/**
 * Static copy for the Side Quest page.
 *
 * Lifting numbers come from Hevy at request time (see `src/lib/hevy`) — this
 * file only holds the words around them. Running is hand-kept: the goals move
 * slowly enough that a static list beats a second API integration.
 */
export const fitness = {
  eyebrow: "Side quest",
  title: "Training log",
  lede: "Two numbers I care about outside work: what I can lift, and how fast I can run 5k. The lifting side is pulled straight from my Hevy log — no hand-typed weights.",
  hevyUrl: "https://hevy.com/user/zaibonk",
  /** Shown when the page renders seeded stand-in data instead of live API data. */
  sampleNotice:
    "Showing representative sample data — the live Hevy key isn’t configured in this environment.",

  /**
   * Best run efforts, newest PR first. Hand-entered — update after a PB.
   * `detail` is the one line of context worth the reader's time; leave it off
   * rather than padding it.
   */
  running: {
    note: "Logged by hand. Road, GPS watch, no treadmill times.",
    records: [
      { distance: "5K", time: "34:10", pace: "6:50 /km", date: "2026-08", detail: "Flat loop, evening" },
      { distance: "3K", time: "19:40", pace: "6:33 /km", date: "2026-07" },
      { distance: "1K", time: "5:48", pace: "5:48 /km", date: "2026-06", detail: "Standalone time trial" },
      { distance: "Longest run", time: "8.2 km", pace: "7:05 /km", date: "2026-08" },
    ],
  },

  /**
   * Where the training is pointed. Each goal is one target with one honest
   * current number beside it — the gap is the whole story, so it stays visible.
   */
  goals: [
    {
      id: "5k-pace",
      icon: "timer",
      label: "5K under 6:30 /km",
      target: "32:30",
      current: "34:10",
      note: "20s per km to find. Two tempo runs a week.",
    },
    {
      id: "10k",
      icon: "activity",
      label: "First 10K, unbroken",
      target: "10 km",
      current: "8.2 km",
      note: "Adding a kilometre to the long run every other week.",
    },
    {
      id: "bench",
      icon: "dumbbell",
      label: "Bench bodyweight for reps",
      target: "70 kg × 5",
      current: "62.5 kg × 5",
    },
    {
      id: "consistency",
      icon: "repeat",
      label: "Four sessions a week",
      target: "4 / week",
      current: "3 / week",
      note: "Two lifts, two runs. Missing the fourth is the usual failure.",
    },
  ],
} as const;
