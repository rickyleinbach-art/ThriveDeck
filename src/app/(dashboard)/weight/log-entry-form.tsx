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
  bodyMetricSchema,
  type MeasurementUnit,
  type MetricType,
} from "@/lib/validations/weight";
import { logBodyMetric } from "@/lib/weight/actions";

function todayLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function LogEntryForm({ defaultUnitSystem }: { defaultUnitSystem: "METRIC" | "IMPERIAL" }) {
  const router = useRouter();
  const [metricType, setMetricType] = useState<MetricType>("WEIGHT");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<MeasurementUnit>(
    defaultUnitSystem === "IMPERIAL" ? "lb" : "kg"
  );
  const [recordedAt, setRecordedAt] = useState(todayLocal());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const unitOptions = UNITS_FOR_METRIC[metricType];

  function handleMetricChange(next: MetricType) {
    setMetricType(next);
    if (!UNITS_FOR_METRIC[next].includes(unit)) {
      setUnit(UNITS_FOR_METRIC[next][0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = bodyMetricSchema.safeParse({
      metricType,
      value: Number(value),
      unit,
      recordedAt,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await logBodyMetric(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setValue("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="metricType">Metric</Label>
          <Select
            id="metricType"
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
          <Label htmlFor="recordedAt">Date</Label>
          <Input
            id="recordedAt"
            type="date"
            value={recordedAt}
            max={todayLocal()}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 78.4"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
          >
            {unitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering about today"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Log entry"}
      </Button>
    </form>
  );
}
