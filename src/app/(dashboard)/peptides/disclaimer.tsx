import { ShieldAlert } from "lucide-react";

// SAFETY CRITICAL — this banner must stay at the top of every peptide
// screen. MetabolicOS records what the user enters; it never advises.
export function MedicalDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Medical disclaimer"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-sm">
        <p className="font-semibold text-amber-700 dark:text-amber-300">
          MetabolicOS never recommends peptide or medication dosing.
        </p>
        <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">
          This tracker only records information you enter from your own prescription.
          Always consult your licensed healthcare provider before starting, changing,
          or stopping any peptide or medication — and contact them promptly about any
          side effects.
        </p>
      </div>
    </div>
  );
}
