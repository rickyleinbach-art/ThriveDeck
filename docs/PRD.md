# ThriveDeck — Product Requirements Document

> Reference document. In any Claude Code session, read ONLY the section relevant to the
> module you're building. Do not load the whole file into context.

## Vision
A premium health platform combining nutrition, exercise, weight loss, habit building,
body composition, peptide tracking, progress analytics, community, and AI coaching.
Quality bar: Apple Health, WHOOP, Levels, Oura, Noom combined. Must look launch-ready,
not AI-generated. The product's purpose is long-term health improvement, not just
tracking injections.

## Brand & design
Minimal, premium, modern, medical-but-approachable, Apple-level UI. White background,
soft shadows, rounded cards, tasteful gradients, elegant charts, subtle animations
throughout. Dark + light mode. Mobile-first, responsive on desktop.

## Primary navigation
Dashboard · Today · Nutrition · Exercise · Weight · Peptides · Progress · Community ·
AI Coach · Recipes · Challenges · Profile · Settings

---

## § Foundation (Module 1)
- Supabase Auth (email/password + OAuth). Secure session handling via middleware.
- `profiles` table extending `auth.users`: name, DOB, sex, height, timezone, units pref,
  goal weight, activity level, onboarding state.
- RLS enabled on all tables from day one; policy `auth.uid() = user_id`.
- App shell: responsive nav, protected dashboard layout, theme provider (dark/light).
- Design system: tokens (color, spacing, radius, shadow, type scale), base shadcn setup.
- Two-factor authentication, consent management, audit log scaffold.

## § Dashboard (Module 1 shell, filled later)
Answers "What should I do today?" Cards: today's calories, protein remaining, water
remaining, today's workout, steps, weight trend, body-fat trend, next peptide reminder,
today's habits, sleep score, recovery score, mood, energy, upcoming goals, weekly streak,
progress photos, weekly wins, community notifications, AI recommendations, daily quote,
weather, calendar. Build the shell + card slots in Module 1; wire real data as modules land.

## § Weight Loss (Module 2)
Track: starting/current/goal weight, BMI, body fat %, lean muscle mass, and measurements
(waist, chest, arms, legs, neck, hip). Weekly + monthly averages, projected goal date,
body-composition timeline, progress photos, milestones, achievements.
Data model: single flexible `body_metrics` table (user_id, metric_type, value, unit,
recorded_at, notes) plus `progress_photos` (Storage) and `goals`.

## § Nutrition (Module 3)
Food logging with barcode scanner, USDA + restaurant DB integration, favorites, meal
plans, recipes, meal-prep mode, shopping lists. Macro/protein calculators. Track fiber,
sugar, sodium, micronutrients, hydration, electrolytes, caffeine, alcohol. Daily/weekly/
monthly nutrition scores and trends. Healthy restaurant + fast-food swap recommendations,
high-protein / budget / family meal plans.

## § Exercise (Module 4)
Workout builder, exercise library, strength/cardio/HIIT/walking/running/cycling/swimming/
yoga/mobility/stretching/recovery. Workout + rest timers, PR tracking, history, calories
burned, streaks, analytics (weekly volume, estimated recovery), AI workout suggestions.

## § Peptides (Module 5) — SAFETY CRITICAL
Track: peptide, protocol, dose, frequency, injection location, injection history, provider,
pharmacy, lot number, expiration, reminder + refill schedule, missed doses, side effects,
journal, lab reminders, provider appointments.
**The app NEVER recommends dosing. It only records user-entered information and encourages
consultation with a licensed healthcare provider.** Surface this disclaimer in the UI.

## § Habits & Health Metrics (Module 6)
Habits: sleep, water, meditation, reading, stretching, protein, fiber, supplements, steps,
walks, routines, sunlight, mood, energy, stress, custom habits. Streak tracking + scoring.
Health metrics: blood pressure, heart rate, RHR, HRV, blood sugar, A1C, lipids, cholesterol,
triglycerides, testosterone, vitamin D, labs, medical history, medication list, providers.

## § Analytics (Module 7)
Interactive charts for every tracked series (weight, calories, protein, macros, body fat,
lean mass, waist, water, workouts, strength, sleep, mood, energy, steps, peptide adherence,
side effects, recovery). Each supports daily/weekly/monthly/yearly/custom ranges, PDF + CSV
export. Dashboard scores: trend predictions, moving averages, projected weight, goal %,
weekly health/nutrition/fitness/consistency/recovery/wellness scores.

## § AI Coach (Module 8)
Reviews progress, summarizes weekly improvements, identifies trends, suggests meals, builds
grocery lists, creates workout plans, adjusts calorie targets, provides educational content,
weekly reports, celebrates milestones, encourages consistency.
**NEVER prescribes medication or gives dosing instructions.** Medical questions → educational
info + "consult a licensed healthcare provider."

## § Community (Module 9)
Reddit-style. Categories: weight loss, nutrition, fitness, recipes, walking club, strength,
cardio, peptide experiences, lifestyle, success stories, progress pics, motivation, meal
prep, questions, general. Features: like/comment/share/save/follow, groups, friends,
messaging, profiles, badges, anonymous posting, pinned educational posts, moderator tools,
challenge leaderboards, events, polls, verified healthcare-professional badges.
Strict moderation for unsafe medical advice.

## § Challenges & Gamification (Module 10)
Challenges: 30-day protein, 75 Hard, 10k steps, hydration, strength, meal prep, weight loss,
body fat, consistency. Compete with friends, leaderboards, badges, rewards.
Gamification: XP, levels, achievements, badges, daily/weekly/monthly streaks, goal
completion, community rankings, seasonal events.

## § Subscriptions (Module 10)
Tiers: Free, Premium, Clinic, Coach, Enterprise. Premium unlocks AI Coach, advanced
analytics, unlimited progress photos, meal planning, workout builder, community challenges,
PDF reports, provider sharing. Stripe billing + management UI.

## § Admin (Module 10)
User management, analytics, community moderation, feature flags, subscription management,
challenge management, educational content management, push notifications, support tickets,
reported posts.

## § Calendar & Notifications
Calendar: workout/meal schedules, injection reminders, appointments, lab work, challenges,
events, weekly planning. Notifications: workout/meal/hydration/protein/medication/lab/
provider reminders, community replies, challenge updates, weekly/monthly reports,
achievement unlocks.

## § Integrations (phased, mostly Phase 2+)
Apple Health, Google Fit, Fitbit, Garmin, WHOOP, Oura, Samsung Health, Strava, Cronometer,
MyFitnessPal import, Health Connect, smart scales, DEXA, CGMs (future).

## § Security
Encrypted data at rest + in transit, 2FA, secure auth, cloud backups, privacy controls,
audit logs, consent management. Treat as sensitive health data throughout.
**LEGAL FLAG:** If real users store labs, medications, and provider info — and especially
for Clinic/Coach tiers touching identified health data — this likely falls under HIPAA,
not merely "HIPAA-inspired." Confirm with a healthcare attorney before launch; this affects
required BAAs (Supabase, Stripe, hosting), audit logging, and encryption obligations.

---

## Roadmap
- **MVP (Modules 1–7):** auth/profiles, weight, nutrition, exercise, peptides, habits/metrics,
  analytics. A single user can fully track their health.
- **Phase 2 (Modules 8–10):** AI Coach, community, challenges/gamification, subscriptions,
  admin, calendar, notifications.
- **Phase 3:** device integrations, native React Native apps, CGM support, clinic/coach
  multi-user features.
