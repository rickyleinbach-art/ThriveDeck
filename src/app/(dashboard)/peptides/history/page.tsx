import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInjections } from "@/lib/peptides/queries";
import { deleteInjectionFormAction } from "@/lib/peptides/actions";
import {
  DOSE_UNIT_LABELS,
  INJECTION_SITE_LABELS,
} from "@/lib/validations/peptide";
import { MedicalDisclaimer } from "../disclaimer";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PeptideHistoryPage() {
  const injections = await getInjections({ limit: 200 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Injection history</h1>
          <p className="mt-1 text-muted-foreground">
            Everything you&apos;ve logged, including missed doses.
          </p>
        </div>
        <Link href="/peptides" className="text-sm text-primary hover:underline">
          Back to peptides
        </Link>
      </div>

      <MedicalDisclaimer />

      <Card>
        {injections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No injections logged yet. Log your first one from the peptides page.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {injections.map((injection) => {
              const doseText =
                injection.doseAmount != null && injection.doseUnit
                  ? `${injection.doseAmount} ${DOSE_UNIT_LABELS[injection.doseUnit]}`
                  : null;
              const details = [
                doseText,
                injection.site && INJECTION_SITE_LABELS[injection.site],
                injection.lotNumber && `Lot ${injection.lotNumber}`,
                injection.notes,
              ].filter(Boolean) as string[];

              return (
                <li
                  key={injection.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {injection.peptideName}
                      {injection.status === "MISSED" && (
                        <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          Missed
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(injection.injectedAt)}
                      {details.length > 0 ? ` · ${details.join(" · ")}` : ""}
                    </p>
                  </div>
                  <form action={deleteInjectionFormAction.bind(null, injection.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive"
                    >
                      Delete
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
