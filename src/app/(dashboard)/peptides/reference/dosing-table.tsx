"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  REFERENCE_COMPOUNDS,
  TIER_ORDER,
  TIER_SOURCE_LABELS,
  type ReferenceTier,
} from "@/lib/peptides/reference";
import { TIER_DOT_CLASSES, TierBadge } from "./tier-badge";

// SAFETY (CLAUDE.md § Health & safety): every row carries the source of its
// figure, and the source filter exists so an animal-study number is never read
// as if it were a regulator-cleared label. Nothing here is a protocol.
export function DosingTable() {
  const [hiddenTiers, setHiddenTiers] = useState<ReferenceTier[]>([]);
  const rows = REFERENCE_COMPOUNDS.filter((c) => !hiddenTiers.includes(c.tier));

  function toggleTier(tier: ReferenceTier) {
    setHiddenTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TIER_ORDER.map((tier) => {
          const on = !hiddenTiers.includes(tier);
          return (
            <button
              key={tier}
              type="button"
              aria-pressed={on}
              onClick={() => toggleTier(tier)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                on
                  ? "border-border bg-card text-foreground"
                  : "border-border bg-transparent text-muted-foreground opacity-60"
              )}
            >
              <span
                aria-hidden
                className={cn("h-2 w-2 rounded-full", TIER_DOT_CLASSES[tier])}
              />
              {TIER_SOURCE_LABELS[tier]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Compound</th>
              <th className="px-4 py-2.5 font-medium">Documented dose</th>
              <th className="px-4 py-2.5 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.slug} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top font-medium">{c.name}</td>
                <td className="px-4 py-3 align-top text-foreground/90">
                  {c.documentedDose}
                </td>
                <td className="px-4 py-3 align-top">
                  <TierBadge tier={c.tier} source />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          All sources are hidden. Turn one back on to see the table.
        </p>
      )}
    </div>
  );
}
