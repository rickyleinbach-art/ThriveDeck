# ThriveDeck

A premium health platform: nutrition, exercise, weight loss, habits, peptide tracking,
analytics, community, and AI coaching. Target quality: Apple Health / Levels / WHOOP.
Full product spec lives in `docs/PRD.md` — read the relevant section only, not the whole file.

## Stack
- Next.js 15 (App Router) + React + TypeScript
- Tailwind + shadcn/ui + Framer Motion
- Supabase (Postgres + Auth + Storage)
- Prisma ORM, Zod validation, TanStack Query
- Recharts for charts, Stripe for billing, UploadThing for uploads
- Deployed on Vercel. PWA support.

## Working rules
- App Router only. Server Components by default; add "use client" only when needed.
- All Supabase access goes through `/src/lib/supabase`. Never inline a client.
- Every table has Row Level Security. Every policy scopes to `auth.uid() = user_id`.
- Validate every input with Zod (`/src/lib/validations`).
- Use the existing design tokens and shadcn components. Do not invent new UI primitives.
- Mobile-first. Support dark + light mode via the theme provider.

## Health & safety rules

Single-user deck. The owner is the only account, and the previous
"never advises" posture has been lifted deliberately — the app may state doses,
mixing protocols, and medical information directly, and the AI Coach answers
dosing and medical questions instead of deferring them.

What still holds, for accuracy rather than liability:
- Every dose figure must carry its provenance tier (`approved` / `trial` /
  `research`). An approved-label dose and an animal-study dose are different
  kinds of number, and that distinction is the most useful thing on the page.
  See `src/lib/peptides/reference.ts`.
- Do not invent dose figures. Numbers come from a regulatory label, a trial
  protocol, or published literature, recorded in the reference library. If a
  compound has no sourced figure, say so rather than estimating one.
- The coach answers from the library (`src/lib/coach/peptide-answers.ts`), so
  every number it can emit is one already written down and attributed.
- Never log or console.print health metric values, lab results, or medication data.
- Treat all health data as sensitive. See docs/PRD.md § Security.

## Scope discipline
- Build ONE module per session. Do not modify modules outside the one requested.
- Ask before editing `/prisma/schema.prisma` or anything in `/prisma/migrations`.
- Do not touch `.env` files.

## Commands
- Dev: `npm run dev`
- DB: `npx prisma migrate dev` / `npx prisma generate`
- Lint: `npm run lint`

## Build order (do not jump ahead)
1. Foundation — auth, profiles, RLS baseline, layout shell, design system, theming
2. Weight + body measurements
3. Nutrition logging
4. Exercise
5. Peptides (with no-dosing guardrails)
6. Habits + health metrics
7. Analytics / charts
8. AI Coach
9. Community
10. Challenges, gamification, subscriptions, admin
