import type { Metadata } from "next";
import { ContentColumn, HashedBand, SiteFooter, SiteHeader } from "@/components/layout";
import {
  Consistency,
  PersonalBests,
  RaceGoals,
  RecentRuns,
  RunningHeader,
} from "@/components/sections/running";
import { dayKey } from "@/lib/strava/aggregate";
import { getStravaSnapshot } from "@/lib/strava/snapshot";

export const metadata: Metadata = {
  title: "Side Quest",
  description:
    "Running log pulled live from Strava — personal bests, recent runs, streaks and the races ahead.",
  alternates: { canonical: "/side-quest" },
};

/** The Strava snapshot is cached for an hour; this keeps the page in step. */
export const revalidate = 3600;

export default async function SideQuestPage() {
  const snapshot = await getStravaSnapshot();
  const today = dayKey(new Date(), process.env.STRAVA_TIMEZONE ?? "Asia/Kolkata");
  const year = today.slice(0, 4);

  return (
    <>
      <SiteHeader />

      <main>
        <ContentColumn>
          <RunningHeader snapshot={snapshot} />
        </ContentColumn>

        <HashedBand />

        <ContentColumn>
          <PersonalBests bests={snapshot.personalBests} year={year} />
          <Consistency snapshot={snapshot} />
        </ContentColumn>

        <HashedBand />

        <ContentColumn>
          <RecentRuns runs={snapshot.recent} year={year} />
          <RaceGoals today={today} />
        </ContentColumn>
      </main>

      <SiteFooter />
    </>
  );
}
