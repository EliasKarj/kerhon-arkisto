"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CountEntry } from "@/lib/stats";
import { ChartFrame } from "./chart-frame";

const ACCENT = "#c6f000";

/** Best girl/boy -äänten jakauma pylväskaaviona. */
export function BestPickBarChart({ data }: { data: CountEntry[] }) {
  const caption =
    "Best girl/boy -äänet: " +
    data.map((entry) => `${entry.label} ${entry.count}`).join(", ") +
    ".";

  return (
    <ChartFrame caption={caption}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
          <XAxis
            dataKey="label"
            tick={{ fill: "currentColor", fontSize: 12 }}
            axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            cursor={{ fillOpacity: 0.08 }}
            formatter={(value) => [value, "Ääniä"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
