import type { Metadata } from "next";
import { StacksList, StackWarnings } from "../stacks-section";
import { RefSection } from "../sections";

export const metadata: Metadata = {
  title: "Stacks · Peptide reference",
};

export default function StacksPage() {
  return (
    <div className="space-y-10">
      <RefSection
        id="pairings"
        title="Pairings people run"
        note="Each one with the mechanism behind it and how it is run in practice — whether the two share a vial, timing, what to watch."
      >
        <StacksList />
      </RefSection>

      <RefSection
        id="avoid"
        title="Combinations to avoid"
        note="The warnings name the mechanism rather than just the verdict, so the reasoning extends to cases not listed."
      >
        <StackWarnings />
      </RefSection>
    </div>
  );
}
