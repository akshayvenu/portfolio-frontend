"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hideLanyard, loadLanyard, showLanyard } from "./lanyard-store";

/**
 * Wraps a name or company so hovering it drops the lanyard badge in at the
 * top-right of the viewport. Mouse only — touch devices never show it.
 */
export function LanyardTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block", className)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        void loadLanyard();
        showLanyard();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") hideLanyard();
      }}
    >
      {children}
    </span>
  );
}
