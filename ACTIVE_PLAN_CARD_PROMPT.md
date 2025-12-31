# Feature: Active Plan Progress Card & Dashboard

## Context
The user wants to upgrade the "Active Plan Card" (triggered by `renderActivePlanCard` / `viewProgress` action) in the mobile app.
The new design is based on a provided HTML/Tailwind template, which needs to be ported to **React Native (Expo)** with **Convex** backend integration.
It must support **Arabic (RTL)** and include specific UI modifications.

## Requirements

### 1. New Component: `ActivePlanDashboard.tsx`
Create a new screen or full-screen modal component at `src/features/meal-plans/components/ActivePlanDashboard.tsx`.

#### UI Specifications (Ported from HTML)
*   **Header:**
    *   Left: "Back" arrow button (Navigates back).
    *   Center: Title (e.g., "Ahmed's Meal Plan").
    *   Right: **REMOVE** the "Vertical Points" (More) button.
*   **Plan Summary Card:**
    *   Gradient background (`primary` to `primary-dark`).
    *   "Active" Badge.
    *   Plan Name (e.g., "Classic 1200-1300").
    *   Start Date & Current Week info.
*   **Weekly Progress Section:**
    *   **Circular Chart:** Visualizes "Meals Done" vs "Total Meals" for the week (e.g., 18/21). Use `react-native-svg` or a lightweight chart library.
    *   **Day Scroller:** Horizontal list of days (Sat -> Fri).
        *   States: Completed (Green Check), Partial (Yellow Timer), Missed (Red X), Upcoming (Gray).
        *   "Today" should be highlighted visually.
*   **Daily Checklist:**
    *   Vertical list of meals for the selected day.
    *   Checkbox logic:
        *   If completed: Green check, line-through text? (or just "Completed 8:30 AM" badge).
        *   If pending: Empty box.
    *   Images: Show meal image if available.
*   **Bottom Actions:**
    *   Three buttons: "View Plan", "Modify", and **"Okay Reminder"** (Renamed from "Remind").

#### Localization (Arabic/RTL)
*   Use the `isRTL` helper.
*   Flip layouts (`flex-direction: row-reverse`) where appropriate.
*   Translate all static text (e.g., "Active" -> "نشط", "This Week" -> "هذا الأسبوع", "Meals Done" -> "وجبات مكتملة").

### 2. Backend Integration (Convex)

#### Query: `api.plans.getActivePlanProgress`
Create a new query in `convex/plans.ts` (or `mealPlans.ts`) that returns:
1.  **Plan Info:** Name, Type, Start Date.
2.  **Weekly Stats:**
    *   Total meals scheduled for the current week.
    *   Total meals completed.
    *   Progress percentage.
3.  **Daily Status:** For each day of the current week (Sat-Fri):
    *   Status: `completed` | `partial` | `missed` | `upcoming`.
    *   Is Today?
4.  **Selected Day Meals:** List of meals for the requested day (or today).
    *   `id`, `name`, `time`, `isCompleted`, `imageUrl`.

### 3. Integration Point
*   In `mobile/app/(app)/(tabs)/index.tsx` (or the relevant home screen):
    *   Locate the `renderActivePlanCard` or the "View Progress" button.
    *   On press, navigate to this new `ActivePlanDashboard` screen (push to stack or open modal).

### 4. Special Logic
*   **"Okay Reminder" Button:**
    *   Action: Trigger a local notification or Convex mutation to set a reminder for the next meal.
    *   Feedback: Show a toast "Reminder Set".
*   **View Plan Button:** Navigate to the full plan details view.
*   **Modify Button:** Navigate to `EditDietScreen` (if allowed for client) or show "Contact Coach".

## file structure
- `src/features/meal-plans/components/ActivePlanDashboard.tsx`
- `src/features/meal-plans/components/ProgressChart.tsx` (Helper)
- `src/features/meal-plans/components/DayScroller.tsx` (Helper)
