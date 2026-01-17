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
**Add a "Create New Diet" feature** at the end of the list to easily add new plans of the current type.

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
5.  **Create Action**:
    *   Add a specific "Create New Plan" button/card at the bottom of the list.
    *   This button should immediately create a **draft plan** with the current `type` and navigate to the editor.

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

---

## 3. Frontend Implementation

### A. Hook
Create `src/features/meals/hooks/useDietsByType.ts`.

**Responsibilities**:
*   Wrap `useQuery(api.plans.getDietsByType, { type })`
*   Return: `{ diets: DietPlan[], isLoading: boolean, error?: Error }`

### B. Create Action Hook
In `src/features/meals/hooks/usePlanMutations.ts` (ensure this exists or create it):
*   Add `useCreateDraftPlan`.
*   Calls `createDietPlan` mutation (args: `{ type, name: 'New Plan', status: 'draft', ... }`).
*   Returns the new `dietId` on success.

### C. Component Refactor
Rename `CalorieRangesList.tsx` → `DietPlansList.tsx`.

**Props**:
Receive the selected category object (containing `id` = diet type).

**Rendering Rules**:
1.  **List**: Render the fetched plans using `FlatList`.
2.  **Footer**: Render a "Create New Plan" button as the `ListFooterComponent`.
    *   Style: Dashed border, "Plus" icon, centered text ("Create new [Category Name] Plan").
    *   **Action**:
        *   Call `createDietPlan({ type: category.id })`.
        *   Show loading spinner on the button.
        *   On success, navigate to `EditDietScreen` with the new `dietId`.

---

## 4. UX & State Handling Rules

1.  **Loading State**:
    *   Render existing skeleton/placeholder UI (do not invent new loaders).
2.  **Empty State**:
    *   If no active plans exist, show the "Create New Plan" button prominently (center screen or top of list).
    *   Message: "No plans found for [Category]. Create the first one!"
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
