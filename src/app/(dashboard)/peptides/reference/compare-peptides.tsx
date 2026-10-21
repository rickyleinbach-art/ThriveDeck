"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import {
  PEPTIDE_REFERENCE,
  REFERENCE_SECTIONS,
  type PeptideReference,
} from "@/lib/peptides/reference";
import { TierBadge } from "./tier-badge";

const SLOTS = 3;

// Solvents are not compounds and would only confuse a side-by-side.
const COMPOUNDS = PEPTIDE_REFERENCE.filter((c) => c.category !== "solvent");
const BY_SLUG = new Map(COMPOUNDS.map((c) => [c.slug, c]));
const CATEGORY_TITLE = new Map(REFERENCE_SECTIONS.map((s) => [s.id, s.title]));

// One row of the comparison. `render` returns null to leave a cell blank.
const ROWS: { label: string; render: (c: PeptideReference) => React.ReactNode }[] =
  [
    { label: "Evidence", render: (c) => <TierBadge tier={c.tier} /> },
    {
      label: "Category",
      render: (c) => CATEGORY_TITLE.get(c.category as never) ?? c.category,
    },
    { label: "Studied for", render: (c) => c.studiedFor },
    { label: "Frequency", render: (c) => c.frequency ?? null },
    { label: "Route", render: (c) => c.route ?? null },
    { label: "Half-life", render: (c) => c.halfLife ?? null },
    {
      label: "Documented dose",
      render: (c) => (
        <>
          <TierBadge tier={c.tier} source className="mb-1.5" />
          <div>{c.documentedDose}</div>
        </>
      ),
    },
    { label: "Solvent", render: (c) => c.solvent ?? null },
    { label: "Once mixed", render: (c) => c.storageMixed ?? null },
    { label: "Worth knowing", render: (c) => c.worthKnowing },
  ];

// Pick up to three compounds and read them across one table. The point is
// the rows you would otherwise scroll between: evidence tier, dosing source,
// half-life, and the worth-knowing line.
export function ComparePeptides() {
  const [slugs, setSlugs] = useState<(string | null)[]>([null, null, null]);

  const picked = useMemo(
    () => slugs.map((s) => (s ? BY_SLUG.get(s) ?? null : null)),
    [slugs]
  );
  const any = picked.some(Boolean);

  const setSlot = (i: number, value: string | null) =>
    setSlugs((prev) => prev.map((s, j) => (j === i ? value : s)));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: SLOTS }, (_, i) => (
          <div key={i}>
            <label
              htmlFor={`compare-${i}`}
              className="text-xs font-medium text-muted-foreground"
            >
              Compound {i + 1}
            </label>
            <div className="mt-1.5 flex gap-1.5">
              <Select
                id={`compare-${i}`}
                value={slugs[i] ?? ""}
                onChange={(e) => setSlot(i, e.target.value || null)}
                className="min-w-0 flex-1"
              >
                <option value="">Choose…</option>
                {COMPOUNDS.map((c) => (
                  <option
                    key={c.slug}
                    value={c.slug}
                    // The same compound in two columns is a wasted column.
                    disabled={slugs.includes(c.slug) && slugs[i] !== c.slug}
                  >
                    {c.name}
                  </option>
                ))}
              </Select>
              {slugs[i] && (
                <button
                  type="button"
                  aria-label={`Clear compound ${i + 1}`}
                  onClick={() => setSlot(i, null)}
                  className="rounded-lg border border-border px-2.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon icon={X} size="sm" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!any ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Pick at least one compound to start.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "40rem" }}>
            <thead>
              <tr className="border-b border-border">
                <th className="w-36 pb-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground" />
                {picked.map((c, i) =>
                  c ? (
                    <th key={c.slug} className="pb-3 pr-4 text-left align-bottom">
                      <div className="font-semibold">{c.name}</div>
                      {c.aka && (
                        <div className="text-xs font-normal text-muted-foreground">
                          {c.aka}
                        </div>
                      )}
                    </th>
                  ) : (
                    <th key={`empty-${i}`} />
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border/60 align-top last:border-0"
                >
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {row.label}
                  </th>
                  {picked.map((c, i) => (
                    <td
                      key={c ? c.slug : `empty-${i}`}
                      className="py-3 pr-4 leading-relaxed text-foreground/90"
                    >
                      {c ? (row.render(c) ?? <span className="text-muted-foreground">—</span>) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
