import { Icon } from "@/components/icons";
import type { IconName } from "@/lib/icons";
import { Panel } from "@/components/ui";
import { formatKm } from "@/lib/strava/format";
import type { HeatmapDay } from "@/types/hevy";
import type { StravaSnapshot } from "@/types/strava";
import { ActivityCalendar } from "./activity-calendar";
import { MonoLabel, SectionHeading } from "./section-heading";
import { WeeklyVolume } from "./weekly-volume";

/**
 * Consistency, three ways: streak numbers up top, gym and run days week by
 * week, and the last twelve weeks of volume. Streaks are counted in weeks
 * because a rest day isn't a failure; an empty week is.
 */
export function Consistency({
  snapshot,
  gymDays,
  today,
}: {
  snapshot: StravaSnapshot;
  gymDays: HeatmapDay[];
  today: string;
}) {
  const { streak, days, weeks } = snapshot;
  const yearKm = days.reduce((sum, day) => sum + day.meters, 0);
  const activeDays = days.filter((day) => day.runs > 0).length;

  const stats: { icon: IconName; label: string; value: string; hint: string }[] = [
    {
      icon: "flame",
      label: "Current streak",
      value: `${streak.currentWeeks} wk`,
      hint: streak.currentDays > 1 ? `${streak.currentDays} days running` : "weeks with a run",
    },
    {
      icon: "trophy",
      label: "Longest streak",
      value: `${streak.longestWeeks} wk`,
      hint: "in the last year",
    },
    {
      icon: "calendar-days",
      label: "This week",
      value: streak.thisWeekMeters > 0 ? `${formatKm(streak.thisWeekMeters)} km` : "0 km",
      hint: `${streak.thisWeekRuns} ${streak.thisWeekRuns === 1 ? "run" : "runs"} so far`,
    },
  ];

  return (
    <Panel aria-labelledby="consistency-title" noTopLine>
      <SectionHeading
        id="consistency-title"
        title="Consistency"
        description={`${Math.round(yearKm / 1000).toLocaleString("en-US")} km across ${activeDays} days in the last year.`}
      />

      <dl className="m-0 grid grid-cols-3 border-y border-line">
        {stats.map((stat) => (
          <div key={stat.label} className="border-line px-4 py-4 not-first:border-l">
            <dt className="flex items-center gap-1.5">
              <Icon name={stat.icon} size={12} className="text-training" />
              <MonoLabel>{stat.label}</MonoLabel>
            </dt>
            <dd className="m-0 mt-1.5">
              <span className="block font-heading text-xl font-medium tracking-[-0.02em] tabular-nums sm:text-2xl">
                {stat.value}
              </span>
              <span className="block text-xs text-muted-foreground">{stat.hint}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div id="calendar" className="px-4 pt-6 pb-5">
        <ActivityCalendar runDays={days} gymDays={gymDays} today={today} />
      </div>

      <div className="border-t border-line px-4 pt-5 pb-2">
        <div className="flex items-baseline justify-between">
          <MonoLabel className="text-foreground">Weekly distance</MonoLabel>
          <MonoLabel>Last {weeks.length} weeks · km</MonoLabel>
        </div>
        <div className="mt-2">
          <WeeklyVolume weeks={weeks} />
        </div>
      </div>
    </Panel>
  );
}
