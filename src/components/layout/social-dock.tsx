"use client";

import { Mail, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SVGProps,
} from "react";
import { brandIcons } from "@/components/icons";
import { socialCards, type SocialCard, type SocialCardPlatform } from "@/content";
import { useUiSound } from "@/hooks/use-ui-sound";
import { cn } from "@/lib/utils";
import { PREVIEW_CARD_HEIGHT, PREVIEW_CARD_WIDTH, SocialPreviewCard } from "./social-preview-card";

/** Hover intent before the first card opens — filters out pass-through swipes. */
const OPEN_DELAY_MS = 90;
/** Grace period so crossing from icon to card (or back) never closes it. */
const CLOSE_DELAY_MS = 140;
/** Minimum distance kept between the card and the viewport edge. */
const VIEWPORT_GUTTER = 16;

const spring: Transition = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 };

const dockIcons: Record<SocialCardPlatform, ComponentType<SVGProps<SVGSVGElement>>> = {
  ...brandIcons,
  email: Mail,
};

interface Placement {
  /** Card's left edge, relative to the dock. */
  left: number;
  width: number;
  /** Hovered icon's centre, relative to the card — the scale origin. */
  originX: number;
}

/**
 * Floating bottom toolbar with brand preview cards.
 *
 * Desktop: hover an icon to reveal its card; it glides between icons and stays
 * open while the pointer is anywhere over the dock or the card. Touch: the
 * first tap opens the card, a second tap (or a tap on the card) follows the
 * link, tapping elsewhere closes it.
 */
