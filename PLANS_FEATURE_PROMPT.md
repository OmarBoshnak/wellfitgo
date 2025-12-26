# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are working on the **Doctor's Plan Dashboard** (`app/(app)/doctor/(tabs)/plans.tsx`) for the WellFitGo app.
Currently, this screen uses **hardcoded mock data** and is completely disconnected from the backend.
The goal is to make this screen **fully functional, interactive, and intelligent** by connecting it to the Convex backend.

**Files of Interest:**
- UI: `app/(app)/doctor/(tabs)/plans.tsx`
- Schema: `convex/schema.ts` (specifically `weeklyMealPlans`, `dietPlans`, `users`, `mealCompletions`)
- Feature Folder: `src/features/meals/` (You should place new hooks/components here)

---

## 1. The Mission

Refactor `plans.tsx` to replacing all mock data with real-time data from Convex. Implement "Intelligent" features like smart plan suggestions and progress tracking.

### A. Data Connections (Queries)
Create a new file `convex/doctorPlans.ts` (or similar) to handle these queries:
1.  **`getActivePlans`**: Fetch all `weeklyMealPlans` where `coachId` is the current user and `status` is 'active'.
    *   *Join* with `users` to get Client Name and Avatar.
    *   *Join* with `dietPlans` (if applicable) to get the Program Name.
    *   *Calculate Progress*: Count related `mealCompletions` for the current week vs total scheduled meals.
2.  **`getDraftPlans`**: Fetch `weeklyMealPlans` where `status` is 'draft'.
3.  **`getDietPrograms`**: Fetch `dietPlans` (templates) available to the doctor.

### B. Intelligent Features
1.  **Smart "Assign Client" Modal**:
    *   When the doctor clicks "Assign", show a list of clients *without* active plans first.
    *   **Intelligence**: If a client has the goal "weight_loss", highlight plans tagged `weight_loss` or `keto` as "Recommended".
2.  **Real-Time Status Indicators**:
    *   Calculate `status` dynamically:
        *   **Good**: >80% meal adherence this week.
        *   **Warning**: <50% meal adherence.
        *   **Paused**: Plan status is 'paused'.

### C. Mutations (Actions)
1.  **`assignPlan`**: Create a new `weeklyMealPlans` entry based on a `dietPlan` template.
2.  **`pausePlan` / `resumePlan`**: Toggle the status of a plan.
3.  **`archivePlan`**: Move a plan to 'archived'.

---

## 2. Implementation Steps

### Step 1: Backend (Convex)
Create `convex/doctorPlans.ts`.
- Implement `getActivePlans`: careful with the joins. You might need to fetch plans first, then `Promise.all` to fetch user details.
- Implement `getDietPrograms`.
- Implement `assignPlan` mutation.

### Step 2: Frontend Hooks
Create `src/features/meals/hooks/useDoctorPlans.ts`.
- Wrap the Convex queries.
- Return structured data matching the UI needs (mapped from the backend format).

### Step 3: UI Refactor (`plans.tsx`)
- Replace `mockActivePlans` with `useDoctorPlans()`.
- Replace `mockDraftPlans` with real drafts.
- **Loading States**: Add `ActivityIndicator` or Skeleton loaders while fetching.
- **Empty States**: Ensure the "No Active Plans" UI shows correctly when data is empty.

---

## 3. Rules & Guidelines

1.  **Type Safety**: Create a shared type `DoctorPlanItem` that matches the UI's expectation, and map the Convex result to this type in the hook.
2.  **No Mock Data**: Delete `mockActivePlans` and `mockDraftPlans` entirely.
3.  **Performance**: Use `Promise.all` in Convex functions to fetch client data efficiently. Do not make N+1 queries from the client.
4.  **Error Handling**: If a query fails, show a `Toast` or generic error message.

## 4. Deliverables
- `convex/doctorPlans.ts` (New API file)
- `src/features/meals/hooks/useDoctorPlans.ts` (New Hook)
- `app/(app)/doctor/(tabs)/plans.tsx` (Refactored)

**Tone**:
High-precision coding. No placeholders. "It just works."
