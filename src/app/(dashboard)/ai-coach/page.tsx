import { Sparkles, Trophy, TrendingUp, Target } from "lucide-react";
import { getCoachContext } from "@/lib/coach/queries";
import { buildWeeklyReport } from "@/lib/coach/insights";
import type { Insight } from "@/lib/coach/types";
import { getEntitlements } from "@/lib/subscription/queries";
import { UpgradeWall } from "@/components/upgrade-gate";
import { CoachDisclaimer } from "./disclaimer";
import { CoachChat } from "./coach-chat";

export const metadata = { title: "AI Coach · ThriveDeck" };

const TONE_STYLES: Record<Insight["tone"], string> = {
  win: "border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10",
  focus: "border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/10",
  milestone: "border-primary/40 bg-primary/10",
  neutral: "border-border bg-card",
};

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={`rounded-2xl border p-4 ${TONE_STYLES[insight.tone]}`}>
      <p className="text-sm font-semibold">{insight.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
    </div>
  );
}

function Section({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: Insight[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((it, i) => (
          <InsightCard key={`${it.title}-${i}`} insight={it} />
        ))}
      </div>
    </section>
  );
}

export default async function AiCoachPage() {
  const { has } = await getEntitlements();

  const header = (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Sparkles className="h-6 w-6 text-primary" />
        AI Coach
      </h1>
      <p className="mt-1 text-muted-foreground">
        Your personal review of what you&apos;ve logged — plus a coach you can ask anytime.
      </p>
    </div>
  );

  if (!has("ai_coach")) {
    return (
      <div className="space-y-6">
        {header}
        <UpgradeWall
          title="The AI Coach is a Pro feature"
          description="Get a weekly review of your progress and a coach you can ask anytime — tailored to your goals, training, and diet. Upgrade to unlock it."
        />
      </div>
    );
  }

  const ctx = await getCoachContext();
  const report = buildWeeklyReport(ctx);

  return (
    <div className="space-y-6">
      {header}

      <CoachDisclaimer />

      {/* Weekly review */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-medium text-muted-foreground">{report.greeting}</p>
        <p className="mt-1 text-lg">{report.summary}</p>
      </div>

      <Section
        icon={<Trophy className="h-4 w-4" />}
        title="Wins this week"
        items={report.wins}
      />
      <Section
        icon={<Trophy className="h-4 w-4" />}
        title="Milestones"
        items={report.milestones}
      />
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Where to focus"
        items={report.focus}
      />

      {report.wins.length === 0 &&
        report.milestones.length === 0 &&
        report.focus.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <TrendingUp className="mx-auto mb-2 h-6 w-6" />
            Start logging meals, workouts, weight, or habits and your weekly review will
            appear here.
          </div>
        )}

      {/* Chat */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ask your coach
        </h2>
        <CoachChat />
      </section>
    </div>
  );
}
