import type { PersonalBest, RunActivity } from "@/types/strava";
import { emptyPersonalBests } from "./aggregate";
import { encodePolyline, type LatLng } from "./polyline";

/**
 * Seeded stand-in data for environments without Strava credentials.
 *
 * Generated relative to `today` (not a frozen fixture) so streaks, the
 * heatmap and "recent" stay believable whenever the page is built. A fixed
 * seed keeps every render of the same day identical.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Arbitrary origin — routes render as shapes only, never on a map. */
const HOME: LatLng = [10, 76];

/** A wobbly closed loop around home, roughly `km` long. */
function loopRoute(random: () => number, km: number): string {
  const radiusDeg = km / (2 * Math.PI) / 111;
  const steps = 48;
  const phase = random() * Math.PI * 2;
  const stretch = 0.7 + random() * 0.6;
  const points: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const wobble = 1 + 0.18 * Math.sin(3 * t + phase) + 0.08 * Math.sin(7 * t + phase * 2);
    points.push([
      HOME[0] + radiusDeg * wobble * Math.sin(t),
      HOME[1] + radiusDeg * stretch * wobble * Math.cos(t),
    ]);
  }
  return encodePolyline(points);
}

const NAMES = {
  easy: ["Easy miles", "Recovery jog", "Morning run", "Evening shakeout"],
  tempo: ["Tempo Tuesday", "Threshold 3×1K", "Progression run"],
  long: ["Sunday long run", "Long and slow", "Long run by the backwaters"],
};

function addDays(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function sampleActivities(today: string): RunActivity[] {
  const random = mulberry32(20261125);
  const activities: RunActivity[] = [];
  let id = 16_000_000_000;

  for (let back = 364; back >= 0; back--) {
    const day = addDays(today, -back);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sun
    // Fitness builds through the year: longer runs, slightly faster pace.
    const progress = 1 - back / 364;

    let kind: keyof typeof NAMES | null = null;
    if (weekday === 0 && random() > 0.15) kind = "long";
    else if (weekday === 2 && random() > 0.25) kind = "tempo";
    else if ((weekday === 4 || weekday === 6) && random() > 0.35) kind = "easy";
    else if (weekday === 1 && random() > 0.85) kind = "easy";
    // A three-week lull in early spring, the kind every real log has.
    if (back > 230 && back < 252) kind = null;
    if (!kind) continue;

    const km =
      kind === "long"
        ? 6 + progress * 7 + random() * 1.5
        : kind === "tempo"
          ? 4 + progress * 2 + random()
          : 3 + progress * 2.5 + random() * 1.5;
    const paceSecPerKm =
      (kind === "tempo" ? 405 : kind === "long" ? 445 : 430) - progress * 30 + random() * 15;
    const hour = kind === "long" ? 6 : random() > 0.5 ? 6 : 18;
    const names = NAMES[kind];

    activities.push({
      id: id++,
      name: names[Math.floor(random() * names.length)] ?? "Run",
      sportType: "Run",
      startDate: `${day}T${String(hour).padStart(2, "0")}:${String(Math.floor(random() * 50)).padStart(2, "0")}:00Z`,
      meters: Math.round(km * 1000),
      movingSeconds: Math.round(km * paceSecPerKm),
      elevationGain: Math.round(km * (4 + random() * 6)),
      polyline: loopRoute(random, km),
      averageHeartrate: Math.round(148 + random() * 18),
    });
  }

  return activities.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/** Bests to show with the sample log. The half is deliberately still open. */
export function samplePersonalBests(activities: RunActivity[]): PersonalBest[] {
  const bests = emptyPersonalBests();
  const tempo = activities.find((run) => run.meters >= 5000 && run.name.startsWith("Tempo"));
  const long = activities.find((run) => run.meters >= 10000);

  return bests.map((best) => {
    if (best.distance === "5k" && tempo) {
      return {
        ...best,
        seconds: 34 * 60 + 10,
        date: tempo.startDate,
        activityId: tempo.id,
        activityName: tempo.name,
      };
    }
    if (best.distance === "10k" && long) {
      return {
        ...best,
        seconds: 72 * 60 + 40,
        date: long.startDate,
        activityId: long.id,
        activityName: long.name,
      };
    }
    return best;
  });
}
