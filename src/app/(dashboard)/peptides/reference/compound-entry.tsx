"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PeptideReference } from "@/lib/peptides/reference";
import { TierBadge } from "./tier-badge";

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="mt-2 text-sm text-foreground/90">{children}</div>
    </div>
  );
}

// One expandable compound. Collapsed it shows name, aliases, a plain-language
// line and the evidence level; opened it shows the full entry.
export function CompoundEntry({
  compound,
  open,
  highlighted = false,
  onToggle,
}: {
  compound: PeptideReference;
  open: boolean;
  highlighted?: boolean;
  onToggle: () => void;
}) {
  const bodyId = `compound-body-${compound.slug}`;
  const quick = [
    compound.frequency && ["How often", compound.frequency],
    compound.route && ["Route", compound.route],
    compound.halfLife && ["Half-life", compound.halfLife],
  ].filter(Boolean) as [string, string][];

  return (
    <article
      id={`compound-${compound.slug}`}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-border bg-card transition",
        highlighted && "ring-2 ring-ring"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{compound.name}</span>
            <span className="text-xs text-muted-foreground">{compound.aka}</span>
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {compound.summary}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <TierBadge tier={compound.tier} className="hidden sm:inline-flex" />
          <ChevronDown
            aria-hidden
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {open && (
        <div id={bodyId} className="space-y-5 border-t border-border p-4 pt-4">
          <TierBadge tier={compound.tier} className="sm:hidden" />
          <p className="text-sm leading-relaxed text-foreground/90">
            {compound.detail}
          </p>

          {quick.length > 0 && (
            <dl className="grid gap-3 rounded-xl bg-muted/60 p-3 sm:grid-cols-3">
              {quick.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {compound.benefits && compound.benefits.length > 0 && (
            <Block title="What it's studied for">
              <ul className="space-y-1.5">
                {compound.benefits.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {compound.mixes && compound.mixes.length > 0 && (
            <Block title="Published reconstitution table">
              {compound.solvent && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Solvent: <span className="font-medium text-foreground">{compound.solvent}</span>
                </p>
              )}
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Vial</th>
                      <th className="pb-2 pr-3 font-medium">Add</th>
                      <th className="pb-2 pr-3 font-medium">Gives</th>
                      <th className="pb-2 font-medium">Per unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compound.mixes.map((m) => (
                      <tr key={m.vial} className="border-t border-border">
                        <td className="py-2 pr-3 tabular-nums">{m.vial}</td>
                        <td className="py-2 pr-3 tabular-nums">{m.ml} mL</td>
                        <td className="py-2 pr-3 tabular-nums">{m.conc}</td>
                        <td className="py-2 tabular-nums">{m.per}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Block>
          )}

          {/* SAFETY: the figure is always paired with the tier that says where
              it came from, and never presented as a suggestion. */}
          <Block title="Documented dose">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <TierBadge tier={compound.tier} source />
                <span className="text-xs text-muted-foreground">
                  Reported figure — not a recommendation
                </span>
              </div>
              <p className="mt-2">{compound.documentedDose}</p>
              {compound.doseNote && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {compound.doseNote}
                </p>
              )}
            </div>
          </Block>

          {(compound.storageDry || compound.storageMixed) && (
            <Block title="Storage">
              <div className="grid gap-3 sm:grid-cols-2">
                {compound.storageDry && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Dry powder, unopened
                    </div>
                    <p className="mt-0.5">{compound.storageDry}</p>
                  </div>
                )}
                {compound.storageMixed && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      After mixing
                    </div>
                    <p className="mt-0.5">{compound.storageMixed}</p>
                  </div>
                )}
              </div>
            </Block>
          )}

          <Block title="Worth knowing">
            <p>{compound.worthKnowing}</p>
          </Block>
        </div>
      )}
    </article>
  );
}
