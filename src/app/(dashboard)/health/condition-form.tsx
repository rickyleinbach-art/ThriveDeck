"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CONDITION_STATUS_LABELS,
  CONDITION_STATUSES,
  conditionSchema,
  type ConditionStatus,
} from "@/lib/validations/health";
import { createCondition } from "@/lib/health/actions";

export function ConditionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ConditionStatus>("ACTIVE");
  const [diagnosedOn, setDiagnosedOn] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = conditionSchema.safeParse({
      name,
      status,
      diagnosedOn: diagnosedOn || undefined,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createCondition(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setDiagnosedOn("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="condName">Condition</Label>
        <Input
          id="condName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hypertension"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="condStatus">Status</Label>
          <Select
            id="condStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as ConditionStatus)}
          >
            {CONDITION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONDITION_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="condDiagnosedOn">Diagnosed (optional)</Label>
          <Input
            id="condDiagnosedOn"
            type="date"
            value={diagnosedOn}
            onChange={(e) => setDiagnosedOn(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="condNotes">Notes (optional)</Label>
        <Input
          id="condNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add to history"}
      </Button>
    </form>
  );
}
