import { Icon, StravaIcon } from "@/components/icons";
import { Panel } from "@/components/ui";
import { running } from "@/content";
import {
  formatDuration,
  formatKm,
  formatPace,
  formatShortDate,
  formatWeekdayTime,
} from "@/lib/strava/format";
import { routeToSvgPath } from "@/lib/strava/polyline";
import type { RunActivity } from "@/types/strava";
import { SectionHeading } from "./section-heading";

const ROUTE_SIZE = 44;

/** The run's GPS trace as a single stroke — the shape is recognisable without a map. */
function RouteGlyph({ polyline }: { polyline: string | null }) {
  const path = polyline ? routeToSvgPath(polyline, ROUTE_SIZE, 5) : null;

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface">
      {path ? (
        <svg
          viewBox={`0 0 ${ROUTE_SIZE} ${ROUTE_SIZE}`}
          className="size-11 text-muted-foreground transition-colors group-hover:text-training"
          aria-hidden="true"
        >
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Icon name="footprints" size={14} className="text-muted-foreground" />
      )}
    </div>
  );
}

/**
 * Latest runs as a quiet list: route shape, name, when — then distance, pace
 * and time in a fixed mono grid so the columns line up down the list.
 */
export function RecentRuns({ runs, year }: { runs: RunActivity[]; year: string }) {
  return (
    <Panel aria-labelledby="recent-title">
      <SectionHeading
        id="recent-title"
        title="Recent runs"
        description="The last few outings, straight off the watch."
      />

      <ol className="m-0 list-none border-t border-line p-0">
        {runs.map((run) => (
          <li key={run.id} className="border-b border-line last:border-b-0">
            <a
              href={`https://www.strava.com/activities/${run.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-3 text-foreground no-underline transition-colors hover:bg-accent-muted"
            >
              <RouteGlyph polyline={run.polyline} />

              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-medium">{run.name}</p>
                <p className="m-0 mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {formatShortDate(run.startDate, year)} · {formatWeekdayTime(run.startDate)}
                  {run.elevationGain > 0 ? ` · ↑${Math.round(run.elevationGain)} m` : ""}
                </p>
              </div>

              <dl className="m-0 grid shrink-0 grid-cols-[4.5rem] gap-x-4 text-right font-mono tabular-nums sm:grid-cols-[4.5rem_4.5rem_4.5rem]">
                <div>
                  <dt className="sr-only">Distance</dt>
                  <dd className="m-0 text-sm font-medium">
                    {formatKm(run.meters)}
                    <span className="ml-0.5 text-[10px] text-muted-foreground">km</span>
                  </dd>
                </div>
                <div className="hidden sm:block">
                  <dt className="sr-only">Pace</dt>
                  <dd className="m-0 text-sm text-muted-foreground">
                    {formatPace(run.movingSeconds, run.meters)}
                    <span className="ml-0.5 text-[10px]">/km</span>
                  </dd>
                </div>
                <div className="hidden sm:block">
                  <dt className="sr-only">Moving time</dt>
                  <dd className="m-0 text-sm text-muted-foreground">
                    {formatDuration(run.movingSeconds)}
                  </dd>
                </div>
              </dl>
            </a>
          </li>
        ))}
      </ol>

      <div className="flex justify-end border-t border-line px-4 py-3">
        <a
          href={running.stravaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground no-underline transition-colors hover:text-training"
        >
          <StravaIcon className="size-3" />
          All activities on Strava
          <Icon name="arrow-up-right" size={11} />
        </a>
      </div>
    </Panel>
  );
}
