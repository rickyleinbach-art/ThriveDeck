"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Peptide } from "@/lib/peptides/types";
import {
  DOSE_UNITS,
  DOSE_UNIT_LABELS,
  INJECTION_SITES,
  INJECTION_SITE_LABELS,
  injectionSchema,
  type DoseUnit,
  type InjectionSite,
  type InjectionStatus,
} from "@/lib/validations/peptide";
import { logInjection } from "@/lib/peptides/actions";

function nowLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

// Records an injection (or a missed dose). The dose fields echo what the
// user already recorded on their own protocol — never an app suggestion.
export function LogInjectionForm({ peptides }: { peptides: Peptide[] }) {
  const router = useRouter();
  const [peptideId, setPeptideId] = useState(peptides[0]?.id ?? "");
  const [status, setStatus] = useState<InjectionStatus>("LOGGED");
  const [injectedAt, setInjectedAt] = useState(nowLocal());
  const [doseAmount, setDoseAmount] = useState(
    peptides[0]?.doseAmount != null ? String(peptides[0].doseAmount) : ""
  );
  const [doseUnit, setDoseUnit] = useState<DoseUnit>(peptides[0]?.doseUnit ?? "MG");
  const [site, setSite] = useState<InjectionSite | "">("");
  const [lotNumber, setLotNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePeptideChange(id: string) {
    setPeptideId(id);
    // Echo the dose the user recorded on that peptide's protocol, if any.
    const peptide = peptides.find((p) => p.id === id);
    setDoseAmount(peptide?.doseAmount != null ? String(peptide.doseAmount) : "");
    if (peptide?.doseUnit) setDoseUnit(peptide.doseUnit);
    setLotNumber(peptide?.lotNumber ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = injectionSchema.safeParse({
      peptideId,
      status,
      injectedAt,
      doseAmount: doseAmount ? Number(doseAmount) : undefined,
      doseUnit: doseAmount ? doseUnit : undefined,
      site: site || undefined,
      lotNumber: lotNumber || undefined,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await logInjection(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setNotes("");
    setInjectedAt(nowLocal());
    router.refresh();
  }

  if (peptides.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a peptide first, then log injections here.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="injPeptide">Peptide</Label>
          <Select
            id="injPeptide"
            value={peptideId}
            onChange={(e) => handlePeptideChange(e.target.value)}
          >
            {peptides.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="injStatus">Entry type</Label>
          <Select
            id="injStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as InjectionStatus)}
          >
            <option value="LOGGED">Injection taken</option>
            <option value="MISSED">Missed dose</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="injectedAt">Date &amp; time</Label>
        <Input
          id="injectedAt"
          type="datetime-local"
          value={injectedAt}
          max={nowLocal()}
          onChange={(e) => setInjectedAt(e.target.value)}
          required
        />
      </div>

      {status === "LOGGED" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="injDose">Dose taken (optional)</Label>
              <Input
                id="injDose"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={doseAmount}
                onChange={(e) => setDoseAmount(e.target.value)}
                placeholder="As prescribed"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="injDoseUnit">Unit</Label>
              <Select
                id="injDoseUnit"
                value={doseUnit}
                onChange={(e) => setDoseUnit(e.target.value as DoseUnit)}
              >
                {DOSE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {DOSE_UNIT_LABELS[u]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="injSite">Injection site</Label>
              <Select
                id="injSite"
                value={site}
                onChange={(e) => setSite(e.target.value as InjectionSite | "")}
              >
                <option value="">Not recorded</option>
                {INJECTION_SITES.map((s) => (
                  <option key={s} value={s}>
                    {INJECTION_SITE_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="injLot">Lot number</Label>
              <Input
                id="injLot"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="injNotes">Notes (optional)</Label>
        <Input
          id="injNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How it went, anything you noticed"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : status === "MISSED" ? "Record missed dose" : "Log injection"}
      </Button>
    </form>
  );
}
