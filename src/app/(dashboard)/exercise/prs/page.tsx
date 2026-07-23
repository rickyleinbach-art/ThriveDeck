import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import {
  displayWeight,
  personalRecords,
  weightUnit,
} from "@/lib/exercise/calculations";
import { getStrengthSets, getUnitSystem } from "@/lib/exercise/queries";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PersonalRecordsPage() {
  const [sets, unitSystem] = await Promise.all([
    getStrengthSets(),
    getUnitSystem(),
  ]);
  const records = personalRecords(sets);
  const unit = weightUnit(unitSystem);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Personal records</h1>
          <p className="mt-1 text-muted-foreground">
            Best set per exercise, with an estimated one-rep max (Epley).
          </p>
        </div>
        <Link href="/exercise" className="text-sm text-primary hover:underline">
          <Icon icon={ArrowLeft} size="sm" className="mr-1 inline align-[-0.2em]" />Back to Exercise
        </Link>
      </div>

      <Card>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No strength sets logged yet — PRs appear once you log weighted sets.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Exercise</th>
                  <th className="pb-2 pr-4 font-medium">Best set</th>
                  <th className="pb-2 pr-4 font-medium">Est. 1RM</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 font-medium">Sets logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record) => (
                  <tr key={record.exerciseName}>
                    <td className="py-2.5 pr-4 font-medium">{record.exerciseName}</td>
                    <td className="py-2.5 pr-4">
                      {record.bestWeightReps} ×{" "}
                      {Math.round(displayWeight(record.bestWeightKg, unitSystem) * 10) / 10}{" "}
                      {unit}
                    </td>
                    <td className="py-2.5 pr-4">
                      {Math.round(displayWeight(record.estOneRepMaxKg, unitSystem))} {unit}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatDate(record.bestWeightDate)}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{record.setCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
