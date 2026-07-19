"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { medicationSchema } from "@/lib/validations/health";
import { createMedication } from "@/lib/health/actions";

// Record-only: every field is the user's transcription of their own
// prescription label. The app never suggests or prefills any of it.
export function MedicationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [doseText, setDoseText] = useState("");
  const [frequency, setFrequency] = useState("");
  const [reason, setReason] = useState("");
  const [prescriber, setPrescriber] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = medicationSchema.safeParse({
      name,
      doseText: doseText || undefined,
      frequency: frequency || undefined,
      reason: reason || undefined,
      prescriber: prescriber || undefined,
      startedOn: startedOn || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createMedication(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setDoseText("");
    setFrequency("");
    setReason("");
    setPrescriber("");
    setStartedOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="medName">Medication</Label>
        <Input
          id="medName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As it reads on the label"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="medDose">Dose (from your label)</Label>
          <Input
            id="medDose"
            value={doseText}
            onChange={(e) => setDoseText(e.target.value)}
            placeholder="e.g. 10 mg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="medFrequency">Frequency</Label>
          <Input
            id="medFrequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="e.g. once daily"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="medReason">Taken for (optional)</Label>
          <Input
            id="medReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="medStartedOn">Started (optional)</Label>
          <Input
            id="medStartedOn"
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="medPrescriber">Prescriber (optional)</Label>
        <Input
          id="medPrescriber"
          value={prescriber}
          onChange={(e) => setPrescriber(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Enter exactly what your prescription says. Questions about dose or timing
        belong with your provider or pharmacist.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add medication"}
      </Button>
    </form>
  );
}
