# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are making the `EditDietScreen` (`src/features/meals/components/EditDietScreen.tsx`) fully functional.
Currently, the "Save" and "Delete" buttons are placeholders, and the meal editor uses mock data.

**Files of Interest:**
- UI: `src/features/meals/components/EditDietScreen.tsx`
- Schema: `convex/schema.ts` (`dietPlans`)

---

## 1. The Mission

Make the Edit/Delete actions real.

1.  **Delete Action**: Implement "Soft Delete" (Archive).
    *   When the user clicks the Trash icon, show a confirmation alert.
    *   On confirm, call `archiveDietPlan` (sets `status: 'archived'`, `isActive: false`).
    *   Navigate back on success.
2.  **Edit/Save Action**:
    *   Collect all changes (Name, Description, Calories, Meals configuration).
    *   On "Save", call `updateDietPlan`.
    *   Show a loading state and success Toast.
3.  **Data Binding**:
    *   Replace `MOCK_MEALS` with the actual meals from the `diet` prop.
    *   Ensure the "Meal Plan Editor" section reflects the real plan structure.

---

## 2. Backend Implementation (Convex)

Update `convex/plans.ts`:

### Mutation: `archiveDietPlan`
- **Args**: `{ id: Id<"dietPlans"> }`
- **Logic**:
  - Patch the plan: `{ status: 'archived', isActive: false }`.

### Mutation: `updateDietPlan`
- **Args**: `{ id: Id<"dietPlans">, updates: Partial<DietPlan>, meals?: Meal[] }`
- **Logic**:
  - Patch the top-level fields (name, description, etc.).
  - **Advanced**: If `meals` are provided, you might need to update the `meals` json column or the related `meals` table rows depending on your schema strategy.
  - *Constraint*: For this task, assume we are updating the `dietPlans` document itself. If meals are stored separately, handle that logic server-side.

---

## 3. Frontend Implementation

### A. Hook
Update `src/features/meals/hooks/usePlanMutations.ts` to include `archiveDietPlan`.

### B. Component Refactor (`EditDietScreen.tsx`)

1.  **Delete Button**:
    - Wire up the `Trash2` icon in the header (or where appropriate).
    - Use `Alert.alert` for confirmation.
    - Call `archiveDietPlan`.

2.  **Save Button**:
    - Wire up the "Save" button.
    - Gather local state (`calorieRange`, `goalDescription`, `mealsPerDay`, etc.).
    - Call `updateDietPlan`.

3.  **Meal Editor State**:
    - Initialize local state from `props.diet.meals` (or `dailyMeals`).
    - Allow the user to add/remove meals or categories locally.
    - Pass this updated structure to `updateDietPlan` on save.

---

## 4. Execution Rules

1.  **Soft Delete Only**: Do not remove data from the DB.
2.  **Type Safety**: Use `Id<"dietPlans">`.
3.  **UX**:
    - Show `ActivityIndicator` during save/delete.
    - Disable buttons while loading.

## 5. Deliverables

- `convex/plans.ts` (archive/update mutations)
- `src/features/meals/hooks/usePlanMutations.ts`
- `src/features/meals/components/EditDietScreen.tsx` (Functional)

**Tone**:
Production-ready. Safe data handling.
