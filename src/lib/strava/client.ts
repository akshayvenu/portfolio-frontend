import "server-only";

import type { PersonalBest, RunActivity } from "@/types/strava";
import { PB_TARGETS, emptyPersonalBests, isRun } from "./aggregate";

/**
 * Minimal Strava API client — server only.
 *
 * Auth is the single-athlete pattern: a long-lived refresh token (scope
 * `activity:read_all`) is exchanged for a short-lived access token on each
 * snapshot build. The whole build is cached for an hour upstream, so this
 * costs a handful of requests per hour against Strava's 100 / 15 min limit.
 */

const API = "https://www.strava.com/api/v3";

interface StravaCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export function stravaCredentials(): StravaCredentials | null {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

async function accessToken(credentials: StravaCredentials): Promise<string> {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });
  if (!response.ok) throw new Error(`Strava token refresh failed: ${response.status}`);
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

async function get<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Strava ${response.status} for ${path}`);
  return (await response.json()) as T;
}

/** The subset of Strava's SummaryActivity this page reads. */
interface SummaryActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_speed: number;
  average_heartrate?: number;
  map?: { summary_polyline?: string | null };
}

interface BestEffort {
  name: string;
  elapsed_time: number;
  start_date_local: string;
}

function toActivity(raw: SummaryActivity): RunActivity {
  return {
    id: raw.id,
    name: raw.name,
    sportType: raw.sport_type,
    startDate: raw.start_date_local,
    meters: raw.distance,
    movingSeconds: raw.moving_time,
    elevationGain: raw.total_elevation_gain,
    polyline: raw.map?.summary_polyline || null,
    averageHeartrate: raw.average_heartrate ?? null,
  };
}

/** Every activity, newest first, capped so a huge history can't stall a build. */
async function allActivities(token: string, maxPages = 5): Promise<SummaryActivity[]> {
  const all: SummaryActivity[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await get<SummaryActivity[]>(
      token,
      `/athlete/activities?per_page=200&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 200) break;
  }
  return all;
}

/**
 * Bests come from Strava's own `best_efforts`, which only the detailed
 * activity endpoint returns. Rather than fetch every run, take the fastest
 * few runs long enough to contain each distance and read their efforts.
 */
async function personalBests(token: string, runs: SummaryActivity[]): Promise<PersonalBest[]> {
  const candidates = new Set<number>();
  for (const target of PB_TARGETS) {
    runs
      .filter((run) => run.distance >= target.meters * 0.99)
      .sort((a, b) => b.average_speed - a.average_speed)
      .slice(0, 4)
      .forEach((run) => candidates.add(run.id));
  }

  const byId = new Map(runs.map((run) => [run.id, run]));
  const details = await Promise.all(
    [...candidates].map((id) =>
      get<{ id: number; best_efforts?: BestEffort[] }>(token, `/activities/${id}`).catch(
        () => null,
      ),
    ),
  );

  return emptyPersonalBests().map((best) => {
    const target = PB_TARGETS.find((t) => t.distance === best.distance);
    let winner: PersonalBest = best;
    for (const detail of details) {
      const effort = detail?.best_efforts?.find((e) => e.name === target?.effortName);
      if (!detail || !effort) continue;
      if (winner.seconds === null || effort.elapsed_time < winner.seconds) {
        winner = {
          ...best,
          seconds: effort.elapsed_time,
          date: effort.start_date_local,
          activityId: detail.id,
          activityName: byId.get(detail.id)?.name ?? null,
        };
      }
    }
    return winner;
  });
}

export async function fetchStrava(
  credentials: StravaCredentials,
): Promise<{ activities: RunActivity[]; personalBests: PersonalBest[] }> {
  const token = await accessToken(credentials);
  const raw = await allActivities(token);
  const runs = raw.filter((activity) => isRun({ sportType: activity.sport_type }));
  const bests = await personalBests(token, runs);
  return { activities: runs.map(toActivity), personalBests: bests };
}
