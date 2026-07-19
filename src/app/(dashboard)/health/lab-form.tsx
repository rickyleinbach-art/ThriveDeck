"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LAB_PRESETS } from "@/lib/health/presets";
import { labResultSchema } from "@/lib/validations/health";
import { createLabResult } from "@/lib/health/actions";

function todayLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

const CUSTOM = "__custom__";

export function LabForm() {
  const router = useRouter();
  const [preset, setPreset] = useState(LAB_PRESETS[0].name);
  const [testName, setTestName] = useState(LAB_PRESETS[0].name);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(LAB_PRESETS[0].unit);
  const [referenceLow, setReferenceLow] = useState("");
  const [referenceHigh, setReferenceHigh] = useState("");
  const [collectedOn, setCollectedOn] = useState(todayLocal());
  const [labName, setLabName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function applyPreset(name: string) {
    setPreset(name);
    if (name === CUSTOM) {
      setTestName("");
      setUnit("");
      return;
    }
    const found = LAB_PRESETS.find((p) => p.name === name);
    if (found) {
      setTestName(found.name);
      setUnit(found.unit);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = labResultSchema.safeParse({
      testName,
      value: value ? Number(value) : undefined,
      unit,
      referenceLow: referenceLow ? Number(referenceLow) : undefined,
      referenceHigh: referenceHigh ? Number(referenceHigh) : undefined,
      collectedOn,
      labName: labName || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createLabResult(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setValue("");
    setReferenceLow("");
    setReferenceHigh("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="labPreset">Test</Label>
          <Select
            id="labPreset"
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
          >
            {LAB_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
            <option value={CUSTOM}>Other…</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="labCollectedOn">Collected</Label>
          <Input
            id="labCollectedOn"
            type="date"
            value={collectedOn}
            max={todayLocal()}
            onChange={(e) => setCollectedOn(e.target.value)}
            required
          />
        </div>
      </div>

      {preset === CUSTOM && (
        <div className="space-y-1.5">
          <Label htmlFor="labTestName">Test name</Label>
          <Input
            id="labTestName"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. TSH"
            required
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="labValue">Result</Label>
          <Input
            id="labValue"
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="labUnit">Unit</Label>
          <Input
            id="labUnit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="mg/dL"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="labRefLow">Ref. low (optional)</Label>
          <Input
            id="labRefLow"
            type="number"
            min="0"
            step="any"
            value={referenceLow}
            onChange={(e) => setReferenceLow(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="labRefHigh">Ref. high (optional)</Label>
          <Input
            id="labRefHigh"
            type="number"
            min="0"
            step="any"
            value={referenceHigh}
            onChange={(e) => setReferenceHigh(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="labLabName">Lab (optional)</Label>
        <Input
          id="labLabName"
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
          placeholder="e.g. Quest, LabCorp"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Save lab result"}
      </Button>
    </form>
  );
}
