import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Dumbbell,
  ListChecks,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Utensils,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Reveal } from "@/components/marketing/reveal";
import { PlanTeaser } from "@/components/marketing/plan-teaser";

export const metadata = {
  title: "ThriveDeck — Train. Fuel. Recover. Perform.",
  description:
    "Track nutrition, training, weight, habits, and labs in one place — then see what actually moves the needle.",
};

// ── Shared visual primitives (server-rendered, token-colored) ──────────────
// Every product visual is a CSS mock of the real UI so the page ships with zero
// external assets. Where a real screenshot should later drop in, a SCREENSHOT
// SLOT comment marks the path + intended dimensions.

function PreviewFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* emerald glow behind the frame */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, hsl(var(--primary) / 0.25), transparent 70%)",
        }}
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted" />
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function MiniBar({ pct, label, value }: { pct: number; label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Hero phone mockup — a faithful mini dashboard.
function HeroMockup() {
  const trend = [38, 34, 36, 30, 28, 24, 22, 25, 20, 18, 16, 14];
  const max = Math.max(...trend);
  const pts = trend
    .map((v, i) => `${(i / (trend.length - 1)) * 100},${40 - (v / max) * 34}`)
    .join(" ");

  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      {/* SCREENSHOT SLOT: replace with /public/marketing/hero-app.png @ 1170x2532 */}
      <div className="rounded-[2.5rem] border border-border bg-card p-3 shadow-card">
        <div className="overflow-hidden rounded-[2rem] bg-background">
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-lg font-bold tracking-tight">Good morning</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            {/* weight trend card */}
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Weight trend</span>
                <span className="text-xs font-medium text-primary">▼ 3.2 lb / mo</span>
              </div>
              <p className="mt-1 text-2xl font-bold">181.4 lb</p>
              <svg viewBox="0 0 100 40" className="mt-2 h-12 w-full" preserveAspectRatio="none">
                <polyline
                  points={pts}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* macro rings row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Protein", v: "82%" },
                { l: "Carbs", v: "64%" },
                { l: "Fat", v: "71%" },
              ].map((m) => (
                <div key={m.l} className="rounded-xl border border-border p-3 text-center">
                  <p className="text-sm font-bold text-primary">{m.v}</p>
                  <p className="text-[10px] text-muted-foreground">{m.l}</p>
                </div>
              ))}
            </div>

            {/* habit row */}
            <div className="rounded-xl border border-border p-4">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Habits</span>
                <span className="font-medium">4 / 5</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 1, 1, 1, 0].map((on, i) => (
                  <span
                    key={i}
                    className={`h-6 flex-1 rounded-md ${on ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile device frame for the "See it in action" gallery. The center frame is
// elevated/enlarged on desktop; on mobile the row scrolls horizontally with snap.
function PhoneFrame({
  children,
  elevated,
}: {
  children: React.ReactNode;
  elevated?: boolean;
}) {
  return (
    <div
      className={`relative shrink-0 snap-center ${
        elevated
          ? "w-[262px] sm:w-[284px] lg:z-10 lg:-my-6 lg:scale-105"
          : "w-[240px] opacity-95 sm:w-[262px] lg:opacity-80"
      }`}
    >
      {elevated && (
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[3rem] opacity-70 blur-2xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 45%, hsl(var(--primary) / 0.22), transparent 70%)",
          }}
        />
      )}
      {/* SCREENSHOT SLOT: replace inner screen with /public/marketing/screen-*.png @ 1170x2532 */}
      <div className="rounded-[2.5rem] border border-border bg-card p-2.5 shadow-card">
        <div className="relative overflow-hidden rounded-[2rem] bg-background">
          <div
            aria-hidden
            className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-card"
          />
          <div className="p-4 pt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Section data ───────────────────────────────────────────────────────────
const STATS = [
  { value: "8", label: "Connected modules" },
  { value: "All-in-one", label: "Nutrition · Training · Labs · Habits" },
  { value: "Encrypted", label: "Your data, never sold" },
  { value: "PWA", label: "Phone & web, always in sync" },
];

type Feature = {
  icon: typeof Utensils;
  eyebrow: string;
  title: string;
  copy: string;
  visual: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    icon: Utensils,
    eyebrow: "Nutrition",
    title: "Log a meal in seconds",
    copy: "Search, favorites, and recents make logging fast — then see macros and calories break down against your targets without the guesswork.",
    visual: (
      <PreviewFrame>
        <div className="space-y-3">
          <div className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            Search foods…
          </div>
          {[
            { n: "Greek yogurt", k: "120 kcal" },
            { n: "Chicken & rice bowl", k: "540 kcal" },
            { n: "Almonds, 1 oz", k: "164 kcal" },
          ].map((f) => (
            <div key={f.n} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-accent" />
                {f.n}
              </span>
              <span className="text-muted-foreground">{f.k}</span>
            </div>
          ))}
          <MiniBar pct={82} label="Protein" value="148 / 180 g" />
        </div>
      </PreviewFrame>
    ),
  },
  {
    icon: Dumbbell,
    eyebrow: "Training",
    title: "Every set, tracked and progressing",
    copy: "Build workouts, log sets and reps, and watch your volume and personal records climb over time — so training stays intentional, not random.",
    visual: (
      <PreviewFrame>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Push day</p>
          {[
            { n: "Bench press", s: "4 × 8", w: "185 lb" },
            { n: "Incline DB press", s: "3 × 10", w: "60 lb" },
            { n: "Cable fly", s: "3 × 12", w: "35 lb" },
          ].map((e) => (
            <div key={e.n} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span>{e.n}</span>
              <span className="text-muted-foreground">
                {e.s} · <span className="font-medium text-foreground">{e.w}</span>
              </span>
            </div>
          ))}
        </div>
      </PreviewFrame>
    ),
  },
  {
    icon: TrendingDown,
    eyebrow: "Weight & body",
    title: "See the real trend, not the noise",
    copy: "Daily weigh-ins bounce around. ThriveDeck smooths the line so you can tell true progress from water weight and yesterday's dinner.",
    visual: (
      <PreviewFrame>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">90-day trend</span>
            <span className="text-sm font-medium text-primary">▼ 9.4 lb</span>
          </div>
          <svg viewBox="0 0 100 44" className="mt-3 h-24 w-full" preserveAspectRatio="none">
            <polyline
              points="0,6 12,10 24,8 36,16 48,14 60,22 72,20 84,30 100,34"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </PreviewFrame>
    ),
  },
  {
    icon: ListChecks,
    eyebrow: "Habits & health metrics",
    title: "Build streaks that stick",
    copy: "Track sleep, steps, mood, and the daily habits that drive results. Small consistent wins, made visible.",
    visual: (
      <PreviewFrame>
        <div className="space-y-3">
          {[
            { n: "Sleep 7h+", done: true },
            { n: "10k steps", done: true },
            { n: "Protein target", done: true },
            { n: "No late snacking", done: false },
          ].map((h) => (
            <div key={h.n} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  h.done ? "bg-primary text-primary-foreground" : "border border-border"
                }`}
              >
                {h.done && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className={h.done ? "" : "text-muted-foreground"}>{h.n}</span>
            </div>
          ))}
          <div className="flex gap-1.5 pt-1">
            {[1, 1, 1, 1, 1, 0, 0].map((on, i) => (
              <span key={i} className={`h-6 flex-1 rounded-md ${on ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </PreviewFrame>
    ),
  },
  {
    icon: BarChart3,
    eyebrow: "Analytics",
    title: "Connect the dots across everything",
    copy: "Your nutrition, training, weight, and labs live in one place — so you can finally see which inputs actually move your outcomes.",
    visual: (
      <PreviewFrame>
        <div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            {[
              { v: "1,842", l: "avg kcal" },
              { v: "12.4k", l: "weekly volume" },
              { v: "7.2h", l: "avg sleep" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-border p-2">
                <p className="text-sm font-bold">{s.v}</p>
                <p className="text-[10px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="flex h-20 items-end gap-1.5">
            {[40, 55, 48, 70, 62, 80, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </PreviewFrame>
    ),
  },
  {
    icon: MessageSquare,
    eyebrow: "AI Coach",
    title: "Guidance grounded in your data",
    copy: "Ask questions and get educational, data-aware suggestions about your habits and training. For anything medical, it always points you to your provider.",
    visual: (
      <PreviewFrame>
        <div className="space-y-3">
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
            Why did my weight stall this week?
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-accent px-4 py-2 text-sm text-accent-foreground">
            Your average intake rose ~200 kcal and sleep dipped below 6h on 3 nights. Both can slow the trend — want to review your habits?
          </div>
        </div>
      </PreviewFrame>
    ),
  },
];

const STEPS = [
  { n: 1, title: "Log it", copy: "Meals, workouts, weigh-ins, habits — quick to enter, all in one app." },
  { n: 2, title: "See the trend", copy: "Charts smooth the noise so real progress stands out from daily swings." },
  { n: 3, title: "Adjust", copy: "Spot what's working, change what isn't, and keep the momentum going." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    tagline: "Everything you need to start.",
    features: ["Nutrition, training & weight logging", "Habits & health metrics", "Core trends & charts"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Upgrade anytime",
    tagline: "Deeper insight and the full toolkit.",
    features: [
      "Advanced analytics & correlations",
      "AI Coach",
      "Peptide tracking — log what you take",
      "Data export",
    ],
    cta: "Get started",
    highlighted: true,
  },
];

// ── Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          {/* aurora background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 45% at 70% 20%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(45% 40% at 20% 30%, hsl(var(--primary) / 0.10), transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
              WebkitMaskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
            }}
          />

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <Reveal>
              <div className="text-center lg:text-left">
                <Image
                  src="/brand/thrivedeck-mark-only-transparent.png"
                  alt="ThriveDeck logo"
                  width={512}
                  height={512}
                  priority
                  className="mx-auto mb-8 h-28 w-auto drop-shadow-[0_8px_30px_hsl(var(--primary)/0.25)] sm:h-32 lg:h-36 lg:mx-0"
                />
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Train. Fuel. Recover. <span className="text-primary">Perform.</span>
                </span>
                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Your metabolism,
                  <br />
                  <span className="text-primary">finally in focus.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
                  Track nutrition, training, weight, habits, and labs in one place —
                  then see what actually moves the needle. Built to help you get
                  healthier, not just log numbers.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                  <Link
                    href="/signup"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 sm:w-auto"
                  >
                    Start free — no card required
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-card px-6 font-medium transition hover:bg-accent sm:w-auto"
                  >
                    Sign in
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Private by design
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Encrypted health data
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> No ads, ever
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <HeroMockup />
            </Reveal>
          </div>
        </section>

        {/* STAT STRIP */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-12 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.05}>
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PLAN TEASER */}
        <section className="px-6 py-24">
          <Reveal>
            <PlanTeaser />
          </Reveal>
        </section>

        {/* FEATURES */}
        <section id="features" className="px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  One app for the whole picture
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Most apps track one thing. ThriveDeck connects them, so insight
                  comes from the overlap — not a pile of separate numbers.
                </p>
              </div>
            </Reveal>

            <div className="mt-20 space-y-24">
              {FEATURES.map((f, i) => {
                const flip = i % 2 === 1;
                return (
                  <Reveal key={f.title}>
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                      <div className={flip ? "lg:order-2" : ""}>
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                          <Icon icon={f.icon} size="lg" />
                        </div>
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                          {f.eyebrow}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                          {f.title}
                        </h3>
                        <p className="mt-4 text-lg text-muted-foreground">{f.copy}</p>
                      </div>
                      <div className={flip ? "lg:order-1" : ""}>{f.visual}</div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* SEE IT IN ACTION — device gallery */}
        <section className="overflow-hidden border-t border-border px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  See it in action
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  The same clean, focused interface everywhere — log on your phone,
                  review on the web, always in sync.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                aria-hidden
                className="mt-16 flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-2 pb-4 lg:justify-center lg:overflow-visible lg:pb-0"
              >
                {/* Nutrition */}
                <PhoneFrame>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Nutrition</p>
                    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="4"
                          strokeDasharray="94.2"
                          strokeDashoffset="20"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div>
                        <p className="text-lg font-bold">1,540</p>
                        <p className="text-[10px] text-muted-foreground">of 1,900 kcal</p>
                      </div>
                    </div>
                    {[
                      { n: "Oatmeal & berries", k: "320" },
                      { n: "Chicken salad", k: "440" },
                      { n: "Protein shake", k: "180" },
                    ].map((f) => (
                      <div key={f.n} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-accent" />
                          {f.n}
                        </span>
                        <span className="text-muted-foreground">{f.k}</span>
                      </div>
                    ))}
                  </div>
                </PhoneFrame>

                {/* Home dashboard — elevated center */}
                <PhoneFrame elevated>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Wednesday</p>
                        <p className="text-base font-bold">Your day</p>
                      </div>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted-foreground">Weight trend</span>
                        <span className="text-[10px] font-medium text-primary">▼ 2.1 lb</span>
                      </div>
                      <svg viewBox="0 0 100 30" className="mt-1 h-10 w-full" preserveAspectRatio="none">
                        <polyline
                          points="0,8 20,12 40,10 60,18 80,16 100,22"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { l: "kcal", v: "1.5k" },
                        { l: "steps", v: "8.2k" },
                        { l: "streak", v: "12" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg border border-border p-2 text-center">
                          <p className="text-sm font-bold text-primary">{s.v}</p>
                          <p className="text-[9px] text-muted-foreground">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {[1, 1, 1, 1, 0, 0, 0].map((on, i) => (
                        <span key={i} className={`h-5 flex-1 rounded ${on ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>
                  </div>
                </PhoneFrame>

                {/* Analytics */}
                <PhoneFrame>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Analytics</p>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-[10px] text-muted-foreground">Weekly volume</p>
                      <div className="mt-2 flex h-16 items-end gap-1">
                        {[45, 60, 52, 72, 66, 84, 90].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: "avg sleep", v: "7.2h" },
                        { l: "resting HR", v: "58" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg border border-border p-2">
                          <p className="text-sm font-bold">{s.v}</p>
                          <p className="text-[9px] text-muted-foreground">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </PhoneFrame>
              </div>
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="border-t border-border px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1}>
                  <div className="relative text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-soft">
                      {s.n}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-muted-foreground">{s.copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Start free. Upgrade when you&rsquo;re ready.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  The core app is free. Pro unlocks deeper analytics and the full toolkit.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.1}>
                  <div
                    className={`flex h-full flex-col rounded-3xl border p-8 ${
                      p.highlighted
                        ? "border-primary bg-card shadow-card ring-1 ring-primary"
                        : "border-border bg-card shadow-card"
                    }`}
                  >
                    {p.highlighted && (
                      <span className="mb-4 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{p.price}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {p.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`mt-8 inline-flex h-11 items-center justify-center rounded-lg px-6 font-medium transition ${
                        p.highlighted
                          ? "bg-primary text-primary-foreground shadow-soft hover:opacity-90"
                          : "border border-border bg-transparent hover:bg-accent"
                      }`}
                    >
                      {p.cta}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS — PLACEHOLDER copy. Replace with real, attributed quotes
            before launch; do not present these invented quotes as genuine. */}
        <section className="border-t border-border px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                Built for people who want the why
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { q: "Placeholder — the first app where all my data finally lives together.", a: "Early tester" },
                { q: "Placeholder — I stopped guessing and started seeing the trend.", a: "Early tester" },
                { q: "Placeholder — logging is fast enough that I actually keep it up.", a: "Early tester" },
              ].map((t, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                    <blockquote className="flex-1 text-lg leading-relaxed">
                      &ldquo;{t.q}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4 text-sm font-medium text-muted-foreground">
                      {t.a}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 pb-24">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/30 px-8 py-16 text-center">
              <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(60% 100% at 50% 0%, hsl(var(--primary) / 0.20), transparent 70%)",
                }}
              />
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                See what actually moves your needle.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Free to start, no card required. Your data stays private and encrypted.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-1">
            <Image
              src="/brand/thrivedeck-logo-full-transparent.png"
              alt="ThriveDeck"
              width={640}
              height={160}
              className="h-8 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Your metabolic health, in one place.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="transition hover:text-foreground">Features</a></li>
              <li><a href="#how" className="transition hover:text-foreground">How it works</a></li>
              <li><a href="#pricing" className="transition hover:text-foreground">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {/* TODO: point these at real pages when they exist */}
              <li><a href="#" className="transition hover:text-foreground">About</a></li>
              <li><a href="#" className="transition hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {/* TODO: point these at real pages when they exist */}
              <li><a href="#" className="transition hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="transition hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
            <p>© 2026 ThriveDeck. All rights reserved.</p>
            <p>Not a substitute for professional medical advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
