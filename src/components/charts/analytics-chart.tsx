"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartType } from "@/lib/analytics/types";
import { movingAverage, type SeriesPoint } from "@/lib/analytics/series";

// Reusable analytics chart. Data arrives already bucketed to the selected
// granularity (the explorer owns range/granularity state); this component just
// renders it. Colors come from the design tokens so it themes light/dark.

interface AnalyticsChartProps {
  data: SeriesPoint[];
  type?: ChartType;
  unit?: string;
  color?: string; // any CSS color; defaults to the primary token
  goalValue?: number;
  goalLabel?: string;
  showAverage?: boolean; // overlay a trailing moving average (line/area)
  averageWindow?: number;
}

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function AnalyticsChart({
  data,
  type = "line",
  unit = "",
  color = "hsl(var(--primary))",
  goalValue,
  goalLabel = "Goal",
  showAverage = false,
  averageWindow = 7,
}: AnalyticsChartProps) {
  const rawId = useId();
  const gradientId = `grad-${rawId.replace(/:/g, "")}`;
  const chartData = useMemo(() => {
    const avg = showAverage ? movingAverage(data, averageWindow) : null;
    return data.map((p, i) => ({
      label: p.label,
      value: p.value,
      average: avg ? avg[i] : null,
    }));
  }, [data, showAverage, averageWindow]);

  const hasData = data.some((p) => p.value !== null);
  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground/70">
        No data in this range yet.
      </div>
    );
  }

  const tooltip = (
    <Tooltip
      formatter={(value: number, name: string) => [
        `${formatTick(value)}${unit ? ` ${unit}` : ""}`,
        name === "average" ? `${averageWindow}-pt avg` : "Value",
      ]}
      contentStyle={{
        borderRadius: 12,
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        fontSize: 12,
      }}
      cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
    />
  );

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />;
  const xAxis = <XAxis dataKey="label" tick={AXIS_TICK} minTickGap={20} tickLine={false} axisLine={false} />;
  const yAxis = (
    <YAxis
      tick={AXIS_TICK}
      width={40}
      domain={["auto", "auto"]}
      tickFormatter={formatTick}
      tickLine={false}
      axisLine={false}
    />
  );
  const goalLine =
    typeof goalValue === "number" ? (
      <ReferenceLine
        y={goalValue}
        stroke="hsl(var(--primary))"
        strokeDasharray="4 4"
        label={{ value: goalLabel, fontSize: 11, fill: "hsl(var(--primary))", position: "insideTopRight" }}
      />
    ) : null;

  const margin = { top: 10, right: 12, left: 0, bottom: 0 };

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" ? (
          <BarChart data={chartData} margin={margin}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {goalLine}
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        ) : type === "area" ? (
          <ComposedChart data={chartData} margin={margin}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {goalLine}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              connectNulls
              dot={false}
            />
            {showAverage && (
              <Line
                type="monotone"
                dataKey="average"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        ) : (
          <ComposedChart data={chartData} margin={margin}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {goalLine}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={chartData.length <= 31 ? { r: 2 } : false}
              connectNulls
            />
            {showAverage && (
              <Line
                type="monotone"
                dataKey="average"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
