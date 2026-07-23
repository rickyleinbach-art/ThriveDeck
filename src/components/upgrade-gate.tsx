import Link from "next/link";
import { Lock } from "lucide-react";

// Presentational upgrade prompts shown where a Pro feature is gated. No client
// state, so these render fine inside Server Components. Entitlement checks live
// in the server pages (getEntitlements().has(feature)); these just render the
// locked state and route to /upgrade.

// Full-section wall — replaces a gated page's body.
export function UpgradeWall({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        ThriveDeck Pro
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      <Link
        href="/upgrade"
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}

// Compact inline lock — sits in place of a gated control (e.g. an export button).
export function UpgradeInline({ label }: { label: string }) {
  return (
    <Link
      href="/upgrade"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
    >
      <Lock className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
