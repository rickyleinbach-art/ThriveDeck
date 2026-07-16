"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  METRIC_LABELS,
  METRIC_TYPES,
  UNITS_FOR_METRIC,
  goalSchema,
  type MeasurementUnit,
  type MetricType,
} from "@/lib/validations/weight";
import { createGoal } from "@/lib/weight/actions";

export function GoalForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [metricType, setMetricType] = useState<MetricType>("WEIGHT");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState(UNITS_FOR_METRIC.WEIGHT[0]);
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleMetricChange(next: MetricType) {
    setMetricType(next);
    setUnit(UNITS_FOR_METRIC[next][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = goalSchema.safeParse({
      metricType,
      targetValue: Number(targetValue),
      unit,
      targetDate: targetDate || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your goal");
      return;
    }

    setSubmitting(true);
    const result = await createGoal(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTargetValue("");
    setTargetDate("");
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="goalMetric">Metric</Label>
          <Select
            id="goalMetric"
            value={metricType}
            onChange={(e) => handleMetricChange(e.target.value as MetricType)}
          >
            {METRIC_TYPES.map((type) => (
              <option key={type} value={type}>
                {METRIC_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goalDate">Target date (optional)</Label>
          <Input
            id="goalDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="goalValue">Target value</Label>
          <Input
            id="goalValue"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goalUnit">Unit</Label>
          <Select
            id="goalUnit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
          >
            {UNITS_FOR_METRIC[metricType].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} variant="outline" className="w-full">
        {submitting ? "Saving…" : "Set goal"}
      </Button>
    </form>
  );
}
