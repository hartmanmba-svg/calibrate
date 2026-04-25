# Calibrate Phase 5 — Todo

## Task 1 — tasks/todo.md
- [x] Create/overwrite tasks/todo.md with Phase 5 checklist

## Task 2 — lib/subscription.ts
- [x] Create server-side getSubscription(userId) helper

## Task 3 — app/(marketing)/pricing/page.tsx
- [x] Update pricing page with correct feature lists and plan CTAs
- [x] Ensure (marketing)/layout.tsx exists (already present)

## Task 4 — components/UpgradePrompt.tsx
- [x] Create UpgradePrompt client component (lock icon, feature name, upgrade CTA)

## Task 5 — Paywall gates in existing pages
- [x] app/(app)/progress/page.tsx — gate specialty grid for free users
- [x] app/(app)/ce-credits/page.tsx — gate entire page for free users
- [x] app/(app)/study/flashcards/page.tsx — gate after 20 card reviews for free users

## Task 6 — Settings subscription section + billing portal
- [x] Add Subscription section to app/(app)/settings/page.tsx
- [x] Create app/api/billing-portal/route.ts (POST → Stripe portal session)

## Task 7 — Post-checkout success page
- [x] Create app/(app)/checkout/success/page.tsx

## Task 8 — Onboarding redirect gate
- [x] Make app/(app)/layout.tsx async, add profile check + redirect to /onboarding
- [x] Add x-pathname header injection in middleware.ts

## Task 9 — Update api/checkout/route.ts
- [x] Add team plan support, allow_promotion_codes, update success_url

## Task 10 — Type-check and build
- [x] npx tsc --noEmit — passes clean
- [x] npx next build — passes clean (31 pages, no errors)

## Task 11 — Update tasks/todo.md (check off completed items)
- [x] Mark all completed items

## Task 12 — Git commit
- [x] git add -A && git commit
