# Landing Page Redesign — Build Spec

**Goal:** Rebuild the ThriveDeck marketing landing page (`src/app/page.tsx`) from a plain
centered splash screen into a premium, scroll-driven marketing page on par with
myfitnesspal.com, levels.com, and whoop.com.

**Reference:** MyFitnessPal — full-bleed hero, stat counters, alternating feature rows
paired with app screenshots, press logos, testimonials, closing CTA. Our current page is
a single centered column (logo + tagline + two buttons) on a flat background; it reads as
a loading screen, not a product site.

---

## Hard constraints (do not violate)

- **Stack:** Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Framer Motion.
  Keep `page.tsx` a **Server Component**; extract any animated/interactive piece into a
  small `"use client"` component under `src/components/marketing/`.
- **Design tokens only** (from `src/app/globals.css`):
  - Background = `--background` (Obsidian in dark, white in light)
  - Surfaces = `--card`
  - CTA / accent / active = `--primary` (Emerald)
  - Text = `--foreground` / `--muted-foreground`
  - Borders = `--border`, radius = `--radius`
- **Dark mode is the flagship** — design dark-first, then verify light mode mirrors it.
- **`--achievement` (Orange) is RESERVED for earned accomplishments ONLY.** Do NOT use
  orange anywhere on this page. Emerald is the only accent color.
- **Health-safety (non-negotiable):** No dosing, prescription, or medical-outcome claims.
  Peptide tracking may only be described as "log and track what you take" — never as
  guidance. No "lose X lbs" promises. Copy is about tracking, insight, and habits.
- **Reuse existing primitives:** shadcn `<Button>` and `<Card>`. Do not invent new UI
  primitives. Icons from the existing icon set / lucide.
- **Mobile-first & responsive.** Must look intentional at 375px, 768px, 1280px+.
- **Accessible:** semantic landmarks (`header`/`main`/`section`/`footer`), one `<h1>`,
  logical heading order, alt text on all imagery, visible focus rings, WCAG-AA contrast,
  and respect `prefers-reduced-motion` (disable transforms/parallax when set).
- **No un-cleared assets.** Default to CSS/SVG mockups. Do NOT add stock photography.

---

## Available assets

- `public/brand/thrivedeck-logo-full-transparent.png` — wordmark (nav + footer)
- `public/brand/thrivedeck-mark-only-transparent.png` — mark
- Icons: `public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
- **No product screenshots exist yet.** Every product visual is a CSS/SVG device mockup
  rendering token-colored fake UI, with a commented slot for a real screenshot later:
  `{/* SCREENSHOT SLOT: /public/marketing/hero-app.png @ 1170x2532 */}`

---

## Page structure (top to bottom)

### 1. Sticky nav header
Translucent blurred bar (`backdrop-blur`, subtle bottom border). Left: full logo wordmark.
Right: anchor links (Features, How it works, Pricing) + "Sign in" (ghost) + "Get started"
(primary). Collapses to logo + "Get started" on mobile.

### 2. Hero (full viewport height; two-column desktop, stacked mobile)
- **Left:** eyebrow pill ("Train. Fuel. Recover. Perform."), bold 3–5 word `<h1>`
  (e.g. "Your metabolism, finally in focus."), one-sentence subhead about tracking
  nutrition/training/weight/habits/labs and seeing what moves the needle. Two CTAs:
  primary **"Start free — no card required"** → `/signup`, ghost **"Sign in"** → `/login`.
  Thin trust line below: "Private by design • Your data is encrypted • No ads."
- **Right:** CSS/SVG **phone device mockup** showing a faithful mini dashboard —
  weight-trend sparkline, a few metric cards, a progress ring — built from token colors so
  it themes correctly. Commented SCREENSHOT SLOT for later.
- **Background:** soft emerald radial/aurora gradient mesh bleeding from behind the mockup
  + faint dot/grid texture. Never a flat black rectangle.

### 3. Interactive "See your plan" teaser  *(priority feature)*
A 2–3 tap mini-flow that lets a visitor feel the product **before** the signup wall:
pick a goal (reuse the onboarding goal options from commit `66f54f4`) → show a preview of
what their dashboard focus would look like → CTA "Create your free account to start."
Client component; no data persisted; purely illustrative. Mirrors MFP's
"pick a goal → personalized target" onboarding hook.

### 4. Stat / social-proof strip  *(priority feature)*
Horizontal row of 3–4 big-number stat cards. **Use only honest, non-fabricated content** —
do NOT invent user counts or review totals. Substitute capabilities we truly own:
"8 modules in one app", "Nutrition · Training · Labs · Habits", "Your data encrypted,
never sold". If a metric isn't real, describe a capability instead of a number.

### 5. Feature showcase
5–6 **alternating left/right** rows (text one side, visual the other, flipping each row).
One row each, matching real app modules: Nutrition logging, Training/exercise, Weight &
body trends, Habits & health metrics, Analytics/insights, AI Coach. Each row: small emerald
icon, short headline, 1–2 sentence benefit copy, framed UI-preview card (device/screenshot
slot pattern). Lead the Nutrition row with the fastest-log path (search + favorites/recents),
framed as "log a meal in seconds." Include a line on cross-device sync ("log on your phone,
review on the web") since we're a PWA.

### 6. How it works
3-step horizontal flow (**Log it → See the trend → Adjust**) with numbered emerald badges
and a connecting line.

### 7. Pricing (free vs Pro)
Clean 3-column or 2-column comparison tied to the existing entitlements/Pro gates
(commits `72a7d56`, `7949bf8`). Make free-vs-Pro **clearer than MFP's** (theirs is vague).
Keep peptide tracking described only as "log what you take."

### 8. Testimonial / quote band
2–3 short quote cards. **Mark as PLACEHOLDER in a comment** so real quotes replace them —
do not present invented quotes as real.

### 9. Final CTA band
Full-width emerald-tinted panel, centered headline, single primary CTA → `/signup`,
reassurance subtext.

### 10. Footer
Logo, short blurb, link columns (Product / Company / Legal), copyright. Keep links that
exist; stub others with `#` and a `TODO` comment.

---

## Positioning note

Do **not** race MFP on weight-loss / calorie-deficit messaging (also forbidden by our
health-safety rules). Our differentiator is **insight over calorie-counting** — "see what
actually moves the needle." Lead with that.

---

## Motion & polish

- Framer Motion: subtle fade-up-on-scroll reveals per section (staggered, ~16–24px travel,
  ~0.4s) and a gentle float/parallax on the hero mockup. All gated behind
  `prefers-reduced-motion`.
- Generous vertical rhythm (`py-24`/`py-32` between sections), `max-w-6xl` content
  container, consistent card styling (border, `--radius`, soft shadow, subtle hover lift).
- Depth without clutter: one gradient system, one accent (emerald), lots of negative space.
  Avoid neon-glow overload.

---

## Deliverable & verification

- Refactored `src/app/page.tsx` + extracted components under `src/components/marketing/`.
- Run `npm run lint` (clean).
- Verify the page renders correctly in **both dark and light mode** at **mobile and desktop**
  widths before finishing.
