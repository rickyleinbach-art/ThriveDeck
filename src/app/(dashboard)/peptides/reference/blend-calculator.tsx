"use client";

import { useMemo, useState } from "react";
import { Info, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import {
  SYRINGE_SIZES_ML,
  VIAL_SIZES_ML,
  formatNumber,
  reconstituteBlend,
  syringeLabel,
} from "@/lib/peptides/reconstitution";

const BAR_X = 9;
const BAR_W = 582;

type Row = { id: number; name: string; mg: string };

let nextId = 3;

// A blended vial's label gives one total mass, which hides what each draw
// actually delivers of each component. This splits that out: set the masses
// that went into the vial, pick where you draw to, and read off what that
// gives you of each.
export function BlendCalculator() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: "CJC-1295", mg: "5" },
    { id: 2, name: "Ipamorelin", mg: "5" },
  ]);
  const [solventMl, setSolventMl] = useState("2");
  const [vialSizeMl, setVialSizeMl] = useState("3");
  const [syringeSizeMl, setSyringeSizeMl] = useState("1");
  const [drawUnits, setDrawUnits] = useState("20");

  const result = useMemo(
    () =>
      reconstituteBlend({
        components: rows.map((r) => ({
          name: r.name.trim() || "Component",
          mg: parseFloat(r.mg),
        })),
        solventMl: parseFloat(solventMl),
        drawUnits: parseFloat(drawUnits),
        vialSizeMl: parseFloat(vialSizeMl),
        syringeSizeMl: parseFloat(syringeSizeMl),
      }),
    [rows, solventMl, drawUnits, vialSizeMl, syringeSizeMl]
  );

  const maxUnits = result.syringeMaxUnits;
  const draw = parseFloat(drawUnits);
  const clamped = Math.max(0, Math.min(maxUnits, Number.isFinite(draw) ? draw : 0));
  const markerX = BAR_X + (BAR_W * clamped) / maxUnits;
  const notice = result.capacityWarning ?? result.warning;

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Blended vial</h3>
        <p className="text-xs text-muted-foreground">
          One draw delivers every component at once
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row, i) => (
          <div key={row.id} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              {i === 0 && (
                <label className="text-xs font-medium text-muted-foreground">
                  Component
                </label>
              )}
              <Input
                aria-label={`Component ${i + 1} name`}
                value={row.name}
                onChange={(e) => update(row.id, { name: e.target.value })}
                className={i === 0 ? "mt-1.5" : undefined}
              />
            </div>
            <div className="w-28">
              {i === 0 && (
                <label className="text-xs font-medium text-muted-foreground">
                  mg in vial
                </label>
              )}
              <Input
                aria-label={`Component ${i + 1} milligrams`}
                type="number"
                min="0"
                step="any"
                value={row.mg}
                onChange={(e) => update(row.id, { mg: e.target.value })}
                className={i === 0 ? "mt-1.5" : undefined}
              />
            </div>
            <button
              type="button"
              aria-label={`Remove ${row.name || `component ${i + 1}`}`}
              disabled={rows.length <= 1}
              onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
              className="mb-0.5 rounded-lg border border-border p-2.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Icon icon={X} size="sm" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setRows((rs) => [...rs, { id: nextId++, name: "", mg: "" }])
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
        >
          <Icon icon={Plus} size="sm" />
          Add component
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div>
          <label
            htmlFor="blend-solvent"
            className="text-xs font-medium text-muted-foreground"
          >
            Solvent added
          </label>
          <Input
            id="blend-solvent"
            type="number"
            min="0"
            step="any"
            value={solventMl}
            onChange={(e) => setSolventMl(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <label
            htmlFor="blend-vial"
            className="text-xs font-medium text-muted-foreground"
          >
            Vial size
          </label>
          <Select
            id="blend-vial"
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
        </div>
        <div>
          <label
            htmlFor="blend-syringe"
            className="text-xs font-medium text-muted-foreground"
          >
            Injection syringe
          </label>
          <Select
            id="blend-syringe"
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
        </div>
        <div>
          <label
            htmlFor="blend-draw"
            className="text-xs font-medium text-muted-foreground"
          >
            Draw to
          </label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="blend-draw"
              type="number"
              min="0"
              step="any"
              value={drawUnits}
              onChange={(e) => setDrawUnits(e.target.value)}
            />
            <Select aria-label="Draw unit" disabled className="w-24">
              <option>units</option>
            </Select>
          </div>
        </div>
      </div>

      {result.components.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">Component</th>
                <th className="pb-2 text-right font-medium">Share</th>
                <th className="pb-2 text-right font-medium">Concentration</th>
                <th className="pb-2 text-right font-medium">Per unit</th>
                <th className="pb-2 text-right font-medium">
                  At {formatNumber(clamped, 1)}u
                </th>
              </tr>
            </thead>
            <tbody>
              {result.components.map((c) => (
                <tr key={c.name} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 font-medium">{c.name}</td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(c.share * 100, 0)}%
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(c.concentration)} mg/mL
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(c.mcgPerUnit, 1)} mcg
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-primary">
                    {formatNumber(c.mcgAtDraw, 1)} mcg
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-[11px] text-muted-foreground">
                <td className="pt-2">
                  {formatNumber(result.totalMg)} mg total in the vial
                </td>
                <td colSpan={4} className="pt-2 text-right">
                  {result.drawMl == null
                    ? null
                    : `${formatNumber(result.drawMl, 3)} mL per draw`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Where that lands on a {syringeSizeMl} mL syringe
        </div>
        <svg
          viewBox="0 0 600 54"
          role="img"
          aria-label={`Insulin syringe diagram, ${maxUnits} unit barrel, marked at ${formatNumber(
            clamped,
            1
          )} units`}
          className="mt-2 w-full"
        >
          <rect
            x={BAR_X - 1}
            y="12"
            width={BAR_W + 2}
            height="24"
            rx="3"
            className="fill-muted stroke-border"
          />
          <rect
            x={BAR_X}
            y="13"
            width={Math.max(0, markerX - BAR_X)}
            height="22"
            rx="2"
            className="fill-primary/25"
          />
          <line
            x1={markerX}
            y1="8"
            x2={markerX}
            y2="42"
            strokeWidth="2"
            className="stroke-primary"
          />
          <text
            x={Math.max(20, Math.min(580, markerX))}
            y="52"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            className="fill-primary"
          >
            {formatNumber(clamped, 1)}u
          </text>
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
