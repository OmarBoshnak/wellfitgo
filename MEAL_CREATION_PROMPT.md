# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are making the "Meal Plan Creation" flow fully interactive and connected to the Convex backend.
This involves several components related to creating/editing categories (Diet Plans), building meals, and assigning plans.

**Files of Interest:**
The following files in `src/features/meals/components/` (or `src/features/meal-plans/` if moved):
1.  `EditDietScreen.tsx`
2.  `EditMealCategories.tsx`
3.  `MealBuilderModal.tsx`
4.  `MealPlanCreator.tsx`
5.  `CreateCategoryModal.tsx`

**Schema:** `convex/schema.ts` (`dietPlans`, `weeklyMealPlans`, `meals`, `mealTemplates`)

---

## 1. The Mission

Refactor these components to use Convex Mutations.
Remove hardcoded behavior and connect them to real backend logic.

### A. Create Category Modal
`CreateCategoryModal.tsx`
- **Action**: Call `api.plans.createDietPlan`.
- **Logic**:
    - When the user clicks "Create", send `{ name, nameAr, emoji, description, type: 'custom' }` to the backend.
    - If `autoGenerateRanges` is true, the backend should perhaps generate some default metadata (or just ignore it if out of scope).
    - Close modal and refresh the list (which happens automatically with Convex).

### B. Edit Diet Screen
`EditDietScreen.tsx`
- **Action**: Call `api.plans.updateDietPlan`.
- **Logic**: Allow editing the name, description, and status of an existing plan.

### C. Meal Plan Creator
`MealPlanCreator.tsx`
- **Context**: This likely manages the creation of a `weeklyMealPlan`.
- **Action**: Call `api.plans.createWeeklyPlan`.
- **Logic**:
    - Gather selected client, start date, and assigned diet.
    - Submit to backend.

### D. Meal Builder & Edit Categories
`MealBuilderModal.tsx` / `EditMealCategories.tsx`
- **Context**: Building specific meals (breakfast, lunch).
- **Action**: Call `api.plans.saveMealTemplate` (if saving as template) or just update local state before final submission.

---

## 2. Backend Implementation (Convex)

Update `convex/plans.ts` with these mutations:

1.  `createDietPlan`
    - Args: `{ name, nameAr, emoji, description, type, ... }`
    - Logic: Insert into `dietPlans`.
2.  `updateDietPlan`
    - Args: `{ id, ...updates }`
    - Logic: Patch `dietPlans`.
3.  `createWeeklyPlan`
    - Args: `{ clientId, coachId, startDate, dietPlanId, ... }`
    - Logic: Insert into `weeklyMealPlans`. (Advanced: Copy meals from `dietPlan` to `meals` table if needed).

---

## 3. Frontend Implementation

- **Hooks**: Create `src/features/meals/hooks/usePlanMutations.ts` to expose these mutations.
- **Refactor**: Update each component to:
    1.  Accept necessary props (e.g., `dietId`, `clientId`).
    2.  Use the mutation hooks.
    3.  Handle loading/error states.
    4.  Show success feedback (Toast).

---

## 4. Execution Rules

1.  **Cleanup**:
    *   **DELETE** the legacy folder `src/component/doctor/plans/` and all its contents.
    *   Ensure all imports in the app point to `src/features/meals/components/`.
2.  **Schema Alignment**:
    *   `CreateCategoryModal` implies creating a 'Category'. In our schema, this maps to creating a `dietPlan` with `type="custom"` and `isTemplate=true`.
3.  **Strict Types**: Use `Id<"tableName">` for all ID props.

## 5. Deliverables

- `convex/plans.ts` (Mutations)
- `src/features/meals/hooks/usePlanMutations.ts`
- Refactored components in `src/features/meals/components/`
- **Deleted** `src/component/doctor/plans/`

**Tone**:
Action-oriented. Full-stack integration.
