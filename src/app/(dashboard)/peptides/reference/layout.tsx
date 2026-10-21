import Link from "next/link";
import { ArrowLeft, Syringe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/ui/icon";
import { MedicalDisclaimer } from "../disclaimer";
import { ReferenceTabs } from "./reference-tabs";

// The reference used to be one 700-line scroll. It is now a tabbed area: the
// header, sourcing note and tabs live here once, and each tab is its own route
// so a link lands on the thing it names instead of somewhere above it.
export default function ReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={Syringe}
        title="Peptide reference"
        description="What each compound is, how much evidence stands behind it, how it is mixed, stored and paired."
        actions={
          <Link
            href="/peptides"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <Icon icon={ArrowLeft} size="sm" />
            Back to Peptides
          </Link>
        }
      />
      <MedicalDisclaimer />
      <ReferenceTabs />
      <div>{children}</div>
    </div>
  );
}
