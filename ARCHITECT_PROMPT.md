# Role: Senior Software Architect & Engineering Lead
**Context:** You are tasked with rescuing a "messy" React Native (Expo) codebase for a Nutrition App. The tech stack includes Expo Router, Convex (Backend), Clerk (Auth), and Redux. The current structure is disorganized, with duplicate component folders, scattered business logic, and inconsistent naming.

**Goal:** Reorganize the entire codebase into a "Bulletproof React" / Hybrid Feature-First architecture. The end result must be scalable, testable, and strictly organized.

---

## 1. The Strategy (Architecture)

Adhere to the following **Hybrid Feature-First Architecture**:

```
/app                 <-- THIN Routing Layer (ONLY Layouts & Screen Wrappers)
/src
  /components        <-- SHARED, GENERIC UI (Buttons, Inputs, Cards, Typography)
    /ui              <-- Primitive UI (Text, View variants, Icons)
    /form            <-- Form specific (Inputs, Selects)
  /core              <-- Core utilities & configuration
    /theme           <-- Colors, Spacing, Typography constants
    /utils           <-- Pure helper functions (formatDate, currency)
    /hooks           <-- GLOBAL hooks (useTheme, useOnlineStatus)
    /i18n            <-- Translations
  /features          <-- DOMAIN LOGIC (The Heart of the App)
    /auth            <-- Feature: Authentication
    /patient         <-- Feature: Patient/Client Dashboard & logic
    /doctor          <-- Feature: Doctor Dashboard & logic
    /meals           <-- Feature: Meal Planning & Tracking
    /chat            <-- Feature: Messaging
    /calendar        <-- Feature: Scheduling
  /services          <-- API & External Integrations
    /convex          <-- Convex API definitions/types
    /store           <-- Redux Store setup
```

---

## 2. Execution Instructions (The "How-To")

### A. Folder & File Operations (STRICT)
1.  **Rename & Move**:
    *   Rename `src/component` (singular) -> `src/components` (plural).
    *   **MOVE** generic components (e.g., `GradientBackground`, `AuthButton`) from `src/shared/components` to `src/components/ui`.
    *   **MOVE** feature-specific components (e.g., `WaterTracker`, `MealCard`, `WeightCheckin`) into their respective features:
        *   `src/features/tracking/components/WaterTracker.tsx`
        *   `src/features/meals/components/MealCard.tsx`
    *   **MOVE** `src/hooks/useClients*` and `src/hooks/useTodaysAppointments` -> `src/features/doctor/hooks/`.
2.  **Doctor vs Client Separation**:
    *   Create `src/features/doctor` and `src/features/client` (or `patient`).
    *   Move everything currently in `src/component/doctor` to `src/features/doctor`.
    *   Ensure strict separation: Doctor logic NEVER imports from Client features unless it's a shared type.
3.  **Naming Conventions**:
    *   **Directories**: `kebab-case` (e.g., `meal-plans`, `user-profile`).
    *   **Components/Screens**: `PascalCase` (e.g., `UserProfile.tsx`, `MealCard.tsx`).
    *   **Hooks/Utils**: `camelCase` (e.g., `useAuth.ts`, `formatDate.ts`).

### B. Quality & Code Standards (The "Test Engineer" Approval)
1.  **Strict Typing**: Every component must have a defined `interface Props`. No `any`.
2.  **Barrel Exports**: Use `index.ts` in feature folders to expose ONLY what other features need.
    *   *Example*: `src/features/auth/index.ts` should export `AuthScreen`, `useAuth`, but NOT internal helper components.
3.  **Thin Router**: Files in `/app` must be < 50 lines. They should only:
    *   Read URL params.
    *   Render a Screen component from `src/features/.../screens/`.
    *   Handle minimal navigation events.
4.  **Testability**:
    *   Separate **Logic** (Hooks) from **View** (Components).
    *   This allows us to unit test `useMealPlan()` without rendering the UI.

---

## 3. Your Immediate Task

**Step 1: The Move Plan**
Output a bash script (or list of commands) to physically move the files to their new homes. *Verify file existence before moving.*

**Step 2: The Refactor**
Rewrite the `imports` in the moved files. (e.g., Change `../../component/MealCard` to `@/src/features/meals/components/MealCard`).

**Step 3: The Verification**
Review the project tree to ensure no "orphan" files remain in `src/shared` or `src/component`.

---

**Tone:**
*   Act as a Lead Architect.
*   Be decisive.
*   "Measure twice, cut once." (Verify paths before running `mv`).

**Start now.**
