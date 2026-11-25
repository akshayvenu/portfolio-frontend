"use client";

import { motion, useSpring, useTransform, type SpringOptions } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  /** Diameter of the light, in px. */
  size?: number;
  springOptions?: SpringOptions;
}

/**
 * A soft disc of light that trails the pointer across its parent (after
 * motion-primitives' `Spotlight`). It listens on the parent element, so it can
 * be dropped into any card as the first child; the parent is made the clipping
 * context so the glow never spills past the card's rounded corners.
 */
export function Spotlight({
  className,
  size = 200,
  springOptions = { bounce: 0 },
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);
  const left = useTransform(mouseX, (value) => `${value - size / 2}px`);
  const top = useTransform(mouseY, (value) => `${value - size / 2}px`);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    parent.style.position = "relative";
    parent.style.overflow = "hidden";

    function onMove(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      const box = parent!.getBoundingClientRect();
      mouseX.set(event.clientX - box.left);
      mouseY.set(event.clientY - box.top);
    }
    function onEnter(event: PointerEvent) {
      if (event.pointerType !== "touch") setHovered(true);
    }
    function onLeave() {
      setHovered(false);
    }

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerenter", onEnter);
    parent.addEventListener("pointerleave", onLeave);
    return () => {
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full blur-xl transition-opacity duration-200",
        hovered ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ width: size, height: size, left, top }}
    />
  );
}
