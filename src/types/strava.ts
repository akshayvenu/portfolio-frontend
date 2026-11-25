/**
 * The shape the Side Quest page renders from.
 *
 * Built server-side from the Strava API (or a seeded sample when no Strava
 * credentials are configured) — components never see raw Strava payloads.
 */

export type StravaSource = "live" | "sample";

export type PersonalBestDistance = "5k" | "10k" | "half";

export interface PersonalBest {
  distance: PersonalBestDistance;
  /** Display label: "5K", "10K", "Half". */
  label: string;
  /** Exact distance in metres, used for pace. */
  meters: number;
  /** Elapsed seconds for the effort, or null when not run yet. */
  seconds: number | null;
  /** ISO date of the effort. */
  date: string | null;
  /** Strava activity the effort came from. */
  activityId: number | null;
  activityName: string | null;
}

export interface RunActivity {
  id: number;
  name: string;
  /** Strava sport type, e.g. "Run", "TrailRun", "Walk". */
  sportType: string;
  /** ISO local start time. */
  startDate: string;
  meters: number;
  movingSeconds: number;
  elevationGain: number;
  /** Encoded Google polyline of the route, if GPS was on. */
  polyline: string | null;
  averageHeartrate: number | null;
}

export interface DayVolume {
  /** `YYYY-MM-DD` in the athlete's local time. */
  date: string;
  meters: number;
  runs: number;
}

export interface WeekVolume {
  /** Monday of the week, `YYYY-MM-DD`. */
  weekStart: string;
  meters: number;
  runs: number;
}

export interface StravaTotals {
  /** Year to date. */
  ytdMeters: number;
  ytdRuns: number;
  ytdMovingSeconds: number;
  ytdElevation: number;
  /** All time. */
  allMeters: number;
  allRuns: number;
}

export interface StreakSummary {
  /** Consecutive weeks (ending this week or last) with at least one run. */
  currentWeeks: number;
  longestWeeks: number;
  /** Consecutive days ending today or yesterday with a run. */
  currentDays: number;
  /** Runs logged in the current Monday–Sunday week. */
  thisWeekRuns: number;
  thisWeekMeters: number;
}

export interface StravaSnapshot {
  source: StravaSource;
  syncedAt: string;
  athleteUrl: string;
  totals: StravaTotals;
  personalBests: PersonalBest[];
  recent: RunActivity[];
  /** Daily volume across the heatmap window (oldest first). */
  days: DayVolume[];
  /** Weekly volume for the last few weeks (oldest first). */
  weeks: WeekVolume[];
  streak: StreakSummary;
}
