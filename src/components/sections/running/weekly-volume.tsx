"use client";

import { useMemo } from "react";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import type { WeekVolume } from "@/types/strava";

/** Weekly kilometres for the last few weeks — the shape of the training block. */
export function WeeklyVolume({ weeks }: { weeks: WeekVolume[] }) {
  const data = useMemo(
    () =>
      weeks.map((week, index) => {
        const date = new Date(`${week.weekStart}T00:00:00Z`);
        const label =
          index === weeks.length - 1
            ? "Now"
            : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
        return {
          week: label,
          km: Math.round(week.meters / 100) / 10,
          runs: week.runs,
        };
      }),
    [weeks],
  );

  return (
    <BarChart
      data={data}
      xDataKey="week"
      aspectRatio="4 / 1"
      barGap={0.55}
      margin={{ top: 12, right: 0, bottom: 28, left: 0 }}
    >
      <Grid horizontal numTicksRows={3} strokeDasharray="2,4" />
      <Bar
        dataKey="km"
        fill="var(--chart-scale-04)"
        stroke="var(--chart-1)"
        lineCap={2}
        fadedOpacity={0.35}
      />
      <BarXAxis />
      <ChartTooltip
        showDatePill={false}
        rows={(point) => [
          { color: "var(--chart-1)", label: "Distance", value: `${point.km} km` },
          { color: "var(--muted-foreground)", label: "Runs", value: String(point.runs) },
        ]}
      />
    </BarChart>
  );
}
