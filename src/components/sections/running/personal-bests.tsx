import { Icon } from "@/components/icons";
import { Panel } from "@/components/ui";
import { running } from "@/content";
import { formatDuration, formatPace, formatShortDate, parseDuration } from "@/lib/strava/format";
import type { PersonalBest } from "@/types/strava";
import { MonoLabel, SectionHeading } from "./section-heading";

/** Which race distance label in `running.races` a best is chasing. */
const RACE_DISTANCE: Record<PersonalBest["distance"], string> = {
  "5k": "5K",
  "10k": "10K",
  half: "21.1K",
};

/**
 * Three bests, one cell each. The time is the hero; pace and provenance sit
 * underneath, and — when a race is booked at that distance — the gap to its
 * goal time, because the gap is what the training is for.
 */
export function PersonalBests({ bests, year }: { bests: PersonalBest[]; year: string }) {
  return (
    <Panel aria-labelledby="bests-title">
      <SectionHeading
        id="bests-title"
        title="Personal bests"
        description="Fastest efforts Strava has recorded at each distance."
      />

      <ol className="m-0 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-3">
        {bests.map((best) => {
          const race = running.races.find((r) => r.distance === RACE_DISTANCE[best.distance]);
          const goalSeconds = race ? parseDuration(race.goal) : null;
          const gap =
            best.seconds !== null && goalSeconds !== null ? best.seconds - goalSeconds : null;

          return (
            <li
              key={best.distance}
              className="group relative flex flex-col gap-4 border-line px-4 py-5 not-first:border-t sm:not-first:border-t-0 sm:not-first:border-l"
            >
              <div className="flex items-center justify-between">
                <MonoLabel className="text-foreground">{best.label}</MonoLabel>
                {best.seconds !== null ? (
                  <Icon
                    name="trophy"
                    size={13}
                    className="text-muted-foreground transition-colors group-hover:text-training"
                  />
                ) : null}
              </div>

              {best.seconds !== null ? (
                <div>
                  <p className="m-0 font-heading text-4xl font-medium tracking-[-0.03em] tabular-nums">
                    {formatDuration(best.seconds)}
                  </p>
                  <p className="m-0 mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                    {formatPace(best.seconds, best.meters)} /km
                  </p>
                </div>
              ) : (
                <div>
                  <p className="m-0 font-heading text-4xl font-medium tracking-[-0.03em] text-muted-foreground/50">
                    Not yet
                  </p>
                  <p className="m-0 mt-1 font-mono text-xs text-muted-foreground">
                    {race
                      ? `First attempt · ${formatShortDate(race.date, year)}`
                      : "Unrun distance"}
                  </p>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-1.5 text-xs">
                {gap !== null && race ? (
                  <p className="m-0 flex items-center justify-between font-mono tabular-nums">
                    <span className="text-muted-foreground">Goal {race.goal}</span>
                    <span className={gap <= 0 ? "text-success" : "text-training"}>
                      {gap <= 0 ? "Goal hit" : `${formatDuration(gap)} to go`}
                    </span>
                  </p>
                ) : null}

                {best.activityId && best.date ? (
                  <a
                    href={`https://www.strava.com/activities/${best.activityId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 text-muted-foreground no-underline transition-colors hover:text-foreground"
                  >
                    <span className="truncate">
                      {formatShortDate(best.date, year)}
                      {best.activityName ? ` · ${best.activityName}` : ""}
                    </span>
                    <Icon name="arrow-up-right" size={11} className="shrink-0" />
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
