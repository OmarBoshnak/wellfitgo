# Calendar Bug Fix: Date Shifting & Timezone Handling

## Context
The user is reporting a critical bug in the Calendar feature where **events scheduled for Sunday appear on Saturday**.
This is affecting the **Week View** (visual misplacement) and likely the **Day View** consistency.

## Root Cause Analysis
Upon investigation, the issue stems from how date strings are generated for the backend (Convex).
The code extensively uses:
```typescript
date.toISOString().split('T')[0]
```

**The Problem:** `toISOString()` converts the date to **UTC**.
*   For users in **MENA (GMT+3)** (e.g., Saudi Arabia, Egypt), "Sunday 00:00:00" Local Time is "Saturday 21:00:00" UTC.
*   `toISOString().split('T')[0]` results in `YYYY-MM-DD` of **Saturday**.
*   The event is saved to the database with Saturday's date key.
*   When fetched, the UI renders it in the Saturday column.

This "Off-by-One" error affects:
1.  **Saving Events** (`AddCallModal.tsx`).
2.  **Querying Events** (`DayCalendarScreen.tsx`, `CalendarScreen.tsx`).
3.  **Week Range Calculation** (`CalendarScreen.tsx`).

## Instructions for Refactoring

You need to refactor the Date Handling logic across the `src/features/calendar` directory.

### 1. Create a Date Utility
Create a reusable helper in `src/features/calendar/utils/time.ts` (or `date.ts`) to strictly format dates as `YYYY-MM-DD` using **Local Time**:

```typescript
export const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

### 2. Apply Fix to Key Files

**A. `src/features/calendar/day/components/AddCallModal.tsx`**
*   Locate `isoDate`.
*   Replace `selectedDate.toISOString().split('T')[0]` with `toLocalDateString(selectedDate)`.

**B. `src/features/calendar/day/DayCalendarScreen.tsx`**
*   Locate `isoDate`.
*   Replace `currentDate.toISOString().split('T')[0]` with `toLocalDateString(currentDate)`.
*   Ensure the `handleEventCreated` logic also respects local dates.

**C. `src/features/calendar/CalendarScreen.tsx` (Week View)**
*   Locate the `weekDates` memo.
*   Replace `d.date.toISOString().split('T')[0]` with `toLocalDateString(d.date)`.
*   This ensures the query range (`startDate`, `endDate`) matches the local days visible on screen.

### 3. (Optional but Recommended) Layout Cleanup
In `src/features/calendar/components/WeekGrid.tsx`, the RTL logic is double-negating itself:
```typescript
const displayDays = isRTL ? [...days].reverse() : days;
// ...
flexDirection: isRTL ? 'row-reverse' : 'row'
```
*   **Best Practice:** React Native's `I18nManager` automatically flips `row` to `row-reverse` visually.
*   If `isRTL` is true, keeping the array in **normal order** (`[Sat, Sun...]`) and using `flexDirection: 'row'` will result in `[Sat] [Sun] ...` (Sat on Right) automatically.
*   Current implementation manually reverses the array AND manually flips direction, which is fragile.
*   *Action:* If you touch this file, verify if simplifying to `displayDays = days` and `flexDirection: 'row'` yields the correct "Saturday on Right" layout without the complexity.

## Verification
*   Create a test event on "Sunday".
*   Verify the `date` payload sent to `createCalendarCall` is "YYYY-MM-DD" matching Sunday (not Saturday).
*   Verify the event appears in the Sunday column in Week View.
