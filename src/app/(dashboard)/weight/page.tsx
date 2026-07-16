import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { METRIC_LABELS } from "@/lib/validations/weight";
import { calculateBmi, bmiCategory } from "@/lib/weight/calculations";
import {
  getGoalForMetric,
  getLatestMetric,
  getProgressPhotosWithUrls,
  getWeightProfileInfo,
} from "@/lib/weight/queries";
import { LogEntryForm } from "./log-entry-form";
import { GoalForm } from "./goal-form";
import { PhotoUploadForm } from "./photo-upload-form";

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

export default async function WeightPage() {
  const [profile, latestWeight, latestBodyFat, latestLeanMass, weightGoal, photos] =
    await Promise.all([
      getWeightProfileInfo(),
      getLatestMetric("WEIGHT"),
      getLatestMetric("BODY_FAT"),
      getLatestMetric("LEAN_MASS"),
      getGoalForMetric("WEIGHT"),
      getProgressPhotosWithUrls(),
    ]);

  const weightInKg =
    latestWeight && (latestWeight.unit === "kg" ? latestWeight.value : latestWeight.value * 0.453592);
  const bmi =
    weightInKg && profile?.heightCm ? calculateBmi(weightInKg, profile.heightCm) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weight</h1>
          <p className="mt-1 text-muted-foreground">
            Log today&apos;s numbers and keep an eye on your trend.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/weight/history" className="text-primary hover:underline">
            History
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/weight/trend" className="text-primary hover:underline">
            Trends
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Current weight">
          <p className="text-2xl font-semibold">
            {latestWeight ? formatValue(latestWeight.value, latestWeight.unit) : "—"}
          </p>
          {weightGoal && (
            <p className="mt-1 text-sm text-muted-foreground">
              Goal: {formatValue(weightGoal.targetValue, weightGoal.unit)}
            </p>
          )}
        </Card>
        <Card title="BMI">
          <p className="text-2xl font-semibold">{bmi ? bmi.toFixed(1) : "—"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {bmi ? bmiCategory(bmi) : "Add height in your profile"}
          </p>
        </Card>
        <Card title="Body fat">
          <p className="text-2xl font-semibold">
            {latestBodyFat ? formatValue(latestBodyFat.value, latestBodyFat.unit) : "—"}
          </p>
        </Card>
        <Card title="Lean mass">
          <p className="text-2xl font-semibold">
            {latestLeanMass ? formatValue(latestLeanMass.value, latestLeanMass.unit) : "—"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Log an entry" className="lg:col-span-1">
          <LogEntryForm defaultUnitSystem={profile?.unitSystem ?? "METRIC"} />
        </Card>

        <Card title="Goal" className="lg:col-span-1">
          <GoalForm />
        </Card>

        <Card title="Progress photo" className="lg:col-span-1">
          <PhotoUploadForm />
        </Card>
      </div>

      {photos.length > 0 && (
        <Card title="Recent progress photos">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {photos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="space-y-1">
                {photo.signedUrl ? (
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    <Image
                      src={photo.signedUrl}
                      alt={`Progress photo from ${photo.takenAt.slice(0, 10)}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
                    Unavailable
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{photo.takenAt.slice(0, 10)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Tracking {Object.values(METRIC_LABELS).join(", ")}.
      </p>
    </div>
  );
}
