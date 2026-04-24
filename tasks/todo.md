# Calibrate Phase 4 — Todo

## Item 1 — PWA Offline Support for Flashcards
- [x] Create public/manifest.json
- [x] Add manifest link + theme-color meta tag to app/layout.tsx
- [x] Create public/sw.js (service worker — vanilla JS)
- [x] Create app/offline/page.tsx (standalone offline fallback)
- [x] Create app/(app)/components/ServiceWorkerRegistrar.tsx (client component)
- [x] Import + render ServiceWorkerRegistrar in app/layout.tsx

## Item 2 — Weekly Case Drop
- [x] Create lib/weekly-case.ts with WeeklyCase type + CURRENT_WEEKLY_CASE constant
- [x] Create app/(app)/resources/components/WeeklyCaseQuiz.tsx (client component)
- [x] Build out app/(app)/resources/page.tsx (server component wrapping quiz + resource cards)

## Item 3 — Web Push Notifications
- [x] Create .env.local.example with VAPID key placeholders
- [x] Create app/api/push/subscribe/route.ts (POST handler)
- [x] Create app/api/push/send/route.ts (POST handler placeholder)
- [x] Create app/(app)/settings/components/PushNotificationToggle.tsx (client component)
- [x] Build out app/(app)/settings/page.tsx (server wrapper + notification + account + danger zone)

## Item 4 — Remaining Specialty Scores + Credentials
- [x] Add computeVascularScore, computeCranialScore, computePediatricsScore, computeExtremityScore, computeSpinalTumorScore to app/actions/scores.ts
- [x] Update computeAndCacheScores() to return all 6 specialty score groups
- [x] Update ComputedScores type
- [x] Update app/(app)/progress/page.tsx — fill specialty grid with live data
- [x] Create app/actions/credentials.ts — checkCredentials(userId)
- [x] Call checkCredentials from processReview in app/actions/review.ts
- [x] Add credentialsUpdated: boolean to ProcessReviewResult
- [x] Add Credentials section to app/(app)/progress/page.tsx

## Finishing
- [x] npx tsc --noEmit — passes clean
- [x] npx next build — passes clean (29 pages, no errors)
- [x] Updated tasks/lessons.md with Phase 4 patterns
- [x] Git commit
