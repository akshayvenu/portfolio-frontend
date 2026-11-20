import { Panel } from "@/components/ui";
import { contributionAccounts } from "@/content";
import { emptyCalendar, fetchContributions } from "@/lib/contributions";
import { ContributionsMosaic } from "./contributions-mosaic";

/**
 * Server component: pulls the real GitHub contribution calendar for every
 * account (revalidated hourly) and hands them to the interactive graph, which
 * renders its own heading and the account switch.
 */
export async function Contributions() {
  const accounts = await Promise.all(
    contributionAccounts.map(async (account) => ({
      ...account,
      calendar: (await fetchContributions(account.username)) ?? emptyCalendar(),
    })),
  );

  return (
    <Panel noTopLine>
      <ContributionsMosaic accounts={accounts} />
    </Panel>
  );
}
