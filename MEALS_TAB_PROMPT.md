# Feature: Real-Time Interactive Meals Tab (Convex Refactor)

## Context
The user wants to refactor the main Meals tab (`app/(app)/(tabs)/meals.tsx`) to be fully **interactive** and **real-time**.
Currently, it relies on Redux and some simulated data.
The goal is to switch entirely to **Convex** for state management, ensuring that when a doctor assigns a new diet or changes the plan, the app updates instantly without pull-to-refresh.

## Requirements

### 1. Refactor `app/(app)/(tabs)/meals.tsx`
*   **Remove Redux:** Delete all `useAppSelector`, `useAppDispatch`, and imports from `src/store/mealsSlice`.
*   **State Management:** Use `useQuery` for data and `useState` only for UI state (modals, selected date).
*   **Screen Ownership:** The logic must live in `meals.tsx`. UI subcomponents (like `MealCard`) may be extracted/imported, but **no additional screens** should be created for this logic.

### 2. Backend Integration (Convex)

#### A. New Query: `api.meals.getMyFullMealHistory`
*   **Arguments:** `month: number`, `year: number`.
*   **Returns:** A map of date strings (`YYYY-MM-DD`) to completion status (`{ total: number, completed: number }`).
*   **Usage:** Populates the "Live Calendar Card" dots/colors.

#### B. New Query: `api.meals.getDayView`
*   **Arguments:** `date: string` (YYYY-MM-DD).
*   **Returns:**
    *   `activePlan`: Metadata about the current active `weeklyMealPlan` (Name, Description, Tags, Start Date).
    *   `meals`: Array of meals for that specific date.
        *   Include `completionStatus` (boolean or timestamp) by checking `mealCompletions` table.
        *   Include `selectedOption` if applicable.
*   **Logic:**
    *   If no active plan exists for that date, return `null` (Show "No Plan" state).
    *   If plan exists, strictly filter meals by `dayOfWeek` or specific date mapping.

#### C. Mutations
*   **`completeMeal`:** Create/Update `mealCompletions` record.
*   **`uncompleteMeal`:** Remove `mealCompletions` record.
*   **`requestPlanChange`:** Create a `clientNotes` or `notifications` record for the coach.

### 3. Critical Technical Constraints

#### 🕰️ Data Ordering & Timezone
*   **Rule:** All date comparisons and keys (`YYYY-MM-DD`) must be generated using the **client’s local timezone** and normalized consistently between queries.
*   **Prevention:** Do NOT use `toISOString()` blindly. Use `toLocalDateString()` (as defined in `CALENDAR_FIX_PROMPT.md`) or equivalent local-aware formatting. This prevents silent production bugs where today's meals disappear at 9 PM GMT+3.

#### 🚀 Performance Expectation
*   **Rule:** Queries should be memo-safe and not refetch unnecessarily.
*   **Safety:** Avoid calling queries inside render loops or side effects. Rely on Convex's built-in caching and reactivity.

### 4. UI & UX Logic Updates

*   **Real-time Updates:**
    *   Wrapping the data in `useQuery` ensures that if the Doctor (Admin) changes the plan in the backend, the mobile app UI updates instantly.
*   **Calendar Interaction:**
    *   Changing the selected day in the calendar should update the `date` arg for `getDayView`.
*   **States & Feedback:**
    *   **Loading:** While `useQuery` is loading, show a **skeleton loader** or spinner; do not leave the screen blank.
    *   **Error:** If a query errors, show a **retry-friendly error state** (no crashes).
    *   **Empty:** If `getDayView` returns null (e.g., no plan assigned), show a friendly "Waiting for Coach" screen.

### 5. Code Cleanup
*   Remove `mealCompletionByDate` simulation logic.
*   Remove hardcoded "Classic Diet" card; populate it from `activePlan` metadata.

## ✅ Definition of Done
- [ ] No Redux dependencies in `meals.tsx`.
- [ ] "Calendar" dots reflect real backend history using local timezone.
- [ ] "Today's Meals" list updates instantly when toggled.
- [ ] Assigning a new plan in Convex (via Admin) immediately reflects in the App.
- [ ] Loading and Error states are handled gracefully.
- [ ] Arabic/RTL layout is preserved.
