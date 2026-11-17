import type { Metadata } from "next";
import { ContentColumn, HashedBand, SiteFooter, SiteHeader } from "@/components/layout";
import {
  Goals,
  PersonalRecords,
  RunningRecords,
  TrainingHeader,
} from "@/components/sections/fitness";
import { getTrainingSnapshot } from "@/lib/hevy/snapshot";

export const metadata: Metadata = {
  title: "Side Quest",
  description:
    "Training log pulled live from the Hevy API — sessions, volume, consistency and personal bests.",
  alternates: { canonical: "/side-quest" },
};

/** The Hevy client already sets an hour of ISR; this keeps the page in step. */
export const revalidate = 3600;

export default async function SideQuestPage() {
  const snapshot = await getTrainingSnapshot();

  return (
    <>
      <SiteHeader />

      <main>
        <ContentColumn>
          <TrainingHeader snapshot={snapshot} />
        </ContentColumn>

        <HashedBand />

        <ContentColumn>
          {/* The two bests panels sit side by side because they answer the same
              question in two units; they stack below `sm`, and the shared middle
              rule comes from the left panel's own border so the seam stays hairline. */}
          <div className="flex flex-col sm:flex-row">
            <PersonalRecords records={snapshot.records} />
            <RunningRecords />
          </div>
        </ContentColumn>

        <HashedBand />

        <ContentColumn>
          <Goals />
        </ContentColumn>
      </main>

      <SiteFooter />
    </>
  );
}
