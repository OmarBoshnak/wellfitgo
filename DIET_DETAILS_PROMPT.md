# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are refactoring the `DietDetailsView` component (`src/features/meals/components/DietDetailsView.tsx`).
Currently, it uses hardcoded data (`DIET_DETAILS`, `MEALS`).
The goal is to fetch full diet details from Convex (`dietPlans` table) and handle both "General" (static) and "Daily" (weekly) formats.

**Files of Interest:**
- UI: `src/features/meals/components/DietDetailsView.tsx`
- Schema: `convex/schema.ts` (`dietPlans`)

---

## 1. The Mission

Connect `DietDetailsView` to Convex.

1.  **Fetch**: Get the full diet plan details by ID.
2.  **Format Handling**:
    *   If `format === 'general'`: Show the list of meals (standard view).
    *   If `format === 'daily'`: Add a **Day Selector** (Saturday - Friday) to the UI. When a day is selected, show the meals for that specific day.
3.  **Refactor**: Remove all hardcoded data constants.

---

## 2. Backend Implementation (Convex)

Update `convex/plans.ts`.

### Query: `getDietDetails`
- **Arguments**: `{ id: Id<"dietPlans"> }`
- **Logic**:
  1. Fetch the plan by ID.
  2. Return the full object.
  3. (Optional) You may want to compute total calories/macros server-side if they aren't explicitly stored, but `targetCalories` is usually sufficient for the header.

---

## 3. Frontend Implementation

### A. Hook
`src/features/meals/hooks/useDietDetails.ts`
- Wrap `useQuery(api.plans.getDietDetails, { id })`.

### B. Component Refactor
`DietDetailsView.tsx`

**Props Update**:
- Remove the old `diet` object prop.
- Add `dietId: string`.

**State**:
- `selectedDay`: string (default to current day name or 'saturday'). Used only if `format === 'daily'`.
- `expandedMeal`: string | null (for accordion).

**Rendering Logic**:
1.  **Header/Summary**:
    *   Use `plan.name`, `plan.description`, `plan.targetCalories`.
    *   Tags: Use `plan.tags`.
2.  **Day Selector (Conditional)**:
    *   Check `plan.format === 'daily'`.
    *   If true, render a horizontal scrollable list of days (Sat, Sun, Mon...).
    *   Highlight the `selectedDay`.
3.  **Meals List**:
    *   Determine which meals to show:
        *   **General**: Use `plan.meals`.
        *   **Daily**: Access `plan.dailyMeals[selectedDay].meals`.
    *   Map these meals to the Accordion UI.
    *   *Note*: The schema structure for a meal includes `categories` (carbs, protein, etc.). Map these strictly to the existing UI structure (`renderCategory`).

---

## 4. Execution Rules

1.  **Schema Alignment**: The schema defines `categories` inside meals as having `options` (array of objects). The UI expects `items` (array of strings). You must **map** `options.text` to the UI's expected string format.
2.  **Flexible UI**: The "Day Selector" must look professional and match the app's theme (`colors.primary`, `horizontalScale`).
3.  **Zero Mock Data**: Remove `DIET_DETAILS` and `MEALS` constants.

## 5. Deliverables

- `convex/plans.ts` (getDietDetails)
- `src/features/meals/hooks/useDietDetails.ts`
- `src/features/meals/components/DietDetailsView.tsx` (Refactored)

**Tone**:
Flexible. Robust. Detail-oriented.
