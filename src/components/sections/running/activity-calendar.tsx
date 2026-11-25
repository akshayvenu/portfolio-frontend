"use client";

import { useEffect, useMemo, useRef } from "react";
import { Icon } from "@/components/icons";
import { EASE_SETTLE, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { HeatmapDay } from "@/types/hevy";
import type { DayVolume } from "@/types/strava";

/** Matches the Hevy heatmap window, so gym and run days cover the same span. */
const WEEKS = 26;
const DAYS_PER_WEEK = 7;

/** Monday-first rows; every other weekday labelled, as on GitHub. */
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""] as const;

/** Reveal: per-column delay, plus the pause before the first column moves. */
const COLUMN_STEP = 0.022;
const COLUMNS_START = 0.15;

/** Without JS nothing would ever reveal the grid, so force it visible. */
const NO_SCRIPT_CSS = "[data-week],[data-glyph]{opacity:1!important}";

const labelText =
  "font-mono text-[10px] leading-none tracking-[0.08em] text-muted-foreground uppercase";

interface CalendarDay {
  date: string;
  runs: number;
  meters: number;
  workouts: number;
  volumeKg: number;
  future: boolean;
}

function localDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function describe(day: CalendarDay): string {
  const date = localDate(day.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const parts: string[] = [];
  if (day.workouts > 0) {
    parts.push(
      day.volumeKg > 0 ? `Gym · ${Math.round(day.volumeKg).toLocaleString("en-US")} kg` : "Gym",
    );
  }
  if (day.runs > 0) parts.push(`Run · ${(day.meters / 1000).toFixed(1)} km`);
  if (parts.length === 0) parts.push(day.future ? "Upcoming" : "Rest day");
  return `${parts.join(" + ")} — ${date}`;
}

/** Monday-start week columns: the last `WEEKS` weeks, ending with this one. */
function toWeeks(runDays: DayVolume[], gymDays: HeatmapDay[], today: string): CalendarDay[][] {
  const gym = new Map(gymDays.map((day) => [day.date, day]));
  const window = runDays.slice(-WEEKS * DAYS_PER_WEEK);

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < window.length; i += DAYS_PER_WEEK) {
    weeks.push(
      window.slice(i, i + DAYS_PER_WEEK).map((run) => {
        const lift = gym.get(run.date);
        return {
          date: run.date,
          runs: run.runs,
          meters: run.meters,
          workouts: lift?.workouts ?? 0,
          volumeKg: lift?.volumeKg ?? 0,
          future: run.date > today,
        };
      }),
    );
  }
  return weeks;
}

/** A month name over the first column that holds the 1st of that month. */
function monthLabels(weeks: CalendarDay[][]): (string | null)[] {
  let lastShown = -Infinity;
  return weeks.map((week, index) => {
    const first = week[0];
    if (!first) return null;
    const startsMonth = index === 0 || week.some((day) => day.date.endsWith("-01"));
    // Keep labels from colliding when two months start a column or two apart.
    if (!startsMonth || index - lastShown < 3) return null;
    lastShown = index;
    const anchor = week.find((day) => day.date.endsWith("-01")) ?? first;
    return localDate(anchor.date).toLocaleDateString("en-US", { month: "short" });
  });
}

function DayTile({ day, isToday }: { day: CalendarDay; isToday: boolean }) {
  const ran = day.runs > 0;
  const lifted = day.workouts > 0;
  const both = ran && lifted;

  return (
    <div
      role="img"
      aria-label={describe(day)}
      title={describe(day)}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center gap-px rounded-[4px] transition-[filter] duration-150 hover:brightness-95",
        ran
          ? "bg-training text-background"
          : lifted
            ? "bg-[var(--training-1)] text-training"
            : "bg-[var(--training-0)]",
        day.future && "opacity-40",
        isToday && "ring-1 ring-foreground/50 ring-offset-1 ring-offset-background",
      )}
    >
      {lifted ? (
        <span data-glyph className="flex opacity-0">
          <Icon name="dumbbell" strokeWidth={2.4} className={both ? "size-[38%]" : "size-[58%]"} />
        </span>
      ) : null}
      {ran ? (
        <span data-glyph className="flex opacity-0">
          <Icon
            name="footprints"
            strokeWidth={2.4}
            className={both ? "size-[38%]" : "size-[58%]"}
          />
        </span>
      ) : null}
    </div>
  );
}

