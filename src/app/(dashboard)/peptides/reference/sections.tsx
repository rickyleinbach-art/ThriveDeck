import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared building blocks for the long-form half of the reference library.
// Server components — these render prose and static tables, nothing stateful.

export function RefSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-base font-semibold">{title}</h2>
      {note && (
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{note}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-prose text-sm leading-relaxed text-foreground/90">
      {children}
    </p>
  );
}

export function Callout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm leading-relaxed text-foreground/90",
        className
      )}
    >
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="max-w-prose">{children}</div>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
  minWidth = "32rem",
  emphasizeFirst = false,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  minWidth?: string;
  /** Renders the first column as the row's label. */
  emphasizeFirst?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {cells.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-4 py-3 align-top text-foreground/90",
                    emphasizeFirst && j === 0 && "font-medium text-foreground"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NumberedSteps({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
            {i + 1}
          </span>
          <span className="max-w-prose text-sm leading-relaxed text-foreground/90">
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 font-mono text-sm tabular-nums">
      {children}
    </div>
  );
}
