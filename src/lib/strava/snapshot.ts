import "server-only";

import fallbackSnapshot from "./fallback-snapshot.json";

import { apiFetch } from "@/lib/api";
import { running } from "@/content";
import type { StravaSnapshot } from "@/types/strava";

type BackendSnapshot = Omit<StravaSnapshot, "athleteUrl">;

function withAthleteUrl(snapshot: BackendSnapshot): StravaSnapshot {
  return { ...snapshot, athleteUrl: snapshot.athlete?.profileUrl ?? running.stravaUrl };
}

/**
 * Single entry point for the Side Quest page's running data.
 *
 * The snapshot itself — live Strava data or seeded sample data — is assembled
 * by the FastAPI backend (`portfolio-backend/app/services/strava`), which holds
 * the Strava credentials. If the backend is unreachable, this falls back to a
 * static fixture generated from the backend's own sample path, so a portfolio
 * page never 500s over it.
 */
export async function getStravaSnapshot(): Promise<StravaSnapshot> {
  try {
    return withAthleteUrl(await apiFetch<BackendSnapshot>("/api/v1/running/snapshot", ["strava"]));
  } catch (error) {
    console.error("[strava] backend unreachable, using fallback snapshot:", error);
    return withAthleteUrl(fallbackSnapshot as BackendSnapshot);
  }
}
