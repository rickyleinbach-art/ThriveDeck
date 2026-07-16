export function calculateBmi(weightKg: number, heightCm: number): number | null {
  if (heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Above range";
  return "Well above range";
}

interface SeriesPoint {
  recordedAt: string;
  value: number;
}

function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday-start week
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function groupedAverages(points: SeriesPoint[], keyFn: (d: Date) => string) {
  const buckets = new Map<string, number[]>();
  for (const point of points) {
    const key = keyFn(new Date(point.recordedAt));
    const bucket = buckets.get(key) ?? [];
    bucket.push(point.value);
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .map(([period, values]) => ({
      period,
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function weeklyAverages(points: SeriesPoint[]) {
  return groupedAverages(points, startOfWeek);
}

export function monthlyAverages(points: SeriesPoint[]) {
  return groupedAverages(points, startOfMonth);
}

// Simple linear regression over recent points to estimate the date a goal
// value will be reached. Returns null when there isn't enough trend data
// or the trend is flat/moving away from the target.
export function projectedGoalDate(
  points: SeriesPoint[],
  targetValue: number
): string | null {
  if (points.length < 3) return null;

  const sorted = [...points].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const t0 = new Date(sorted[0].recordedAt).getTime();
  const xs = sorted.map((p) => (new Date(p.recordedAt).getTime() - t0) / 86_400_000); // days
  const ys = sorted.map((p) => p.value);

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  if (slope === 0) return null;

  const daysToTarget = (targetValue - intercept) / slope;
  const latestDay = xs[xs.length - 1];
  if (daysToTarget <= latestDay) return null; // target already passed, or trend moving away

  const targetDate = new Date(t0 + daysToTarget * 86_400_000);
  return targetDate.toISOString().slice(0, 10);
}
