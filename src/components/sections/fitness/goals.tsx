import { Icon } from "@/components/icons";
import { IconTile, Panel, PanelHeader, PanelTitle } from "@/components/ui";
import { fitness } from "@/content";

/**
 * What the training is actually for.
 *
 * Each row states the target and the current number side by side: the gap
 * between them is the only thing a reader needs, and hiding it behind a
 * progress bar would round away the honesty the rest of the page is built on.
 */
export function Goals() {
  return (
    <Panel id="goals">
      <PanelHeader>
        <PanelTitle className="text-xl">What I’m chasing</PanelTitle>
      </PanelHeader>

      <ul className="m-0 flex list-none flex-col p-0">
        {fitness.goals.map((goal) => (
          <li
            key={goal.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-b-0"
          >
            <IconTile>
              <Icon name={goal.icon} size={13} />
            </IconTile>

            <div className="min-w-[14ch] flex-1">
              <p className="m-0 text-sm font-medium">{goal.label}</p>
              {"note" in goal && goal.note ? (
                <p className="m-0 text-xs text-muted-foreground">{goal.note}</p>
              ) : null}
            </div>

            {/* Current → target, so the eye lands on where it's going. */}
            <p className="m-0 shrink-0 font-mono text-xs tabular-nums">
              <span className="text-muted-foreground">{goal.current}</span>
              <span aria-label="to" className="mx-1.5 text-muted-foreground">
                →
              </span>
              <span className="font-medium text-training">{goal.target}</span>
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
