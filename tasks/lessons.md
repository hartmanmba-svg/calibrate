# Lessons Learned — Phase 2 Steps 2–5

## 1. DB enum constraint means no ad-hoc score_type values

The `score_type` DB enum in `readiness_scores` only contains: `or_readiness` + the 12 individual case types. There is no `'spinal'` value.

**Pattern used:** Compute the spinal score in application memory by filtering reviews across the 5 spinal case types (`cervical`, `lumbar`, `scoliosis`, `tethered_cord`, `spinal_tumor`) before upserting. Return `spinalScore` from `computeAndCacheScores()` without writing it as a separate DB row.

**If you need a persistent spinal cache in future:** Add `'spinal'` to the DB enum via a migration:
```sql
ALTER TYPE score_type ADD VALUE IF NOT EXISTS 'spinal';
```
Then add `'spinal'` to the `ScoreType` union in `lib/supabase/types.ts`.

## 2. review_log does not have case_type — join to cards

The `review_log` table only has `card_id`. To filter by `case_type`, you must use Supabase's relational query syntax: `.select('rating, cards(case_type)')`. This performs a join via the FK `review_log.card_id → cards.id`. The type system doesn't model this FK in `Relationships: []`, so an `as unknown as ReviewRow[]` cast is required.

## 3. admin client for score computation, server client for reading user data

- Use `createAdminClient()` in server actions that read from `review_log` (bypasses RLS for aggregate queries).
- Use `createClient()` in page server components fetching the authenticated user's own data (`profiles`, `readiness_scores`, `badges`) — these tables have RLS policies for `auth.uid() = user_id`.

## 4. Never async layout components

All components in `app/(app)/` layout files must be synchronous. Only `page.tsx` files that are explicitly page-level components can be `async`. Sub-components defined in the same file as the page can be synchronous functions even when the page is async.

## 5. ReadinessRing label prop — backward compatible

Adding an optional `label?: string` prop (defaulting to `'OR Readiness'`) keeps existing call sites working without changes while allowing the ring to be reused for the Spinal score.

## 6. Daily missions: null check and date reset pattern

Daily missions are stored as `JSONB` in `profiles.daily_missions`. The pattern:
1. If `null` or `dm.date !== todayDate` → reset to default 3 missions (all incomplete).
2. Check completion conditions.
3. Upsert the updated JSON blob back.

This keeps the missions stateless from the DB schema perspective (no separate missions table needed for Phase 2) and resets automatically at midnight.

## 7. consecutive_got_it reset on every non-"Got it" rating

The `consecutive_got_it` field resets to 0 on any rating that isn't 3 (Got it). This must be done atomically in the same `profiles.update()` call as XP and streak to avoid race conditions.

## 8. Spinal Tumors specialty cell — locked by career_stage

The lock check uses: `careerStage === 'certified' || careerStage === 'supervisor'`. Students and candidates see a lock icon + "Unlocks at CNIM". This is a display-only gate — no DB-level enforcement needed at Phase 2.

## 9. TypeScript cast for JSONB columns

Supabase types `JSONB` columns as `Json | null`. When reading structured data back from JSONB (like `DailyMissions`), use `as unknown as DailyMissions` — direct casting from `Json` is not safe because `Json` is a union type. Always null-check before casting.
