"use client";

import {
  motion,
  useSpring,
  useTransform,
  type SpringOptions,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  /** Diameter of the light, in px. */
  size?: number;
  className?: string;
  springOptions?: SpringOptions;
}

/**
 * A soft spot of light that trails the pointer inside its parent, after
 * motion-primitives' `Spotlight`. The parent must be `relative`.
 */
export function Spotlight({ size = 200, className, springOptions }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [parent, setParent] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);
  const left = useTransform(mouseX, (v) => v - size / 2);
  const top = useTransform(mouseY, (v) => v - size / 2);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    el.style.position ||= "relative";
    el.style.overflow ||= "hidden";
    setParent(el);
  }, []);

  useEffect(() => {
    if (!parent) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = parent.getBoundingClientRect();
      mouseX.set(event.clientX - box.left);
      mouseY.set(event.clientY - box.top);
    };
    const enter = () => setActive(true);
    const leave = () => setActive(false);
    parent.addEventListener("pointermove", move);
    parent.addEventListener("pointerenter", enter);
    parent.addEventListener("pointerleave", leave);
    return () => {
      parent.removeEventListener("pointermove", move);
      parent.removeEventListener("pointerenter", enter);
      parent.removeEventListener("pointerleave", leave);
    };
  }, [parent, mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ width: size, height: size, left, top }}
    />
  );
}
