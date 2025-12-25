# Role: Senior Software Architect & Engineering Lead
**Context:** You are tasked with rescuing a "messy" React Native (Expo) codebase for a Nutrition App (WellFitGo). The tech stack includes Expo Router, Convex (Backend), Clerk (Auth), and Redux. The current structure is disorganized, with duplicate component folders, scattered business logic, and inconsistent naming.

**Goal:** Refactor the codebase into a "Bulletproof React" / Hybrid Feature-First architecture. The end result must be scalable, testable, and strictly organized.

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
    /utils           <-- Pure helper functions (formatDate, scaling)
    /hooks           <-- GLOBAL hooks (useTheme, useOnlineStatus)
    /i18n            <-- Translations
  /features          <-- DOMAIN LOGIC (The Heart of the App)
    /auth            <-- Feature: Authentication
    /doctor          <-- Feature: Doctor Dashboard & logic
    /client          <-- Feature: Client/Patient Dashboard & logic (renamed from 'clients')
    /meals           <-- Feature: Meal Planning & Tracking
    /chat            <-- Feature: Messaging (renamed from 'messaging')
    /calendar        <-- Feature: Scheduling
    /tracking        <-- Feature: Progress Tracking
  /services          <-- API & External Integrations
    /convex          <-- Convex API definitions/types
    /store           <-- Redux Store setup
```

---

## 2. HARD CONSTRAINTS (NON-NEGOTIABLE)

*   ❌ **Do NOT modify Convex schema or backend logic** (files in `convex/` must strictly stay there).
*   ❌ **Do NOT modify Clerk auth setup**.
*   ❌ **Do NOT delete files** unless explicitly instructed (prefer moving).
*   ❌ **Do NOT rename routes in `/app`** (unless fixing a broken import).
*   ❌ **Do NOT introduce new libraries**.
*   ❌ **Do NOT change runtime behavior**.
*   ❌ **Do NOT touch `tsconfig.json`, `babel.config.js`, or `metro.config.js`**.

Convex, Clerk, and Redux must continue working exactly as before.

---

## 3. Execution Instructions (The "How-To")

### A. Folder & File Operations (STRICT)

**1. Rename & Normalize**
*   Rename `src/component` (singular) → `src/components` (plural).
*   Remove `src/shared` and `src/common`. Merge their contents into `src/components` or `src/core`.

**2. Generic UI (Move to `src/components/ui`)**
*   `src/shared/components/GradientBackground.tsx`
*   `src/shared/components/AuthButton.tsx`
*   `src/component/common/SegmentedControl.tsx`

**3. Feature Ownership (Consolidate Logic)**
*   **Doctor Feature (`src/features/doctor`)**:
    *   Move `src/component/doctor/*` → `src/features/doctor/components/`
    *   Move `src/hooks/useClients*` → `src/features/doctor/hooks/`
    *   Move `src/hooks/useTodaysAppointments.ts` → `src/features/doctor/hooks/`
*   **Client/Patient Feature (`src/features/client`)**:
    *   Move `src/features/clients/*` → `src/features/client/` (Rename for consistency)
*   **Tracking Feature**:
    *   Move `src/component/WaterTracker` → `src/features/tracking/components/`
    *   Move `src/component/WeightCheckin` → `src/features/tracking/components/`
*   **Meals Feature**:
    *   Move `src/component/MealCard` → `src/features/meals/components/`
    *   Move `src/data/mealsData.ts` → `src/features/meals/data/`

**4. Doctor and Patient features must never import from each other.**

### B. Naming Rules
*   **Folders**: `kebab-case` (e.g., `meal-plans`, `user-profile`).
*   **Components/Screens**: `PascalCase` (e.g., `UserProfile.tsx`, `MealCard.tsx`).
*   **Hooks/Utils**: `camelCase` (e.g., `useAuth.ts`, `formatDate.ts`).
*   **Barrel Exports**: `index.ts` files should ONLY expose the public API of a feature.

### C. Thin Router Enforcement
*   Files in `/app` must be < 50 lines.
*   They should only read URL params and render a Screen component from `src/features/.../screens/`.
*   ❌ No business logic, no Convex calls, no Redux logic in `/app`.

---

## 4. Your Immediate Task

**Step 1: The Move Plan**
Output a bash script (or list of commands) to physically move the files.
*   Use `mkdir -p` to create directories.
*   Use `[ -f ]` checks to verify file existence before moving.
*   Use `mv` for moving.
*   **Do NOT use destructive commands (`rm`).**

**Step 2: The Import Refactor**
Update all affected imports to use the `@/src/...` alias.
*   Example: Change `../../component/MealCard` to `@/src/features/meals/components/MealCard`.

**Step 3: Verification**
Review the project tree to ensure no "orphan" files remain in `src/shared` or `src/component`.

---

**Tone:**
*   Act as a Lead Architect.
*   Be decisive.
*   "Measure twice, cut once."

**Start now.**
