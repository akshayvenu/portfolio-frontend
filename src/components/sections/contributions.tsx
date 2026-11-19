import { Panel } from "@/components/ui";
import { contributionSource, contributionUser } from "@/content";
import { emptyCalendar, fetchContributions } from "@/lib/contributions";
import { ContributionsMosaic } from "./contributions-mosaic";

/**
 * Server component: pulls the real GitHub contribution calendar (revalidated
 * hourly) and hands it to the interactive graph, which renders its own heading.
 */
export async function Contributions() {
  const calendar = (await fetchContributions(contributionUser)) ?? emptyCalendar();

  return (
    <Panel noTopLine>
      <ContributionsMosaic
        calendar={calendar}
        username={contributionUser}
        profileHref={contributionSource.href}
      />
    </Panel>
  );
}