export function SocialDock() {
  const [active, setActive] = useState<SocialCardPlatform | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef(new Map<SocialCardPlatform, HTMLAnchorElement>());
  const activeRef = useRef<SocialCardPlatform | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const lastPointerType = useRef<string>("mouse");

  const sound = useUiSound();

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  /** Centres the card over `platform`'s icon, clamped inside the viewport. */
  const measure = useCallback((platform: SocialCardPlatform) => {
    const root = rootRef.current;
    const icon = iconRefs.current.get(platform);
    if (!root || !icon) return;

    const rootBox = root.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    const width = Math.min(PREVIEW_CARD_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
    const iconCentre = iconBox.left + iconBox.width / 2;

    const viewportLeft = Math.min(
      Math.max(iconCentre - width / 2, VIEWPORT_GUTTER),
      window.innerWidth - VIEWPORT_GUTTER - width,
    );

    setPlacement({
      left: viewportLeft - rootBox.left,
      width,
      originX: iconCentre - viewportLeft,
    });
  }, []);

  const open = useCallback(
    (platform: SocialCardPlatform) => {
      clearTimers();
      measure(platform);
      if (activeRef.current !== platform) sound.tick();
      activeRef.current = platform;
      setActive(platform);
    },
    [clearTimers, measure, sound],
  );

  const close = useCallback(() => {
    clearTimers();
    activeRef.current = null;
    setActive(null);
  }, [clearTimers]);

  /** Hover intent: wait briefly before the first card, switch instantly after. */
  const requestOpen = useCallback(
    (platform: SocialCardPlatform) => {
      clearTimers();
      if (activeRef.current) {
        open(platform);
      } else {
        openTimer.current = window.setTimeout(() => open(platform), OPEN_DELAY_MS);
      }
    },
    [clearTimers, open],
  );

  const requestClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(close, CLOSE_DELAY_MS);
  }, [clearTimers, close]);

  // Outside tap / Escape / resize while a card is open.
  useEffect(() => {
    if (!active) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onResize() {
      if (activeRef.current) measure(activeRef.current);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [active, close, measure]);

  useEffect(() => clearTimers, [clearTimers]);

  /** Mouse and pen drive hover; touch is handled on click instead. */
  const isHoverPointer = (event: ReactPointerEvent) => event.pointerType !== "touch";

  function handleIconClick(event: ReactMouseEvent<HTMLAnchorElement>, card: SocialCard) {
    // First tap on touch reveals the card; a second tap on the same icon
    // falls through and follows the link.
    if (lastPointerType.current === "touch" && activeRef.current !== card.platform) {
      event.preventDefault();
      open(card.platform);
      return;
    }
    sound.click();
  }

  const activeCard = socialCards.find((card) => card.platform === active) ?? null;
  const tooltipId = "social-dock-card";

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
        onPointerDownCapture={(event) => {
          lastPointerType.current = event.pointerType;
        }}
        onPointerEnter={(event) => {
          if (isHoverPointer(event)) window.clearTimeout(closeTimer.current);
        }}
        onPointerLeave={(event) => {
          if (isHoverPointer(event)) requestClose();
        }}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) close();
        }}
      >
        <AnimatePresence>
          {activeCard && placement && (
            <motion.div
              key="card"
              id={tooltipId}
              role="tooltip"
              // `pb-3` is an invisible bridge between the card and the dock, so
              // the pointer never crosses dead space on its way up.
              className="absolute bottom-full left-0 pb-3"
              style={{
                width: placement.width,
                transformOrigin: `${placement.originX}px 100%`,
              }}
              initial={{ opacity: 0, y: 10, scale: 0.92, x: placement.left }}
              animate={{ opacity: 1, y: 0, scale: 1, x: placement.left }}
              exit={{ opacity: 0, y: 8, scale: 0.94, transition: { duration: 0.16 } }}
              transition={spring}
            >
              <a
                href={activeCard.href}
                target={activeCard.external ? "_blank" : undefined}
                rel={activeCard.external ? "noopener noreferrer" : undefined}
                tabIndex={-1}
                aria-label={`Open ${activeCard.label}`}
                onClick={() => sound.click()}
                className="relative block no-underline"
                style={{ height: PREVIEW_CARD_HEIGHT }}
              >
                {/* Content cross-fades in place while the shell glides. */}
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeCard.platform}
                    className="absolute inset-0"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <SocialPreviewCard card={activeCard} />
                  </motion.div>
                </AnimatePresence>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <nav
          aria-label="Social links"
          className="flex items-center gap-0.5 rounded-full border border-border bg-background/85 p-1.5 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.22),0_1px_2px_rgb(0_0_0/0.05)] backdrop-blur-md"
        >
          {socialCards.map((card) => {
            const DockIcon = dockIcons[card.platform];
            const isActive = active === card.platform;
            return (
              <a
                key={card.platform}
                ref={(node) => {
                  if (node) iconRefs.current.set(card.platform, node);
                  else iconRefs.current.delete(card.platform);
                }}
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noopener noreferrer" : undefined}
                aria-label={card.label}
                aria-describedby={isActive ? tooltipId : undefined}
                onPointerEnter={(event) => {
                  if (isHoverPointer(event)) requestOpen(card.platform);
                }}
                onFocus={(event) => {
                  // Keyboard focus only: a tap also focuses the link, and
                  // opening here would make that first tap navigate.
                  if (event.currentTarget.matches(":focus-visible")) open(card.platform);
                }}
                onClick={(event) => handleIconClick(event, card)}
                className={cn(
                  "group relative inline-flex size-8 items-center justify-center rounded-lg text-foreground/65 no-underline transition-colors duration-150 hover:text-foreground",
                  isActive && "text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="social-dock-active"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg bg-muted"
                    transition={spring}
                  />
                )}
                <DockIcon
                  width={16}
                  height={16}
                  aria-hidden="true"
                  className="relative transition-transform duration-150 ease-out group-hover:scale-110"
                />
              </a>
            );
          })}

          <span aria-hidden="true" className="mx-1.5 h-5 border-l border-dashed border-border" />

          <button
            type="button"
            onClick={sound.toggle}
            onPointerEnter={(event) => {
              if (isHoverPointer(event)) requestClose();
            }}
            aria-pressed={sound.enabled}
            aria-label={sound.enabled ? "Turn interface sounds off" : "Turn interface sounds on"}
            className="inline-flex size-8 items-center justify-center rounded-lg text-foreground/65 transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            {sound.enabled ? (
              <Volume2 size={16} aria-hidden="true" />
            ) : (
              <VolumeX size={16} aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>
    </MotionConfig>
  );
}
