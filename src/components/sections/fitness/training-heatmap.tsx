import type { HeatmapDay } from "@/types/hevy";

const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

function dayLabel(day: HeatmapDay): string {
  const date = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  if (day.workouts === 0) return `Rest — ${date}`;
  return `${day.workouts} session${day.workouts === 1 ? "" : "s"} · ${day.volumeKg.toLocaleString("en-US")} kg — ${date}`;
}

/**
 * The current training week: one tile per day, Monday through Sunday.
 *
 * Built mobile-first — seven full-width tiles fit the narrowest phone without
 * scrolling, and each tile prints its own volume rather than hiding it behind a
 * hover tooltip that a touch device can never reach.
 */
export function TrainingHeatmap({ days }: { days: HeatmapDay[] }) {
  // `build_heatmap` ends on the Sunday of the current week, so the tail seven
  // entries are always Mon–Sun of this week.
  const week = days.slice(-7);
  const today = new Date().toLocaleDateString("en-CA");

  const trainedDays = week.filter((day) => day.workouts > 0).length;
  const weekVolume = week.reduce((total, day) => total + day.volumeKg, 0);

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {week.map((day, index) => {
          const isToday = day.date === today;
          const trained = day.workouts > 0;
          return (
            <div
              key={day.date}
              role="img"
              aria-label={dayLabel(day)}
              title={dayLabel(day)}
              className={`flex flex-col items-center gap-1.5 rounded-md border p-1.5 sm:p-2 ${
                isToday ? "border-foreground/40" : "border-line"
              }`}
            >
              <span
                className={`font-mono text-[10px] leading-none ${
                  isToday ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {WEEKDAY_INITIALS[index]}
              </span>

              <span
                aria-hidden="true"
                className="h-7 w-full rounded-[3px] sm:h-9"
                style={{ background: `var(--training-${day.level})` }}
              />

              <span className="font-mono text-[9px] leading-none text-muted-foreground tabular-nums sm:text-[10px]">
                {trained ? `${Math.round(day.volumeKg / 1000)}t` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">{trainedDays} of 7 days trained</span>
        <span className="font-mono tabular-nums">
          {weekVolume.toLocaleString("en-US")} kg this week
        </span>
      </div>
    </div>
  );
}
