import { Card } from "@/components/ui/card";

// Dashboard shell. Each card is a slot to be wired up as its module is built.
// PRD § Dashboard lists the full set; these are the MVP-relevant ones first.
const SLOTS = [
  { title: "Today's calories", note: "Nutrition module" },
  { title: "Protein remaining", note: "Nutrition module" },
  { title: "Water remaining", note: "Habits module" },
  { title: "Today's workout", note: "Exercise module" },
  { title: "Steps", note: "Habits module" },
  { title: "Weight trend", note: "Weight module" },
  { title: "Body fat trend", note: "Weight module" },
  { title: "Next peptide reminder", note: "Peptides module" },
  { title: "Today's habits", note: "Habits module" },
  { title: "Sleep score", note: "Habits module" },
  { title: "Recovery score", note: "Analytics module" },
  { title: "Weekly streak", note: "Gamification module" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What should I do today?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your day at a glance. Cards fill in as you connect each part of your
          routine.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SLOTS.map((slot) => (
          <Card key={slot.title} title={slot.title}>
            <div className="flex h-16 items-center text-sm text-muted-foreground/70">
              Coming with the {slot.note}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
