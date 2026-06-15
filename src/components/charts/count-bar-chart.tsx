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
import type { CountBucket } from "@/lib/fun-stats";
import { ChartFrame } from "./chart-frame";

const ACCENT = "var(--accent)";

/** Hover-tooltip, joka listaa pylvääseen kuuluvat animet. */
function BucketTooltip({
  active,
  payload,
  valueLabel,
}: {
  active?: boolean;
  payload?: { payload: CountBucket }[];
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload;
  const shown = bucket.titles.slice(0, 12);
  const rest = bucket.titles.length - shown.length;
  return (
    <div className="surface-flat max-w-[240px] bg-panel p-2 text-xs">
      <p className="font-bold uppercase tracking-tight">
        {bucket.label} — {bucket.count} {valueLabel.toLowerCase()}
      </p>
      <p className="mt-1 text-muted">
        {shown.join(", ")}
        {rest > 0 ? ` +${rest} muuta` : ""}
      </p>
    </div>
  );
}

/** Yleinen pylväskaavio CountBucket-datalle (genre/vuosikymmen/lähde). */
export function CountBarChart({
  data,
  caption,
  valueLabel,
}: {
  data: CountBucket[];
  caption: string;
  valueLabel: string;
}) {
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
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip cursor={{ fillOpacity: 0.08 }} content={<BucketTooltip valueLabel={valueLabel} />} />
          <Bar dataKey="count" fill={ACCENT} radius={[0, 0, 0, 0]}>
            <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
