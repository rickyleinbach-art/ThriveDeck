"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  updateHealthProfile,
  updateNotificationPrefs,
  updatePeptideTracking,
  updateUnitSystem,
} from "@/lib/profile/actions";
import type { NotificationPrefs } from "@/lib/validations/profile";
import {
  INJURY_FLAGS,
  INJURY_FLAG_LABELS,
  PEPTIDE_CATEGORIES,
  PEPTIDE_CATEGORY_LABELS,
  type HealthProfile,
  type InjuryFlag,
  type PeptideCategory,
} from "@/lib/validations/onboarding";

type UnitSystem = "METRIC" | "IMPERIAL";

// peptideReminders is only shown when the user tracks peptides (see below).
const NOTIF_LABELS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "mealLogReminders", label: "Meal-log reminders", hint: "A nudge to log your meals." },
  { key: "workoutReminders", label: "Workout reminders", hint: "A reminder on your training days." },
  { key: "peptideReminders", label: "Peptide & refill reminders", hint: "Dose, refill, lab, and appointment reminders you set." },
  { key: "habitNudges", label: "Habit nudges", hint: "A daily reminder to check off your habits." },
  { key: "weeklyReport", label: "Weekly report", hint: "Your progress summary every week." },
  { key: "communityReplies", label: "Community replies", hint: "When someone replies to your posts." },
];

const textareaClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={
            "rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 " +
            (value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition " +
          (checked ? "bg-primary" : "bg-muted")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all " +
            (checked ? "left-[22px]" : "left-0.5")
          }
        />
      </button>
    </div>
  );
}

