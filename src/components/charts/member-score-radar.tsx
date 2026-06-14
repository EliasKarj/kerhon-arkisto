"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartFrame } from "./chart-frame";

export interface MemberScorePoint {
  member: string;
  score: number;
}

const ACCENT = "var(--accent)";

/** Radar, jossa kunkin jäsenen pisteet näkyvät samassa kuvassa (akselit = jäsenet). */
export function MemberScoreRadar({ data }: { data: MemberScorePoint[] }) {
  const caption =
    "Jäsenten pisteet asteikolla 0–5: " +
    data.map((point) => `${point.member} ${point.score}`).join(", ") +
    ".";

  return (
    <ChartFrame caption={caption}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="member" tick={{ fill: "currentColor", fontSize: 12 }} />
          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 10, opacity: 0.5 }}
          />
          <Radar
            name="Pisteet"
            dataKey="score"
            stroke={ACCENT}
            fill={ACCENT}
            fillOpacity={0.4}
          />
          <Tooltip
            formatter={(value) => [value, "Pisteet"]}
            contentStyle={{ fontSize: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
