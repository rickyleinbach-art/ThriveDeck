"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { CareProvider, Peptide } from "@/lib/peptides/types";
import {
  DOSE_UNIT_LABELS,
  PEPTIDE_STATUSES,
  PEPTIDE_STATUS_LABELS,
  type PeptideStatus,
} from "@/lib/validations/peptide";
import { deletePeptide, updatePeptideStatus } from "@/lib/peptides/actions";

export function PeptideListItem({
  peptide,
  providers,
}: {
  peptide: Peptide;
  providers: CareProvider[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const provider = providers.find((p) => p.id === peptide.providerId);
  const pharmacy = providers.find((p) => p.id === peptide.pharmacyId);

  const doseText =
    peptide.doseAmount != null && peptide.doseUnit
      ? `${peptide.doseAmount} ${DOSE_UNIT_LABELS[peptide.doseUnit]}`
      : null;

  const details = [
    doseText && `Recorded dose: ${doseText}`,
    peptide.frequency && `Frequency: ${peptide.frequency}`,
    peptide.lotNumber && `Lot ${peptide.lotNumber}`,
    peptide.expiresOn && `Expires ${peptide.expiresOn}`,
    provider && `Provider: ${provider.name}`,
    pharmacy && `Pharmacy: ${pharmacy.name}`,
  ].filter(Boolean) as string[];

  async function handleStatusChange(status: PeptideStatus) {
    setBusy(true);
    await updatePeptideStatus(peptide.id, status);
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${peptide.name}? Injection history is kept.`)) return;
    setBusy(true);
    await deletePeptide(peptide.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{peptide.name}</p>
          {peptide.startedOn && (
            <p className="text-xs text-muted-foreground">Started {peptide.startedOn}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label={`Status for ${peptide.name}`}
            value={peptide.status}
            disabled={busy}
            onChange={(e) => handleStatusChange(e.target.value as PeptideStatus)}
            className="h-9 w-auto"
          >
            {PEPTIDE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PEPTIDE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={handleDelete}
            className="text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>
      {details.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">{details.join(" · ")}</p>
      )}
      {peptide.protocolNotes && (
        <p className="mt-1 text-sm text-muted-foreground">{peptide.protocolNotes}</p>
      )}
    </div>
  );
}
