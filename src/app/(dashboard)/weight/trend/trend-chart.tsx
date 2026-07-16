"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { monthlyAverages, weeklyAverages } from "@/lib/weight/calculations";

type Granularity = "raw" | "weekly" | "monthly";

interface Point {
  recordedAt: string;
  value: number;
}

export function TrendChart({
  unit,
  points,
  goalValue,
}: {
  unit: string;
  points: Point[];
  goalValue?: number;
}) {
  const [granularity, setGranularity] = useState<Granularity>("weekly");

  const chartData = useMemo(() => {
    if (granularity === "raw") {
      return points
        .slice()
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .map((p) => ({ label: p.recordedAt.slice(0, 10), value: p.value }));
    }
    const grouped = granularity === "weekly" ? weeklyAverages(points) : monthlyAverages(points);
    return grouped.map((g) => ({ label: g.period, value: Number(g.average.toFixed(1)) }));
  }, [points, granularity]);

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Not enough entries yet to chart a trend.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-1">
        {(["raw", "weekly", "monthly"] as const).map((g) => (
          <Button
            key={g}
            type="button"
            size="sm"
            variant={granularity === g ? "default" : "outline"}
            onClick={() => setGranularity(g)}
          >
            {g === "raw" ? "Daily" : g === "weekly" ? "Weekly" : "Monthly"}
          </Button>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={40}
              domain={["auto", "auto"]}
              unit={unit === "%" ? "%" : ""}
            />
            <Tooltip
              formatter={(value: number) => [`${value} ${unit}`, "Value"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
            />
            {typeof goalValue === "number" && (
              <ReferenceLine
                y={goalValue}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                label={{ value: "Goal", fontSize: 11, fill: "hsl(var(--primary))" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={chartData.length <= 30}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
