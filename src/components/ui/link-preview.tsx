"use client";

import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  usePresence,
  useReducedMotion,
  useSpring,
  type Transition,
} from "motion/react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useUiSound } from "@/hooks/use-ui-sound";
import { cn } from "@/lib/utils";
import type { LinkPreview as LinkPreviewData } from "@/types/content";

/** 20% smaller than the original 264px card. */
const CARD_WIDTH = 211;
/** Gap between link and card — the strips travel through it out of the word. */
const REACH = 12;
const VIEWPORT_GUTTER = 12;
const OPEN_DELAY_MS = 60;
/** Wait this long for the screenshot before pouring the card out anyway. */
const IMAGE_WAIT_MS = 300;

/** The genie slices the card into thin horizontal strips this far apart. */
const STRIP_STEP = 3;
/** Slightly taller than the step so neighbouring strips overlap — no seams. */
const STRIP_HEIGHT = 3.5;
const GENIE_OPEN_S = 0.56;
const GENIE_CLOSE_S = 0.42;
/** Maximum tilt, in degrees either way, as the pointer crosses the link. */
const MAX_TILT = 3;

const tiltSpring = { stiffness: 420, damping: 28, mass: 0.6 };
const glyphSpring: Transition = { type: "spring", stiffness: 260, damping: 20, mass: 0.7 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const clamp01 = (value: number) => clamp(value, 0, 1);
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/** Tiny red phone mock — the "app" glyph that sits after the link text. */
function PhoneGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 22" aria-hidden="true" focusable="false" className={className}>
      <rect
        x="1"
        y="1"
        width="14"
        height="20"
        rx="3.2"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect x="6" y="2.9" width="4" height="1.3" rx="0.65" fill="currentColor" />
      <rect
        x="3.6"
        y="6.4"
        width="8.8"
        height="5.2"
        rx="1.2"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <rect
        x="3.6"
        y="13.2"
        width="6.2"
        height="1.2"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.55"
      />
      <rect
        x="3.6"
        y="15.6"
        width="4.4"
        height="1.2"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}

const surfaceClass =
  "relative rounded-2xl bg-white p-1.5 shadow-[inset_0_0_0_1px_#ebebeb] dark:bg-neutral-900 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]";

function CardContent({
  preview,
  width,
  onLoad,
}: {
  preview: LinkPreviewData;
  width: number;
  onLoad?: () => void;
}) {
  return (
    <>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[11px] bg-neutral-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] dark:bg-neutral-800">
        <Image
          src={preview.image}
          alt=""
          fill
          sizes={`${width - 12}px`}
          unoptimized
          loading="eager"
          className="object-cover object-top"
          onLoad={onLoad}
        />
      </div>
      <p className="mx-1.5 mt-2.5 mb-0 text-[13px] leading-[1.3] font-semibold tracking-[-0.1px] text-black dark:text-white">
        {preview.title}
      </p>
      <p className="mx-1.5 mt-0.5 mb-1 text-xs leading-[1.35] text-[#878787]">{preview.subtitle}</p>
    </>
  );
}

interface Placement {
  /** Viewport-fixed position of the card. */
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  above: boolean;
  /** Link centre, relative to the card's left edge — where the card pours from. */
  arrow: number;
  /** Width of the link: how narrow the card is where it leaves the word. */
  mouth: number;
}

type Phase = "wait" | "genie" | "open" | "close";

/**
 * The card body with a "genie" entrance: the card is sliced into 3px strips
 * that pour out of the link one after another. Strips still near the word are
 * squeezed to the word's width and centred on it. As they travel they widen
 * to the full card, and late in the animation everything snaps square. Then
 * the real card takes over and its shadow fades in. Closing plays the same
 * thing backwards, so the card is sucked back into the word.
 */
