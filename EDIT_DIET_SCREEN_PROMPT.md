# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are implementing full functionality for the `EditDietScreen` in a production React Native application.

**The screen currently renders correctly but:**
*   The "Save" and "Delete" actions are non-functional placeholders.
*   The "Meal Editor" relies on mock data instead of real plan data.

Your task is to wire the UI to real Convex mutations, ensure correct data binding, and enforce safe, production-grade UX patterns.

**Files in Scope:**
*   Frontend:
    *   `src/features/meals/components/EditDietScreen.tsx`
    *   `src/features/meals/hooks/usePlanMutations.ts`
*   Backend:
    *   `convex/plans.ts`
    *   `convex/schema.ts` → `dietPlans`

---

## 1. Mission Objectives

### A. Delete Action (Soft Delete / Archive)
Implement a soft delete behavior.

**UI Behavior**:
1.  User taps the Trash icon.
2.  Show a confirmation dialog (`Alert.alert`).
3.  If confirmed:
    *   Call `archiveDietPlan`.
    *   Show loading state.
    *   Navigate back on success.

**Data Rule**: Do NOT delete the document. Mark it as archived.

### B. Save / Edit Action
Make the Save button fully functional.

**Behavior**:
1.  Collect all editable fields:
    *   Name
    *   Description
    *   Calories / calorie range
    *   Meal configuration (meals, categories, structure)
2.  On Save:
    *   Call `updateDietPlan`.
    *   Show loading indicator.
    *   Disable Save/Delete while loading.
    *   Show success toast on completion.

### C. Data Binding (Critical)
*   **Remove all mock data.**
*   Replace `MOCK_MEALS`.
*   **Initialize local state from**: `diet.meals` OR `diet.dailyMeals` (based on schema).
*   The Meal Plan Editor must reflect real persisted structure.
*   All edits should be local state only until Save is pressed.

---

## 2. Backend Implementation (Convex)

### Mutation: `archiveDietPlan`
File: `convex/plans.ts`

```typescript
archiveDietPlan({
  id: Id<"dietPlans">
})
```

**Logic**:
*   Patch the document:
    *   `status: "archived"`
    *   `isActive: false`
*   No deletes. No cascading effects.

### Mutation: `updateDietPlan`
```typescript
updateDietPlan({
  id: Id<"dietPlans">,
  updates: Partial<DietPlan>,
  meals?: Meal[]
})
```

**Logic**:
*   Patch top-level fields: name, description, calories, status (if applicable).
*   If `meals` are provided: Update the diet plan’s stored meal structure.
*   **Note**: Assume meals are stored inside `dietPlans` for this task. If your schema supports external meal tables, handle mapping server-side.

**Rules**:
*   Validation lives in Convex, not the UI.
*   Enforce schema enums only.

---

## 3. Frontend Implementation

### A. Hook Update
File: `usePlanMutations.ts`

Expose:
*   `updateDietPlan`
*   `archiveDietPlan`

Each mutation must provide:
*   `isLoading`
*   `onSuccess`
*   `onError`

### B. `EditDietScreen` Refactor

**1. Delete (Archive)**
*   Wire Trash icon.
*   Show confirmation alert.
*   Call `archiveDietPlan(diet._id)`.
*   Navigate back on success.

**2. Save**
*   Wire Save button.
*   Gather all local state (plan fields, meals editor state).
*   Call `updateDietPlan`.
*   Disable buttons while saving.
*   Show success feedback.

**3. Meal Editor State**
*   Initialize state from `props.diet`.
*   Allow adding/removing meals and editing categories.
*   **Do NOT persist until Save is pressed.**
*   Pass updated meals structure to backend on save.

---

## 4. Execution Rules (Strict)

*   **Soft delete only** — never remove records.
*   **Type safety mandatory**: Use `Id<"dietPlans">`.
*   **UX Requirements**:
    *   Show `ActivityIndicator` during save/delete.
    *   Disable Save/Delete during loading.
    *   No silent failures.

## 5. Deliverables

You must produce:
1.  `convex/plans.ts` (archiveDietPlan, Updated updateDietPlan)
2.  `usePlanMutations.ts` (Includes archive mutation)
3.  `EditDietScreen.tsx` (Fully functional, No mock data, Real Convex integration)

**Quality Bar**:
Production-grade. Type-safe. No mock data. No hardcoded logic. Clear state → backend lifecycle separation.
