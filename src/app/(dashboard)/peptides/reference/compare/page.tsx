import type { Metadata } from "next";
import { ComparePeptides } from "../compare-peptides";

export const metadata: Metadata = {
  title: "Compare · Peptide reference",
};

// `?a=slug&b=slug&c=slug` pre-fills the columns, so a library entry can hand
// a compound straight into a comparison.
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}) {
  const { a, b, c } = await searchParams;
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-sm text-muted-foreground">
        Up to three compounds across one table — evidence tier, dosing source,
        half-life and the worth-knowing line, without scrolling between entries.
      </p>
      <ComparePeptides initialSlugs={[a ?? null, b ?? null, c ?? null]} />
    </div>
  );
}
