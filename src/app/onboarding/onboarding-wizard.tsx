"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/lib/onboarding/actions";
import {
  anyWeightChangeGoal,
  DIETARY_PATTERNS,
  DIETARY_PATTERN_LABELS,
  INJURY_FLAGS,
  INJURY_FLAG_LABELS,
  PEPTIDE_CATEGORIES,
  PEPTIDE_CATEGORY_LABELS,
  PRIMARY_GOALS,
  PRIMARY_GOAL_LABELS,
  TRAINING_EXPERIENCES,
  TRAINING_EXPERIENCE_LABELS,
  type DietaryPattern,
  type InjuryFlag,
  type OnboardingInput,
  type PeptideCategory,
  type PrimaryGoal,
  type TrainingExperience,
} from "@/lib/validations/onboarding";
import { PEPTIDE_CATALOG_ENTRIES } from "@/lib/peptides/catalog";
import { MedicalDisclaimer } from "@/app/(dashboard)/peptides/disclaimer";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;
const TOTAL_STEPS = 4;

type UnitSystem = "METRIC" | "IMPERIAL";
type Sex = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "SEDENTARY", label: "Sedentary — little/no exercise" },
  { value: "LIGHT", label: "Lightly active — 1–3 days/week" },
  { value: "MODERATE", label: "Moderately active — 3–5 days/week" },
  { value: "ACTIVE", label: "Very active — 6–7 days/week" },
  { value: "VERY_ACTIVE", label: "Athlete — hard daily / physical job" },
];

