"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
  type SpringOptions,
} from "motion/react";
import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

interface TiltProps {
  children: ReactNode;
  className?: string;
  style?: MotionStyle;
  /** Maximum tilt in degrees at the card edge. */
  rotationFactor?: number;
  /** Tilt away from the pointer instead of toward it. */
  isReverse?: boolean;
  springOptions?: SpringOptions;
}

/** Pointer-following 3D tilt, after motion-primitives' `Tilt`. */
export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isReverse = false,
  springOptions,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);

  const rotateX = useTransform(ySpring, [-0.5, 0.5], [rotationFactor, -rotationFactor].map((v) => (isReverse ? -v : v)));
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-rotationFactor, rotationFactor].map((v) => (isReverse ? -v : v)));
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    x.set((event.clientX - box.left) / box.width - 0.5);
    y.set((event.clientY - box.top) / box.height - 0.5);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ transformStyle: "preserve-3d", ...style, transform }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
