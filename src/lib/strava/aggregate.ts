import type {
  DayVolume,
  PersonalBest,
  PersonalBestDistance,
  RunActivity,
  StravaTotals,
  StreakSummary,
  WeekVolume,
} from "@/types/strava";

/**
 * Pure aggregation over a list of run activities. No I/O here, so the live
 * Strava path and the seeded sample path compute every derived number the
 * same way.
 */

const DAY_MS = 86_400_000;

/** Sport types that count as running for streaks, volume and bests. */
const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);

export function isRun(activity: Pick<RunActivity, "sportType">): boolean {
  return RUN_TYPES.has(activity.sportType);
}

export const PB_TARGETS: readonly {
  distance: PersonalBestDistance;
  label: string;
  meters: number;
  /** Strava's `best_efforts[].name` for this distance. */
  effortName: string;
}[] = [
  { distance: "5k", label: "5K", meters: 5000, effortName: "5k" },
  { distance: "10k", label: "10K", meters: 10000, effortName: "10k" },
  { distance: "half", label: "Half", meters: 21097.5, effortName: "Half-Marathon" },
];

export function emptyPersonalBests(): PersonalBest[] {
  return PB_TARGETS.map((target) => ({
    distance: target.distance,
    label: target.label,
    meters: target.meters,
    seconds: null,
    date: null,
    activityId: null,
    activityName: null,
  }));
}

/** `YYYY-MM-DD` for a date as seen in `timeZone`. */
export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Strava's `start_date_local` is local wall time with a `Z` suffix — the first 10 chars are the local day. */
export function activityDay(activity: Pick<RunActivity, "startDate">): string {
  return activity.startDate.slice(0, 10);
}

function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(key: string, days: number): string {
  return formatDay(new Date(parseDay(key).getTime() + days * DAY_MS));
}

/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const date = parseDay(key);
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(key, -offset);
}

/** Daily volume for `weeks` full Monday-start weeks ending with the current week. */
export function buildDays(runs: RunActivity[], today: string, weeks: number): DayVolume[] {
  const byDay = new Map<string, { meters: number; runs: number }>();
  for (const run of runs) {
    const key = activityDay(run);
    const entry = byDay.get(key) ?? { meters: 0, runs: 0 };
    entry.meters += run.meters;
    entry.runs += 1;
    byDay.set(key, entry);
  }

  const start = addDays(weekStart(today), -(weeks - 1) * 7);
  const days: DayVolume[] = [];
  for (let key = start; key <= today; key = addDays(key, 1)) {
    const entry = byDay.get(key);
    days.push({ date: key, meters: entry?.meters ?? 0, runs: entry?.runs ?? 0 });
  }
  return days;
}

export function buildWeeks(runs: RunActivity[], today: string, count: number): WeekVolume[] {
  const current = weekStart(today);
  const weeks: WeekVolume[] = [];
  for (let i = count - 1; i >= 0; i--) {
    weeks.push({ weekStart: addDays(current, -i * 7), meters: 0, runs: 0 });
  }
  const index = new Map(weeks.map((week, i) => [week.weekStart, i]));
  for (const run of runs) {
    const i = index.get(weekStart(activityDay(run)));
    if (i === undefined) continue;
    const week = weeks[i];
    if (!week) continue;
    week.meters += run.meters;
    week.runs += 1;
  }
  return weeks;
}

export function buildStreak(runs: RunActivity[], today: string): StreakSummary {
  const runDays = new Set(runs.map(activityDay));
  const runWeeks = new Set([...runDays].map(weekStart));

  // Day streak: today counts if run; otherwise a streak ending yesterday is still alive.
  let currentDays = 0;
  let cursor = runDays.has(today) ? today : addDays(today, -1);
  while (runDays.has(cursor)) {
    currentDays += 1;
    cursor = addDays(cursor, -1);
  }

  // Week streak: the current week counts once it has a run; until then, last week carries it.
  const thisWeek = weekStart(today);
  let currentWeeks = 0;
  let week = runWeeks.has(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  while (runWeeks.has(week)) {
    currentWeeks += 1;
    week = addDays(week, -7);
  }

  let longestWeeks = 0;
  for (const start of runWeeks) {
    if (runWeeks.has(addDays(start, -7))) continue; // not the start of a run
    let length = 0;
    let w = start;
    while (runWeeks.has(w)) {
      length += 1;
      w = addDays(w, 7);
    }
    longestWeeks = Math.max(longestWeeks, length);
  }

  const thisWeekRuns = runs.filter((run) => weekStart(activityDay(run)) === thisWeek);

  return {
    currentWeeks,
    longestWeeks,
    currentDays,
    thisWeekRuns: thisWeekRuns.length,
    thisWeekMeters: thisWeekRuns.reduce((sum, run) => sum + run.meters, 0),
  };
}

export function buildTotals(runs: RunActivity[], today: string): StravaTotals {
  const year = today.slice(0, 4);
  const ytd = runs.filter((run) => run.startDate.startsWith(year));
  return {
    ytdMeters: ytd.reduce((sum, run) => sum + run.meters, 0),
    ytdRuns: ytd.length,
    ytdMovingSeconds: ytd.reduce((sum, run) => sum + run.movingSeconds, 0),
    ytdElevation: ytd.reduce((sum, run) => sum + run.elevationGain, 0),
    allMeters: runs.reduce((sum, run) => sum + run.meters, 0),
    allRuns: runs.length,
  };
}
