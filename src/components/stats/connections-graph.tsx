"use client";

import { useState } from "react";
import type { GraphData, GraphEdgeKind } from "@/lib/types";

const KINDS: { id: GraphEdgeKind; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "genre", label: "Genre" },
  { id: "author", label: "Tekijä" },
];

/** Build-aikana laskettu yhteysverkko staattisena SVG:nä + hover-korostus. */
export function ConnectionsGraph({
  data,
  covers,
}: {
  data: GraphData;
  covers: Record<string, string | null>;
}) {
  const [kind, setKind] = useState<GraphEdgeKind>("genre");
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

  // Hoverattu solmu viimeiseksi, jotta se piirtyy muiden päälle.
  const orderedNodes = [...data.nodes].sort(
    (a, b) => Number(a.id === hovered) - Number(b.id === hovered),
  );

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
            className={`border-2 border-foreground px-3 py-1 text-sm font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
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
          {orderedNodes.map((n) => {
            const isHovered = n.id === hovered;
            const isNeighbor = neighbors.has(n.id);
            const dim = hovered != null && !isHovered && !isNeighbor;
            const base = 18 + Math.min(n.degree, 8) * 2;
            const size = isHovered ? base * 1.7 : base;
            const x = n.x - size / 2;
            const y = n.y - size / 2;
            const cover = covers[n.id];
            return (
              <g
                key={n.id}
                opacity={dim ? 0.3 : 1}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                {cover ? (
                  <image
                    href={cover}
                    x={x}
                    y={y}
                    width={size}
                    height={size}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <rect x={x} y={y} width={size} height={size} fill="var(--color-foreground)" />
                )}
                <rect
                  x={x}
                  y={y}
                  width={size}
                  height={size}
                  fill="none"
                  stroke={isHovered ? "var(--accent)" : "var(--color-foreground)"}
                  strokeWidth={isHovered ? 3 : 2}
                />
                {(isHovered || isNeighbor) && (
                  <text
                    x={n.x}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={isHovered ? 20 : 14}
                    fontWeight={700}
                    fill="var(--color-foreground)"
                    stroke="var(--color-background)"
                    strokeWidth={0.5}
                    paintOrder="stroke"
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
