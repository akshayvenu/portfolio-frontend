"use client";

import { useRef } from "react";
import type { ContributionCalendar } from "@/lib/contributions";
import { EASE_SETTLE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import type { ContributionDay, ContributionLevel } from "@/types/content";

const LEVELS: ContributionLevel[] = [0, 1, 2, 3, 4];

/** Sunday-first rows; only every other weekday is labelled, as on GitHub. */
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

const DAYS_PER_WEEK = 7;

/** Tile geometry in SVG user units: an 18-unit tile on an 18.5-unit pitch. */
const TILE = 18;
const PITCH = 18.5;
const GRAPH_HEIGHT = PITCH * (DAYS_PER_WEEK - 1) + TILE;

/** Reveal: per-column delay, plus the pause before the first column moves. */
const COLUMN_STEP = 0.013;
const COLUMNS_START = 0.2;

/** Small mono caps shared by the axes and the legend. */
const labelText =
  "font-mono text-[10px] leading-none tracking-[0.06em] text-[var(--contribution-label)] uppercase";

/** Without JS nothing would ever reveal the graph, so force it visible. */
const NO_SCRIPT_CSS = "[data-stage],[data-column]{opacity:1!important}";

/**
 * One pixel-art tile: a 1px rim with notched corners, a lighter inner fill
 * and a white highlight along the top edge.
 */
function TileShapes({ level }: { level: ContributionLevel }) {
  return (
    <>
      <path
        d="M2 1h14v1h1v14h-1v1H2v-1H1V2h1z"
        style={{ fill: `var(--contribution-${level}-rim)` }}
      />
      <path d="M3 3h12v11H3z" style={{ fill: `var(--contribution-${level})` }} />
      <path d="M3 3h12v1H3z" style={{ fill: "var(--contribution-highlight)" }} />
    </>
  );
}

function contributionLabel(day: ContributionDay): string {
  const count =
    day.count === 0 ? "No contributions" : `${day.count} contribution${day.count === 1 ? "" : "s"}`;
  const date = new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${count} on ${date}`;
}

interface Props {
  calendar: ContributionCalendar;
  /** Account name without the "@", e.g. "akshayvenu". */
  username: string;
  profileHref: string;
}

/**
 * GitHub contribution graph, drawn as an SVG of pixel-art tiles.
 *
 * The first time it scrolls into view, the heading blurs up into place and the
 * week columns then sweep in from left to right.
 */
export function ContributionsMosaic({ calendar, username, profileHref }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { weeks, total, monthLabels } = calendar;
  const width = weeks.length * PITCH - (PITCH - TILE);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const stage = gsap.utils.toArray<HTMLElement>("[data-stage]", root);
      const columns = gsap.utils.toArray<SVGGElement>("[data-column]", root);

      if (prefersReducedMotion()) {
        gsap.set([...stage, ...columns], { opacity: 1 });
        return;
      }

      gsap
        .timeline({ scrollTrigger: { trigger: root, start: "top 85%", once: true } })
        .fromTo(
          stage,
          { opacity: 0, y: 16, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: EASE_SETTLE,
            stagger: 0.08,
            clearProps: "filter,transform",
          },
          0,
        )
        .fromTo(
          columns,
          { opacity: 0, x: -14, scaleY: 0.55, transformOrigin: "50% 50%" },
          {
            opacity: 1,
            x: 0,
            scaleY: 1,
            duration: 0.46,
            ease: EASE_SETTLE,
            stagger: COLUMN_STEP,
          },
          COLUMNS_START,
        );
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="flex flex-col gap-5 p-4">
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>

      <div className="flex flex-col gap-0.5">
        <h2
          data-stage
          className="m-0 font-sans text-[16px] leading-[1.2] font-medium tracking-[-0.04em] text-foreground opacity-0"
        >
          GitHub
        </h2>
        <p data-stage className="m-0 text-[15px] leading-5 text-muted-foreground opacity-0">
          <span className="tabular-nums">{total.toLocaleString("en-US")}</span> contributions in the
          last year.
        </p>
      </div>

      <div data-stage className="flex flex-col gap-3 opacity-0">
        {/* Reversed so that on narrow screens the scroll starts at the most
            recent weeks rather than a year ago. */}
        <div className="flex [scrollbar-width:none] flex-row-reverse overflow-x-auto">
          <div className="flex w-full min-w-[600px] shrink-0 gap-2">
            <div aria-hidden="true" className={`grid shrink-0 grid-rows-7 pt-5 ${labelText}`}>
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={index} className="flex items-center">
                  {label}
                </span>
              ))}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div aria-hidden="true" className={`relative h-3 ${labelText}`}>
                {monthLabels.map((label, index) =>
                  label ? (
                    <span
                      key={index}
                      className="absolute top-0"
                      style={{ left: `${(index / weeks.length) * 100}%` }}
                    >
                      {label}
                    </span>
                  ) : null,
                )}
              </div>

              <svg
                viewBox={`0 0 ${width} ${GRAPH_HEIGHT}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`${total} contributions on GitHub in the last year`}
              >
                <defs>
                  {LEVELS.map((level) => (
                    <g key={level} id={`gh-level-${level}`}>
                      <TileShapes level={level} />
                    </g>
                  ))}
                </defs>

                {weeks.map((week, weekIndex) => {
                  // The first week is usually partial; offset it so each day
                  // still lands on its weekday row.
                  const firstRow = weekIndex === 0 ? DAYS_PER_WEEK - week.length : 0;
                  return (
                    <g key={weekIndex} data-column className="opacity-0">
                      {week.map((day, dayIndex) => (
                        <use
                          key={day.date}
                          href={`#gh-level-${day.level}`}
                          x={weekIndex * PITCH}
                          y={(firstRow + dayIndex) * PITCH}
                          className="transition-[filter] duration-150 hover:brightness-90"
                        >
                          <title>{contributionLabel(day)}</title>
                        </use>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <a
            href={profileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            @{username}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill="currentColor">
              <path d="M16.004 9.414 7.397 18.02l-1.414-1.414L14.59 8H7.004V6h11v11h-2z" />
            </svg>
          </a>

          <div className={`flex items-center gap-1.5 ${labelText}`}>
            Less
            {LEVELS.map((level) => (
              <svg key={level} viewBox="0 0 18 18" aria-hidden="true" className="size-3">
                <TileShapes level={level} />
              </svg>
            ))}
            More
          </div>
        </div>
      </div>
    </div>
  );
}
