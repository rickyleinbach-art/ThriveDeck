import type { Metadata } from "next";
import Link from "next/link";
import { Columns3, Layers, Syringe, type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import {
  APPROVED_COUNT,
  REFERENCE_COMPOUNDS,
} from "@/lib/peptides/reference";
import { CompoundLibrary } from "./compound-library";

export const metadata: Metadata = {
  title: "Peptide reference",
  description:
    "An educational reference: what each compound is, how much evidence stands behind it, how it is mixed and stored.",
};

// The three things people come here to do. Each lands on its own tab; the
// library below is for when the question is "which compound" in the first
// place.
const ACTIONS: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    href: "/peptides/reference/guide",
    icon: Syringe,
    title: "Reconstitute a vial",
    body: "Pick the peptide, confirm the vial, get told how much water and where to draw.",
  },
  {
    href: "/peptides/reference/compare",
    icon: Columns3,
    title: "Compare compounds",
    body: "Up to three side by side: evidence, dosing source, half-life, storage.",
  },
  {
    href: "/peptides/reference/stacks",
    icon: Layers,
    title: "Stacks and what to avoid",
    body: "Common pairings with the mechanism behind them, and the combinations that compound risk.",
  },
];

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-accent/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon icon={a.icon} />
            </span>
            <span className="mt-3 font-semibold">{a.title}</span>
            <span className="mt-1 text-sm text-muted-foreground">{a.body}</span>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Find a compound</h2>
          <p className="text-xs text-muted-foreground">
            {REFERENCE_COMPOUNDS.length} compounds · {APPROVED_COUNT} approved medicines
          </p>
        </div>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Search by name or brand, filter by what you are trying to do, or hide
          the evidence levels you are not interested in. Open an entry for the
          full picture and a shortcut to reconstituting it.
        </p>
        <div className="mt-4">
          <CompoundLibrary />
        </div>
      </div>
    </div>
  );
}
