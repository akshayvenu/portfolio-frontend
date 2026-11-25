import { Icon } from "@/components/icons";
import { Panel } from "@/components/ui";
import { running } from "@/content";
import { formatHours, formatKmWhole } from "@/lib/strava/format";
import type { StravaSnapshot } from "@/types/strava";

/**
 * Side Quest hero: who, what, where the numbers come from — then the year in
 * four figures. The provenance pill is the page's whole claim, so it sits
 * right under the title rather than in a footer.
 */
export function RunningHeader({ snapshot }: { snapshot: StravaSnapshot }) {
  const synced = new Date(snapshot.syncedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: process.env.STRAVA_TIMEZONE ?? "Asia/Kolkata",
  });
  const year = snapshot.syncedAt.slice(0, 4);
  const { totals, streak } = snapshot;

  const stats = [
    { label: `${year} distance`, value: formatKmWhole(totals.ytdMeters), unit: "km" },
    { label: "Runs", value: totals.ytdRuns.toLocaleString("en-US"), unit: "" },
    { label: "Time on feet", value: formatHours(totals.ytdMovingSeconds), unit: "" },
    {
      label: "Week streak",
      value: String(streak.currentWeeks),
      unit: streak.currentWeeks === 1 ? "wk" : "wks",
    },
  ];

  return (
    <Panel>
      <div className="px-4 pt-10 pb-8">
        <p className="m-0 flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-training uppercase">
          <Icon name="footprints" size={13} />
          {running.eyebrow}
        </p>

        <h1 className="mt-3 mb-0 font-heading text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          {running.title}
        </h1>

        <p className="mt-3 mb-0 max-w-[54ch] text-base leading-relaxed text-muted-foreground">
          {running.lede}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 font-mono">
            <span className="relative flex size-1.5" aria-hidden="true">
              {snapshot.source === "live" ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-training opacity-60" />
              ) : null}
              <span
                className={
                  snapshot.source === "live"
                    ? "relative size-1.5 rounded-full bg-training"
                    : "relative size-1.5 rounded-full bg-muted-foreground"
                }
              />
            </span>
            {snapshot.source === "live" ? "Live from Strava" : "Sample data"}
          </span>
          <span className="font-mono">Synced {synced}</span>
          <a
            href={snapshot.athleteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-foreground no-underline transition-colors hover:text-training"
          >
            strava.com
            <Icon name="arrow-up-right" size={12} />
          </a>
        </div>

        {snapshot.source === "sample" ? (
          <p className="mt-4 mb-0 max-w-[60ch] text-xs text-muted-foreground">
            {running.sampleNotice}
          </p>
        ) : null}
      </div>

      <dl className="m-0 grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={[
              "px-4 py-4",
              index % 2 === 1 ? "border-l border-line" : "",
              index >= 2 ? "border-t border-line sm:border-t-0" : "",
              index === 2 ? "sm:border-l" : "",
            ].join(" ")}
          >
            <dt className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              {stat.label}
            </dt>
            <dd className="m-0 mt-1.5 font-heading text-2xl font-medium tracking-[-0.02em] tabular-nums">
              {stat.value}
              {stat.unit ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
