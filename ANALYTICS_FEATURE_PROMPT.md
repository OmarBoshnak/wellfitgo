# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are making the "Doctor Analytics Dashboard" (`app/(app)/doctor/(tabs)/analytics.tsx`) fully functional.
Currently, it uses hardcoded mock data for charts, stats, and tables.
The goal is to replace this with real-time, aggregated data from Convex, providing "Intelligent" insights into patient performance.

**Files of Interest:**
- UI: `app/(app)/doctor/(tabs)/analytics.tsx`
- Backend: `convex/analytics.ts` (New file)
- Schema: `convex/schema.ts` (`users`, `weeklyMealPlans`, `mealCompletions`, `messages`)

---

## 1. The Mission

Connect the Analytics dashboard to Convex.

1.  **Backend Aggregation**: Create a powerful query to fetch all dashboard metrics in one go.
2.  **Smart Logic**: Implement heuristics to determine "At Risk" clients vs "On Track".
3.  **Frontend Binding**: Replace all mock constants with real data.

---

## 2. Backend Implementation (Convex)

Create `convex/analytics.ts`.

### Query: `getDoctorStats`
- **Args**: `{ timeRange: '7days' | '30days' | '3months', timezone: string }`
- **Returns**: A structured object matching the UI needs (see below).

**Logic & Heuristics:**

1.  **Overview Stats**:
    *   `activeClients`: Count `users` where `assignedCoachId == me` AND `isActive == true`.
    *   `avgProgress`: Average `(currentWeight - startingWeight)` for active clients.
    *   `checkInRate`: `(totalMealCompletions / totalScheduledMeals)` for the period.
    *   **Definition**: `totalScheduledMeals` = number of meals defined in active `weeklyMealPlans` within the selected `timeRange` (excluding paused or archived plans).

2.  **Progress Distribution (The Donut Chart)**:
    *   Iterate through active clients.
    *   Calculate their individual "Adherence Score" (completed meals / total).
    *   **Buckets**:
        *   **On Track**: Score > 80%
        *   **Needs Support**: Score 50-80%
        *   **At Risk**: Score < 50% OR No activity in last 3 days.
    *   **Definition**: "Activity" is defined as at least one `mealCompletion` event. Messages do not count.

3.  **Daily Activity (The Bar Chart)**:
    *   Aggregate events by day for the requested `timeRange`.
    *   **Rule**: All daily aggregations must use the coach’s local `timezone` and normalize dates to start-of-day boundaries.
    *   `messages`: Count from `messages` table.
    *   `plans`: Count `weeklyMealPlans` created.
    *   `checkIns`: Count `mealCompletions`.

4.  **Client Check-in Status (The Table)**:
    *   Return list of clients with:
        *   `lastCheckIn`: Timestamp of last `mealCompletion`.
        *   `status`: Derived from the "Buckets" logic above (On Time, Overdue, At Risk).

**Explicit Return Shape**:
```typescript
return {
  overview: {
    activeClients: number,
    avgProgress: number | null,
    checkInRate: number,
    responseTime: number | null
  },
  progressBuckets: {
    onTrack: number,
    needsSupport: number,
    atRisk: number
  },
  dailyActivity: Array<{
    date: string, // ISO date string "YYYY-MM-DD"
    messages: number,
    plans: number,
    checkIns: number
  }>,
  clients: Array<{
    id: Id<"users">,
    name: string,
    lastCheckIn: string | null, // ISO string or null
    status: 'on_track' | 'needs_support' | 'at_risk'
  }>
}
```

---

## 3. Frontend Implementation

### A. Hook
`src/features/analytics/hooks/useDoctorAnalytics.ts`
- Wrap `useQuery(api.analytics.getDoctorStats, { timeRange, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })`.
- Handle the `timeFilter` state change from the UI.

### B. Component Refactor (`analytics.tsx`)
- **Remove**: `weeklyActivity`, `clientProgress`, `checkInStatus` constants.
- **Wire Up**:
    - Pass `activeClients` to the first stat card.
    - Pass `progressData` (buckets) to the Donut Chart.
    - Pass `dailyActivity` to the Bar Chart.
    - Pass `tableData` to the bottom list.
- **UX Rule**: If there are zero active clients, show an "Empty Analytics" state instead of rendering empty charts.
- **Loading State**: Show a clean Skeleton loader or full-screen spinner while fetching.

---

## 4. Execution Rules

1.  **Performance**:
    *   This query scans multiple tables. Ensure you filter by `assignedCoachId` *first* before aggregating.
    *   Use Convex indexes where possible (e.g., `by_coach_date` for activity).
2.  **Date Handling**: Use a library like `date-fns` or native `Date` carefully to respect the `timeRange` and `timezone`.
3.  **Zero Mock Data**: If a metric is effectively zero (e.g., no messages yet), show 0, not a fake number.

## 5. Deliverables

- `convex/analytics.ts`
- `src/features/analytics/hooks/useDoctorAnalytics.ts`
- `app/(app)/doctor/(tabs)/analytics.tsx` (Refactored)

**Tone**:
Data-driven. Analytical. Accurate.
