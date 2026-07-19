import { ShieldAlert } from "lucide-react";

// SAFETY CRITICAL — the coach is a lifestyle assistant, not a medical
// professional. This banner stays at the top of the AI Coach screen.
// The coach never prescribes or suggests dosing (CLAUDE.md § Health & safety).
export function CoachDisclaimer() {
  return (
    <div
      role="note"
      aria-label="AI Coach disclaimer"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-sm">
        <p className="font-semibold text-amber-700 dark:text-amber-300">
          Your AI Coach gives lifestyle guidance, not medical advice.
        </p>
        <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">
          It reviews what you log and helps with nutrition, training, and habits. It never
          prescribes medication, recommends peptide or medication dosing, or interprets lab
          results. For anything medical, consult a licensed healthcare provider.
        </p>
      </div>
    </div>
  );
}
