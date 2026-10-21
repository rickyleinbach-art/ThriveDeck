"use client";

import { useMemo, useState } from "react";
import { Check, Info, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import {
  PEPTIDE_REFERENCE,
  type PeptideReference,
} from "@/lib/peptides/reference";
import {
  SYRINGE_SIZES_ML,
  VIAL_SIZES_ML,
  formatNumber,
  reconstitute,
  suggestSolventVolumes,
  syringeLabel,
  TARGET_UNIT_LABELS,
  type TargetUnit,
  type VialUnit,
} from "@/lib/peptides/reconstitution";
import { TierBadge } from "./tier-badge";

const COMPOUNDS = PEPTIDE_REFERENCE.filter((c) => c.category !== "solvent");
const BY_SLUG = new Map(COMPOUNDS.map((c) => [c.slug, c]));

// "5 mg" → { amount: 5, unit: "mg" }; "12 IU (4 mg)" → { amount: 12, unit: "iu" }.
function parseVial(label: string): { amount: number; unit: VialUnit } | null {
  const m = label.match(/(\d+(?:\.\d+)?)\s*(mg|iu)/i);
  if (!m) return null;
  return { amount: parseFloat(m[1]), unit: m[2].toLowerCase() as VialUnit };
}

// Pulls the figures out of a documented-dose sentence so they can be offered
// as one-tap options. "0.25 mg weekly for 4 weeks, then 0.5 → 1 → 1.7 → 2.4 mg"
// yields 0.25, 0.5, 1, 1.7 and 2.4 mg: a bare number in a → chain takes the
// unit that closes the chain. Per-kilogram figures are skipped — "10 mcg/kg"
// is not a dose until it is multiplied by a body weight.
function parseDoseFigures(
  text: string
): { amount: number; unit: TargetUnit }[] {
  const out: { amount: number; unit: TargetUnit }[] = [];
  const re = /(\d+(?:\.\d+)?)(\s*(?:→|-|–|to)\s*\d+(?:\.\d+)?)*\s*(mg|mcg|iu)(\/kg)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[4]) continue;
    const unit = m[3].toLowerCase() as TargetUnit;
    const nums = m[0].match(/\d+(?:\.\d+)?/g) ?? [];
    for (const n of nums) {
      const amount = parseFloat(n);
      if (amount > 0 && !out.some((o) => o.amount === amount && o.unit === unit)) {
        out.push({ amount, unit });
      }
    }
  }
  return out.slice(0, 8);
}

function StepHeading({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          done
            ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground"
        }
      >
        {done ? <Icon icon={Check} size="sm" /> : n}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition"
          : "rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
      }
    >
      {children}
    </button>
  );
}

