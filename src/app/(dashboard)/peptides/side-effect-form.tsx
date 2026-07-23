"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Peptide } from "@/lib/peptides/types";
import {
  SIDE_EFFECT_SEVERITIES,
  SIDE_EFFECT_SEVERITY_LABELS,
  sideEffectSchema,
  type SideEffectSeverity,
} from "@/lib/validations/peptide";
import { logSideEffect } from "@/lib/peptides/actions";

function nowLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function SideEffectForm({ peptides }: { peptides: Peptide[] }) {
  const router = useRouter();
  const [peptideId, setPeptideId] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocal());
  const [severity, setSeverity] = useState<SideEffectSeverity>("MILD");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = sideEffectSchema.safeParse({
      peptideId: peptideId || undefined,
      occurredAt,
      severity,
      description,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await logSideEffect(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDescription("");
    setOccurredAt(nowLocal());
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sePeptide">Peptide (optional)</Label>
          <Select
            id="sePeptide"
            value={peptideId}
            onChange={(e) => setPeptideId(e.target.value)}
          >
            <option value="">Not sure / general</option>
            {peptides.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seSeverity">Severity</Label>
          <Select
            id="seSeverity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as SideEffectSeverity)}
          >
            {SIDE_EFFECT_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SIDE_EFFECT_SEVERITY_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seOccurredAt">When</Label>
        <Input
          id="seOccurredAt"
          type="datetime-local"
          value={occurredAt}
          max={nowLocal()}
          onChange={(e) => setOccurredAt(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seDescription">What did you notice?</Label>
        <textarea
          id="seDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the side effect in your own words"
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Contact your healthcare provider about any side effect — especially anything
        moderate or severe.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Record side effect"}
      </Button>
    </form>
  );
}
