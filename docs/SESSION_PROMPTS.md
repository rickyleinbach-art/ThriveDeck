# Claude Code — session prompt templates

Paste one of these at the start of a focused Claude Code session. Each one keeps context
small (that's what controls token usage) and builds a single module.

## Universal opener (start every session with this)
> Read CLAUDE.md and only the relevant § of docs/PRD.md for this task. Do not read other
> modules' code or other PRD sections. Follow the working rules and safety rules. Build only
> what I ask for; don't scaffold ahead into other modules.

---

## Session 1 — Foundation
> Task: Build Module 1 (Foundation). Read CLAUDE.md and docs/PRD.md § Foundation + § Dashboard.
> Set up: Next.js 15 App Router project, Tailwind + shadcn/ui, theme provider (dark/light),
> Supabase Auth with middleware session handling, the `profiles` table + Prisma model + first
> migration with RLS, the protected dashboard layout shell with empty card slots, and the
> design tokens. Deliver the file tree first, then implement. No other modules.

## Session 2 — Weight
> Task: Build Module 2 (Weight Loss). Read CLAUDE.md and docs/PRD.md § Weight Loss only.
> Add the `body_metrics`, `progress_photos`, and `goals` models + migration with RLS, the
> log / history / trend screens using our existing design system and Recharts, and Zod
> validation. Wire the dashboard weight + body-fat cards. Don't touch other modules.

## Session 3 — Nutrition
> Task: Build Module 3 (Nutrition). Read CLAUDE.md and docs/PRD.md § Nutrition only.
> Start with the core food-logging data model + migration (RLS), manual entry + favorites,
> macro/protein calculators, and the daily nutrition screen. Defer barcode/USDA/restaurant
> integrations to a follow-up session. Don't touch other modules.

## Session 4 — Exercise
> Task: Build Module 4 (Exercise). Read CLAUDE.md and docs/PRD.md § Exercise only.
> Data model + migration (RLS), exercise library seed, workout builder, workout/rest timers,
> history, PR tracking. Don't touch other modules.

## Session 5 — Peptides (SAFETY CRITICAL)
> Task: Build Module 5 (Peptides). Read CLAUDE.md and docs/PRD.md § Peptides only.
> Data model + migration (RLS) for peptide records, injection history, reminders, side
> effects, journal, provider/pharmacy info. The UI must NEVER suggest dosing — only record
> user input — and must surface the "consult your healthcare provider" disclaimer prominently.
> Don't touch other modules.

## Session 6 — Habits & Health Metrics
> Task: Build Module 6. Read CLAUDE.md and docs/PRD.md § Habits & Health Metrics only.
> Flexible habit-tracking model with streaks + scoring, and the health-metrics model
> (BP, HR, HRV, glucose, labs, meds, providers), each with migration + RLS. Don't touch
> other modules.

## Session 7 — Analytics
> Task: Build Module 7 (Analytics). Read CLAUDE.md and docs/PRD.md § Analytics only.
> Reusable charting components (Recharts) supporting daily/weekly/monthly/yearly/custom
> ranges, plus PDF + CSV export, reading from existing module tables. Add the dashboard
> score cards. Don't add new data models unless asked.

## Sessions 8–10 — Phase 2
> AI Coach, Community, then Challenges/Gamification/Subscriptions/Admin. One module per
> session, same pattern. For AI Coach, enforce the no-dosing / educational-only rule.

---

## Token discipline reminders
- One module per session. Start a fresh chat between modules so old context drops.
- If a module is big (Nutrition, Community), split it: data model first, then screens.
- Keep CLAUDE.md under ~150 lines so it's cheap to load every turn.
- Let .claudeignore do its job — never ask Claude to "read the whole repo."
