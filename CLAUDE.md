# CLAUDE.md — Calibrate
**Read this file at the start of every session.**

---

## What this project is

Calibrate is a web-first PWA for intraoperative neuromonitoring (IONM) professionals. It delivers spaced repetition flashcards, clinical Q&A, specialty readiness scoring, national benchmarking, gamification, CE credit tracking, and an employer team dashboard.

Target users: IONM practitioners at all career stages — students, CNIM candidates, certified practitioners, supervisors.

---

## Stack — never deviate from these choices

| Layer | Choice |
|---|---|
| Framework | Next.js 14 — App Router only. Never use Pages Router. |
| Language | TypeScript — strict mode. No `any` types. |
| Styling | Tailwind CSS — utility classes only, no custom CSS files except globals.css |
| Database | Supabase — Postgres, Auth, Storage, Edge Functions |
| SRS | ts-fsrs npm package — FSRS v5 algorithm |
| Payments | Stripe — subscriptions + webhooks |
| Email | Resend |
| Animations | Framer Motion |
| State | Zustand — no Redux, no Context for global state |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer — for CE certificates |
| Hosting | Vercel |

---

## Brand and design tokens

```
App name: Calibrate
Tagline: Sharpen your edge.

Colors:
  --navy:   #2C3E50   (primary background)
  --dark:   #1A252F   (surface / card background)
  --orange: #E8611A   (primary accent — CTAs, active states, logo)
  --teal:   #1ABBE8   (secondary accent — section headings, progress)
  --white:  #FFFFFF
  --muted:  #8A97A5   (secondary text)
  --gold:   #F4C430   (Trainer credential)
  --red:    #E24B4A   (alerts, below-average scores)
  --green:  #5DCAA5   (above-average, success states)
  --border: rgba(255,255,255,0.10)

Fonts (Google Fonts):
  Oswald — headings, labels, numbers, nav
  Open Sans — body text, descriptions

Logo: "calibrate." — lowercase, Oswald 600, --orange only. Never two-tone.
```

---

## Database schema — canonical reference

Always use these exact table and column names. Never rename them.

```
profiles           — user data, career_stage, xp, level, streak fields
employers          — B2B accounts, seat_count, admin_user_id
cards              — front, back, explanation, modality, case_type, card_type
card_reviews       — FSRS state per user per card (upsert on review)
review_log         — append-only review history (insert only, never update)
readiness_scores   — computed scores cached daily, score_type + score + percentile
credentials        — trainer / educator / fellow, status active/warning/paused
badges             — badge_key + earned_at per user
ce_modules         — CE module definitions
ce_completions     — user progress through CE modules, certificate_url
subscriptions      — Stripe subscription state, synced via webhooks
share_links        — token + user_id + privacy settings for public profile
```

### Card taxonomy — three axes (always use these exact string values)

**Axis 1 — modality:**
`ssep` | `mep` | `emg_free` | `emg_triggered` | `eeg` | `baep` | `vep` | `dwave`

**Axis 2 — case_type:**
`cervical` | `lumbar` | `scoliosis` | `carotid` | `vascular` | `supratentorial` | `posterior_fossa` | `skull_base` | `peripheral_nerve` | `spinal_tumor` | `tethered_cord` | `pediatric`

**Axis 3 — card_type:**
`didactic` | `clinical`

---

## FSRS — how ratings map

```typescript
// User sees:       "Missed it"  "Almost"   "Got it"
// calibrateRating:     1           2           3
// FSRS Rating:      Again        Hard        Good

import { Rating } from 'ts-fsrs';
const ratingMap = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good };
```

Never expose FSRS internal terminology (Again/Hard/Good/Easy) in the UI.
Always show: **Missed it / Almost / Got it**
Always show next review interval below each button.

---

## Readiness scores — how they work

- **OR Readiness**: weighted average of recent 30-day review accuracy across all modalities
- **Specialty scores**: same calculation filtered by `case_type`
- Minimum 10 reviews required before a specialty score renders (show "Not enough data" otherwise)
- Scores are 0–100 integers
- Percentiles compare against users with the same `career_stage`
- Computed nightly via Supabase Edge Function cron + on-demand when user opens progress screen
- Cached in `readiness_scores` table

---

## Credentials — rules

| Credential | Requirement | Decay rule |
|---|---|---|
| Trainer | 90%+ clinical accuracy for 30 consecutive days | Paused if drops below 80% for 14 days |
| Educator | 90%+ didactic accuracy for 30 consecutive days | Same |
| Fellow | CNIM certified + all specialty scores above 80 | No decay — earned permanently |

---

## SRS session flow

