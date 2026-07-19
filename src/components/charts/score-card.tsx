import Link from "next/link";
import { cn } from "@/lib/utils";

// A dashboard score: a 0–100 ring with the value and a one-line detail.
// Purely a summary of logged activity — never medical scoring (see
// src/lib/analytics/scores.ts).

interface ScoreCardProps {
  label: string;
  value: number | null; // 0–100, or null when not enough data
  detail?: string;
  href?: string;
  size?: number;
  className?: string;
}

// Color the ring by band so a glance reads good/okay/low without reading digits.
function ringColor(value: number): string {
  if (value >= 75) return "hsl(var(--success))";
  if (value >= 50) return "hsl(var(--primary))";
  if (value >= 25) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function Ring({ value, size }: { value: number | null; size: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - pct / 100);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" role="img" aria-label={`${value ?? "—"} out of 100`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
      />
      {value !== null && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor(value)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      )}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90 fill-foreground"
        style={{ transformOrigin: "center", fontSize: size * 0.26, fontWeight: 600 }}
      >
        {value === null ? "—" : value}
      </text>
    </svg>
  );
}

export function ScoreCard({ label, value, detail, href, size = 72, className }: ScoreCardProps) {
  const body = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition",
        href && "hover:border-primary/40 hover:shadow-soft",
        className
      )}
    >
      <Ring value={value} size={size} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