function LegendSwatch({ kind }: { kind: "rest" | "gym" | "run" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-3.5 items-center justify-center rounded-[3px]",
        kind === "run" && "bg-training text-background",
        kind === "gym" && "bg-[var(--training-1)] text-training",
        kind === "rest" && "bg-[var(--training-0)]",
      )}
    >
      {kind === "gym" ? <Icon name="dumbbell" size={9} strokeWidth={2.6} /> : null}
      {kind === "run" ? <Icon name="footprints" size={9} strokeWidth={2.6} /> : null}
    </span>
  );
}

/**
 * Gym and run days, week by week: one column per week, one tile per day.
 * A dumbbell marks a Hevy workout, footprints mark a Strava run.
 *
 * The first time it scrolls into view the week columns sweep in from left to
 * right (the same motion as the GitHub graph), then the glyphs pop in.
 */
export function ActivityCalendar({
  runDays,
  gymDays,
  today,
}: {
  runDays: DayVolume[];
  gymDays: HeatmapDay[];
  today: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(() => toWeeks(runDays, gymDays, today), [runDays, gymDays, today]);
  const months = useMemo(() => monthLabels(weeks), [weeks]);

  const days = weeks.flat().filter((day) => !day.future);
  const gymCount = days.filter((day) => day.workouts > 0).length;
  const runCount = days.filter((day) => day.runs > 0).length;

  // On phones the grid scrolls; open it on the latest weeks.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const columns = gsap.utils.toArray<HTMLElement>("[data-week]", root);
      const glyphs = gsap.utils.toArray<HTMLElement>("[data-glyph]", root);

      if (prefersReducedMotion()) {
        gsap.set([...columns, ...glyphs], { opacity: 1 });
        return;
      }

      gsap
        .timeline({ scrollTrigger: { trigger: root, start: "top 85%", once: true } })
        .fromTo(
          columns,
          { opacity: 0, x: -14, scaleY: 0.55, transformOrigin: "50% 50%" },
          {
            opacity: 1,
            x: 0,
            scaleY: 1,
            duration: 0.5,
            ease: EASE_SETTLE,
            stagger: COLUMN_STEP,
            clearProps: "transform",
          },
          COLUMNS_START,
        )
        .fromTo(
          glyphs,
          { opacity: 0, scale: 0.3 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.35,
            ease: "back.out(2.4)",
            stagger: { each: 0.006, from: "start" },
            clearProps: "transform",
          },
          COLUMNS_START + 0.25,
        );
    },
    { scope: rootRef, dependencies: [weeks] },
  );

  return (
    <div ref={rootRef}>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>

      <div
        ref={scrollerRef}
        className="-mx-1 [scrollbar-width:none] overflow-x-auto overflow-y-hidden px-1"
      >
        <div className="flex min-w-[560px] gap-2">
          <div
            aria-hidden="true"
            className={`grid shrink-0 grid-rows-7 gap-[3px] pt-5 ${labelText}`}
          >
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} className="flex items-center">
                {label}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div aria-hidden="true" className={`relative h-3 ${labelText}`}>
              {months.map((label, index) =>
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

            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {weeks.map((week) => (
                <div key={week[0]?.date} data-week className="grid gap-[3px] opacity-0">
                  {week.map((day) => (
                    <DayTile key={day.date} day={day} isToday={day.date === today} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className={`m-0 ${labelText}`}>
          <span className="tabular-nums">{gymCount}</span> gym ·{" "}
          <span className="tabular-nums">{runCount}</span> run days · {WEEKS} wk
        </p>
        <div className={`flex items-center gap-3 ${labelText}`}>
          <span className="flex items-center gap-1.5">
            <LegendSwatch kind="rest" /> Rest
          </span>
          <span className="flex items-center gap-1.5">
            <LegendSwatch kind="gym" /> Gym
          </span>
          <span className="flex items-center gap-1.5">
            <LegendSwatch kind="run" /> Run
          </span>
        </div>
      </div>
    </div>
  );
}
