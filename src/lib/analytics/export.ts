import type { SeriesPoint } from "@/lib/analytics/series";

// Pure CSV helpers. Building the Blob / triggering the download stays in the
// client component; keeping the formatting pure makes it testable and reusable.

// RFC-4180-ish escaping: quote fields containing comma, quote, or newline.
function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map((h) => escapeField(h)).join(",")];
  for (const row of rows) {
    lines.push(
      row
        .map((cell) => (cell === null || cell === undefined ? "" : escapeField(String(cell))))
        .join(",")
    );
  }
  return lines.join("\r\n");
}

// Wide export: one row per period, one column per selected metric. `columns`
// pairs a header label with the series aligned to the same bucket keys.
export function seriesToCsv(
  columns: { label: string; series: SeriesPoint[] }[]
): string {
  if (columns.length === 0) return "";

  // Union of bucket keys, preserving the first column's period ordering.
  const order: string[] = [];
  const seen = new Set<string>();
  for (const col of columns) {
    for (const p of col.series) {
      if (!seen.has(p.key)) {
        seen.add(p.key);
        order.push(p.key);
      }
    }
  }

  const labelByKey = new Map<string, string>();
  for (const col of columns) {
    for (const p of col.series) labelByKey.set(p.key, p.label);
  }
  const valueLookup = columns.map((col) => {
    const m = new Map<string, number | null>();
    for (const p of col.series) m.set(p.key, p.value);
    return m;
  });

  const headers = ["Period", ...columns.map((c) => c.label)];
  const rows = order.map((key) => [
    labelByKey.get(key) ?? key,
    ...valueLookup.map((m) => {
      const v = m.get(key);
      return v === null || v === undefined ? null : Number(v.toFixed(2));
    }),
  ]);

  return toCsv(headers, rows);
}
