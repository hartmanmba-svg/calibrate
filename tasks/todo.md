# Calibrate Phase 3 — Todo

## Item 1 — National Benchmark Percentiles
- [x] Add `percentile: number | null` to `readiness_scores` Row/Insert/Update in `lib/supabase/types.ts`
- [x] Add percentile query to `computeAndCacheScores()` in `app/actions/scores.ts`
- [x] Add `orPercentile` to `ComputedScores` return type
- [x] Upsert `percentile` alongside `or_readiness` score
- [x] Display percentile on progress page (Top X% / Building benchmark data)

## Item 2 — Shareable Profile Card + Public Route
- [x] Build out `app/p/[token]/page.tsx` — unauthenticated public profile (admin client)
- [x] Add "Share Profile" section to `app/(app)/profile/page.tsx` (fetch/upsert share_link)
- [x] Create `ProfilePrivacyForm` client component with toggle switches
- [x] Add `updateShareSettings()` server action to `app/(app)/profile/actions.ts`
- [x] Create `CopyLinkButton` client component

## Item 3 — Employer Dashboard
- [x] Create `app/(employer)/employer/layout.tsx` with nav header (synchronous, plain `<a>` tags)
- [x] Build `app/(employer)/employer/dashboard/page.tsx` with employer stats
- [x] Build `app/(employer)/employer/team/page.tsx` with staff list + scores
- [x] Build `app/(employer)/employer/reports/page.tsx` placeholder
- [x] `/employer` confirmed in middleware PROTECTED_PATHS

## Item 4 — CE Credit Tracker
- [x] Build out `app/(app)/ce-credits/page.tsx` from stub
- [x] Show total credits, module list, progress bars, completed badges + download certificate links

## Item 5 — Certificate PDF Generation
- [x] Create `app/api/certificates/generate/route.tsx` using `@react-pdf/renderer` (already installed)
- [x] Auth check (401), completion check (404), PDF generation, Uint8Array response
- [x] "Download certificate" link on CE credits page for completed modules

## Finishing
- [x] `npx tsc --noEmit` — passes clean
- [x] `npx next build` — passes clean (26 pages, no errors)
- [x] Updated `tasks/lessons.md` with Phase 3 patterns
- [x] Git commit
