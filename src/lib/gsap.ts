"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration point for GSAP plugins. Import `gsap` / `useGSAP` from
 * here (never from "gsap" directly) so every plugin is registered exactly once.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin, CustomEase);

/** cubic-bezier(.22, 1, .36, 1): fast out, long soft settle. */
export const EASE_SETTLE = CustomEase.create("settle", "0.22,1,0.36,1");

/** True when the visitor asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export { gsap, useGSAP, ScrollTrigger };
