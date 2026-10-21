import { BookMarked } from "lucide-react";

// Describes what the coach actually does. It answers compound questions out of
// the reference library, so the only thing worth saying up front is where its
// numbers come from — not a warning that it won't answer, which it now does.
export function CoachDisclaimer() {
  return (
    <div
      role="note"
      aria-label="How the coach answers"
      className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3"
    >
      <BookMarked
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
      />
      <p className="text-sm text-muted-foreground">
        The coach is deterministic — it reads what you&apos;ve logged and quotes
        the peptide reference library, so every figure it gives is one that is
        written down and tagged with its source. It never estimates a number.
      </p>
    </div>
  );
}
