"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CareProvider } from "@/lib/peptides/types";
import {
  DOSE_UNITS,
  DOSE_UNIT_LABELS,
  peptideSchema,
  type DoseUnit,
} from "@/lib/validations/peptide";
import { createPeptide } from "@/lib/peptides/actions";

// Records the user's own prescription. No dose field is ever pre-filled
// or suggested — the user transcribes what their provider prescribed.
export function PeptideForm({ providers }: { providers: CareProvider[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState<DoseUnit>("MG");
  const [frequency, setFrequency] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [providerId, setProviderId] = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [protocolNotes, setProtocolNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const prescribers = providers.filter((p) => p.kind === "PROVIDER");
  const pharmacies = providers.filter((p) => p.kind === "PHARMACY");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = peptideSchema.safeParse({
      name,
      status: "ACTIVE",
      doseAmount: doseAmount ? Number(doseAmount) : undefined,
      doseUnit: doseAmount ? doseUnit : undefined,
      frequency: frequency || undefined,
      startedOn: startedOn || undefined,
      lotNumber: lotNumber || undefined,
      expiresOn: expiresOn || undefined,
      providerId: providerId || undefined,
      pharmacyId: pharmacyId || undefined,
      protocolNotes: protocolNotes || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createPeptide(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setDoseAmount("");
    setFrequency("");
    setStartedOn("");
    setLotNumber("");
    setExpiresOn("");
    setProtocolNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="peptideName">Peptide name</Label>
        <Input
          id="peptideName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exactly as written on your prescription"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="doseAmount">Prescribed dose (optional)</Label>
          <Input
            id="doseAmount"
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
          <Label htmlFor="doseUnit">Unit</Label>
          <Select
            id="doseUnit"
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

      <div className="space-y-1.5">
        <Label htmlFor="frequency">Frequency (optional)</Label>
        <Input
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          placeholder="As your provider phrased it, e.g. “once nightly”"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startedOn">Start date</Label>
          <Input
            id="startedOn"
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiresOn">Expiration date</Label>
          <Input
            id="expiresOn"
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lotNumber">Lot number (optional)</Label>
        <Input
          id="lotNumber"
          value={lotNumber}
          onChange={(e) => setLotNumber(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="providerId">Provider</Label>
          <Select
            id="providerId"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            <option value="">None</option>
            {prescribers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pharmacyId">Pharmacy</Label>
          <Select
            id="pharmacyId"
            value={pharmacyId}
            onChange={(e) => setPharmacyId(e.target.value)}
          >
            <option value="">None</option>
            {pharmacies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="protocolNotes">Protocol notes (optional)</Label>
        <textarea
          id="protocolNotes"
          value={protocolNotes}
          onChange={(e) => setProtocolNotes(e.target.value)}
          rows={2}
          placeholder="Anything else from your provider's instructions"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add peptide"}
      </Button>
    </form>
  );
}
