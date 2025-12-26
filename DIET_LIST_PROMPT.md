# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are refactoring the `CalorieRangesList` component (`src/features/meals/components/CalorieRangesList.tsx`).
Currently, this component displays a hardcoded list of artificial “Calorie Ranges”.
However, the database (`dietPlans` table in `convex/schema.ts`) contains real, named diet plans (e.g. “Classic Diet 1400”, “Low Carb Diet 1”, etc.).
These plans already encode calorie intent and structure and must be treated as the single source of truth.
The UI must reflect exactly what exists in the database, without inventing abstractions.

**Files of Interest:**
- UI (to refactor): `src/features/meals/components/CalorieRangesList.tsx`
- Schema (source of truth): `convex/schema.ts` → `dietPlans`
- Backend logic: `convex/plans.ts`

---

## 1. The Mission

Refactor the component to display the actual list of diet plans for a selected category (type), instead of fake calorie ranges.

### Required Changes

1.  **Rename the Component**:
    *   `CalorieRangesList` → `DietPlansList`
    *   Rename both the file and the component export.
2.  **Data Source**:
    *   Fetch diet plans from the `dietPlans` table.
    *   Only include plans where `isActive === true`.
3.  **Filtering**:
    *   Filter by the selected diet type (coming from the previous category selection).
4.  **Display**:
    *   Render each individual plan as its own list item/card.
    *   Do not group or transform plans into ranges.

---

## 2. Backend Implementation (Convex)

Update or create `convex/plans.ts`.

### Query: `getDietsByType`

**Arguments**:
The `type` argument must exactly match the schema union. Do NOT accept arbitrary strings.
```typescript
{
  type:
    | "keto"
    | "weekly"
    | "classic"
    | "low_carb"
    | "high_protein"
    | "intermittent_fasting"
    | "vegetarian"
    | "maintenance"
    | "muscle_gain"
    | "medical"
    | "custom";
}
```

**Query Logic**:
1.  Use the `by_type_active` index on `dietPlans`.
2.  Filter where:
    *   `type === args.type`
    *   `isActive === true`
3.  Sort results deterministically using this priority:
    1.  `sortOrder` (ascending) — if present
    2.  `targetCalories` (ascending) — if present
    3.  `createdAt` (ascending) — fallback

**Derived Fields**:
Compute `mealsCount` using explicit rules:
*   If `format === "general"`: `mealsCount = meals.length`
*   If `format === "daily"`: `mealsCount = sum of all day.meals.length across the week`
*   If meals data is missing: `mealsCount = 0`

**Return Shape**:
```typescript
{
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  targetCalories?: number;
  emoji?: string;
  mealsCount: number;
  usageCount: number;
}[]
```
*Constraint*: Do NOT invent fields that do not exist in the schema.

---

## 3. Frontend Implementation

### A. Hook
Create `src/features/meals/hooks/useDietsByType.ts`.

**Responsibilities**:
*   Wrap `useQuery(api.plans.getDietsByType, { type })`
*   Return:
    ```typescript
    {
      diets: DietPlan[];
      isLoading: boolean;
      error?: Error;
    }
    ```
*   Use strict TypeScript typing aligned with the backend return shape.

### B. Component Refactor
Rename `CalorieRangesList.tsx` → `DietPlansList.tsx`.

**Props**:
Receive the selected category object (containing `id` = diet type).

**Rendering Rules**:
For each diet plan:
*   **Title**:
    *   Primary: `plan.name`
    *   Secondary (optional): `plan.nameAr`
*   **Calories Badge**:
    *   Display only if `targetCalories` exists.
    *   Example: "🔥 1500 kcal"
*   **Meta Information**:
    *   Display: "Meals: X" using `mealsCount`.
*   **Emoji**:
    *   Use `plan.emoji` if present.
    *   Otherwise, fall back to a neutral default emoji.

---

## 4. UX & State Handling Rules

1.  **Loading State**:
    *   Render existing skeleton/placeholder UI (do not invent new loaders).
2.  **Empty State**:
    *   If no active plans exist for the selected category:
    *   Show a clear empty message (e.g. “No plans available yet”).
    *   Preserve layout spacing and typography.
3.  **Styling**:
    *   Preserve the existing Card/List layout.
    *   Only change content, not structure, unless required.

---

## 5. Execution Rules (Strict)

*   Zero mock data.
*   Zero client-side aggregation.
*   No artificial “ranges”.
*   No schema violations.
*   UI must be a pure render of backend data.
*   Deterministic sorting.
*   Type-safe from Convex → Hook → Component.

## 6. Deliverables

1.  `convex/plans.ts` (getDietsByType query)
2.  `src/features/meals/hooks/useDietsByType.ts`
3.  `src/features/meals/components/DietPlansList.tsx` (Renamed and fully refactored)

**Tone**:
Precise. Deterministic. Schema-driven. Production-ready.
