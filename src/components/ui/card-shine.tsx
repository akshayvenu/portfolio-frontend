"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface CardShineOptions {
  /** Maximum tilt, in degrees, when the pointer is at a card edge. */
  maxTilt?: number;
  /** Sweep once as soon as the card mounts (the dock's cards land when shown). */
  sweepOnMount?: boolean;
}

/**
 * The "premium card" micro-interactions (GSAP), shared by the dock's social
 * cards and the certification cards: a band of light that sweeps left → right
 * on landing and on every hover, a pointer-following tilt, and a soft glare.
 * Attach `rootRef` + `handlers` to the card and render `<CardShineLayers>`
 * inside it. Reduced-motion visitors get a static card.
 */
export function useCardShine({ maxTilt = 7, sweepOnMount = true }: CardShineOptions = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{
    tiltX: gsap.QuickToFunc;
    tiltY: gsap.QuickToFunc;
    glareX: gsap.QuickToFunc;
    glareY: gsap.QuickToFunc;
  } | null>(null);

  const { contextSafe } = useGSAP(
    () => {
      const root = rootRef.current;
      const sheen = sheenRef.current;
      const glare = glareRef.current;
      if (!root || !sheen || !glare || prefersReducedMotion()) return;

      gsap.set(root, { transformPerspective: 700 });
      pointer.current = {
        tiltX: gsap.quickTo(root, "rotationX", { duration: 0.6, ease: "power3.out" }),
        tiltY: gsap.quickTo(root, "rotationY", { duration: 0.6, ease: "power3.out" }),
        glareX: gsap.quickTo(glare, "x", { duration: 0.35, ease: "power3.out" }),
        glareY: gsap.quickTo(glare, "y", { duration: 0.35, ease: "power3.out" }),
      };

      if (sweepOnMount) {
        gsap.fromTo(
          sheen,
          { xPercent: 0 },
          { xPercent: 200, duration: 1.1, ease: "power2.inOut", delay: 0.12 },
        );
      }
    },
    { scope: rootRef },
  );

  /** Runs the light band across the card once; ignored while one is already crossing. */
  const sweep = contextSafe((delay = 0) => {
    const sheen = sheenRef.current;
    if (!sheen || !pointer.current || gsap.isTweening(sheen)) return;
    gsap.fromTo(
      sheen,
      { xPercent: 0 },
      { xPercent: 200, duration: delay > 0 ? 1.1 : 0.95, ease: "power2.inOut", delay },
    );
  });

  const track = contextSafe((event: ReactPointerEvent<HTMLElement>) => {
    const root = rootRef.current;
    const handlers = pointer.current;
    // Touch has no hover; tilting under a finger fights scrolling.
    if (!root || !handlers || event.pointerType === "touch") return;
    const box = root.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    handlers.tiltY((x / box.width - 0.5) * maxTilt * 2);
    handlers.tiltX(-(y / box.height - 0.5) * maxTilt * 2);
    handlers.glareX(x);
    handlers.glareY(y);
    gsap.to(glareRef.current, { opacity: 1, duration: 0.3, overwrite: "auto" });
  });

  const settle = contextSafe(() => {
    const handlers = pointer.current;
    if (!handlers) return;
    handlers.tiltX(0);
    handlers.tiltY(0);
    gsap.to(glareRef.current, { opacity: 0, duration: 0.4, overwrite: "auto" });
  });

  return {
    rootRef,
    sheenRef,
    glareRef,
    sweep,
    handlers: {
      onPointerEnter: () => sweep(),
      onPointerMove: track,
      onPointerLeave: settle,
    },
  };
}

interface CardShineLayersProps {
  sheenRef: RefObject<HTMLDivElement | null>;
  glareRef: RefObject<HTMLDivElement | null>;
  /** Diameter of the pointer glare, in px. */
  glareSize?: number;
}

/**
 * The glare and light-sweep overlays. Their colour comes from `--card-light`
 * on the card, so each surface can tune how bright the light reads.
 */
export function CardShineLayers({ sheenRef, glareRef, glareSize = 220 }: CardShineLayersProps) {
  return (
    <>
      {/* Pointer glare: a soft spot of light that trails the cursor. */}
      <div
        ref={glareRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-[2] rounded-full bg-[radial-gradient(closest-side,var(--card-light),transparent)] opacity-0 mix-blend-soft-light"
        style={{
          width: glareSize,
          height: glareSize,
          marginTop: -glareSize / 2,
          marginLeft: -glareSize / 2,
        }}
      />

      {/* Light sweep: starts fully off the left edge, travels to the right. */}
      <div
        ref={sheenRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-[-100%] z-[3] w-full",
          "bg-[linear-gradient(105deg,transparent_32%,var(--card-light)_50%,transparent_68%)]",
        )}
      />
    </>
  );
}
