"use client";

import { useState } from "react";
import type { GraphData, GraphEdgeKind } from "@/lib/types";

const KINDS: { id: GraphEdgeKind; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "genre", label: "Genre" },
  { id: "author", label: "Tekijä" },
];

/** Build-aikana laskettu yhteysverkko staattisena SVG:nä + hover-korostus. */
export function ConnectionsGraph({ data }: { data: GraphData }) {
  const [kind, setKind] = useState<GraphEdgeKind>("studio");
  const [hovered, setHovered] = useState<string | null>(null);

  const edges = data.edges.filter((e) => e.kind === kind);
  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

  const neighbors = new Set<string>();
  if (hovered) {
    for (const e of edges) {
      if (e.source === hovered) neighbors.add(e.target);
      if (e.target === hovered) neighbors.add(e.source);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Yhteyden tyyppi" className="flex gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={k.id === kind}
            onClick={() => setKind(k.id)}
            className={`border-2 border-foreground px-3 py-1 text-sm font-bold uppercase tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              k.id === kind ? "bg-accent text-background" : "bg-panel hover:bg-foreground/10"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="surface-flat bg-panel p-2">
        <svg viewBox="0 0 1000 1000" className="h-auto w-full" role="img" aria-label="Animeiden yhteysverkko">
          {edges.map((e, i) => {
            const a = nodeById.get(e.source);
            const b = nodeById.get(e.target);
            if (!a || !b) return null;
            const active = hovered != null && (e.source === hovered || e.target === hovered);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={active ? "var(--accent)" : "currentColor"}
                strokeOpacity={hovered == null ? 0.25 : active ? 0.9 : 0.06}
                strokeWidth={active ? 3 : 1.5}
              />
            );
          })}
          {data.nodes.map((n) => {
            const isHovered = n.id === hovered;
            const isNeighbor = neighbors.has(n.id);
            const dim = hovered != null && !isHovered && !isNeighbor;
            const size = 10 + Math.min(n.degree, 8) * 1.5;
            return (
              <g
                key={n.id}
                opacity={dim ? 0.25 : 1}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <rect
                  x={n.x - size / 2}
                  y={n.y - size / 2}
                  width={size}
                  height={size}
                  fill={isHovered ? "var(--accent)" : "var(--color-foreground)"}
                  stroke="var(--color-foreground)"
                  strokeWidth={2}
                />
                {(isHovered || isNeighbor) && (
                  <text
                    x={n.x + size / 2 + 4}
                    y={n.y + 4}
                    fontSize={isHovered ? 18 : 14}
                    fontWeight={700}
                    fill="var(--color-foreground)"
                  >
                    {n.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-muted">Vie kursori animen päälle nähdäksesi sen yhteydet.</p>
    </div>
  );
}
