"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Peptide } from "@/lib/peptides/types";
import {
  REMINDER_KINDS,
  REMINDER_KIND_LABELS,
  reminderSchema,
  type ReminderKind,
} from "@/lib/validations/peptide";
import { createReminder } from "@/lib/peptides/actions";

export function ReminderForm({ peptides }: { peptides: Peptide[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<ReminderKind>("DOSE");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [repeatEveryDays, setRepeatEveryDays] = useState("");
  const [peptideId, setPeptideId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = reminderSchema.safeParse({
      kind,
      title,
      dueAt,
      repeatEveryDays: repeatEveryDays ? Number(repeatEveryDays) : undefined,
      peptideId: peptideId || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createReminder(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTitle("");
    setDueAt("");
    setRepeatEveryDays("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="remKind">Type</Label>
          <Select
            id="remKind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ReminderKind)}
          >
            {REMINDER_KINDS.map((k) => (
              <option key={k} value={k}>
                {REMINDER_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="remPeptide">Peptide (optional)</Label>
          <Select
            id="remPeptide"
            value={peptideId}
            onChange={(e) => setPeptideId(e.target.value)}
          >
            <option value="">None</option>
            {peptides.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remTitle">Title</Label>
        <Input
          id="remTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Evening dose, Refill order, Quarterly labs"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="remDueAt">Due</Label>
          <Input
            id="remDueAt"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="remRepeat">Repeat every (days)</Label>
          <Input
            id="remRepeat"
            type="number"
            inputMode="numeric"
            min="1"
            max="365"
            value={repeatEveryDays}
            onChange={(e) => setRepeatEveryDays(e.target.value)}
            placeholder="Leave blank for one-off"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add reminder"}
      </Button>
    </form>
  );
}
