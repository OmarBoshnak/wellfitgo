# Role: Senior Frontend Engineer (React Native + Convex)

Context:
You are working on the Doctor's Plan Dashboard (`app/(app)/doctor/(tabs)/plans.tsx`) for the WellFitGo app.
This screen currently uses hardcoded mock data and is disconnected from the Convex backend.
The goal is to make this screen fully functional, interactive, and intelligent.

IMPORTANT:
Before implementing anything:
- Read the existing `plans.tsx` UI carefully.
- Preserve layout, styling, and UX unless explicitly required to change.
- Read `convex/schema.ts` fully.
- Do NOT invent schema fields or relationships. If something is missing, explain instead of guessing.

Files of Interest:
- UI: `app/(app)/doctor/(tabs)/plans.tsx`
- Schema: `convex/schema.ts` (`weeklyMealPlans`, `dietPlans`, `users`, `mealCompletions`)
- Feature Folder: `src/features/meals/`

---

## 1. The Mission

Refactor `plans.tsx` by replacing all mock data with real-time Convex data.
Implement rule-based intelligent features such as smart suggestions and progress tracking.

---

## 2. Data Connections (Convex Queries)

Create `convex/doctorPlans.ts`.

Note:
- Convex does NOT support native joins.
- Perform joins manually inside Convex functions (not in the client).
- Avoid N+1 queries from the frontend.

### Queries

1. getActivePlans
- Fetch `weeklyMealPlans` where:
  - coachId = current user
  - status = 'active'
- Manually join:
  - `users` → client name + avatar
  - `dietPlans` → program name
- Calculate weekly progress:
  - completed meals / total scheduled meals

2. getDraftPlans
- Fetch `weeklyMealPlans` where status = 'draft'

3. getDietPrograms
- Fetch all available `dietPlans` templates

---

## 3. Intelligent Features (Rule-Based)

1. Smart "Assign Client" Modal
- Show clients without active plans first
- If client goal = "weight_loss":
  - Highlight plans tagged `weight_loss` or `keto` as "Recommended"

2. Real-Time Status Indicators
- Good: >80% adherence
- Warning: <50% adherence
- Paused: plan status = 'paused'

---

## 4. Mutations

- assignPlan: create a `weeklyMealPlans` entry from a `dietPlan`
- pausePlan / resumePlan
- archivePlan

---

## 5. Implementation Steps

### Backend
- Create `convex/doctorPlans.ts`
- Use `Promise.all` where needed
- Keep logic server-side

### Frontend
- Create `src/features/meals/hooks/useDoctorPlans.ts`
- Map Convex results into UI-friendly structures

### UI
- Replace mockActivePlans / mockDraftPlans
- Add loading & empty states
- Handle errors with Toasts

---

## 6. Rules & Guidelines

- Create a shared type `DoctorPlanItem`
- No mock data
- No client-side joins
- No placeholders
- High-performance, production-ready code

---

## 7. Deliverables

- `convex/doctorPlans.ts`
- `useDoctorPlans.ts`
- Refactored `plans.tsx`

Tone:
High precision. Production quality. It just works.
