# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are refactoring the `DietCategoriesGrid` component (`src/features/meals/components/DietCategoriesGrid.tsx`).
Currently, it uses a hardcoded `DIET_CATEGORIES` array.
The goal is to fetch these categories dynamically from Convex, reflecting the actual data stored in the `dietPlans` table.

**Files of Interest:**
- UI: `src/features/meals/components/DietCategoriesGrid.tsx`
- Schema: `convex/schema.ts` (specifically `dietPlans`)

---

## 1. The Mission

Connect `DietCategoriesGrid` to Convex.
1.  **Fetch**: Query the `dietPlans` table to find all unique "types" of diets (e.g., 'keto', 'vegan').
2.  **Aggregated Counts**: For each type, count how many active plans exist.
3.  **Display**: Render the grid using *only* this real data. Remove hardcoded constants.

---

## 2. Backend Implementation (Convex)

Create/Update `convex/plans.ts`:

### Query: `getDietCategories`
- **Logic**:
  1. Fetch all `dietPlans` (or use an index if available).
  2. Group them by their `type` field.
  3. Return an array of category objects:
     ```typescript
     {
       id: string;       // e.g., "keto"
       name: string;     // e.g., "Keto" (formatted)
       nameAr: string;   // Arabic translation (mapped server-side or stored)
       emoji: string;    // Taken from the first plan of this type, or a lookup
       count: number;    // Total plans of this type
     }
     ```
- **Constraint**: Since `dietPlans` has fields like `name`, `nameAr`, `emoji`, and `type`, try to aggregate these intelligently. If multiple plans of type 'keto' exist, use the metadata (emoji/names) from the most recently updated one.

---

## 3. Frontend Implementation

### A. Create Hook
`src/features/meals/hooks/useDietCategories.ts`
- Use `useQuery(api.plans.getDietCategories)`.
- Return `{ categories, isLoading, error }`.

### B. Refactor Component
`src/features/meals/components/DietCategoriesGrid.tsx`
- **Remove**: The `DIET_CATEGORIES` constant array.
- **Props**: Update interface to remove manual `customCategories` passing if they are now all coming from the same source.
  - *Note*: If the parent screen (`plans.tsx`) was passing custom categories, ensure that logic is either preserved (if they are local-only) or migrated to the backend. **Preference**: All data should come from the hook.
- **Render**: Map over the data returned by `useDietCategories`.

---

## 4. Execution Rules

1.  **Dynamic Icons/Emojis**: The schema has an `emoji` field in `dietPlans`. Use it. If a plan type doesn't have an emoji, provide a fallback in the UI.
2.  **Zero Mock Data**: The final component must rely 100% on the `categories` prop/hook.
3.  **Type Safety**: Define a strict `DietCategory` interface in `src/features/meals/types.ts` (or similar) and use it in both the hook and component.

## 5. Deliverables

- `convex/plans.ts` (with `getDietCategories`)
- `src/features/meals/hooks/useDietCategories.ts`
- `src/features/meals/components/DietCategoriesGrid.tsx` (Refactored)

**Tone**:
Professional, clean, and data-driven.
