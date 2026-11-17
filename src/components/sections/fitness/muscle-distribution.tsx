import { Icon } from "@/components/icons";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui";
import type { MuscleRadar, PeriodComparison } from "@/types/hevy";
import { MuscleRadarChart } from "./muscle-radar-chart";

/**
 * Muscle distribution: a six-spoke radar of where the working sets landed,
 * overlaid on the window before it, plus the four totals that moved with it.
 *
 * The radar earns its place over the bar list next to it by answering a
 * different question — not "which region got the most work" but "did the shape
 * of the split drift", which only reads once both periods are on the same web.
 */
export function MuscleDistribution({
  radar,
  comparison,
}: {
  radar: MuscleRadar;
  comparison: PeriodComparison;
}) {
  const hasSets = radar.axes.some((axis) => axis.currentSets > 0);

  return (
    <Panel id="distribution">
      <PanelHeader className="flex items-baseline justify-between gap-4">
        <PanelTitle>Muscle distribution</PanelTitle>
        <span className="font-mono text-xs text-muted-foreground">
          Last {radar.windowDays} days
        </span>
      </PanelHeader>

      {hasSets ? (
        <MuscleRadarChart axes={radar.axes} windowDays={radar.windowDays} />
      ) : (
        <p className="m-0 p-4 text-sm text-muted-foreground">
          No working sets logged in the last {radar.windowDays} days.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {comparison.metrics.map((metric) => (
          <div
            key={metric.id}
            className="flex min-w-0 flex-col gap-1 border-r border-line p-4 last:border-r-0"
          >
            <span className="text-xs text-muted-foreground">{metric.label}</span>

            <span className="truncate font-mono text-2xl leading-none font-medium tabular-nums">
              {metric.value}
              {metric.unit && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {metric.unit}
                </span>
              )}
            </span>

            {/* A flat window gets a dash rather than a "0" so the eye skips it
                instead of reading it as a measured result. */}
            {metric.delta ? (
              <span
                className={`flex items-center gap-0.5 font-mono text-xs tabular-nums ${
                  metric.direction === "up" ? "text-training" : "text-muted-foreground"
                }`}
              >
                <Icon name={metric.direction === "up" ? "arrow-up" : "arrow-down"} size={12} />
                {metric.delta}
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">—</span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
