import { Icon } from "@/components/icons";
import { Panel } from "@/components/ui";
import { running } from "@/content";
import { daysBetween, formatShortDate } from "@/lib/strava/format";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

function countdown(days: number): string {
  if (days === 0) return "Race day";
  if (days === 1) return "Tomorrow";
  if (days < 0) return "Done";
  if (days < 21) return `In ${days} days`;
  return `In ${Math.round(days / 7)} weeks`;
}

/**
 * The race calendar as a route: a dotted line from today down through each
 * booked race, the next one lit. Each stop states the goal time plainly —
 * the bests panel above already shows how far off it is.
 */
export function RaceGoals({ today }: { today: string }) {
  const races = [...running.races].sort((a, b) => a.date.localeCompare(b.date));
  const nextIndex = races.findIndex((race) => race.date >= today);
  const year = today.slice(0, 4);

  return (
    <Panel aria-labelledby="races-title" noTopLine>
      <SectionHeading
        id="races-title"
        title="Upcoming races"
        description="What the training is pointed at, and the time I’m going for."
      />

      <div className="border-t border-line px-4 pt-6 pb-8">
        <p className="m-0 mb-4 flex items-center gap-2 pl-[3px] font-mono text-[10px] tracking-[0.14em] text-training uppercase">
          <Icon name="flag" size={12} />
          Race plan
        </p>

        <ol className="relative m-0 list-none p-0">
          {/* The route: one dotted rule behind every stop. */}
          <span
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-[7px] w-0 border-l-2 border-dotted border-muted-foreground/30"
          />

          {races.map((race, index) => {
            const days = daysBetween(today, race.date);
            const isNext = index === nextIndex;

            return (
              <li key={race.id} className="relative pb-7 pl-8 last:pb-0">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1 left-0 flex size-[15px] items-center justify-center rounded-full border bg-background",
                    isNext ? "border-training" : "border-muted-foreground/40",
                  )}
                >
                  <span
                    className={cn(
                      "size-[7px] rounded-full",
                      isNext ? "bg-training" : "bg-muted-foreground/50",
                    )}
                  />
                  {isNext ? (
                    <span className="absolute inset-0 animate-ping rounded-full border border-training opacity-40" />
                  ) : null}
                </span>

                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="m-0 flex items-baseline gap-2 text-base font-medium">
                    {race.name}
                    <span className="rounded-md border border-line bg-surface px-1.5 py-px font-mono text-[10px] font-normal text-muted-foreground">
                      {race.distance}
                    </span>
                  </p>
                  <p
                    className={cn(
                      "m-0 font-mono text-xs tracking-[0.08em] uppercase tabular-nums",
                      isNext ? "text-training" : "text-muted-foreground",
                    )}
                  >
                    {formatShortDate(race.date, year)} · {countdown(days)}
                  </p>
                </div>

                <p className="m-0 mt-1 text-sm text-muted-foreground">
                  {race.place}
                  {race.note ? ` — ${race.note}` : ""}
                </p>

                <p className="m-0 mt-2 inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
                  <Icon name="timer" size={12} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium text-foreground">{race.goal}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </Panel>
  );
}
