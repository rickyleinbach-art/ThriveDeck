"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  GOAL_LABELS,
  GOAL_ORDER,
  REFERENCE_COMPOUNDS,
  REFERENCE_COMPOUNDS_AZ,
  REFERENCE_SECTIONS,
  TIER_BLURBS,
  TIER_LABELS,
  TIER_ORDER,
  referenceHaystack,
  type ReferenceGoal,
  type ReferenceTier,
} from "@/lib/peptides/reference";
import { CompoundEntry } from "./compound-entry";
import { TIER_DOT_CLASSES, TierBadge } from "./tier-badge";

// Search text is derived once — the list is static, so there's no reason to
// rebuild it on every keystroke.
const HAYSTACKS = new Map(
  REFERENCE_COMPOUNDS.map((c) => [c.slug, referenceHaystack(c)])
);

const TIER_RANK: Record<ReferenceTier, number> = {
  approved: 0,
  trial: 1,
  research: 2,
};

export function CompoundLibrary() {
  const [query, setQuery] = useState("");
  const [hiddenTiers, setHiddenTiers] = useState<ReferenceTier[]>([]);
  const [goal, setGoal] = useState<ReferenceGoal | null>(null);
  const [openSlugs, setOpenSlugs] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const term = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      REFERENCE_COMPOUNDS.filter(
        (c) =>
          !hiddenTiers.includes(c.tier) &&
          (!term || (HAYSTACKS.get(c.slug) ?? "").includes(term))
      ),
    [hiddenTiers, term]
  );

  const goalHits = useMemo(() => {
    if (!goal) return [];
    return REFERENCE_COMPOUNDS.filter((c) => c.goals?.includes(goal)).sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.name.localeCompare(b.name)
    );
  }, [goal]);

  const toggleSlug = useCallback((slug: string) => {
    setOpenSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  // Opening a compound from the A-Z index or the goal finder has to clear
  // whatever filter is currently hiding it, or the jump lands on nothing.
  const jumpTo = useCallback((slug: string) => {
    setHiddenTiers([]);
    setQuery("");
    setOpenSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
    setHighlighted(slug);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setHighlighted(null), 1600);
    requestAnimationFrame(() => {
      document
        .getElementById(`compound-${slug}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  function toggleTier(tier: ReferenceTier) {
    setHiddenTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  return (
    <div className="space-y-8">
      {/* search + evidence filter */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or use…"
              aria-label="Search the peptide reference"
              className="pl-9"
            />
          </div>
          <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
            {visible.length === REFERENCE_COMPOUNDS.length
              ? `${REFERENCE_COMPOUNDS.length} compounds`
              : `${visible.length} of ${REFERENCE_COMPOUNDS.length} shown`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIER_ORDER.map((tier) => {
            const on = !hiddenTiers.includes(tier);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => toggleTier(tier)}
                aria-pressed={on}
                title={TIER_BLURBS[tier]}
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
                {TIER_LABELS[tier]}
              </button>
            );
          })}
        </div>
      </div>

      {/* find by goal */}
      <section
        aria-labelledby="ref-goals"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="ref-goals" className="text-base font-semibold">
            What are you trying to learn about?
          </h2>
          {goal && (
            <button
              type="button"
              onClick={() => setGoal(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {GOAL_ORDER.map((g) => {
            const on = goal === g;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => setGoal(on ? null : g)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {GOAL_LABELS[g]}
              </button>
            );
          })}
        </div>

        {goal && (
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">
              {goalHits.length} compound{goalHits.length === 1 ? "" : "s"} studied
              for {GOAL_LABELS[goal].toLowerCase()}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Best-evidenced first. This lists what has been studied — it is not a
              suggestion to use any of it.
            </p>
            <ul className="mt-3 space-y-2">
              {goalHits.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => jumpTo(c.slug)}
                    className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {c.summary}
                      </span>
                    </span>
                    <TierBadge tier={c.tier} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* A-Z index */}
      <section aria-labelledby="ref-az">
        <h2 id="ref-az" className="text-base font-semibold">
          Every compound, A to Z
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap any name to open its entry. The dot shows its evidence level.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {REFERENCE_COMPOUNDS_AZ.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => jumpTo(c.slug)}
              title={TIER_LABELS[c.tier]}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-xs transition hover:bg-accent hover:text-accent-foreground"
            >
              <span className="truncate">{c.name}</span>
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  TIER_DOT_CLASSES[c.tier]
                )}
              />
            </button>
          ))}
        </div>
      </section>

      {/* category sections */}
      {visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing matches that. Try a shorter word, or turn an evidence level back
          on.
        </p>
      )}

      {REFERENCE_SECTIONS.map((section) => {
        const items = visible.filter((c) => c.category === section.id);
        if (items.length === 0) return null;
        return (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="scroll-mt-24"
          >
            <h2 className="flex items-baseline gap-2 text-base font-semibold">
              {section.title}
              <span className="text-xs font-normal text-muted-foreground">
                {items.length}
              </span>
            </h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {section.note}
            </p>
            <div className="mt-4 space-y-3">
              {items.map((c) => (
                <CompoundEntry
                  key={c.slug}
                  compound={c}
                  open={openSlugs.includes(c.slug)}
                  highlighted={highlighted === c.slug}
                  onToggle={() => toggleSlug(c.slug)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
