import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Quiet section heading: a short title and one line of context underneath.
 * Deliberately small — the numbers below are the headline, not the label.
 */
export function SectionHeading({
  id,
  title,
  description,
  aside,
  className,
}: {
  id?: string;
  title: string;
  description: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-4 px-4 pt-8 pb-4", className)}>
      <div className="min-w-0">
        <h2 id={id} className="m-0 text-base font-medium tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        <p className="m-0 mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

/** Tiny uppercase mono label used for meta and axis-like captions. */
export function MonoLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
