"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateNotificationPrefs, updateUnitSystem } from "@/lib/profile/actions";
import type { NotificationPrefs } from "@/lib/validations/profile";

type UnitSystem = "METRIC" | "IMPERIAL";

const NOTIF_LABELS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "peptideReminders", label: "Peptide & refill reminders", hint: "Dose, refill, lab, and appointment reminders you set." },
  { key: "habitNudges", label: "Habit nudges", hint: "A daily reminder to check off your habits." },
  { key: "weeklyReport", label: "Weekly report", hint: "Your progress summary every week." },
  { key: "communityReplies", label: "Community replies", hint: "When someone replies to your posts." },
];

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
}: {
  email: string;
  initialUnitSystem: UnitSystem;
  initialNotificationPrefs: NotificationPrefs;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [notif, setNotif] = useState<NotificationPrefs>(initialNotificationPrefs);
  const [notifError, setNotifError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          {NOTIF_LABELS.map((n) => (
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
    </div>
  );
}
