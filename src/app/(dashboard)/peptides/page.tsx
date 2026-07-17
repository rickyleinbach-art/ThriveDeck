import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCareProviders,
  getInjections,
  getJournalEntries,
  getPeptides,
  getSideEffects,
  getUpcomingReminders,
} from "@/lib/peptides/queries";
import {
  completeReminderFormAction,
  deleteCareProviderFormAction,
  deleteJournalEntryFormAction,
  deleteReminderFormAction,
  deleteSideEffectFormAction,
} from "@/lib/peptides/actions";
import {
  CARE_PROVIDER_KIND_LABELS,
  REMINDER_KIND_LABELS,
  SIDE_EFFECT_SEVERITY_LABELS,
} from "@/lib/validations/peptide";
import { MedicalDisclaimer } from "./disclaimer";
import { PeptideForm } from "./peptide-form";
import { PeptideListItem } from "./peptide-list-item";
import { LogInjectionForm } from "./log-injection-form";
import { ReminderForm } from "./reminder-form";
import { SideEffectForm } from "./side-effect-form";
import { JournalForm } from "./journal-form";
import { ProviderForm } from "./provider-form";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function PeptidesPage() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [peptides, recentInjections, monthInjections, reminders, sideEffects, journal, providers] =
    await Promise.all([
      getPeptides(),
      getInjections({ since: weekAgo }),
      getInjections({ since: monthAgo }),
      getUpcomingReminders({ limit: 5 }),
      getSideEffects({ limit: 5 }),
      getJournalEntries({ limit: 5 }),
      getCareProviders(),
    ]);

  const activePeptides = peptides.filter((p) => p.status === "ACTIVE");
  const injectionsThisWeek = recentInjections.filter((i) => i.status === "LOGGED").length;
  const missedThisMonth = monthInjections.filter((i) => i.status === "MISSED").length;
  const nextReminder = reminders[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Peptides</h1>
          <p className="mt-1 text-muted-foreground">
            A private record of your prescribed protocol — injections, reminders, and
            how you&apos;re feeling.
          </p>
        </div>
        <Link href="/peptides/history" className="text-sm text-primary hover:underline">
          Full history
        </Link>
      </div>

      <MedicalDisclaimer />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Active peptides">
          <p className="text-2xl font-semibold">{activePeptides.length}</p>
        </Card>
        <Card title="Injections this week">
          <p className="text-2xl font-semibold">{injectionsThisWeek}</p>
        </Card>
        <Card title="Missed doses (30 days)">
          <p className="text-2xl font-semibold">{missedThisMonth}</p>
        </Card>
        <Card title="Next reminder">
          {nextReminder ? (
            <>
              <p className="truncate font-semibold">{nextReminder.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(nextReminder.dueAt)}
              </p>
            </>
          ) : (
            <p className="text-2xl font-semibold">—</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Your peptides" className="lg:col-span-2">
          {peptides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing tracked yet. Add the peptide your provider prescribed to start
              logging injections.
            </p>
          ) : (
            <div className="space-y-3">
              {peptides.map((peptide) => (
                <PeptideListItem key={peptide.id} peptide={peptide} providers={providers} />
              ))}
            </div>
          )}
        </Card>

        <Card title="Add a peptide">
          <PeptideForm providers={providers} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Log an injection">
          <LogInjectionForm peptides={activePeptides} />
        </Card>

        <Card title="Reminders">
          {reminders.length > 0 && (
            <ul className="mb-4 space-y-2">
              {reminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {REMINDER_KIND_LABELS[reminder.kind]} · {formatDateTime(reminder.dueAt)}
                      {reminder.repeatEveryDays
                        ? ` · every ${reminder.repeatEveryDays}d`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={completeReminderFormAction.bind(null, reminder.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Done
                      </Button>
                    </form>
                    <form action={deleteReminderFormAction.bind(null, reminder.id)}>
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        ✕
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ReminderForm peptides={peptides} />
        </Card>

        <Card title="Report a side effect">
          <SideEffectForm peptides={peptides} />
          {sideEffects.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-border pt-4">
              {sideEffects.map((effect) => (
                <li key={effect.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-medium">
                        {SIDE_EFFECT_SEVERITY_LABELS[effect.severity]}
                      </span>
                      {effect.peptideName ? ` · ${effect.peptideName}` : ""}
                      {" · "}
                      <span className="text-muted-foreground">
                        {formatDateTime(effect.occurredAt)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">{effect.description}</p>
                  </div>
                  <form action={deleteSideEffectFormAction.bind(null, effect.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
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
        <Card title="Journal">
          <JournalForm peptides={peptides} />
          {journal.length > 0 && (
            <ul className="mt-4 space-y-3 border-t border-border pt-4">
              {journal.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {entry.entryDate}
                      {entry.peptideName ? ` · ${entry.peptideName}` : ""}
                    </p>
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                  </div>
                  <form action={deleteJournalEntryFormAction.bind(null, entry.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      ✕
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Providers & pharmacies">
          {providers.length > 0 && (
            <ul className="mb-4 space-y-2">
              {providers.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CARE_PROVIDER_KIND_LABELS[contact.kind]}
                      {contact.phone ? ` · ${contact.phone}` : ""}
                      {contact.email ? ` · ${contact.email}` : ""}
                    </p>
                  </div>
                  <form action={deleteCareProviderFormAction.bind(null, contact.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      ✕
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <ProviderForm />
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Questions about your protocol, dose, or side effects belong with your licensed
        healthcare provider. MetabolicOS only stores what you enter.
      </p>
    </div>
  );
}
