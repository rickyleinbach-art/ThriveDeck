"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  HEALTH_METRIC_KIND_LABELS,
  HEALTH_METRIC_KINDS,
  HEALTH_METRIC_UNITS,
  healthMetricSchema,
  type HealthMetricKind,
} from "@/lib/validations/health";
import { logHealthMetric } from "@/lib/health/actions";

function nowLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function MetricForm() {
  const router = useRouter();
  const [kind, setKind] = useState<HealthMetricKind>("BLOOD_PRESSURE");
  const [value, setValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [measuredAt, setMeasuredAt] = useState(nowLocal());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isBloodPressure = kind === "BLOOD_PRESSURE";
  const unit = HEALTH_METRIC_UNITS[kind];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = healthMetricSchema.safeParse({
      kind,
      value: value ? Number(value) : undefined,
      secondaryValue:
        isBloodPressure && secondaryValue ? Number(secondaryValue) : undefined,
      measuredAt,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await logHealthMetric(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setValue("");
    setSecondaryValue("");
    setNotes("");
    setMeasuredAt(nowLocal());
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="metricKind">Vital</Label>
        <Select
          id="metricKind"
          value={kind}
          onChange={(e) => setKind(e.target.value as HealthMetricKind)}
        >
          {HEALTH_METRIC_KINDS.map((k) => (
            <option key={k} value={k}>
              {HEALTH_METRIC_KIND_LABELS[k]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="metricValue">
            {isBloodPressure ? "Systolic (top)" : `Value (${unit})`}
          </Label>
          <Input
            id="metricValue"
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        {isBloodPressure ? (
          <div className="space-y-1.5">
            <Label htmlFor="metricSecondary">Diastolic (bottom)</Label>
            <Input
              id="metricSecondary"
              type="number"
              min="0"
              step="any"
              value={secondaryValue}
              onChange={(e) => setSecondaryValue(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="metricMeasuredAt">When</Label>
            <Input
              id="metricMeasuredAt"
              type="datetime-local"
              value={measuredAt}
              max={nowLocal()}
              onChange={(e) => setMeasuredAt(e.target.value)}
              required
            />
          </div>
        )}
      </div>

      {isBloodPressure && (
        <div className="space-y-1.5">
          <Label htmlFor="metricMeasuredAtBp">When</Label>
          <Input
            id="metricMeasuredAtBp"
            type="datetime-local"
            value={measuredAt}
            max={nowLocal()}
            onChange={(e) => setMeasuredAt(e.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="metricNotes">Notes (optional)</Label>
        <Input
          id="metricNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. after morning coffee"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Log vital"}
      </Button>
    </form>
  );
}