1. Fetch due cards: `WHERE user_id = ? AND due <= now()` from `card_reviews`, joined to `cards`
2. If no cards due, offer "Study ahead" mode (next 20 cards not yet due)
3. Show question side → user thinks → tap "Reveal answer"
4. Answer revealed → user taps Missed it / Almost / Got it
5. Call `processReview(userId, cardId, rating)` — updates `card_reviews`, inserts to `review_log`
6. Show XP toast (+5 for Missed, +10 for Almost, +15 for Got it + streak multiplier)
7. Next card

---

## Stripe subscription tiers

```
Monthly:  $14.99/mo   — plan: 'monthly'
Annual:   $107.88/yr  — plan: 'annual'   (shown as $8.99/mo, saves 40%)
Lifetime: $149 once   — plan: 'lifetime'
Team:     $9.99/seat/mo — plan: 'team'
```

Free tier: 20 cards total, no specialty scores, no benchmarks, no CE credits.
Trial: 7-day free trial on Annual plan via Stripe trial period.

Webhook events to handle:
- `checkout.session.completed` → activate subscription
- `customer.subscription.updated` → sync status
- `customer.subscription.deleted` → downgrade to free
- `invoice.payment_failed` → send warning email

---

## Auth and access control

- Supabase Auth: email/password + Google OAuth
- `career_stage` set during onboarding: `student` | `candidate` | `certified` | `supervisor`
- Employers access staff data via `employer_id` FK on `profiles`
- Practitioners can revoke employer access — sets `employer_id = null`
- Employers can READ scores but never WRITE to practitioner data
- Public profile cards are unauthenticated — served at `/p/[token]`

---

## Route structure (App Router)

```
(marketing)/          — public, no auth required
(auth)/               — login, signup, onboarding
(app)/                — requires active session
  dashboard/          — home screen
  study/              — flashcards, quiz, drill
  progress/           — career path, benchmarks, achievements
  resources/          — guides, videos, case libraries
  ce-credits/         — CE tracker + certificates
  profile/            — shareable profile card + privacy controls
  settings/
(employer)/           — requires employer role
  dashboard/
  team/
  benchmarks/
  reports/
api/
  stripe/webhook/     — Stripe events
  scores/compute/     — on-demand score recalculation
  certificates/generate/ — PDF generation + email
  p/[token]/          — public profile data
```

---

## Gamification rules

- XP per review: Missed it = +5, Almost = +10, Got it = +15
- Streak multiplier: days 8–14 = 1.2x, days 15–29 = 1.5x, days 30+ = 2x
- Level thresholds: 1→2 = 100 XP, each subsequent level = previous × 1.4, rounded to nearest 50
- Streak: increments if user reviews at least 1 card per calendar day (user's local timezone)
- Streak shield badge: protects one missed day, earned at 30-day streak
- Daily missions reset at midnight local time: review 20 cards (+30 XP), score 80%+ on a drill (+50 XP), maintain streak (+10 XP)

---

## Common mistakes to avoid

1. **Never query Supabase with service role key on the client** — service role key is server-only
2. **Always test RLS policies** — query once with service role (should return data), once with anon key (should respect policy)
3. **Stripe webhooks are async** — never make the user wait for webhook to activate subscription. Use optimistic UI on success page, let webhook sync in background
4. **FSRS card state is per-user** — never mutate `cards` table on review, only `card_reviews`
5. **Percentiles require minimum sample** — don't compute percentile with fewer than 50 users in cohort; show "Building benchmark data" instead
6. **Specialty scores need minimum reviews** — require 10+ reviews in a case_type before showing score
7. **PWA manifest theme_color** must match nav background: `#1A252F`

---

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_ANNUAL
STRIPE_PRICE_LIFETIME
STRIPE_PRICE_TEAM
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

---

## Build order — follow this sequence

### Phase 1 (weeks 1–6) — Core loop
- [ ] Next.js project init + Supabase schema + auth
- [ ] Card seed data (200 SSEP cards to start)
- [ ] FSRS review session (flashcard screen)
- [ ] Streak + XP tracking
- [ ] Stripe paywall (Monthly + Annual + 7-day trial)

### Phase 2 (weeks 7–10) — Scoring
- [ ] OR Readiness score calculation
- [ ] Spinal specialty score
- [ ] Progress screen + career path
- [ ] Badge system (10 badges)
- [ ] Daily missions

### Phase 3 (weeks 11–16) — Social + B2B
- [ ] National benchmark percentiles
- [ ] Shareable profile card + public route
- [ ] Employer dashboard
- [ ] CE credit tracker
- [ ] Certificate PDF generation

### Phase 4 (weeks 17–20) — Polish
- [ ] PWA offline support for flashcards
- [ ] Weekly case drop
- [ ] Web push notifications
- [ ] Remaining specialty scores + credentials

---

*Keep this file updated as decisions change. This is the source of truth for every Claude Code session.*
