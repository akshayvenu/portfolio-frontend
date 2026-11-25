/**
 * Static copy for the Side Quest (running) page.
 *
 * Numbers — bests, activities, streaks — come from Strava at request time
 * (see `src/lib/strava`). This file only holds the words around them, plus the
 * race calendar, which Strava has no API for.
 */
export const running = {
  eyebrow: "Side quest",
  title: "Running log",
  lede: "What I do when the laptop closes. Every number on this page is pulled from my Strava — no hand-typed times, no rounding down.",
  stravaUrl: "https://www.strava.com/athletes/124545511",
  sampleNotice:
    "Showing representative sample data — Strava credentials aren’t configured in this environment.",

  /**
   * Upcoming races and the time each one is pointed at. Hand-kept: update
   * when a race is booked or run. `date` is the race day (`YYYY-MM-DD`).
   * Placeholder entries — replace with the real races.
   */
  races: [
    {
      id: "5k-tt-dec",
      name: "5K time trial",
      place: "Home loop",
      date: "2026-12-13",
      distance: "5K",
      goal: "32:30",
      note: "Break 6:30 /km for the full five.",
    },
    {
      id: "first-10k",
      name: "First 10K race",
      place: "City road race",
      date: "2027-01-24",
      distance: "10K",
      goal: "1:08:00",
      note: "Run it unbroken, negative split the back half.",
    },
    {
      id: "first-half",
      name: "First half marathon",
      place: "Road, flat course",
      date: "2027-03-21",
      distance: "21.1K",
      goal: "2:30:00",
      note: "Finish strong. Long run builds to 18 km first.",
    },
  ],
} as const;

export type Race = (typeof running.races)[number];
