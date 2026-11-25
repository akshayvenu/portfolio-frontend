"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type SpringOptions,
  type Variants,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PREVIEW_CARD_WIDTH } from "@/components/layout/social-preview-card";
import { Panel, PanelHeader, PanelTitle, Spotlight, Tilt } from "@/components/ui";
import { certifications } from "@/content";
import type { Certification } from "@/types/content";
import { CertificationCardFace } from "./certification-card-face";

/** Gap between cards, in px — also the distance one arrow press travels past a card. */
const GAP = 16;

/**
 * Certification cards render at 80% of the dock's social-card size. The face is
 * laid out at full size and CSS-zoomed, so its artwork and type keep their
 * proportions instead of being re-tuned for a second size.
 */
const CARD_SCALE = 0.8;
const CARD_WIDTH = Math.round(PREVIEW_CARD_WIDTH * CARD_SCALE);

/** The springs from motion-primitives' "Tilt with Spotlight" example. */
const tiltSpring: SpringOptions = { stiffness: 26.7, damping: 4.1, mass: 0.2 };

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      y: { type: "spring", stiffness: 240, damping: 26 },
      default: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
    transitionEnd: { filter: "none" },
  },
};

function isRealLink(href: string): boolean {
  return href.length > 0 && href !== "#";
}

/**
 * One credential: the tilting, spotlit card face with its caption underneath —
 * issuer in mono, full title in sans — mirroring motion-primitives' "Tilt with
 * Spotlight". The face rests in greyscale and blooms into colour on hover/focus
 * (always in colour on touch screens, which have no hover).
 */
function CertificationCard({ cert }: { cert: Certification }) {
  const linked = isRealLink(cert.href);
  const Wrapper = linked ? "a" : "div";

  return (
    <motion.li
      variants={itemVariants}
      className="shrink-0 snap-start"
      style={{ width: CARD_WIDTH }}
    >
      <Wrapper
        {...(linked ? { href: cert.href, target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group block rounded-xl text-inherit no-underline outline-none"
      >
        <Tilt
          rotationFactor={6}
          isReverse
          springOptions={tiltSpring}
          style={{ transformOrigin: "center center" }}
          className="relative rounded-xl shadow-[0_18px_40px_-18px_rgb(0_0_0/0.4),0_3px_10px_-4px_rgb(0_0_0/0.12)] will-change-transform group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          <Spotlight
            size={200}
            springOptions={tiltSpring}
            className="z-10 bg-[radial-gradient(circle_at_center,rgb(255_255_255/0.5),rgb(255_255_255/0.2),rgb(255_255_255/0.1),transparent_80%)] blur-2xl"
          />
          <CertificationCardFace
            cert={cert}
            style={{ zoom: CARD_SCALE }}
            className="grayscale transition-[filter] duration-700 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 [@media(hover:none)]:grayscale-0"
          />
        </Tilt>

        <div className="flex flex-col gap-0.5 pt-3">
          <h3 className="m-0 font-mono text-sm font-medium text-muted-foreground">{cert.issuer}</h3>
          <p className="m-0 text-sm leading-snug text-foreground">{cert.title}</p>
        </div>
      </Wrapper>
    </motion.li>
  );
}

function RailButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Chevron = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      aria-label={direction === "prev" ? "Previous certifications" : "Next certifications"}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-foreground/70 transition-[color,background-color,opacity] duration-150 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
    >
      <Chevron size={16} aria-hidden="true" />
    </motion.button>
  );
}

/**
 * Certifications as a horizontally scrollable rail — user-driven (trackpad,
 * touch swipe, shift + wheel, arrow keys or the header buttons), snapping card
 * by card, never auto-playing. Edges fade in only when there is more to see,
 * and a spring-smoothed thumb tracks the position.
 */
export function Certifications() {
  const railRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // Watch the rail (viewport-wide), not the list: the list is as wide as every card
  // together, so on a phone too little of it is ever on screen to cross a threshold.
  const inView = useInView(railRef, { once: true, amount: 0.3 });

  /** Visible share of the rail (0–1) — the thumb's width. */
  const visible = useMotionValue(1);
  const { scrollXProgress } = useScroll({ container: railRef });
  const progress = useSpring(scrollXProgress, { stiffness: 220, damping: 32, mass: 0.4 });
  const thumbWidth = useTransform(visible, (share) => `${share * 100}%`);
  // translateX is relative to the thumb itself, so its travel is (1 / share − 1) widths.
  const thumbX = useTransform([progress, visible], ([p = 0, share = 1]: number[]) =>
    share > 0 ? `${Math.min(Math.max(p, 0), 1) * (1 / share - 1) * 100}%` : "0%",
  );

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setScrollable(max > 2);
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= max - 2);
    visible.set(rail.scrollWidth > 0 ? rail.clientWidth / rail.scrollWidth : 1);
  }, [visible]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    sync();
    rail.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync]);

  const step = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const distance = (card?.offsetWidth ?? CARD_WIDTH) + GAP;
    rail.scrollBy({ left: direction * distance, behavior: "smooth" });
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Panel id="certifications" noBottomLine>
        <PanelHeader className="flex items-center justify-between gap-4">
          <PanelTitle>
            Certifications
            <sup className="ml-0.5 text-[0.45em] font-normal text-muted-foreground">
              ({certifications.length})
            </sup>
          </PanelTitle>

          {scrollable && (
            <div className="flex items-center gap-1.5">
              <RailButton direction="prev" disabled={atStart} onClick={() => step(-1)} />
              <RailButton direction="next" disabled={atEnd} onClick={() => step(1)} />
            </div>
          )}
        </PanelHeader>

        <div className="border-b border-line">
          <div className="relative">
            <div
              ref={railRef}
              tabIndex={0}
              role="region"
              aria-label="Certifications — scroll sideways for more"
              className="snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] overflow-x-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
            >
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate={inView ? "show" : "hidden"}
                className="m-0 flex w-max list-none px-4 pt-6 pb-5"
                style={{ gap: GAP }}
              >
                {certifications.map((cert) => (
                  <CertificationCard key={cert.title} cert={cert} />
                ))}
              </motion.ul>
            </div>

            {/* Edge fades: only where there is more content to scroll to. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-linear-to-r from-background to-transparent"
              initial={false}
              animate={{ opacity: scrollable && !atStart ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-linear-to-l from-background to-transparent"
              initial={false}
              animate={{ opacity: scrollable && !atEnd ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {scrollable && (
            <div aria-hidden="true" className="px-4 pb-4">
              <div className="h-[3px] overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-foreground/35"
                  style={{ width: thumbWidth, x: thumbX }}
                />
              </div>
            </div>
          )}
        </div>
      </Panel>
    </MotionConfig>
  );
}
