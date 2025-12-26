# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are fully refactoring the "Meal Plan Creation" flow in our React Native app to be interactive, backend-connected, and production-ready. This involves creating/editing diet plans, building meals, and assigning plans to clients.

The goal is to remove all hardcoded behavior, strictly use Convex mutations, and maintain type safety, proper state management, and lifecycle control.

**Files of Interest (frontend):**
1.  `src/features/meals/components/EditDietScreen.tsx`
2.  `src/features/meals/components/EditMealCategories.tsx`
3.  `src/features/meals/components/MealBuilderModal.tsx`
4.  `src/features/meals/components/MealPlanCreator.tsx`
5.  `src/features/meals/components/CreateCategoryModal.tsx`

**Schema Reference:** `convex/schema.ts` (`dietPlans`, `weeklyMealPlans`, `meals`, `mealTemplates`)

---

## 1. Mission

Refactor the components to:
1.  Use Convex mutations for all creation/update actions.
2.  Remove all hardcoded data/constants.
3.  **Ensure state and backend lifecycle are clearly separated**:
    *   Only commit to the database when the parent plan is saved.
    *   `MealBuilderModal` edits local state only until submission, unless explicitly saving as a template.
4.  Preserve styling and UX.

---

## 2. Backend Implementation (Convex)

Add/Update the following mutations in `convex/plans.ts`:

### A. `createDietPlan`
*   **Args**: `{ name, nameAr, emoji, description, type, isTemplate: true }`
*   **Logic**: Insert into `dietPlans`.
*   **Rule**: Must handle validation/defaults server-side, not in UI.

### B. `updateDietPlan`
*   **Args**: `{ id: Id<"dietPlans">, updates: Partial<DietPlan> }`
*   **Logic**: Patch `dietPlans`.
*   **Rule**: Only allow valid enum values (type, status, etc.).

### C. `createWeeklyPlan`
*   **Args**: `{ clientId, coachId, startDate, dietPlanId, ... }`
*   **Logic**: Insert into `weeklyMealPlans`.
*   **Detail**: Optionally copy meals from `dietPlan` to `meals` table if needed.

### D. `updateWeeklyPlan`
*   **Args**: `{ id: Id<"weeklyMealPlans">, updates: Partial<WeeklyMealPlan> }`
*   **Logic**: Patch `weeklyMealPlans`.

### E. `saveMealTemplate`
*   **Args**: `{ meal: MealTemplate }`
*   **Logic**: Save meal templates if the user chooses to persist a meal independently.

**General Rules**:
*   All derived values, validation, and defaults must live in Convex, not frontend.
*   Only enum values defined in the schema may be used.

---

## 3. Frontend Implementation

### A. Hooks
Create `src/features/meals/hooks/usePlanMutations.ts` exposing all mutations (`createDietPlan`, `updateDietPlan`, `createWeeklyPlan`, `updateWeeklyPlan`, `saveMealTemplate`).
*   Handle loading, success, and error states.

### B. Component Refactor

**1. `CreateCategoryModal.tsx`**
*   Submit `{ name, nameAr, emoji, description, type: 'custom', isTemplate: true }` via `createDietPlan`.
*   Close modal and refresh list on success.

**2. `EditDietScreen.tsx`**
*   Use `updateDietPlan`.
*   Allow editing name, description, status.
*   Validation handled in backend.

**3. `MealPlanCreator.tsx`**
*   Use `createWeeklyPlan`.
*   Gather selected client, start date, and diet plan.
*   Persist only on submit.

**4. `MealBuilderModal.tsx` / `EditMealCategories.tsx`**
*   Edit meals in local state only.
*   Optional: save as template using `saveMealTemplate`.
*   **Do not persist to backend until parent plan is submitted.**

### C. UI/UX Rules
1.  Show loading and error states for all backend calls.
2.  Provide success feedback (e.g., toast) on successful mutation.
3.  Keep all visual design consistent with current app (colors, scaling, RTL support).
4.  Handle all ID props using `Id<"tableName">` for type safety.
5.  **Data Flow**: Ensure parent-child data flow is clear: `MealBuilder` updates parent state only; parent submits data to backend.

---

## 4. Cleanup Rules

1.  **Delete** the legacy folder `src/component/doctor/plans/` **only after** all imports are migrated and verified.
2.  Update all import paths to use `src/features/meals/components/`.

## 5. Deliverables

1.  `convex/plans.ts` (all mutations)
2.  `src/features/meals/hooks/usePlanMutations.ts`
3.  Refactored components:
    *   `CreateCategoryModal.tsx`
    *   `EditDietScreen.tsx`
    *   `MealPlanCreator.tsx`
    *   `MealBuilderModal.tsx`
    *   `EditMealCategories.tsx`
4.  **Deleted** `src/component/doctor/plans/` (after safe migration)

**Tone**:
Action-oriented. Full-stack integration. Data-driven. Safe, robust, and type-safe. Zero hardcoded behavior.
