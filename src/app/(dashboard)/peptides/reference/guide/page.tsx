import type { Metadata } from "next";
import { ReconGuide } from "../recon-guide";

export const metadata: Metadata = {
  title: "Reconstitute · Peptide reference",
};

// `?peptide=slug` lands here from a library entry's "Reconstitute this"
// link with that compound already picked.
export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ peptide?: string }>;
}) {
  const { peptide } = await searchParams;
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-sm text-muted-foreground">
        Start here if you have a vial and are not sure what to do with it. Pick
        the peptide and the rest is seeded from its entry — the solvent, the
        sizes it is sold in, the documented dose — so the only thing you decide
        is which step of the schedule you are on.
      </p>
      <ReconGuide initialSlug={peptide ?? null} />
    </div>
  );
}
