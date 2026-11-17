import { Icon } from "@/components/icons";
import { IconTile, Panel, PanelHeader, PanelTitle } from "@/components/ui";
import { fitness } from "@/content";

/**
 * Best run efforts, as a mirror of `PersonalRecords`.
 *
 * Same row anatomy as the lifting panel — tile, label, meta, right-aligned
 * number — so the two read as one pair rather than two unrelated widgets. The
 * difference is provenance: these are hand-kept, and the panel says so once
 * instead of repeating a badge on every row.
 */
export function RunningRecords() {
  const { note, records } = fitness.running;

  return (
    <Panel id="runs" className="flex-1">
      <PanelHeader>
        <PanelTitle className="text-xl">Running bests</PanelTitle>
      </PanelHeader>

      <ol className="m-0 flex list-none flex-col p-0">
        {records.map((record, index) => (
          <li
            key={record.distance}
            className="flex items-center gap-3 border-b border-line px-4 py-3"
          >
            <IconTile className={index === 0 ? "border-training/40 text-training" : undefined}>
              <Icon name={index === 0 ? "trophy" : "footprints"} size={13} />
            </IconTile>

            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-medium">{record.distance}</p>
              <p className="m-0 font-mono text-xs text-muted-foreground tabular-nums">
                {record.pace}
                {"detail" in record && record.detail ? ` · ${record.detail}` : ""}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="m-0 font-mono text-sm font-medium tabular-nums">{record.time}</p>
              <p className="m-0 text-[10px] tracking-wide text-muted-foreground uppercase">
                {record.date}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="m-0 px-4 py-3 text-xs text-muted-foreground">{note}</p>
    </Panel>
  );
}
