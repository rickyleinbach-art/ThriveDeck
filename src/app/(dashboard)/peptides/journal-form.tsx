"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Peptide } from "@/lib/peptides/types";
import { journalEntrySchema } from "@/lib/validations/peptide";
import { createJournalEntry } from "@/lib/peptides/actions";

function todayLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function JournalForm({ peptides }: { peptides: Peptide[] }) {
  const router = useRouter();
  const [peptideId, setPeptideId] = useState("");
  const [entryDate, setEntryDate] = useState(todayLocal());
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = journalEntrySchema.safeParse({
      peptideId: peptideId || undefined,
      entryDate,
      content,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createJournalEntry(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jrnDate">Date</Label>
          <Input
            id="jrnDate"
            type="date"
            value={entryDate}
            max={todayLocal()}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jrnPeptide">Peptide (optional)</Label>
          <Select
            id="jrnPeptide"
            value={peptideId}
            onChange={(e) => setPeptideId(e.target.value)}
          >
            <option value="">General</option>
            {peptides.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jrnContent">Entry</Label>
        <textarea
          id="jrnContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="How are you feeling? Energy, sleep, appetite, anything worth tracking."
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Save entry"}
      </Button>
    </form>
  );
}
