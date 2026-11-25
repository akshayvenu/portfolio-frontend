"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
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
  /** Maximum rotation, in degrees, when the pointer is at an edge. */
  rotationFactor?: number;
  /** Tilt away from the pointer instead of towards it. */
  isReverse?: boolean;
  springOptions?: SpringOptions;
}

/**
 * Pointer-driven 3D tilt (after motion-primitives' `Tilt`). The pointer's
 * position over the element, normalised to -0.5…0.5, feeds two springs that
 * drive rotateX/rotateY, so the card eases into and out of every movement.
 * Touch input and reduced-motion users get a static element.
 */
export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isReverse = false,
  springOptions,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    isReverse ? [rotationFactor, -rotationFactor] : [-rotationFactor, rotationFactor],
  );
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    isReverse ? [-rotationFactor, rotationFactor] : [rotationFactor, -rotationFactor],
  );

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === "touch" || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    x.set((event.clientX - box.left) / box.width - 0.5);
    y.set((event.clientY - box.top) / box.height - 0.5);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        ...style,
        transform: reduceMotion ? undefined : transform,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
