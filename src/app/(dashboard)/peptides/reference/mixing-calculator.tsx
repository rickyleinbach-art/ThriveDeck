"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  COMMON_VIAL_STRENGTHS,
  SYRINGE_SIZES_ML,
  VIAL_SIZES_ML,
  formatNumber,
  reconstitute,
  syringeLabel,
  type TargetUnit,
  type VialUnit,
} from "@/lib/peptides/reconstitution";

// Syringe diagram geometry, in the SVG's own viewBox units.
const BAR_X = 9;
const BAR_W = 582;

// Marks every 5 units, which is how insulin barrels are actually printed,
// across whatever the chosen barrel's ceiling is.
function ticksFor(maxUnits: number): number[] {
  const step = maxUnits <= 30 ? 2 : 5;
  const out: number[] = [];
  for (let u = 0; u <= maxUnits; u += step) out.push(u);
  return out;
}

function Readout({
  label,
  value,
  unit,
  lead = false,
}: {
  label: string;
  value: string;
  unit?: string;
  lead?: boolean;
}) {
  return (
    <div
      className={
        lead
          ? "rounded-xl border border-primary/40 bg-primary/10 p-3"
          : "rounded-xl border border-border bg-muted/40 p-3"
      }
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          lead
            ? "mt-1 text-xl font-semibold tabular-nums text-primary"
            : "mt-1 text-xl font-semibold tabular-nums"
        }
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// Converts what is printed on a vial into where a given amount lands on a
// U-100 syringe. It is a unit converter for figures the user types in — it
// never proposes an amount, and it is not connected to their logged peptides.
export function MixingCalculator() {
  const [vialStrength, setVialStrength] = useState("10");
  const [vialUnit, setVialUnit] = useState<VialUnit>("mg");
  const [solventMl, setSolventMl] = useState("2");
  const [targetAmount, setTargetAmount] = useState("500");
  const [targetUnit, setTargetUnit] = useState<TargetUnit>("mcg");
  const [vialSizeMl, setVialSizeMl] = useState("3");
  const [syringeSizeMl, setSyringeSizeMl] = useState("1");

  const result = useMemo(
    () =>
      reconstitute({
        vialStrength: parseFloat(vialStrength),
        vialUnit,
        solventMl: parseFloat(solventMl),
        targetAmount: parseFloat(targetAmount),
        targetUnit,
        vialSizeMl: parseFloat(vialSizeMl),
        syringeSizeMl: parseFloat(syringeSizeMl),
      }),
    [
      vialStrength,
      vialUnit,
      solventMl,
      targetAmount,
      targetUnit,
      vialSizeMl,
      syringeSizeMl,
    ]
  );

  const units = result.syringeUnits ?? 0;
  const maxUnits = result.syringeMaxUnits;
  const clamped = Math.max(0, Math.min(maxUnits, units));
  const markerX = BAR_X + (BAR_W * clamped) / maxUnits;
  const ticks = ticksFor(maxUnits);
  const majorEvery = maxUnits <= 30 ? 10 : maxUnits <= 50 ? 10 : 25;
  // Capacity is a harder failure than an awkward draw, so it wins the slot.
  const notice =
    result.capacityWarning ?? result.unitMismatch ?? result.warning;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Vial to syringe</h3>
        <p className="text-xs text-muted-foreground">
          Enter what is printed on your own vial
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="calc-strength"
            className="text-xs font-medium text-muted-foreground"
          >
            Vial strength
          </label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="calc-strength"
              type="number"
              min="0"
              step="any"
              value={vialStrength}
              onChange={(e) => setVialStrength(e.target.value)}
            />
            <Select
              aria-label="Vial strength unit"
              value={vialUnit}
              onChange={(e) => setVialUnit(e.target.value as VialUnit)}
              className="w-24"
            >
              <option value="mg">mg</option>
              <option value="iu">IU</option>
            </Select>
          </div>
          {vialUnit === "mg" && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_VIAL_STRENGTHS.map((s) => {
                const active = parseFloat(vialStrength) === s.mg;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setVialStrength(String(s.mg))}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition"
                        : "rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="calc-solvent"
            className="text-xs font-medium text-muted-foreground"
          >
            Solvent added
          </label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="calc-solvent"
              type="number"
              min="0"
              step="any"
              value={solventMl}
              onChange={(e) => setSolventMl(e.target.value)}
            />
            <Select aria-label="Solvent unit" disabled className="w-24">
              <option>mL</option>
            </Select>
          </div>
        </div>

        <div>
          <label
            htmlFor="calc-target"
            className="text-xs font-medium text-muted-foreground"
          >
            Target amount
          </label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="calc-target"
              type="number"
              min="0"
              step="any"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
            <Select
              aria-label="Target amount unit"
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="calc-vial-size"
            className="text-xs font-medium text-muted-foreground"
          >
            Vial size
          </label>
          <Select
            id="calc-vial-size"
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
            Checks the solvent actually fits.
          </p>
        </div>

        <div>
          <label
            htmlFor="calc-syringe-size"
            className="text-xs font-medium text-muted-foreground"
          >
            Injection syringe
          </label>
          <Select
            id="calc-syringe-size"
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
            Sets the scale on the barrel below.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Readout
          label="Concentration"
          value={
            result.concentration == null ? "—" : formatNumber(result.concentration)
          }
          unit={
            result.concentration == null
              ? undefined
              : `${vialUnit === "iu" ? "IU" : "mg"}/mL`
          }
        />
        <Readout
          label="Per syringe unit"
          value={result.perUnit == null ? "—" : formatNumber(result.perUnit, 1)}
          unit={result.perUnit == null ? undefined : result.perUnitLabel}
        />
        <Readout
          lead
          label="Draw to"
          value={
            result.syringeUnits == null ? "—" : formatNumber(result.syringeUnits, 1)
          }
          unit={result.syringeUnits == null ? undefined : "units"}
        />
        <Readout
          label="Draw volume"
          value={result.doseMl == null ? "—" : formatNumber(result.doseMl, 3)}
          unit={result.doseMl == null ? undefined : "mL"}
        />
        <Readout
          label="Doses per vial"
          value={
            result.dosesPerVial == null ? "—" : formatNumber(result.dosesPerVial, 0)
          }
        />
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Where that lands on a {syringeSizeMl} mL syringe
        </div>
        <svg
          viewBox="0 0 600 74"
          role="img"
          aria-label={
            result.syringeUnits == null
              ? `Insulin syringe diagram, ${maxUnits} unit barrel, no amount marked`
              : `Insulin syringe diagram, ${maxUnits} unit barrel, marked at ${formatNumber(
                  units,
                  1
                )} units`
          }
          className="mt-2 w-full"
        >
          <rect
            x={BAR_X - 1}
            y="20"
            width={BAR_W + 2}
            height="24"
            rx="3"
            className="fill-muted stroke-border"
          />
          {result.syringeUnits != null && (
            <rect
              x={BAR_X}
              y="21"
              width={Math.max(0, markerX - BAR_X)}
              height="22"
              rx="2"
              className="fill-primary/25"
            />
          )}
          <g>
            {ticks.map((u) => {
              const x = BAR_X + (BAR_W * u) / maxUnits;
              const major = u % majorEvery === 0;
              return (
                <g key={u}>
                  <line
                    x1={x}
                    y1={major ? 24 : 30}
                    x2={x}
                    y2="38"
                    strokeWidth="1"
                    className="stroke-border"
                  />
                  {major && (
                    <text
                      x={x}
                      y="58"
                      textAnchor="middle"
                      fontSize="10"
                      className="fill-muted-foreground"
                    >
                      {u}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          {result.syringeUnits != null && (
            <g>
              <line
                x1={markerX}
                y1="14"
                x2={markerX}
                y2="50"
                strokeWidth="2"
                className="stroke-primary"
              />
              <circle cx={markerX} cy="14" r="3.4" className="fill-primary" />
              <text
                x={Math.max(20, Math.min(580, markerX))}
                y="8"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                className="fill-primary"
              >
                {formatNumber(units, 1)}u
              </text>
            </g>
          )}
        </svg>
      </div>

      {notice && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </p>
      )}
    </div>
  );
}
