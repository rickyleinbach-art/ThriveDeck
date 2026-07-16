"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({ data }: { data: { value: number }[] }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={["auto", "auto"]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
