import "server-only";

import { unstable_cache } from "next/cache";
import { running } from "@/content";
import type { StravaSnapshot } from "@/types/strava";
import { buildDays, buildStreak, buildTotals, buildWeeks, dayKey } from "./aggregate";
import { fetchStrava, stravaCredentials } from "./client";
import { sampleActivities, samplePersonalBests } from "./sample";

/** Weeks shown in the consistency heatmap and the weekly-volume chart. */
const HEATMAP_WEEKS = 52;
const VOLUME_WEEKS = 12;
const RECENT_COUNT = 6;

function timeZone(): string {
  return process.env.STRAVA_TIMEZONE ?? "Asia/Kolkata";
}

async function build(): Promise<StravaSnapshot> {
  const today = dayKey(new Date(), timeZone());
  const credentials = stravaCredentials();

  let source: StravaSnapshot["source"] = "sample";
  let activities = sampleActivities(today);
  let personalBests = samplePersonalBests(activities);

  if (credentials) {
    try {
      const live = await fetchStrava(credentials);
      activities = live.activities;
      personalBests = live.personalBests;
      source = "live";
    } catch (error) {
      console.error("[strava] live fetch failed, using sample data:", error);
    }
  }

  return {
    source,
    syncedAt: new Date().toISOString(),
    athleteUrl: running.stravaUrl,
    totals: buildTotals(activities, today),
    personalBests,
    recent: activities.slice(0, RECENT_COUNT),
    days: buildDays(activities, today, HEATMAP_WEEKS),
    weeks: buildWeeks(activities, today, VOLUME_WEEKS),
    streak: buildStreak(activities, today),
  };
}

/**
 * Single entry point for the Side Quest page. Cached for an hour and tagged
 * `strava`, so a webhook or `revalidateTag("strava")` can refresh it early.
 * Never throws: a missing key or a Strava outage degrades to sample data.
 */
export const getStravaSnapshot = unstable_cache(build, ["strava-snapshot-v1"], {
  revalidate: 3600,
  tags: ["strava"],
});
