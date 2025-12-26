# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are refactoring the `CalorieRangesList` component (`src/features/meals/components/CalorieRangesList.tsx`).
Currently, this component displays a hardcoded list of "Calorie Ranges".
However, the database (`dietPlans` table) actually contains **distinct named plans** for each category (e.g., "Low Carb Diet 1", "Classic Diet 1400", etc.), as verified by database screenshots.

**Files of Interest:**
- UI: `src/features/meals/components/CalorieRangesList.tsx` (Target for refactor)
- Schema: `convex/schema.ts` (`dietPlans`)

---

## 1. The Mission

Refactor this component to display the **actual list of diet plans** from the database for a selected category, rather than artificial "ranges".

1.  **Rename**: Change the component name from `CalorieRangesList` to `DietPlansList` to reflect reality.
2.  **Fetch**: Query the `dietPlans` table for all active plans matching the selected `type`.
3.  **Display**: List each plan's `name`, `nameAr`, and `targetCalories`.

---

## 2. Backend Implementation (Convex)

Update `convex/plans.ts`.

### Query: `getDietsByType`
- **Arguments**: `{ type: string }`
- **Logic**:
  1. Query `dietPlans` using the `by_type_active` index.
  2. Filter where `type` matches the argument and `isActive === true`.
  3. Sort results (e.g., by `targetCalories` ascending, or `sortOrder` if available).
- **Return Shape**:
  ```typescript
  {
    id: string;
    name: string;        // e.g. "Low Carb Diet 1"
    nameAr?: string;     // e.g. "دايت لو كارب 1"
    description?: string;
    targetCalories?: number; // e.g. 1500
    emoji?: string;
    mealsCount: number;  // Length of 'meals' array or 'dailyMeals' keys
    usageCount: number;
  }[]
  ```

---

## 3. Frontend Implementation

### A. Hook
Create `src/features/meals/hooks/useDietsByType.ts`.
- Wrapper for `useQuery(api.plans.getDietsByType, { type: category.id })`.

### B. Component Refactor (`DietPlansList.tsx`)
- **Rename File**: `CalorieRangesList.tsx` -> `DietPlansList.tsx`.
- **Props**: Update to receive the `category` object (from the previous grid selection).
- **Render Logic**:
  - Iterate over the fetched plans.
  - **Title**: Display `plan.name` (and `plan.nameAr` as subtitle/secondary).
  - **Badge**: Display `plan.targetCalories` with a fire emoji (e.g., "🔥 1500 kcal").
    - *Fallback*: If `targetCalories` is missing, hide the badge.
  - **Meta**: Display "Meals: X" based on the `mealsCount` returned.

---

## 4. Execution Rules

1.  **Accuracy**: The UI must match the database reality shown in the screenshot. E.g., if the DB says "Classic Diet 1400", display exactly that. Do not try to parse it into a range "1300-1400" unless that logic exists on the backend.
2.  **Zero Mock Data**: Remove `CALORIE_RANGES` constant.
3.  **Preserve Styling**: Keep the existing Card layout (Header, Banner, List), but adapt the *content* of the cards to match the new data structure.

## 5. Deliverables

- `convex/plans.ts` (with `getDietsByType`)
- `src/features/meals/hooks/useDietsByType.ts`
- `src/features/meals/components/DietPlansList.tsx` (Renamed & Refactored)

**Tone**:
Precise. Data-driven.
