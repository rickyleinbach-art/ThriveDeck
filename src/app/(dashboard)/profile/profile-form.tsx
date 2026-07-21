"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { profileSchema } from "@/lib/validations/profile";
import { updateProfile } from "@/lib/profile/actions";
import type { Profile } from "@/lib/profile/queries";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

const SEX_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

const ACTIVITY_OPTIONS = [
  { value: "SEDENTARY", label: "Sedentary — little/no exercise" },
  { value: "LIGHT", label: "Light — 1–3 days/week" },
  { value: "MODERATE", label: "Moderate — 3–5 days/week" },
  { value: "ACTIVE", label: "Active — 6–7 days/week" },
  { value: "VERY_ACTIVE", label: "Very active — hard daily / physical job" },
] as const;

// A curated shortlist covering the common cases; the user's stored zone is
// always merged in so we never silently drop an unlisted value.
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? "");
  const [sex, setSex] = useState<string>(profile.sex ?? "");
  const [timezone, setTimezone] = useState(profile.timezone || "UTC");
  const [unitSystem, setUnitSystem] = useState<"METRIC" | "IMPERIAL">(
    profile.unitSystem
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    profile.activityLevel ?? ""
  );

  // Height: stored in cm. Metric edits cm directly; imperial edits ft + in.
  const [heightCm, setHeightCm] = useState(
    profile.heightCm != null ? round1(profile.heightCm) : ""
  );
  const initialFtIn = profile.heightCm != null ? cmToFtIn(profile.heightCm) : null;
  const [heightFt, setHeightFt] = useState(initialFtIn ? String(initialFtIn.ft) : "");
  const [heightIn, setHeightIn] = useState(initialFtIn ? String(initialFtIn.in) : "");

  // Goal weight: stored in kg. Imperial edits lb.
  const [goalWeight, setGoalWeight] = useState(
    profile.goalWeightKg != null
      ? round1(profile.unitSystem === "IMPERIAL" ? profile.goalWeightKg / KG_PER_LB : profile.goalWeightKg)
      : ""
  );

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timezones = useMemo(() => {
    const set = new Set(COMMON_TIMEZONES);
    if (timezone) set.add(timezone);
    return [...set];
  }, [timezone]);

  function detectTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      // Intl unavailable — leave the current value untouched.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    // Resolve height to cm from whichever unit's inputs are active.
    let resolvedHeightCm: number | undefined;
    if (unitSystem === "IMPERIAL") {
      const ft = heightFt ? Number(heightFt) : 0;
      const inch = heightIn ? Number(heightIn) : 0;
      if (ft || inch) resolvedHeightCm = (ft * 12 + inch) * CM_PER_IN;
    } else if (heightCm) {
      resolvedHeightCm = Number(heightCm);
    }

    // Resolve goal weight to kg.
    let resolvedGoalKg: number | undefined;
    if (goalWeight) {
      const val = Number(goalWeight);
      resolvedGoalKg = unitSystem === "IMPERIAL" ? val * KG_PER_LB : val;
    }

    const parsed = profileSchema.safeParse({
      fullName: fullName || undefined,
      dateOfBirth: dateOfBirth || undefined,
      sex: sex || undefined,
      heightCm: resolvedHeightCm,
      timezone: timezone || "UTC",
      unitSystem,
      goalWeightKg: resolvedGoalKg,
      activityLevel: activityLevel || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setSubmitting(true);
    const result = await updateProfile(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sex">Sex</Label>
          <Select id="sex" value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">Select…</option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activityLevel">Activity level</Label>
          <Select
            id="activityLevel"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
          >
            <option value="">Select…</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unitSystem">Units</Label>
        <Select
          id="unitSystem"
          value={unitSystem}
          onChange={(e) => setUnitSystem(e.target.value as "METRIC" | "IMPERIAL")}
        >
          <option value="METRIC">Metric (kg, cm)</option>
          <option value="IMPERIAL">Imperial (lb, ft/in)</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Height</Label>
          {unitSystem === "IMPERIAL" ? (
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Input
                  aria-label="Height feet"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="5"
                />
                <span className="text-sm text-muted-foreground">ft</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  aria-label="Height inches"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={11}
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground">in</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                aria-label="Height centimeters"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="178"
              />
              <span className="text-sm text-muted-foreground">cm</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Used to calculate your BMI on the Weight page.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goalWeight">
            Goal weight ({unitSystem === "IMPERIAL" ? "lb" : "kg"})
          </Label>
          <Input
            id="goalWeight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            placeholder={unitSystem === "IMPERIAL" ? "165" : "75"}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <div className="flex gap-2">
          <Select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" onClick={detectTimezone}>
            Detect
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-primary">Profile saved.</p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = cm / CM_PER_IN;
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round(totalInches - ft * 12);
  // Carry a rounded-up 12" into the next foot.
  if (inch === 12) return { ft: ft + 1, in: 0 };
  return { ft, in: inch };
}
