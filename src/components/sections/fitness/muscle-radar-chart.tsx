"use client";

import { useMemo, useState } from "react";
import type { MuscleRadarAxis } from "@/types/hevy";

const SIZE = 340;
const HEIGHT = 286;
const CENTER = { x: SIZE / 2, y: 136 };
const RADIUS = 100;
const RINGS = [0.25, 0.5, 0.75, 1];

/**
 * Spoke `index` of six, as a point at `fraction` of the outer radius.
 *
 * Angles run in 60° steps from -120°, which puts a vertex at upper-left and
 * makes a flat-topped hexagon: the two long horizontal edges give the left and
 * right labels room to sit outside the web without colliding with it.
 */
function point(index: number, fraction: number) {
  const angle = ((-120 + index * 60) * Math.PI) / 180;
  return {
    x: CENTER.x + Math.cos(angle) * RADIUS * fraction,
    y: CENTER.y + Math.sin(angle) * RADIUS * fraction,
  };
}

function polygon(fractions: number[]): string {
  return fractions
    .map((fraction, index) => {
      const { x, y } = point(index, fraction);
      return `${x},${y}`;
    })
    .join(" ");
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function MuscleRadarChart({
  axes,
  windowDays,
}: {
  axes: MuscleRadarAxis[];
  windowDays: number;
}) {
  const [active, setActive] = useState<number | null>(null);

  // Both polygons are scaled against the single largest share so the outer ring
  // always means "the most-trained region", and the two windows stay directly
  // comparable to each other rather than each filling the web on its own terms.
  const scale = useMemo(
    () => Math.max(...axes.flatMap((axis) => [axis.currentShare, axis.previousShare]), 0.0001),
    [axes],
  );

  const current = axes.map((axis) => axis.currentShare / scale);
  const previous = axes.map((axis) => axis.previousShare / scale);
  const hasPrevious = axes.some((axis) => axis.previousSets > 0);

  const activeAxis = active === null ? null : axes[active];
  const activePoint = active === null ? null : point(active, Math.max(current[active] ?? 0, 0.18));

  return (
    <div className="px-4 pt-4">
      <div className="relative">
        <svg
          viewBox={`0 0 ${SIZE} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`Working sets by muscle region over the last ${windowDays} days, compared with the previous ${windowDays} days.`}
        >
          <g stroke="var(--line)" fill="none">
            {RINGS.map((ring) => (
              <polygon key={ring} points={polygon(axes.map(() => ring))} />
            ))}
            {axes.map((axis, index) => {
              const outer = point(index, 1);
              return (
                <line key={axis.muscle} x1={CENTER.x} y1={CENTER.y} x2={outer.x} y2={outer.y} />
              );
            })}
          </g>

          {hasPrevious && (
            <polygon
              points={polygon(previous)}
              fill="var(--muted-foreground)"
              fillOpacity={0.16}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
          )}

          <polygon
            points={polygon(current)}
            fill="var(--training)"
            fillOpacity={0.28}
            stroke="var(--training)"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {axes.map((axis, index) => {
            const vertex = point(index, current[index] ?? 0);
            const label = point(index, 1);
            const angle = ((-120 + index * 60) * Math.PI) / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            return (
              <g key={axis.muscle}>
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r={3.5}
                  fill="var(--training)"
                  opacity={active === index ? 1 : 0}
                />

                <text
                  x={label.x + cos * 26}
                  y={label.y + sin * 22 + 4}
                  textAnchor={cos > 0.1 ? "start" : cos < -0.1 ? "end" : "middle"}
                  className={`text-[11px] transition-colors ${
                    active === index ? "fill-foreground" : "fill-muted-foreground"
                  }`}
                >
                  {axis.muscle}
                </text>

                {/* Generous invisible hit target — the vertices themselves are far
                  too small to hover reliably, especially near the centre. */}
                <circle
                  cx={label.x * 0.62 + CENTER.x * 0.38}
                  cy={label.y * 0.62 + CENTER.y * 0.38}
                  r={34}
                  fill="transparent"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                />
              </g>
            );
          })}
        </svg>

        {activeAxis && activePoint && (
          <div
            role="status"
            className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md bg-foreground px-2 py-[5px] text-xs whitespace-nowrap text-background"
            style={{
              left: `${(activePoint.x / SIZE) * 100}%`,
              top: `${(activePoint.y / HEIGHT) * 100}%`,
            }}
          >
            {activeAxis.muscle} · {activeAxis.currentSets} sets ({percent(activeAxis.currentShare)})
            {hasPrevious && ` · was ${activeAxis.previousSets}`}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-training" />
          Current
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground" />
          Previous
        </span>
      </div>
    </div>
  );
}
