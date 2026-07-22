import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCareProviders,
  getHealthMetrics,
  getLabResults,
  getMedicalConditions,
  getMedications,
} from "@/lib/health/queries";
import {
  deleteConditionFormAction,
  deleteHealthMetricFormAction,
  deleteLabResultFormAction,
  deleteMedicationFormAction,
  setMedicationActiveFormAction,
} from "@/lib/health/actions";
import { formatMetricValue, isOutsideReferenceRange } from "@/lib/health/types";
import {
  CONDITION_STATUS_LABELS,
  HEALTH_METRIC_KIND_LABELS,
  HEALTH_METRIC_KINDS,
} from "@/lib/validations/health";
import { CARE_PROVIDER_KIND_LABELS } from "@/lib/validations/peptide";
import { MetricForm } from "./metric-form";
import { LabForm } from "./lab-form";
import { MedicationForm } from "./medication-form";
import { ConditionForm } from "./condition-form";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function HealthPage() {
  const [metrics, labs, medications, conditions, providers] = await Promise.all([
    getHealthMetrics({ limit: 100 }),
    getLabResults({ limit: 10 }),
    getMedications(),
    getMedicalConditions(),
    getCareProviders(),
  ]);

  const latestByKind = new Map(
    HEALTH_METRIC_KINDS.map((kind) => [
      kind,
      metrics.find((m) => m.kind === kind) ?? null,
    ])
  );
  const recentMetrics = metrics.slice(0, 8);
  const activeMedications = medications.filter((m) => m.active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Health</h1>
        <p className="mt-1 text-muted-foreground">
          Vitals, labs, medications, and history — your record, in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {HEALTH_METRIC_KINDS.map((kind) => {
          const latest = latestByKind.get(kind) ?? null;
          return (
            <Card key={kind} title={HEALTH_METRIC_KIND_LABELS[kind]}>
              {latest ? (
                <>
                  <p className="text-2xl font-semibold">{formatMetricValue(latest)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(latest.measuredAt)}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-semibold">—</p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Log a vital">
          <MetricForm />
        </Card>

        <Card title="Recent vitals" className="lg:col-span-2">
          {recentMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet. Blood pressure, heart rate, HRV, and glucose all
              live here.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentMetrics.map((metric) => (
                <li
                  key={metric.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {HEALTH_METRIC_KIND_LABELS[metric.kind]} ·{" "}
                      {formatMetricValue(metric)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(metric.measuredAt)}
                      {metric.notes ? ` · ${metric.notes}` : ""}
                    </p>
                  </div>
                  <form action={deleteHealthMetricFormAction.bind(null, metric.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      ✕
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Lab results">
          <LabForm />
          {labs.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-border pt-4">
              {labs.map((lab) => (
                <li
                  key={lab.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {lab.testName} · {lab.value} {lab.unit}
                      {isOutsideReferenceRange(lab) && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          outside reference range — discuss with your provider
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lab.collectedOn}
                      {lab.referenceLow !== null || lab.referenceHigh !== null
                        ? ` · ref ${lab.referenceLow ?? "—"}–${lab.referenceHigh ?? "—"}`
                        : ""}
                      {lab.labName ? ` · ${lab.labName}` : ""}
                    </p>
                  </div>
                  <form action={deleteLabResultFormAction.bind(null, lab.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      ✕
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Medications">
          {medications.length > 0 && (
            <ul className="mb-4 space-y-2">
              {medications.map((med) => (
                <li
                  key={med.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {med.name}
                      {!med.active && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Stopped{med.endedOn ? ` ${med.endedOn}` : ""}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[med.doseText, med.frequency, med.reason, med.prescriber]
                        .filter(Boolean)
                        .join(" · ") || "No details recorded"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form
                      action={setMedicationActiveFormAction.bind(
                        null,
                        med.id,
                        !med.active
                      )}
                    >
                      <Button type="submit" variant="outline" size="sm">
                        {med.active ? "Stop" : "Resume"}
                      </Button>
                    </form>
                    <form action={deleteMedicationFormAction.bind(null, med.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        ✕
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <MedicationForm />
          {activeMedications.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Never start, stop, or change a medication without talking to your
              provider.
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Medical history">
          {conditions.length > 0 && (
            <ul className="mb-4 space-y-2">
              {conditions.map((condition) => (
                <li
                  key={condition.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{condition.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CONDITION_STATUS_LABELS[condition.status]}
                      {condition.diagnosedOn
                        ? ` · diagnosed ${condition.diagnosedOn}`
                        : ""}
                      {condition.notes ? ` · ${condition.notes}` : ""}
                    </p>
                  </div>
                  <form action={deleteConditionFormAction.bind(null, condition.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      ✕
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <ConditionForm />
        </Card>

        <Card title="Providers & pharmacies">
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No providers saved yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {providers.map((contact) => (
                <li
                  key={contact.id}
                  className="rounded-xl border border-border p-3 text-sm"
                >
                  <p className="truncate font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {CARE_PROVIDER_KIND_LABELS[contact.kind]}
                    {contact.phone ? ` · ${contact.phone}` : ""}
                    {contact.email ? ` · ${contact.email}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Add or edit providers on the{" "}
            <Link href="/peptides" className="text-primary hover:underline">
              Peptides page
            </Link>
            .
          </p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        ThriveDeck stores what you enter for your own reference — it never
        interprets results or gives medical advice. Bring questions about any
        reading, lab, or medication to your licensed healthcare provider.
      </p>
    </div>
  );
}
