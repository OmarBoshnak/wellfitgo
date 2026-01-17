# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are refactoring the Diet Details screen in the WellFitGo app.
Component: `src/features/meals/components/DietDetailsView.tsx`

**Current problems:**
*   The component relies on hardcoded constants (`DIET_DETAILS`, `MEALS`).
*   It does not reflect the real structure of the `dietPlans` table.
*   It does not properly support both "General" and "Daily" (weekly) diet formats.

The goal is to make this screen 100% data-driven, aligned strictly with `convex/schema.ts`, and production-ready.

**IMPORTANT (Read First):**
Before implementing anything:
*   Read `convex/schema.ts` fully, especially the `dietPlans` definition.
*   Do NOT invent fields, enums, or structures.
*   Use only what exists in the schema.
*   Preserve existing layout, spacing, and UI behavior.
*   If the UI expects data in a different shape than the schema, map it explicitly.
*   If something is missing in the schema, explain it instead of guessing.

**Files of Interest:**
- UI: `src/features/meals/components/DietDetailsView.tsx`
- Schema: `convex/schema.ts` (dietPlans)
- Hooks folder: `src/features/meals/hooks/`

---

## 1. The Mission

Refactor `DietDetailsView` to fetch and render real diet plan data from Convex.

**Functional Requirements**:
1.  Fetch a full diet plan by ID from Convex.
2.  Support both diet formats:
    *   `format === 'general'`
    *   `format === 'daily'`
3.  Remove all hardcoded diet/meal constants.
4.  Keep the UI visually identical, but fully dynamic.

---

## 2. Backend Implementation (Convex)

Update or create `convex/plans.ts`.

### Query: `getDietDetails`

**Arguments**:
```typescript
{ id: Id<"dietPlans"> }
```

**Logic**:
1.  Fetch the diet plan by ID.
2.  Return the full document exactly as stored.
3.  Do not reshape the data unnecessarily.
4.  Do not compute fake values. `targetCalories` is sufficient for the header (do not invent macros if not present).

---

## 3. Frontend Implementation

### A. Hook
Create `src/features/meals/hooks/useDietDetails.ts`.

**Responsibilities**:
*   Wrap `useQuery(api.plans.getDietDetails, { id })`.
*   Return `{ plan, isLoading, error }`.
*   No transformation logic here beyond basic null safety.

### B. Component Refactor
`src/features/meals/components/DietDetailsView.tsx`

**Props Changes**:
*   ❌ Remove: `diet` object prop.
*   ✅ Add: `dietId: Id<"dietPlans">`.

---

## 4. UI & State Management

**Local State**:
1.  `selectedDay`: `keyof dailyMeals | null`
    *   Used only when `format === 'daily'`.
    *   **Default**: Prefer current weekday if present. Otherwise fallback to `'saturday'`.
2.  `expandedMeal`: `string | null`
    *   Used for accordion expand/collapse.

---

## 5. Rendering Logic (Strict)

### 1. Header / Summary Section
Populate from Convex data:
*   `plan.name`
*   `plan.description`
*   `plan.targetCalories`
*   `plan.tags`
*   *No hardcoded labels or values.*

### 2. Day Selector (Conditional)
Render only if `plan.format === 'daily'`.

**UI requirements**:
*   Horizontal scrollable list.
*   Days: Saturday → Friday.
*   Highlight `selectedDay`.
*   Styled consistently with app theme (`colors.primary`, `horizontalScale`).
*   No logic duplication in render.

### 3. Meals Resolution Logic
Determine which meals array to render:

**General Format**:
```typescript
const meals = plan.meals
```

**Daily Format**:
```typescript
const meals = plan.dailyMeals[selectedDay]?.meals
```

*   If no meals exist for the selected day: Render a clean empty state. Do not crash.

### 4. Meal Mapping (Critical Schema Rule)
**Schema structure**:
```typescript
meal.categories[].options[] = {
  id,
  text,
  textEn
}
```

**UI expectation**:
`items: string[]`

**✅ You MUST explicitly map**:
```typescript
options.map(option => option.text)
```

**Do NOT**:
*   Pass raw objects to the UI.
*   Assume items already exist.
*   Change UI component contracts.

---

## 6. Execution Rules (Non-Negotiable)

*   Zero mock data.
*   Delete `DIET_DETAILS`.
*   Delete `MEALS`.
*   Strict schema alignment.
*   No UI redesign.
*   No client-side guessing.
*   Graceful loading & error states.
*   Accordion behavior must remain unchanged.

## 7. Deliverables

1.  `convex/plans.ts` → `getDietDetails`
2.  `src/features/meals/hooks/useDietDetails.ts`
3.  Refactored `DietDetailsView.tsx`

**Final Expectation**:
After refactor:
*   Diet details reflect real backend data.
*   Both General & Daily diets work flawlessly.
*   The component is reusable, stable, and future-proof.
*   The UI feels unchanged—but the architecture is professional.

**Tone**:
Precise. Robust. Schema-faithful. Production-ready.
