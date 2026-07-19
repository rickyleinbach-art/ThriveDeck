import type { DateRange, Granularity, RangePreset } from "@/lib/validations/analytics";

// All date handling here treats "YYYY-MM-DD" strings as UTC calendar days,
// matching src/lib/habits/calculations.ts and the weight module. Lexical
// string comparison on that format is the same as chronological order.

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Any ISO timestamp or date → its UTC calendar day.
export function toDay(iso: string): string {
  return iso.slice(0, 10);
}

// Resolve a preset (or explicit custom range) to concrete inclusive days.
// `earliest` bounds the "all" preset; falls back to one year when unknown.
export function resolveRange(
  preset: RangePreset,
  today: string,
  earliest: string | null,
  custom?: DateRange
): DateRange {
  if (preset === "custom" && custom) return custom;

  const trailing: Partial<Record<RangePreset, number>> = {
    "7d": 6,
    "30d": 29,
    "90d": 89,
    "1y": 364,
  };

  if (preset === "all") {
    return { start: earliest ?? addDays(today, -364), end: today };
  }
  const days = trailing[preset] ?? 29;
  return { start: addDays(today, -days), end: today };
}

// Bucket a day into the period key its granularity groups by.
export function bucketKey(day: string, g: Granularity): string {
  switch (g) {
    case "daily":
      return day;
    case "weekly":
      return startOfWeek(day); // Monday-start, matches weight module
    case "monthly":
      return day.slice(0, 7); // "YYYY-MM"
    case "yearly":
      return day.slice(0, 4); // "YYYY"
  }
}

function startOfWeek(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = d.getUTCDay();
  const diff = (dow + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

// Human label for a bucket key, given the granularity that produced it.
export function bucketLabel(key: string, g: Granularity): string {
  switch (g) {
    case "yearly":
      return key;
    case "monthly": {
      const d = new Date(`${key}-01T00:00:00Z`);
      return d.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    }
    case "weekly":
    case "daily": {
      const d = new Date(`${key}T00:00:00Z`);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    }
  }
}

// Ordered, de-duplicated bucket keys spanning the whole range — so charts get a
// continuous axis even where a period has no data.
export function bucketKeysInRange(range: DateRange, g: Granularity): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (let day = range.start; day <= range.end; day = addDays(day, 1)) {
    const key = bucketKey(day, g);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

// A sensible default granularity for a preset, so switching range keeps the
// chart readable without a manual granularity change every time.
export function defaultGranularity(preset: RangePreset): Granularity {
  switch (preset) {
    case "7d":
    case "30d":
      return "daily";
    case "90d":
      return "weekly";
    case "1y":
      return "monthly";
    case "all":
      return "monthly";
    case "custom":
      return "daily";
  }
}
