"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = {
  date: string;
  primary: number | null;
  secondary?: number | null;
};

export function VitalsTrendChart({
  data,
  primaryLabel,
  secondaryLabel,
  unit,
}: {
  data: TrendPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trendPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,101,52,0.12)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#166534" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#166534" }} tickLine={false} axisLine={false} width={34} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(22,163,74,0.2)",
            fontSize: 12,
            boxShadow: "0 10px 30px rgba(22,101,52,0.15)",
          }}
          formatter={(value, name) => [`${value}${unit ?? ""}`, String(name)]}
        />
        <Line
          type="monotone"
          dataKey="primary"
          name={primaryLabel}
          stroke="#16a34a"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
        {secondaryLabel && (
          <Line
            type="monotone"
            dataKey="secondary"
            name={secondaryLabel}
            stroke="#86efac"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