function GenieCard({
  preview,
  placement,
  still,
}: {
  preview: LinkPreviewData;
  placement: Placement;
  still: boolean;
}) {
  const [isPresent, safeToRemove] = usePresence();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(0);
  const [height, setHeight] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>("wait");
  const { width, above, arrow, mouth } = placement;

  useLayoutEffect(() => {
    if (surfaceRef.current) setHeight(surfaceRef.current.offsetHeight);
  }, []);

  // Start once the card is measured and the screenshot is in (or we stop waiting).
  useEffect(() => {
    if (phase !== "wait" || !height || !isPresent) return;
    if (still || loaded) {
      setPhase(still ? "open" : "genie");
      return;
    }
    const timer = window.setTimeout(() => setPhase("genie"), IMAGE_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase, height, loaded, still, isPresent]);

  // Leaving: run the genie in reverse. Coming back mid-close: pour out again.
  useLayoutEffect(() => {
    if (isPresent) {
      if (phase === "close") setPhase("genie");
      return;
    }
    if (still || phase === "wait") safeToRemove?.();
    else if (phase === "open" || phase === "genie") setPhase("close");
  }, [isPresent, still, phase, safeToRemove]);

  useLayoutEffect(() => {
    if (phase !== "genie" && phase !== "close") return;

    const travel = REACH + height;
    const mouthWidth = clamp(mouth, 16, width);

    const render = (t: number) => {
      progress.current = t;
      // How far the "front" of the card still is from fully out (px).
      const front = (1 - easeInOutSine(clamp01(t / 0.6))) * travel;
      // Late in the animation the pinched shape relaxes into a rectangle.
      const square = 1 - (1 - clamp01((t - 0.4) / 0.6)) ** 3;

      stripRefs.current.forEach((strip, index) => {
        if (!strip) return;
        const centre = index * STRIP_STEP + STRIP_STEP / 2;
        // Distance this strip has travelled out of the word.
        const out = (above ? REACH + (height - centre) : REACH + centre) - front;
        if (out <= 0) {
          strip.style.opacity = "0";
          return;
        }
        const reach = easeInOutSine(clamp01(out / travel));
        const half = lerp(mouthWidth / 2, width / 2, reach);
        const middle = lerp(arrow, width / 2, reach);
        const left = lerp(middle - half, 0, square);
        const right = lerp(middle + half, width, square);
        const y = above ? travel - out : out - REACH;
        strip.style.opacity = "1";
        strip.style.transform = `translate(${left}px, ${y - centre}px) scaleX(${(right - left) / width})`;
      });
    };

    const opening = phase === "genie";
    const from = opening ? progress.current : Math.min(progress.current, 0.88);
    render(from);
    const controls = animate(from, opening ? 1 : 0, {
      duration: opening ? GENIE_OPEN_S * (1 - from) : GENIE_CLOSE_S * from,
      ease: "linear",
      onUpdate: render,
      onComplete: () => {
        if (opening) setPhase("open");
        else safeToRemove?.();
      },
    });
    return () => controls.stop();
  }, [phase, height, width, above, arrow, mouth, safeToRemove]);

  const strips = useMemo(() => {
    if (still || !height) return null;
    return Array.from({ length: Math.ceil(height / STRIP_STEP) }, (_, index) => {
      const top = index * STRIP_STEP;
      return (
        <div
          key={top}
          ref={(node) => {
            stripRefs.current[index] = node;
          }}
          className="absolute left-0 overflow-hidden opacity-0 will-change-[transform,opacity]"
          style={{ top, width, height: STRIP_HEIGHT, transformOrigin: "0 50%" }}
        >
          <div className={surfaceClass} style={{ width, transform: `translateY(${-top}px)` }}>
            <CardContent preview={preview} width={width} />
          </div>
        </div>
      );
    });
  }, [still, height, width, preview]);

  const pouring = phase === "genie" || phase === "close";

  return (
    <>
      {phase === "open" && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.05),0_14px_36px_-10px_rgb(0_0_0/0.22)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: still ? 0.12 : 0.3 }}
        />
      )}
      <motion.div
        ref={surfaceRef}
        className={surfaceClass}
        style={{ visibility: phase === "open" ? "visible" : "hidden" }}
        initial={still ? { opacity: 0 } : false}
        animate={still && phase === "open" ? { opacity: 1 } : undefined}
        transition={{ duration: 0.12 }}
      >
        <CardContent preview={preview} width={width} onLoad={() => setLoaded(true)} />
      </motion.div>
      {strips && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ opacity: pouring ? 1 : 0 }}
        >
          {strips}
        </div>
      )}
    </>
  );
}

interface LinkPreviewProps {
  preview: LinkPreviewData;
  /** Link text; defaults to `preview.label`. */
  children?: ReactNode;
  className?: string;
}

/**
 * Inline link with a website-preview card that pours out of the link text
 * ("genie" effect) on hover and leans gently toward the pointer. The card is
 * non-interactive, so it never steals the hover from the link. On touch, the
 * first tap opens the card and a second tap follows the link.
 */
