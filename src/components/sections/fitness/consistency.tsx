import { Panel, PanelHeader, PanelTitle } from "@/components/ui";
import type { HeatmapDay } from "@/types/hevy";
import { TrainingHeatmap } from "./training-heatmap";

/** Consistency block: the heatmap of training days over the last 26 weeks. */
export function Consistency({ days }: { days: HeatmapDay[] }) {
  return (
    <Panel id="consistency">
      <PanelHeader className="flex items-baseline justify-between gap-4">
        <PanelTitle>Consistency</PanelTitle>
        <span className="font-mono text-xs text-muted-foreground">This week</span>
      </PanelHeader>

      <TrainingHeatmap days={days} />
    </Panel>
  );
}