// Pick the compound, confirm the vial, say the dose, get a recipe. Every step
// after the first is seeded from the library entry — solvent, the vial sizes
// it is sold in, the documented dose — so the only thing typed is the dose,
// and that is offered as the figures from the published schedule.
export function ReconGuide({
  initialSlug = null,
}: {
  /** Pre-select a compound, e.g. arriving from a library entry. */
  initialSlug?: string | null;
}) {
  // Seed state the same way pick() would, so a deep link lands on step 2
  // with the vial already filled in rather than on an empty step 1.
  const initial = initialSlug ? BY_SLUG.get(initialSlug) ?? null : null;
  const initialVial = initial?.mixes?.[0] ? parseVial(initial.mixes[0].vial) : null;

  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState<string | null>(initial?.slug ?? null);
  const [vialStrength, setVialStrength] = useState(
    initialVial ? String(initialVial.amount) : ""
  );
  const [vialUnit, setVialUnit] = useState<VialUnit>(initialVial?.unit ?? "mg");
  const [vialSizeMl, setVialSizeMl] = useState("3");
  const [syringeSizeMl, setSyringeSizeMl] = useState("1");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetUnit, setTargetUnit] = useState<TargetUnit>(
    initialVial?.unit === "iu" ? "iu" : "mcg"
  );

  const compound = slug ? BY_SLUG.get(slug) ?? null : null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COMPOUNDS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.aka.toLowerCase().includes(q) ||
        c.slug.includes(q.replace(/\s+/g, "-"))
    ).slice(0, 8);
  }, [query]);

  const vialOptions = useMemo(() => {
    if (!compound?.mixes) return [];
    const seen = new Set<string>();
    return compound.mixes
      .map((m) => ({ label: m.vial, parsed: parseVial(m.vial) }))
      .filter((v) => v.parsed && !seen.has(v.label) && seen.add(v.label));
  }, [compound]);

  const doseOptions = useMemo(
    () => (compound ? parseDoseFigures(compound.documentedDose) : []),
    [compound]
  );

  const pick = (c: PeptideReference) => {
    setSlug(c.slug);
    setQuery("");
    const first = c.mixes?.[0] ? parseVial(c.mixes[0].vial) : null;
    const unit: VialUnit = first?.unit ?? "mg";
    setVialUnit(unit);
    setVialStrength(first ? String(first.amount) : "");
    setTargetUnit(unit === "iu" ? "iu" : "mcg");
    setTargetAmount("");
    if (c.mixes?.[0]?.ml && c.mixes[0].ml > 3) setVialSizeMl("5");
  };

  const reset = () => {
    setSlug(null);
    setQuery("");
    setVialStrength("");
    setTargetAmount("");
  };

  const strengthNum = parseFloat(vialStrength);
  const doseNum = parseFloat(targetAmount);
  const haveVial = strengthNum > 0;
  const haveDose = doseNum > 0;
  const injectable = !!compound?.mixes?.length;

  const solve = useMemo(
    () =>
      haveVial && haveDose
        ? suggestSolventVolumes({
            vialStrength: strengthNum,
            vialUnit,
            targetAmount: doseNum,
            targetUnit,
            vialSizeMl: parseFloat(vialSizeMl),
            syringeSizeMl: parseFloat(syringeSizeMl),
          })
        : null,
    [haveVial, haveDose, strengthNum, vialUnit, doseNum, targetUnit, vialSizeMl, syringeSizeMl]
  );

  const best = solve?.suggestions[0] ?? null;
  const recipe = useMemo(
    () =>
      best
        ? reconstitute({
            vialStrength: strengthNum,
            vialUnit,
            solventMl: best.solventMl,
            targetAmount: doseNum,
            targetUnit,
            vialSizeMl: parseFloat(vialSizeMl),
            syringeSizeMl: parseFloat(syringeSizeMl),
          })
        : null,
    [best, strengthNum, vialUnit, doseNum, targetUnit, vialSizeMl, syringeSizeMl]
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* 1 — compound */}
      <StepHeading n={1} title="Which peptide?" done={!!compound} />
      {compound ? (
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{compound.name}</span>
              <TierBadge tier={compound.tier} />
            </div>
            {compound.aka && (
              <div className="text-xs text-muted-foreground">{compound.aka}</div>
            )}
            <p className="mt-2 max-w-prose text-sm text-foreground/90">
              {compound.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <Icon icon={X} size="sm" />
            Change
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="relative">
            <Icon
              icon={Search}
              size="sm"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search peptides"
              placeholder="Type a name or brand — semaglutide, BPC-157, Trulicity…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {matches.length > 0 && (
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {matches.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{c.name}</span>
                      {c.aka && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {c.aka}
                        </span>
                      )}
                    </span>
                    <TierBadge tier={c.tier} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && matches.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing in the library matches that.
            </p>
          )}
        </div>
      )}

      {compound && !injectable && (
        <div className="mt-5 flex gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="max-w-prose">
            <p className="font-medium">This one is not reconstituted.</p>
            <p className="mt-1 text-foreground/90">
              Route: {compound.route ?? "see entry"}. {compound.storageDry}
            </p>
            <p className="mt-2 text-muted-foreground">
              Documented dose: {compound.documentedDose}
            </p>
          </div>
        </div>
      )}

      {compound && injectable && (
        <>
          {/* 2 — vial */}
          <div className="mt-6">
            <StepHeading n={2} title="What is on your vial?" done={haveVial} />
            <p className="mt-1 pl-10 text-xs text-muted-foreground">
              Sizes {compound.name} is commonly sold in. Pick yours or type it.
            </p>
            <div className="mt-3 pl-10">
              {vialOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {vialOptions.map((v) => (
                    <Chip
                      key={v.label}
                      active={
                        strengthNum === v.parsed!.amount && vialUnit === v.parsed!.unit
                      }
                      onClick={() => {
                        setVialStrength(String(v.parsed!.amount));
                        setVialUnit(v.parsed!.unit);
                        setTargetUnit(v.parsed!.unit === "iu" ? "iu" : "mcg");
                      }}
                    >
                      {v.label}
                    </Chip>
                  ))}
                </div>
              )}
              <div className="mt-3 flex max-w-xs gap-2">
                <Input
                  aria-label="Vial strength"
                  type="number"
                  min="0"
                  step="any"
                  value={vialStrength}
                  onChange={(e) => setVialStrength(e.target.value)}
                />
                <Select
                  aria-label="Vial strength unit"
                  value={vialUnit}
                  onChange={(e) => {
                    const u = e.target.value as VialUnit;
                    setVialUnit(u);
                    setTargetUnit(u === "iu" ? "iu" : "mcg");
                  }}
                  className="w-24"
                >
                  <option value="mg">mg</option>
                  <option value="iu">IU</option>
                </Select>
              </div>
            </div>
          </div>

          {/* 3 — supplies */}
          <div className="mt-6">
            <StepHeading n={3} title="What are you using?" done={haveVial} />
            <div className="mt-3 grid gap-4 pl-10 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="guide-vial-size"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Vial size
                </label>
                <Select
                  id="guide-vial-size"
                  value={vialSizeMl}
                  onChange={(e) => setVialSizeMl(e.target.value)}
                  className="mt-1.5"
                >
                  {VIAL_SIZES_ML.map((ml) => (
                    <option key={ml} value={ml}>
                      {ml} mL
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The glass vial the powder came in. 3 mL is the usual.
                </p>
              </div>
              <div>
                <label
                  htmlFor="guide-syringe"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Injection syringe
                </label>
                <Select
                  id="guide-syringe"
                  value={syringeSizeMl}
                  onChange={(e) => setSyringeSizeMl(e.target.value)}
                  className="mt-1.5"
                >
                  {SYRINGE_SIZES_ML.map((ml) => (
                    <option key={ml} value={ml}>
                      {syringeLabel(ml)}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The insulin syringe you will draw doses with. 1 mL if unsure.
                </p>
              </div>
            </div>
            <p className="mt-3 pl-10 text-sm text-muted-foreground">
              Solvent: <span className="text-foreground/90">{compound.solvent ?? "Bacteriostatic water"}</span>
            </p>
          </div>

          {/* 4 — dose */}
          <div className="mt-6">
            <StepHeading n={4} title="How much per dose?" done={haveDose} />
            <div className="mt-3 pl-10">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Documented dose
                  </span>
                  <TierBadge tier={compound.tier} source />
                </div>
                <p className="mt-1.5 text-foreground/90">{compound.documentedDose}</p>
                {compound.doseNote && (
                  <p className="mt-1 text-muted-foreground">{compound.doseNote}</p>
                )}
                {compound.frequency && (
                  <p className="mt-1 text-muted-foreground">
                    Frequency: {compound.frequency}
                  </p>
                )}
              </div>
              {doseOptions.length > 0 && (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Figures from that schedule — pick the step you are on:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doseOptions.map((d) => (
                      <Chip
                        key={`${d.amount}${d.unit}`}
                        active={doseNum === d.amount && targetUnit === d.unit}
                        onClick={() => {
                          setTargetAmount(String(d.amount));
                          setTargetUnit(d.unit);
                        }}
                      >
                        {formatNumber(d.amount, 3)} {TARGET_UNIT_LABELS[d.unit]}
                      </Chip>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-3 flex max-w-xs gap-2">
                <Input
                  aria-label="Dose amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="or type a dose"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
                <Select
                  aria-label="Dose unit"
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value as TargetUnit)}
                  className="w-24"
                >
                  <option value="mcg">mcg</option>
                  <option value="mg">mg</option>
                  <option value="iu">IU</option>
                </Select>
              </div>
            </div>
          </div>

          {/* 5 — recipe */}
          <div className="mt-6">
            <StepHeading n={5} title="Your recipe" done={!!best} />
            <div className="mt-3 pl-10">
              {!haveVial || !haveDose ? (
                <p className="text-sm text-muted-foreground">
                  Finish the steps above and the recipe appears here.
                </p>
              ) : solve?.problem ? (
                <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{solve.problem}</span>
                </p>
              ) : best && recipe ? (
                <div className="space-y-3">
                  <ol className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm">
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary">1.</span>
                      <span>
                        Add{" "}
                        <span className="font-semibold tabular-nums text-primary">
                          {formatNumber(best.solventMl, 2)} mL
                        </span>{" "}
                        of {compound.solvent ?? "bacteriostatic water"} to the{" "}
                        {formatNumber(strengthNum)} {vialUnit === "iu" ? "IU" : "mg"} vial.
                        Run it down the glass, do not squirt it onto the powder, and
                        swirl — never shake.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary">2.</span>
                      <span>
                        That gives {formatNumber(recipe.concentration ?? 0)}{" "}
                        {vialUnit === "iu" ? "IU" : "mg"}/mL —{" "}
                        {formatNumber(recipe.perUnit ?? 0, 1)} {recipe.perUnitLabel} in
                        every syringe unit.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary">3.</span>
                      <span>
                        For {formatNumber(doseNum, 3)} {TARGET_UNIT_LABELS[targetUnit]},
                        draw to{" "}
                        <span className="font-semibold tabular-nums text-primary">
                          {formatNumber(best.syringeUnits, best.exact ? 0 : 1)} units
                        </span>{" "}
                        on the {syringeSizeMl} mL syringe
                        {recipe.doseMl != null && ` (${formatNumber(recipe.doseMl, 3)} mL)`}.
                      </span>
                    </li>
                    {recipe.dosesPerVial != null && (
                      <li className="flex gap-3">
                        <span className="font-semibold text-primary">4.</span>
                        <span>
                          The vial holds{" "}
                          <span className="font-semibold tabular-nums">
                            {formatNumber(recipe.dosesPerVial, 0)} doses
                          </span>
                          {compound.frequency && ` at ${compound.frequency.toLowerCase()}`}.
                          {compound.storageMixed && ` Once mixed: ${compound.storageMixed}`}
                        </span>
                      </li>
                    )}
                  </ol>

                  {solve && solve.suggestions.length > 1 && (
                    <div className="text-xs text-muted-foreground">
                      Also works:{" "}
                      {solve.suggestions.slice(1).map((s, i) => (
                        <span key={s.solventMl}>
                          {i > 0 && " · "}
                          <span className="tabular-nums text-foreground/90">
                            {formatNumber(s.solventMl, 2)} mL → {formatNumber(s.syringeUnits, s.exact ? 0 : 1)} units
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {recipe.warning && (
                    <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{recipe.warning}</span>
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
