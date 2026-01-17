# Feature: Active Plan Dashboard (Full Screen Upgrade)

You are a senior mobile engineer working on a React Native (Expo) application using Convex as the backend.

Your task is to implement a full **Active Plan Dashboard** experience, replacing the existing lightweight "Active Plan Card / View Progress" behavior.

## 🎯 Objective

Upgrade the current Active Plan progress view into a full-screen dashboard that visualizes:
1.  Weekly plan progress
2.  Day-by-day completion status
3.  Meal checklist for the selected day

This screen must be **production-ready**, **RTL-aware**, and suitable for QA testing and App Store release.

## 1️⃣ New Component Structure

Create the following files:

```
src/features/meal-plans/components/
├─ ActivePlanDashboard.tsx
├─ ProgressChart.tsx
├─ DayScroller.tsx
```

**ActivePlanDashboard.tsx**
- Implement as a full-screen stack screen (NOT a bottom sheet).
- Must be navigable via `router.push()` or equivalent.

## 2️⃣ UI Requirements (Port HTML → React Native)

### Header
- **Left:** Back arrow (respects RTL).
- **Center:** Dynamic title (Example: "Ahmed's Meal Plan").
- **Right:** ❌ Remove the vertical "more" menu entirely.

### Plan Summary Card
- **Background:** Gradient (`primary` → `primaryDark`).
- **Badge:** Active → Arabic: "نشط".
- **Content:**
  - Plan name.
  - Start date + current week label (Example: "Week 3 • Started Jan 10").

### Weekly Progress Section

**Circular Progress Chart (`ProgressChart.tsx`)**
- Implement using `react-native-svg` (or `react-native-circular-progress`).
- Shows:
  - Meals completed.
  - Total meals.
  - Percentage text in center.

**Day Scroller (`DayScroller.tsx`)**
- Horizontal ScrollView/FlatList.
- **Order:** Sat → Fri.
- **States:**
  - `completed` → Green check icon.
  - `partial` → Yellow timer icon.
  - `missed` → Red X icon.
  - `upcoming` → Gray circle.
- **Focus:** "Today" must be visually highlighted.
- **Interaction:** Selecting a day updates the checklist below.

### Daily Meal Checklist
- **Component:** Vertical `FlatList`.
- **Item Content:**
  - Meal name.
  - Time.
  - Optional image.
  - **Completion State:**
    - *Completed:* Green check + Optional "Completed at 8:30 AM" badge.
    - *Pending:* Empty checkbox.

### Bottom Actions (Sticky)
Three buttons, equally sized:
1.  **View Plan:** Navigate to full plan details.
2.  **Modify:**
    - If client allowed → Navigate to `EditDietScreen`.
    - Else → Show alert "Contact Coach".
3.  **Okay Reminder:**
    - Triggers reminder for next meal.
    - Shows toast: "تم ضبط التذكير" (Reminder Set).

## 3️⃣ Localization & RTL

- **Default language:** Arabic.
- **Helper:** Use `isRTL` from constants/utils.
- **Styles:**
  - Apply `flexDirection: 'row-reverse'` where necessary (or rely on I18nManager if fully consistent).
  - Use RTL-safe icons (careful with arrows).
- **Translations:**
  - Active → "نشط"
  - This Week → "هذا الأسبوع"
  - Meals Done → "وجبات مكتملة"
  - Reminder Set → "تم ضبط التذكير"

## 4️⃣ Backend (Convex)

**Query:** `api.plans.getActivePlanProgress`

**Return Shape:**
```typescript
{
  plan: {
    id: Id<"weeklyMealPlans">,
    name: string,
    startDate: string,
    type: string
  },
  weeklyStats: {
    totalMeals: number,
    completedMeals: number,
    progressPercentage: number
  },
  days: Array<{
    date: string,
    label: string, // Sat, Sun... (Localized)
    status: "completed" | "partial" | "missed" | "upcoming",
    isToday: boolean
  }>,
  meals: Array<{
    id: string,
    name: string,
    time: string,
    isCompleted: boolean,
    imageUrl?: string
  }>
}
```
- **Logic:** Default selected day = Today. Changing day refetches meals (or filters client-side if data is small).

## 5️⃣ Integration Point

**File:** `mobile/app/(app)/(tabs)/index.tsx`

Locate `renderActivePlanCard` or the "View Progress" button.
**Action:** Replace behavior with `router.push('/active-plan-dashboard')`.

## 6️⃣ UX & Quality Constraints

1.  **States:** Handle Loading, Empty (no active plan), and Error states gracefully.
2.  **Performance:** Use `FlatList` for the meal list (avoid nesting ScrollViews incorrectly).
3.  **Code Quality:** No hardcoded data. Clean separation of UI, State, and Backend calls.

## ✅ Definition of Done
- [ ] Screen renders correctly in **Arabic RTL**.
- [ ] Progress updates correctly per day.
- [ ] Convex query is reusable and efficient.
- [ ] Code is readable, typed, and testable.
- [ ] No leftover web/Tailwind classes (convert all to `StyleSheet`).
