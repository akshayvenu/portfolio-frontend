"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  HeatmapCells,
  HeatmapChart,
  HeatmapInteractionBoundary,
  HeatmapInteractionProvider,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapXAxis,
  HeatmapYAxis,
  type HeatmapColumn,
} from "@/components/charts/heatmap";
import type { DayVolume } from "@/types/strava";

/**
 * Bklit's heatmap counts levels 0–4 directly, so each day's distance is
 * bucketed first: rest, a short run, a standard run, a long-ish run, a long run.
 */
function levelFor(meters: number): number {
  if (meters <= 0) return 0;
  const km = meters / 1000;
  if (km < 4) return 1;
  if (km < 7) return 2;
  if (km < 10) return 3;
  return 4;
}

function localDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Sunday-first week columns (the heatmap's native order); the last column stops at today. */
function toColumns(days: DayVolume[]): HeatmapColumn[] {
  const first = days[0];
  if (!first) return [];
  const byKey = new Map(days.map((day) => [day.date, day]));

  const cursor = localDate(first.date);
  cursor.setDate(cursor.getDate() - cursor.getDay()); // back to Sunday
  const end = localDate(days[days.length - 1]?.date ?? first.date);

  const columns: HeatmapColumn[] = [];
  while (cursor <= end) {
    const column: HeatmapColumn = { bin: columns.length, bins: [] };
    for (let row = 0; row < 7 && cursor <= end; row++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      column.bins.push({
        bin: row,
        count: levelFor(byKey.get(key)?.meters ?? 0),
        date: new Date(cursor),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(column);
  }
  return columns;
}

export function ConsistencyCalendar({ days }: { days: DayVolume[] }) {
  const columns = useMemo(() => toColumns(days), [days]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // On phones the grid scrolls; open it on the latest weeks, not last December.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, []);
  const kmByDay = useMemo(() => new Map(days.map((day) => [day.date, day.meters / 1000])), [days]);

  const label = (_count: number, date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const km = kmByDay.get(key) ?? 0;
    return km > 0 ? `${km.toFixed(1)} km` : "Rest day";
  };

  return (
    <HeatmapInteractionProvider>
      <HeatmapInteractionBoundary>
        {/* Scrolls sideways on phones only; from `sm` up the year fits and the
            tooltip must be free to overflow the grid. */}
        <div
          ref={scrollerRef}
          className="-mx-1 overflow-x-auto overflow-y-hidden px-1 sm:overflow-visible"
        >
          <div className="min-w-[640px] sm:min-w-0">
            <HeatmapChart
              data={columns}
              layout="fluid"
              gap={3}
              margin={{ top: 22, right: 0, bottom: 0, left: 30 }}
            >
              <HeatmapCells cornerRadius={2.5} inactiveOpacity={0.35} />
              <HeatmapXAxis className="font-mono text-[10px] tracking-[0.08em] uppercase" />
              <HeatmapYAxis className="font-mono text-[10px] uppercase" />
              <HeatmapTooltip formatLabel={label} />
            </HeatmapChart>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="m-0 shrink-0 font-mono text-[10px] tracking-[0.08em] whitespace-nowrap text-muted-foreground uppercase">
            Shaded by distance
          </p>
          <HeatmapLegend
            lessLabel="Rest"
            moreLabel="10k+"
            cellSize={10}
            gap={3}
            fontSize={10}
            labelClassName="font-mono uppercase tracking-[0.08em]"
          />
        </div>
      </HeatmapInteractionBoundary>
    </HeatmapInteractionProvider>
  );
}
