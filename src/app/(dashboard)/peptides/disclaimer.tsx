import { BookMarked } from "lucide-react";

// Single-user deck: this is a sourcing note, not a warning banner.
//
// What it still says is the part that stays useful when you are the one
// drawing the syringe — every figure in the library is a number somebody
// published, carrying the tier that says who. An approved-label dose and an
// animal-study dose are not the same kind of number.
export function MedicalDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Reference sourcing"
      className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3"
    >
      <BookMarked
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
      />
      <p className="text-sm text-muted-foreground">
        Figures here are published references — regulatory labels, trial
        protocols, or research literature — each tagged with where it came from.
        Check the tier before leaning on a number.
      </p>
    </div>
  );
}
