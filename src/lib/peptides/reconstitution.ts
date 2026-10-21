// Reconstitution arithmetic for the peptide reference library.
//
// SAFETY (CLAUDE.md § Health & safety): this is unit conversion, not advice.
// It answers "the numbers I typed work out to N syringe units" — it never
// proposes a strength, a solvent volume, or a dose, and it is never seeded
// from a user's own logged peptides.

/** What the vial is measured in. IU never converts to mg by any general rule. */
export type VialUnit = "mg" | "iu";

export type TargetUnit = "mcg" | "mg" | "iu";

export const VIAL_UNIT_LABELS: Record<VialUnit, string> = {
  mg: "mg",
  iu: "IU",
};

export const TARGET_UNIT_LABELS: Record<TargetUnit, string> = {
  mcg: "mcg",
  mg: "mg",
  iu: "IU",
};

export interface ReconstitutionInput {
  vialStrength: number;
  vialUnit: VialUnit;
  solventMl: number;
  targetAmount: number;
  targetUnit: TargetUnit;
  /** Capacity of the vial being mixed into. Omitted means "don't check". */
  vialSizeMl?: number;
  /** Barrel size of the syringe the dose is drawn with. Defaults to 1 mL. */
  syringeSizeMl?: number;
}

// Vial sizes peptides are commonly supplied in.
export const VIAL_SIZES_ML = [3, 5, 10] as const;

// Insulin syringes share the same 0.01 mL mark; only the barrel length (and so
// the highest number on it) differs, which is why `syringeUnits` stays on one
// scale and only the ceiling moves.
export const SYRINGE_SIZES_ML = [0.3, 0.5, 1] as const;

export function syringeLabel(ml: number): string {
  return `${ml} mL (${Math.round(ml * UNITS_PER_ML)} units)`;
}

// Strengths printed on most vials, offered as one-tap fills. Values are in mg
// because that is the unit the vial field uses; sub-milligram vials are labelled
// in mcg because that is how they are printed.
export const COMMON_VIAL_STRENGTHS: { label: string; mg: number }[] = [
  { label: "250 mcg", mg: 0.25 },
  { label: "500 mcg", mg: 0.5 },
  { label: "2 mg", mg: 2 },
  { label: "5 mg", mg: 5 },
  { label: "10 mg", mg: 10 },
  { label: "15 mg", mg: 15 },
  { label: "20 mg", mg: 20 },
  { label: "30 mg", mg: 30 },
];

export interface ReconstitutionResult {
  /** Vial units per mL, or null when the inputs aren't usable yet. */
  concentration: number | null;
  /** Amount held in one syringe unit (0.01 mL), in `perUnitLabel`. */
  perUnit: number | null;
  perUnitLabel: "mcg" | "IU";
  /** Where the target lands on the syringe, in 0.01 mL marks, or null. */
  syringeUnits: number | null;
  /** Highest mark on the chosen syringe. */
  syringeMaxUnits: number;
  /** Volume of one dose in mL, or null. */
  doseMl: number | null;
  dosesPerVial: number | null;
  /** Set when the solvent will not fit the vial being mixed into. */
  capacityWarning: string | null;
  /** Set when the target unit can't be reconciled with the vial unit. */
  unitMismatch: string | null;
  /** Set when the result is technically valid but awkward to draw. */
  warning: string | null;
}

// A U-100 insulin syringe is a 1 mL barrel marked 0–100, so one mark is
// 0.01 mL of whatever is in it.
export const UNITS_PER_ML = 100;
export const SYRINGE_MAX_UNITS = 100;

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