export function LinkPreview({ preview, children, className }: LinkPreviewProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  const openTimer = useRef<number | undefined>(undefined);
  const lastPointerType = useRef("mouse");
  const preloaded = useRef(false);
  const cardId = useId();
  const sound = useUiSound();
  const reducedMotion = useReducedMotion() ?? false;

  const tiltTarget = useMotionValue(0);
  const tilt = useSpring(tiltTarget, tiltSpring);

  useEffect(() => setMounted(true), []);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const box = wrapper.getBoundingClientRect();
    const width = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
    const centre = box.left + box.width / 2;
    const left = clamp(
      centre - width / 2,
      VIEWPORT_GUTTER,
      window.innerWidth - VIEWPORT_GUTTER - width,
    );
    // Always opens downwards, pouring out of the bottom of the word.
    setPlacement({
      left,
      top: box.bottom + REACH,
      width,
      above: false,
      arrow: clamp(centre - left, 16, width - 16),
      mouth: box.width,
    });
  }, []);

  const show = useCallback(() => {
    window.clearTimeout(openTimer.current);
    if (!openRef.current) {
      measure();
      tiltTarget.jump(0);
      tilt.jump(0);
      sound.tick();
    }
    openRef.current = true;
    setOpen(true);
  }, [measure, sound, tilt, tiltTarget]);

  const hide = useCallback(() => {
    window.clearTimeout(openTimer.current);
    openRef.current = false;
    setOpen(false);
  }, []);

  /** Fetches the screenshot as soon as the pointer shows interest. */
  const preload = useCallback(() => {
    if (preloaded.current) return;
    preloaded.current = true;
    const image = new window.Image();
    image.src = preview.image;
  }, [preview.image]);

  const requestShow = useCallback(() => {
    preload();
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(show, OPEN_DELAY_MS);
  }, [preload, show]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) hide();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") hide();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [open, hide]);

  useEffect(() => () => window.clearTimeout(openTimer.current), []);

  const isMouse = (event: ReactPointerEvent) => event.pointerType === "mouse";

  function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    // First tap on touch reveals the card; a second tap follows the link.
    if (lastPointerType.current !== "mouse" && !openRef.current) {
      event.preventDefault();
      show();
      return;
    }
    sound.click();
  }

  const card =
    open && placement ? (
      <motion.div
        key="peek"
        id={cardId}
        role="tooltip"
        className="pointer-events-none fixed z-[90] will-change-transform"
        style={{
          left: placement.left,
          top: placement.top,
          bottom: placement.bottom,
          width: placement.width,
          transformOrigin: `${placement.arrow}px ${placement.above ? "100%" : "0%"}`,
          rotate: tilt,
        }}
      >
        <GenieCard preview={preview} placement={placement} still={reducedMotion} />
      </motion.div>
    ) : null;

  return (
    <>
      <span
        ref={wrapperRef}
        className="inline-block"
        onPointerDownCapture={(event) => {
          lastPointerType.current = event.pointerType;
        }}
        onPointerEnter={(event) => {
          if (isMouse(event)) requestShow();
        }}
        onPointerLeave={(event) => {
          if (isMouse(event)) hide();
        }}
        onPointerMove={(event) => {
          if (reducedMotion || !isMouse(event)) return;
          const box = event.currentTarget.getBoundingClientRect();
          tiltTarget.set(((event.clientX - box.left) / box.width - 0.5) * MAX_TILT * 2);
        }}
      >
        <a
          href={preview.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-describedby={open ? cardId : undefined}
          onFocus={(event) => {
            // Keyboard focus only: a tap also focuses the link, and opening
            // here would make that first tap navigate.
            if (event.currentTarget.matches(":focus-visible")) show();
          }}
          onBlur={hide}
          onClick={handleClick}
          className={cn(
            "group inline-flex items-center gap-1.5 text-inherit no-underline",
            className,
          )}
        >
          <span className="underline decoration-current/30 decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 group-hover:decoration-current">
            {children ?? preview.label}
          </span>
          <motion.span
            aria-hidden="true"
            className="inline-flex shrink-0 text-red-500 dark:text-red-400"
            animate={
              open
                ? { rotate: [0, -14, 10, -6, 0], scale: 1.18, y: -1 }
                : { rotate: 0, scale: 1, y: 0 }
            }
            transition={{
              rotate: { duration: 0.55, ease: "easeInOut" },
              scale: glyphSpring,
              y: glyphSpring,
            }}
          >
            <PhoneGlyph className="h-[1.05em] w-auto" />
          </motion.span>
        </a>
      </span>

      {mounted &&
        createPortal(
          <MotionConfig reducedMotion="user">
            <AnimatePresence>{card}</AnimatePresence>
          </MotionConfig>,
          document.body,
        )}
    </>
  );
}