// ---------------------------------------------------------------------------
// Small building blocks (kept local — the wizard is the only consumer)
// ---------------------------------------------------------------------------
function ChoiceGrid<T extends string>({
  value,
  options,
  onChange,
  columns = 1,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={columns === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={
              "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition " +
              (selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
            }
          >
            <span>{o.label}</span>
            {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function MultiChoiceGrid<T extends string>({
  values,
  options,
  onToggle,
  columns = 1,
}: {
  values: T[];
  options: { value: T; label: string }[];
  onToggle: (v: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={columns === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(o.value)}
            className={
              "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition " +
              (selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
            }
          >
            <span>{o.label}</span>
            {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const textareaClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ---------------------------------------------------------------------------
export function OnboardingWizard({
  initialUnitSystem,
  firstName,
}: {
  initialUnitSystem: UnitSystem;
  firstName: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Screen 1 — Basics
  const [fullName, setFullName] = useState("");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem);
  const [sex, setSex] = useState<Sex | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState(""); // display unit

  // Screen 2 — Goals & activity (goals are multi-select)
  const [primaryGoals, setPrimaryGoals] = useState<PrimaryGoal[]>([]);
  const [goalWeight, setGoalWeight] = useState(""); // display unit
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [experience, setExperience] = useState<TrainingExperience | "">("");
  const [trainingDays, setTrainingDays] = useState("");

  // Screen 3 — Nutrition & substances (categories + compounds multi-select)
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern | "">("");
  const [allergies, setAllergies] = useState("");
  const [tracksPeptides, setTracksPeptides] = useState<boolean | null>(null);
  const [peptideCategories, setPeptideCategories] = useState<PeptideCategory[]>([]);
  const [selectedPeptides, setSelectedPeptides] = useState<string[]>([]);
  const [peptideSearch, setPeptideSearch] = useState("");
  const [customPeptide, setCustomPeptide] = useState("");

  // Screen 4 — Optional but valuable
  const [injuryFlags, setInjuryFlags] = useState<InjuryFlag[]>([]);
  const [injuryNotes, setInjuryNotes] = useState("");
  const [conditions, setConditions] = useState("");

  const weightUnit = unitSystem === "IMPERIAL" ? "lb" : "kg";
  const liveFirstName = fullName.trim().split(" ")[0] || firstName;
  const showTargetWeight = anyWeightChangeGoal(primaryGoals);

  function toggleFrom<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, v: T) {
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }
  const toggleGoal = (g: PrimaryGoal) => toggleFrom(setPrimaryGoals, g);
  const toggleCategory = (c: PeptideCategory) => toggleFrom(setPeptideCategories, c);
  const togglePeptide = (name: string) => toggleFrom(setSelectedPeptides, name);
  const toggleInjury = (flag: InjuryFlag) => toggleFrom(setInjuryFlags, flag);

  function addCustomPeptide() {
    const name = customPeptide.trim();
    if (!name) return;
    if (!selectedPeptides.some((p) => p.toLowerCase() === name.toLowerCase())) {
      setSelectedPeptides((prev) => [...prev, name]);
    }
    setCustomPeptide("");
  }

  // Peptide list: restrict to the chosen categories (if any), then apply the
  // search box. Any already-selected custom entries (typed, not in the catalog)
  // are surfaced separately as removable chips below.
  const peptideOptions = useMemo(() => {
    const q = peptideSearch.trim().toLowerCase();
    return PEPTIDE_CATALOG_ENTRIES.filter(
      (e) =>
        (peptideCategories.length === 0 || peptideCategories.includes(e.category)) &&
        (q === "" || e.name.toLowerCase().includes(q))
    );
  }, [peptideSearch, peptideCategories]);

  const catalogNames = useMemo(
    () => new Set(PEPTIDE_CATALOG_ENTRIES.map((e) => e.name)),
    []
  );
  const customSelected = selectedPeptides.filter((p) => !catalogNames.has(p));

  // Resolve the current inputs into the metric payload the action expects.
  const buildInput = useMemo(
    () =>
      function build(): OnboardingInput {
        let resolvedHeightCm = 0;
        if (unitSystem === "IMPERIAL") {
          const ft = heightFt ? Number(heightFt) : 0;
          const inch = heightIn ? Number(heightIn) : 0;
          resolvedHeightCm = (ft * 12 + inch) * CM_PER_IN;
        } else {
          resolvedHeightCm = heightCm ? Number(heightCm) : 0;
        }

        const toKg = (v: string) =>
          unitSystem === "IMPERIAL" ? Number(v) * KG_PER_LB : Number(v);

        return {
          fullName: fullName.trim() || undefined,
          unitSystem,
          sex: (sex || "PREFER_NOT_TO_SAY") as Sex,
          dateOfBirth,
          heightCm: Math.round(resolvedHeightCm * 10) / 10,
          currentWeightKg: weight ? Math.round(toKg(weight) * 1000) / 1000 : 0,
          primaryGoals,
          goalWeightKg:
            showTargetWeight && goalWeight
              ? Math.round(toKg(goalWeight) * 1000) / 1000
              : undefined,
          activityLevel: activityLevel || undefined,
          trainingExperience: experience || undefined,
          trainingDaysPerWeek: trainingDays ? Number(trainingDays) : undefined,
          dietaryPattern: dietaryPattern || undefined,
          allergies: allergies.trim() || undefined,
          tracksPeptides: tracksPeptides ?? false,
          peptideCategories: tracksPeptides ? peptideCategories : [],
          peptides: tracksPeptides ? selectedPeptides : [],
          healthProfile: {
            injuryFlags,
            injuryNotes: injuryNotes.trim(),
            conditions: conditions.trim(),
            consentAt: null, // stamped server-side when data is present
          },
        };
      },
    [
      fullName, unitSystem, sex, dateOfBirth, heightCm, heightFt, heightIn, weight,
      primaryGoals, goalWeight, showTargetWeight, activityLevel, experience,
      trainingDays, dietaryPattern, allergies, tracksPeptides, peptideCategories,
      selectedPeptides, injuryFlags, injuryNotes, conditions,
    ]
  );

  // Screen 1 is the only hard gate on reaching the dashboard.
  function validateBasics(): string | null {
    if (!sex) return "Please choose an option for sex, including “Prefer not to say.”";
    if (!dateOfBirth) return "Please enter your date of birth.";
    if (unitSystem === "IMPERIAL") {
      if (!heightFt && !heightIn) return "Please enter your height.";
    } else if (!heightCm) {
      return "Please enter your height.";
    }
    if (!weight) return "Please enter your current weight.";
    return null;
  }

  function next() {
    setError(null);
    if (step === 0) {
      const err = validateBasics();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else void finish();
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    // Screen 1 must be complete even when finishing early via "Skip for now".
    const err = validateBasics();
    if (err) {
      setStep(0);
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await completeOnboarding(buildInput());
    if (!result.success) {
      setSubmitting(false);
      setError(result.error);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-5"
      // Full-screen route with no app shell: honor the notch / home indicator
      // in a standalone PWA (statusBarStyle is black-translucent), or the
      // progress bar and action buttons render under the system UI.
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 1.75rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1.75rem)",
      }}
    >
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={
                "h-1.5 flex-1 rounded-full transition-colors " +
                (i <= step ? "bg-primary" : "bg-muted")
              }
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <Screen
            title={
              liveFirstName ? `Welcome, ${liveFirstName}` : "Welcome to ThriveDeck"
            }
            subtitle="A few basics so your targets and coaching are personalized from day one."
          >
            <Field label="Your name" hint="What should we call you? Optional.">
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ricky"
                maxLength={120}
                autoComplete="name"
              />
            </Field>

            <Field label="Units" hint="Changes how every field below is entered and shown.">
              <ChoiceGrid<UnitSystem>
                columns={2}
                value={unitSystem}
                onChange={setUnitSystem}
                options={[
                  { value: "IMPERIAL", label: "Imperial (lb, ft/in)" },
                  { value: "METRIC", label: "Metric (kg, cm)" },
                ]}
              />
            </Field>

            <Field label="Sex" hint="Used for standard BMR formulas. “Prefer not to say” uses a neutral estimate.">
              <ChoiceGrid<Sex>
                columns={2}
                value={sex}
                onChange={setSex}
                options={SEX_OPTIONS}
              />
            </Field>

            <Field label="Date of birth">
              <Input
                type="date"
                value={dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </Field>

            <Field label="Height">
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
            </Field>

            <Field label={`Current weight (${weightUnit})`}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={unitSystem === "IMPERIAL" ? "180" : "82"}
              />
            </Field>
          </Screen>
        )}

        {step === 1 && (
          <Screen
            title="Your goals"
            subtitle="This sets your calorie target and tailors what the coach suggests. Skip anything you're unsure about."
          >
            <Field
              label="Primary goals"
              hint="Pick all that apply. Fat loss + muscle together = body recomposition (maintenance calories)."
            >
              <MultiChoiceGrid<PrimaryGoal>
                values={primaryGoals}
                onToggle={toggleGoal}
                options={PRIMARY_GOALS.map((g) => ({
                  value: g,
                  label: PRIMARY_GOAL_LABELS[g],
                }))}
              />
            </Field>

            {showTargetWeight && (
              <Field label={`Target weight (${weightUnit})`}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder={unitSystem === "IMPERIAL" ? "165" : "75"}
                />
              </Field>
            )}

            <Field label="Activity level" hint="Used with your goal to estimate a daily calorie target.">
              <ChoiceGrid<ActivityLevel>
                value={activityLevel}
                onChange={setActivityLevel}
                options={ACTIVITY_OPTIONS}
              />
            </Field>

            <Field label="Training experience">
              <ChoiceGrid<TrainingExperience>
                columns={2}
                value={experience}
                onChange={setExperience}
                options={TRAINING_EXPERIENCES.map((e) => ({
                  value: e,
                  label: TRAINING_EXPERIENCE_LABELS[e],
                }))}
              />
            </Field>

            <Field label="Days per week available to train">
              <ChoiceGrid<string>
                columns={2}
                value={trainingDays}
                onChange={setTrainingDays}
                options={[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
                  value: String(n),
                  label: n === 0 ? "None yet" : `${n} day${n === 1 ? "" : "s"}`,
                }))}
              />
            </Field>
          </Screen>
        )}

        {step === 2 && (
          <Screen
            title="Nutrition & tracking"
            subtitle="Helps filter food and meal suggestions, and tailors which modules you see."
          >
            <Field label="Dietary pattern">
              <ChoiceGrid<DietaryPattern>
                columns={2}
                value={dietaryPattern}
                onChange={setDietaryPattern}
                options={DIETARY_PATTERNS.map((d) => ({
                  value: d,
                  label: DIETARY_PATTERN_LABELS[d],
                }))}
              />
            </Field>

            <Field label="Allergies or foods to avoid" hint="Optional. Comma-separated is fine.">
              <textarea
                className={textareaClass}
                rows={2}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. peanuts, shellfish"
                maxLength={1000}
              />
            </Field>

            <Field
              label="Do you currently track peptide use?"
              hint="ThriveDeck records adherence and results — never dosing advice. If you don't track peptides, we'll hide that module."
            >
              <ChoiceGrid<string>
                columns={2}
                value={tracksPeptides === null ? "" : tracksPeptides ? "yes" : "no"}
                onChange={(v) => setTracksPeptides(v === "yes")}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </Field>

            {tracksPeptides === true && (
              <>
                <MedicalDisclaimer />

                <Field
                  label="Which categories apply?"
                  hint="Categories only, no doses. Pick all that apply."
                >
                  <MultiChoiceGrid<PeptideCategory>
                    columns={2}
                    values={peptideCategories}
                    onToggle={toggleCategory}
                    options={PEPTIDE_CATEGORIES.map((c) => ({
                      value: c,
                      label: PEPTIDE_CATEGORY_LABELS[c],
                    }))}
                  />
                </Field>

                <Field
                  label="Which peptides are you currently using?"
                  hint="Select what your provider has you on — we record names only, never doses. You'll add protocol details in the Peptides section."
                >
                  <Input
                    value={peptideSearch}
                    onChange={(e) => setPeptideSearch(e.target.value)}
                    placeholder="Search peptides…"
                    aria-label="Search peptides"
                  />
                  <div className="mt-2 flex max-h-60 flex-wrap gap-2 overflow-y-auto">
                    {peptideOptions.map((e) => {
                      const selected = selectedPeptides.includes(e.name);
                      return (
                        <button
                          key={e.name}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => togglePeptide(e.name)}
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                            (selected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
                          }
                        >
                          {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                          {e.name}
                        </button>
                      );
                    })}
                    {peptideOptions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No matches — add it as a custom entry below.
                      </p>
                    )}
                  </div>
                </Field>

                <Field label="Not listed? Add your own">
                  <div className="flex gap-2">
                    <Input
                      value={customPeptide}
                      onChange={(e) => setCustomPeptide(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomPeptide();
                        }
                      }}
                      placeholder="e.g. a compound not in the list"
                      maxLength={120}
                    />
                    <Button type="button" variant="outline" onClick={addCustomPeptide}>
                      Add
                    </Button>
                  </div>
                  {customSelected.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customSelected.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium"
                        >
                          {name}
                          <button
                            type="button"
                            aria-label={`Remove ${name}`}
                            onClick={() => togglePeptide(name)}
                            className="text-muted-foreground transition hover:text-foreground"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>

                {selectedPeptides.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedPeptides.length} selected · added to your Peptides
                    section when you finish.
                  </p>
                )}
              </>
            )}
          </Screen>
        )}

        {step === 3 && (
          <Screen
            title="Anything we should work around?"
            subtitle="Optional. This helps the coach and workouts avoid movements that don't suit you."
          >
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              This is sensitive health information and is private to your account.
              Sharing it helps us tailor recommendations — you can skip it or
              update it anytime in Settings.
            </div>

            <Field label="Injuries or physical limitations">
              <div className="grid grid-cols-2 gap-2">
                {INJURY_FLAGS.map((flag) => {
                  const selected = injuryFlags.includes(flag);
                  return (
                    <button
                      key={flag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInjury(flag)}
                      className={
                        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition " +
                        (selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      }
                    >
                      <span>{INJURY_FLAG_LABELS[flag]}</span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Notes on injuries or limitations" hint="Optional.">
              <textarea
                className={textareaClass}
                rows={2}
                value={injuryNotes}
                onChange={(e) => setInjuryNotes(e.target.value)}
                placeholder="e.g. left knee — avoid deep squats"
                maxLength={1000}
              />
            </Field>

            <Field label="Relevant health conditions" hint="Optional — share only what you're comfortable with.">
              <textarea
                className={textareaClass}
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. type 2 diabetes, hypertension"
                maxLength={1000}
              />
            </Field>
          </Screen>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={back} disabled={submitting}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={next} disabled={submitting}>
          {submitting
            ? "Saving…"
            : step === TOTAL_STEPS - 1
            ? "Finish"
            : "Continue"}
          {!submitting && step < TOTAL_STEPS - 1 && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Skip straight to the dashboard — everything past Screen 1 is optional. */}
      {step > 0 && (
        <button
          type="button"
          onClick={finish}
          disabled={submitting}
          className="mt-4 text-center text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline disabled:opacity-50"
        >
          Skip for now — I&apos;ll finish this in Settings
        </button>
      )}
    </main>
  );
}

function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