export function reconstitute(input: ReconstitutionInput): ReconstitutionResult {
  const { vialStrength, vialUnit, solventMl, targetAmount, targetUnit } = input;
  const perUnitLabel = vialUnit === "iu" ? "IU" : "mcg";

  const syringeMaxUnits = Math.round(
    (input.syringeSizeMl ?? 1) * UNITS_PER_ML
  );

  // The powder itself displaces a negligible volume, so the usable capacity is
  // effectively the vial's rated size.
  const capacityWarning =
    input.vialSizeMl && solventMl > input.vialSizeMl
      ? `${formatNumber(solventMl, 2)} mL will not fit a ${formatNumber(
          input.vialSizeMl,
          0
        )} mL vial. Use a larger vial, or less solvent for a more concentrated mix.`
      : null;

  const empty: ReconstitutionResult = {
    concentration: null,
    perUnit: null,
    perUnitLabel,
    syringeUnits: null,
    syringeMaxUnits,
    doseMl: null,
    dosesPerVial: null,
    capacityWarning,
    unitMismatch: null,
    warning: null,
  };

  if (!(vialStrength > 0) || !(solventMl > 0)) return empty;

  const concentration = vialStrength / solventMl;
  // Per syringe unit, i.e. per 0.01 mL. mg vials are reported in mcg because
  // that's the scale the doses themselves live on.
  const perUnitRaw = concentration / UNITS_PER_ML;
  const perUnit = vialUnit === "iu" ? perUnitRaw : perUnitRaw * 1000;

  const base = { ...empty, concentration, perUnit };

  // Normalise the target into the vial's own unit. IU measures biological
  // activity rather than mass, so there is no cross-conversion to offer.
  let targetInVialUnit = Number.NaN;
  if (vialUnit === "iu") {
    if (targetUnit === "iu") targetInVialUnit = targetAmount;
  } else if (targetUnit === "mg") {
    targetInVialUnit = targetAmount;
  } else if (targetUnit === "mcg") {
    targetInVialUnit = targetAmount / 1000;
  }

  if (!(targetInVialUnit > 0)) {
    return {
      ...base,
      unitMismatch:
        vialUnit === "iu"
          ? "This vial is measured in IU, so set the target amount to IU as well."
          : "This vial is measured in mg, so set the target amount to mg or mcg.",
    };
  }

  const syringeUnits = targetInVialUnit / (concentration / UNITS_PER_ML);
  const dosesPerVial = Math.floor(vialStrength / targetInVialUnit);

  let warning: string | null = null;
  if (syringeUnits > syringeMaxUnits) {
    warning = `That amount is ${formatNumber(
      syringeUnits,
      1
    )} units, past the ${syringeMaxUnits}-unit mark on this syringe. Less solvent gives a more concentrated mix, or it takes more than one draw.`;
  } else if (syringeUnits < 2) {
    warning = `At ${formatNumber(
      syringeUnits,
      1
    )} units this sits at the very bottom of the syringe, where small errors matter a lot. More solvent would spread it over a wider, easier-to-read volume.`;
  }

  return {
    ...base,
    syringeUnits,
    doseMl: syringeUnits / UNITS_PER_ML,
    dosesPerVial: Number.isFinite(dosesPerVial) ? dosesPerVial : null,
    warning,
  };
}

// ---------------------------------------------------------------------------
// Blends
//
// A blended vial holds two or three peptides in one powder, and the label's
// total mass hides the split: "10 mg" might be 5 mg + 5 mg or 8 mg + 2 mg,
// which deliver very different amounts per draw. Components share one solvent
// volume, so each one's concentration is its own mass over that volume, and a
// single draw delivers all of them at once in fixed proportion.
//
// The question a blend actually poses is the reverse of a single vial: you pick
// where to draw to, and you need to know what that gives you of each.

export interface BlendComponent {
  name: string;
  mg: number;
}

export interface BlendInput {
  components: BlendComponent[];
  solventMl: number;
  drawUnits: number;
  vialSizeMl?: number;
  syringeSizeMl?: number;
}

export interface BlendComponentResult {
  name: string;
  mg: number;
  /** mg per mL of the finished solution. */
  concentration: number;
  /** mcg held in one syringe unit (0.01 mL). */
  mcgPerUnit: number;
  /** mcg delivered at the chosen draw. */
  mcgAtDraw: number;
  /** Share of the vial's total mass, 0–1. */
  share: number;
}

export interface BlendResult {
  totalMg: number;
  components: BlendComponentResult[];
  syringeMaxUnits: number;
  /** Volume of the chosen draw, in mL. */
  drawMl: number | null;
  capacityWarning: string | null;
  warning: string | null;
}

export function reconstituteBlend(input: BlendInput): BlendResult {
  const { components, solventMl, drawUnits } = input;
  const syringeMaxUnits = Math.round(
    (input.syringeSizeMl ?? 1) * UNITS_PER_ML
  );

  const usable = components.filter((c) => c.mg > 0);
  const totalMg = usable.reduce((sum, c) => sum + c.mg, 0);

  const capacityWarning =
    input.vialSizeMl && solventMl > input.vialSizeMl
      ? `${formatNumber(solventMl, 2)} mL will not fit a ${formatNumber(
          input.vialSizeMl,
          0
        )} mL vial. Use a larger vial, or less solvent for a more concentrated mix.`
      : null;

  const empty: BlendResult = {
    totalMg,
    components: [],
    syringeMaxUnits,
    drawMl: null,
    capacityWarning,
    warning: null,
  };

  if (!(totalMg > 0) || !(solventMl > 0)) return empty;

  const draw = drawUnits > 0 ? drawUnits : 0;

  const resolved: BlendComponentResult[] = usable.map((c) => {
    const concentration = c.mg / solventMl;
    const mcgPerUnit = (concentration / UNITS_PER_ML) * 1000;
    return {
      name: c.name,
      mg: c.mg,
      concentration,
      mcgPerUnit,
      mcgAtDraw: mcgPerUnit * draw,
      share: c.mg / totalMg,
    };
  });

  let warning: string | null = null;
  if (draw > syringeMaxUnits) {
    warning = `A ${formatNumber(
      draw,
      1
    )} unit draw is past the ${syringeMaxUnits}-unit mark on this syringe.`;
  } else if (draw > 0 && draw < 2) {
    warning =
      "Under 2 units sits at the very bottom of the barrel, where a small misread changes every component at once.";
  }

  return {
    ...empty,
    components: resolved,
    drawMl: draw / UNITS_PER_ML,
    warning,
  };
}