export function SettingsClient({
  email,
  initialUnitSystem,
  initialNotificationPrefs,
  initialTracksPeptides,
  initialPeptideCategories,
  initialHealthProfile,
}: {
  email: string;
  initialUnitSystem: UnitSystem;
  initialNotificationPrefs: NotificationPrefs;
  initialTracksPeptides: boolean;
  initialPeptideCategories: PeptideCategory[];
  initialHealthProfile: HealthProfile;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [notif, setNotif] = useState<NotificationPrefs>(initialNotificationPrefs);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Peptide tracking — the single flag that shows/hides the Peptides module.
  const [tracksPeptides, setTracksPeptides] = useState(initialTracksPeptides);
  const [peptideCategories, setPeptideCategories] = useState<PeptideCategory[]>(
    initialPeptideCategories
  );
  const [peptideError, setPeptideError] = useState<string | null>(null);

  // Sensitive health details.
  const [health, setHealth] = useState<HealthProfile>(initialHealthProfile);
  const [healthSaved, setHealthSaved] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Flipping the toggle (or changing categories) persists immediately and
  // refreshes so the nav reveals/hides the module without a reload.
  function persistPeptides(nextTracks: boolean, nextCategories: PeptideCategory[]) {
    setPeptideError(null);
    startTransition(async () => {
      const result = await updatePeptideTracking(nextTracks, nextCategories);
      if (!result.success) {
        setPeptideError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function togglePeptides(value: boolean) {
    setTracksPeptides(value);
    const nextCategories = value ? peptideCategories : [];
    if (!value) setPeptideCategories([]);
    persistPeptides(value, nextCategories);
  }

  function togglePeptideCategory(value: PeptideCategory) {
    const next = peptideCategories.includes(value)
      ? peptideCategories.filter((c) => c !== value)
      : [...peptideCategories, value];
    setPeptideCategories(next);
    persistPeptides(tracksPeptides, next);
  }

  function toggleInjury(flag: InjuryFlag) {
    setHealthSaved(false);
    setHealth((h) => ({
      ...h,
      injuryFlags: h.injuryFlags.includes(flag)
        ? h.injuryFlags.filter((f) => f !== flag)
        : [...h.injuryFlags, flag],
    }));
  }

  function saveHealth() {
    setHealthError(null);
    setHealthSaved(false);
    startTransition(async () => {
      const result = await updateHealthProfile(health);
      if (!result.success) {
        setHealthError(result.error);
        return;
      }
      setHealthSaved(true);
      router.refresh();
    });
  }

  // Optimistic toggle: reflect immediately, persist to the profile, revert on
  // failure so the UI never claims a preference that didn't save.
  function updateNotif(key: keyof NotificationPrefs, value: boolean) {
    const previous = notif;
    const next = { ...notif, [key]: value };
    setNotif(next);
    setNotifError(null);
    startTransition(async () => {
      const result = await updateNotificationPrefs(next);
      if (!result.success) {
        setNotif(previous);
        setNotifError(result.error);
      }
    });
  }

  function changeUnits(next: UnitSystem) {
    const previous = unitSystem;
    setUnitSystem(next);
    setUnitError(null);
    startTransition(async () => {
      const result = await updateUnitSystem(next);
      if (!result.success) {
        setUnitSystem(previous);
        setUnitError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card title="Account">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">{email}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Email and password are managed through sign-in. Edit your personal
          details on the Profile page.
        </p>
      </Card>

      <Card title="Appearance">
        <div className="space-y-1.5">
          <Label>Theme</Label>
          {mounted ? (
            <Segmented
              value={(theme as string) ?? "system"}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
            />
          ) : (
            <div className="h-9 w-56 rounded-lg border border-border" />
          )}
        </div>
      </Card>

      <Card title="Units">
        <div className="space-y-1.5">
          <Label>Measurement system</Label>
          <Segmented
            value={unitSystem}
            disabled={pending}
            onChange={changeUnits}
            options={[
              { value: "METRIC", label: "Metric (kg, cm)" },
              { value: "IMPERIAL", label: "Imperial (lb, ft/in)" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Applies across weight, exercise, and nutrition. Shared with your
            profile.
          </p>
          {unitError && <p className="text-sm text-destructive">{unitError}</p>}
        </div>
      </Card>

      <Card title="Notifications">
        <div className="divide-y divide-border">
          {NOTIF_LABELS.filter(
            (n) => n.key !== "peptideReminders" || tracksPeptides
          ).map((n) => (
            <Toggle
              key={n.key}
              label={n.label}
              hint={n.hint}
              checked={notif[n.key]}
              onChange={(v) => updateNotif(n.key, v)}
            />
          ))}
        </div>
        {notifError && (
          <p className="mt-3 text-sm text-destructive">{notifError}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Saved to your account. Notification delivery is coming soon.
        </p>
      </Card>

      <Card title="Peptide tracking">
        <Toggle
          label="Track peptides"
          hint="Shows the Peptides module in your navigation, dashboard, and analytics. Turn it on anytime — no re-onboarding needed."
          checked={tracksPeptides}
          onChange={togglePeptides}
        />
        {tracksPeptides && (
          <div className="mt-3 space-y-1.5">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {PEPTIDE_CATEGORIES.map((c) => {
                const selected = peptideCategories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={selected}
                    disabled={pending}
                    onClick={() => togglePeptideCategory(c)}
                    className={
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 " +
                      (selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
                    }
                  >
                    {PEPTIDE_CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Categories only — ThriveDeck records adherence and results, never
              dosing advice.
            </p>
          </div>
        )}
        {peptideError && (
          <p className="mt-3 text-sm text-destructive">{peptideError}</p>
        )}
      </Card>

      <Card title="Health details">
        <p className="mb-3 text-xs text-muted-foreground">
          Private to your account. Sharing this helps the coach and workouts
          avoid movements that don&apos;t suit you — optional, and editable
          anytime.
        </p>
        <div className="space-y-1.5">
          <Label>Injuries or physical limitations</Label>
          <div className="grid grid-cols-2 gap-2">
            {INJURY_FLAGS.map((flag) => {
              const selected = health.injuryFlags.includes(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInjury(flag)}
                  className={
                    "rounded-lg border px-3 py-2 text-left text-sm font-medium transition " +
                    (selected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
                  }
                >
                  {INJURY_FLAG_LABELS[flag]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="injuryNotes">Notes on injuries or limitations</Label>
          <textarea
            id="injuryNotes"
            className={textareaClass}
            rows={2}
            value={health.injuryNotes}
            maxLength={1000}
            onChange={(e) => {
              setHealthSaved(false);
              setHealth((h) => ({ ...h, injuryNotes: e.target.value }));
            }}
            placeholder="e.g. left knee — avoid deep squats"
          />
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="conditions">Relevant health conditions</Label>
          <textarea
            id="conditions"
            className={textareaClass}
            rows={2}
            value={health.conditions}
            maxLength={1000}
            onChange={(e) => {
              setHealthSaved(false);
              setHealth((h) => ({ ...h, conditions: e.target.value }));
            }}
            placeholder="e.g. type 2 diabetes, hypertension"
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveHealth}
            disabled={pending}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            Save health details
          </button>
          {healthSaved && !healthError && (
            <span className="text-sm text-primary">Saved.</span>
          )}
        </div>
        {healthError && (
          <p className="mt-3 text-sm text-destructive">{healthError}</p>
        )}
      </Card>
    </div>
  );
}
