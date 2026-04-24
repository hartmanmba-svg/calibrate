# Calibrate Phase 2 Steps 2–5 — Todo

## Step 2 — Spinal Specialty Score
- [x] Add `computeSpinalScore(userId)` to `app/actions/scores.ts`
- [x] Note: 'spinal' is NOT in DB score_type enum — derive from individual case scores (cervical, lumbar, scoliosis, tethered_cord, spinal_tumor) combined in memory
- [x] `computeAndCacheScores()` now also returns `spinalScore: number | null`
- [x] Progress page calls and displays spinal score

## Step 3 — Progress Screen + Career Path
- [x] Rebuilt `app/(app)/progress/page.tsx` with 5-stage stepper (Student → Trainee → Candidate → CNIM → Expert)
- [x] Added Score Rings section: OR Readiness + Spinal side by side
- [x] Added Specialty Score Grid (7 cells as specified, Spinal Tumors locked for student/candidate)
- [x] Badge Shelf section added (Step 4 implementation included here)
- [x] Updated `ReadinessRing` to accept a `label` prop

## Step 4 — Badge System
- [x] Created `lib/badges.ts` with BADGE_DEFINITIONS and BadgeKey union type (10 badges)
- [x] Added migration `supabase/migrations/20260424000000_add_consecutive_got_it.sql`
- [x] Updated `lib/supabase/types.ts` profiles to add `consecutive_got_it: number`
- [x] Added `checkAndAwardBadges(userId, context)` to `app/actions/review.ts`
- [x] Updated `processReview` to track `consecutive_got_it`, call `checkAndAwardBadges`
- [x] Added `earnedBadges: string[]` to `ProcessReviewResult`
- [x] Badge Shelf on progress page: earned in color, unearned greyed with 🔒

## Step 5 — Daily Missions
- [x] Added migration `supabase/migrations/20260424000001_add_daily_missions.sql`
- [x] Updated `lib/supabase/types.ts` profiles to add `daily_missions: Json | null`
- [x] Created `DailyMissions` type in `app/actions/review.ts`
- [x] Added `checkDailyMissions(userId, context)` to `app/actions/review.ts`
- [x] `processReview` calls `checkDailyMissions`
- [x] Added `completedMissions: string[]` to `ProcessReviewResult`
- [x] Added Daily Missions section to `app/(app)/dashboard/page.tsx`

## Finishing
- [x] `npx tsc --noEmit` — passes clean (no output)
- [x] `npx next build` — passes clean (26 pages, no errors)
- [x] All items marked complete
- [x] Created `tasks/lessons.md`
- [ ] Commit with specified message
