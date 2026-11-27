"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { loadLanyard, useLanyardOpen } from "./lanyard-store";

// three.js is large and WebGL-only: load it on demand, never on the server.
// If the chunk still can't be fetched after a retry, render nothing rather
// than taking the whole page down with a ChunkLoadError — the badge is decoration.
const Lanyard = dynamic(
  () =>
    loadLanyard().catch((error: unknown) => {
      console.warn("Lanyard badge failed to load", error);
      return { default: () => null };
    }),
  { ssr: false },
);

/**
 * Viewport width at which the ~215px card hangs in the empty margin to the
 * right of the 766px content column without covering it.
 */
const WIDE_QUERY = "(min-width: 1340px)";

/** Card height on screen, in CSS px. */
const CARD_HEIGHT = 300;
/** Where the top of the card hangs, in CSS px from the top of the viewport. */
const CARD_TOP = 170;
/** Strap's distance from the right edge of the viewport, in CSS px. */
const ANCHOR_FROM_RIGHT = 150;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function subscribeWide(listener: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function useWideViewport(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}

function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

/**
 * The ID badge, hanging from the top-right corner.
 *
 * The canvas covers the whole viewport above the page, so a dragged card is
 * drawn on top of everything instead of being clipped by a small box. It lets
 * the pointer through everywhere except on the card itself (`passThrough`), so
 * the page underneath stays clickable.
 *
 * - Wide screens: the badge is there from page load and can be dragged and
 *   flipped. At rest it hangs in the empty margin beside the content.
 * - Narrower screens: it would cover the page, so it only drops in while the
 *   name or company is hovered (see `LanyardTrigger`) and ignores the pointer.
 */
export function LanyardOverlay() {
  const hovered = useLanyardOpen();
  const wide = useWideViewport();
  const { width, height } = useViewportSize();

  if (!width || !height) return null;

  // The component frames its scene by viewport *fractions*; convert the fixed
  // pixel targets above so the card keeps the same size on any window.
  const size = clamp(CARD_HEIGHT / height, 0.15, 0.9);
  const strapLength = clamp((CARD_TOP / height - 0.12) / 0.3, 0, 1);
  const anchorX = clamp(1 - ANCHOR_FROM_RIGHT / width, 0.5, 0.95);

  return createPortal(
    <AnimatePresence>
      {(wide || hovered) && (
        <motion.div
          key="lanyard"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[80]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Lanyard
            frontImage="/card-front.jpg"
            backImage="/card-back.jpg"
            strapImage="/band.png"
            imageFit="cover"
            cardColor="#f1f1f1"
            orientation="portrait"
            finish="glossy"
            cornerRadius={0.35}
            size={size}
            anchorX={anchorX}
            strapLength={strapLength}
            strapColor="#0d0d0d"
            strapWidth={0.75}
            metal="silver"
            gravity={1}
            damping={0.5}
            elasticity={0.5}
            breeze={0.5}
            interactive={wide}
            passThrough
            intro
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
