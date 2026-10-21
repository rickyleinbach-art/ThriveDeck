import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { PEPTIDE_REFERENCE } from "@/lib/peptides/reference";
import {
  PEPTIDE_STACKS,
  STACK_GOAL_LABELS,
  STACK_LEVEL_LABELS,
  STACK_WARNINGS,
  WARNING_LEVEL_LABELS,
  type WarningLevel,
} from "@/lib/peptides/stacks";
import { TierBadge } from "./tier-badge";

const BY_SLUG = new Map(PEPTIDE_REFERENCE.map((c) => [c.slug, c]));

const LEVEL_CLASSES: Record<string, string> = {
  beginner: "border-primary/40 bg-primary/10 text-primary",
  intermediate:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  advanced: "border-destructive/40 bg-destructive/10 text-destructive",
};

const WARNING_CLASSES: Record<WarningLevel, string> = {
  high: "border-destructive/40 bg-destructive/5",
  caution: "border-amber-500/40 bg-amber-500/5",
};

const WARNING_CHIP: Record<WarningLevel, string> = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  caution:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

// Links a component to its library entry when it has one. Compounds that are
// not in the library (insulin, PDE5 inhibitors) render as plain text.
function Component({ slug, label }: { slug?: string; label?: string }) {
  const c = slug ? BY_SLUG.get(slug) : undefined;
  if (!c) return <span className="font-medium">{label}</span>;
  return (
    <a
      href={`#compound-${c.slug}`}
      className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
    >
      {c.name}
      <TierBadge tier={c.tier} />
    </a>
  );
}

export function StacksList() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {PEPTIDE_STACKS.map((stack) => (
        <article
          key={stack.id}
          className="flex flex-col rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold">{stack.name}</h3>
            <div className="flex gap-1.5">
              <Chip className="border-border bg-muted text-muted-foreground">
                {STACK_GOAL_LABELS[stack.goal]}
              </Chip>
              <Chip className={LEVEL_CLASSES[stack.level]}>
                {STACK_LEVEL_LABELS[stack.level]}
              </Chip>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{stack.purpose}</p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {stack.slugs.map((slug) => (
              <Component key={slug} slug={slug} />
            ))}
          </div>

          <dl className="mt-4 space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Why these two
              </dt>
              <dd className="mt-1 text-foreground/90">{stack.why}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                How it is run
              </dt>
              <dd className="mt-1 text-foreground/90">{stack.howItIsRun}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function StackWarnings() {
  return (
    <div className="space-y-3">
      {STACK_WARNINGS.map((w) => (
        <article
          key={w.id}
          className={cn(
            "flex gap-3 rounded-2xl border p-4",
            WARNING_CLASSES[w.level]
          )}
        >
          {w.level === "high" ? (
            <ShieldAlert
              aria-hidden
              className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
            />
          ) : (
            <AlertTriangle
              aria-hidden
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{w.title}</h3>
              <Chip className={WARNING_CHIP[w.level]}>
                {WARNING_LEVEL_LABELS[w.level]}
              </Chip>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {w.parties.map((p) => (
                <Component key={p.label} slug={p.slug} label={p.label} />
              ))}
            </div>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground/90">
              {w.why}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
