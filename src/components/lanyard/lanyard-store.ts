"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the lanyard badge is showing. Triggers (name, company) flip it on
 * hover; `LanyardOverlay` reads it. A module-level store is enough because
 * the page only ever renders one overlay.
 */
let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

export const showLanyard = () => set(true);
export const hideLanyard = () => set(false);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLanyardOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

const importLanyard = () => import("@/components/ui/lanyard");

/**
 * Loads the three.js chunk (also called early so the first hover doesn't wait).
 * Retries once: in dev the chunk can be mid-rebuild, and in production a new
 * deploy can replace chunk files under an open tab.
 */
export const loadLanyard = () =>
  importLanyard().catch(() =>
    new Promise((resolve) => setTimeout(resolve, 600)).then(importLanyard),
  );
