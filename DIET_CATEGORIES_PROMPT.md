# Role: Senior Frontend Engineer (React Native + Convex)

Context:
You are refactoring the `DietCategoriesGrid` component
(`src/features/meals/components/DietCategoriesGrid.tsx`).

Currently, it uses a hardcoded `DIET_CATEGORIES` array.
The goal is to derive diet categories dynamically from the `dietPlans` table
based on the schema in `convex/schema.ts`.

IMPORTANT:
- Read `convex/schema.ts` before implementing.
- Do NOT invent fields or enums.
- Use only what exists in the schema.
- Preserve existing layout and UX unless required to change.

Files of Interest:
- UI: `src/features/meals/components/DietCategoriesGrid.tsx`
- Schema: `convex/schema.ts` (`dietPlans`)

---

## 1. The Mission

Connect `DietCategoriesGrid` to Convex.

1. Fetch all diet plan categories by aggregating `dietPlans.type`.
2. For each category, count how many **active** plans exist
   (`dietPlans.isActive === true`).
3. Render the grid using only this real data.
4. Remove all hardcoded category constants.

---

## 2. Backend Implementation (Convex)

Create or update `convex/plans.ts`.

### Query: `getDietCategories`

Logic:
1. Query `dietPlans` using the `by_type_active` index when possible.
2. Group plans by `type`.
3. For each group:
   - `id`: the diet type (e.g. "keto")
   - `name`: formatted label derived from `type` (e.g. "Keto")
   - `nameAr`: mapped server-side from `type`
     (do NOT assume `nameAr` is consistent across plans)
   - `emoji`: taken from the most recently updated plan of that type
   - `count`: number of plans where `isActive === true`

Return shape:
```ts
{
  id: string;
  name: string;
  nameAr: string;
  emoji?: string;
  count: number;
}
```

Constraints:
- Do not assume every plan has `emoji` or `nameAr`.
- Use deterministic sorting by `updatedAt` when selecting metadata.

---

## 3. Frontend Implementation

### A. Hook
Create `src/features/meals/hooks/useDietCategories.ts`.
- Use `useQuery(api.plans.getDietCategories)`
- Return `{ categories, isLoading, error }`

### B. Component Refactor
Update `DietCategoriesGrid.tsx`:
- Remove `DIET_CATEGORIES`
- Fetch categories via `useDietCategories`
- Render dynamically
- If a category has no emoji, provide a UI fallback
- All category data must come from the hook.

---

## 4. Execution Rules
- Zero mock data.
- No client-side aggregation.
- Strict type safety.
- UI is a pure render of backend data.

---

## 5. Deliverables
- `convex/plans.ts` (getDietCategories)
- `useDietCategories.ts`
- Refactored `DietCategoriesGrid.tsx`

Tone:
Professional. Deterministic. Production-ready.
