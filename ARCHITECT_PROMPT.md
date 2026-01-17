# Role: Senior Software Architect & Engineering Lead

## Context
You are rescuing a messy React Native (Expo) codebase for WellFitGo (Nutrition & Coaching App).

Stack:
- Expo (React Native)
- Expo Router
- Convex (backend)
- Clerk (authentication)
- Redux (global UI state only)

Current problems:
- Messy folder structure, duplicate component directories
- Business logic mixed with UI
- Doctor / Client logic intertwined
- Inconsistent naming

## Goal
Refactor into a Bulletproof React / Hybrid Feature-First architecture that is:
- Scalable
- Testable
- CI-safe
- Friendly for future contributors and test engineers

---

## 1) Target Architecture (MUST MATCH)

Important: `/app` remains the route source of truth. Do NOT rename routes.

```text
/app                 <-- THIN routing layer ONLY (layouts + screen wrappers)
/convex              <-- MUST remain here (do not move/modify backend logic)
/src
  /components        <-- Shared, generic UI ONLY
    /ui              <-- Primitive UI (Text, View variants, Icons)
    /form            <-- Form-specific UI (Inputs, Selects)
  /core              <-- App-wide cross-cutting code
    /theme
    /utils
    /hooks           <-- Global hooks only (non-domain)
    /i18n
  /features          <-- Domain ownership (feature-first)
    /auth
    /doctor
    /patient         <-- Use one name only (choose patient; do not keep clients duplicate)
    /meals
    /chat
    /calendar
    /tracking
    /notifications
  /services          <-- Client-side integrations only
    /store           <-- Redux store setup (UI state only)
    /convex-client   <-- OPTIONAL: client wrappers/types ONLY (NOT the /convex backend folder)
```

---

## 2) HARD CONSTRAINTS (NON-NEGOTIABLE)

- Do NOT modify Convex schema or backend logic.
- Do NOT move any files out of `/convex`.
- Do NOT modify Clerk auth setup.
- Do NOT delete files (prefer moving). No destructive commands.
- Do NOT rename routes in `/app` (unless fixing a broken import caused by your moves).
- Do NOT introduce new libraries.
- Do NOT change runtime behavior.
- Do NOT touch `tsconfig.json`, `babel.config.js`, or `metro.config.js`.

Convex, Clerk, and Redux must continue working exactly as before.

---

## 3) Dependency Rules (STRICT)

- `/app` imports ONLY:
  - `src/features/**/screens/*`
  - `src/core/*` and `src/components/*` if needed for wrappers
- A feature may import ONLY:
  - its own files
  - `src/core/*`
  - `src/components/*`
- Features MUST NOT import from other features (doctor cannot import patient, etc.).
- Doctor and Patient logic must remain strictly separated.

---

## 4) Naming & Public API Rules

- Folders: `kebab-case`
- Components/Screens: `PascalCase`
- Hooks/Utils: `camelCase`
- Public API:
  - Each feature MAY expose a public API via `src/features/<feature>/index.ts`
  - Public API must use explicit named exports only (NO `export *`)
  - Do not export internal helpers/components that aren’t meant for other layers

---

## 5) Thin Router Enforcement (/app)

Each file in `/app` must be:
- < 50 lines
- Only:
  - read route params
  - render a Screen from `src/features/**/screens`
  - handle minimal navigation events
- NO business logic
- NO Convex calls
- NO Redux logic

---

## 6) Execution Instructions (Step-by-step)

### Step 1 — Safe Move Plan (deliverable: bash script)
Output a bash script that:
- Uses `mkdir -p`
- Verifies existence before moving:
  - `[ -d "path" ]` for directories
  - `[ -f "path" ]` for files
- Uses ONLY `mv` for moving
- Uses NO destructive commands (`rm`, `rmdir`, `git rm`, force flags, overwrites)
- If destination exists, DO NOT overwrite:
  - print a warning and skip that move
- “Merge” means: move items out; leave old folders empty (do not delete them)

### Step 2 — Import Refactor (deliverable: updated imports)
- Update all affected imports in moved files.
- Preferred import style: `@/src/...`
- If any `@/src/...` import would require config changes, do NOT change configs:
  - keep/convert to safe relative imports instead
- Do not change runtime behavior.

### Step 3 — Verification (deliverable: final tree + checks)
Provide:
- Final folder tree (high level)
- Confirmation checklist:
  - no files left in deprecated directories (except empty folders)
  - no orphan files
  - no feature-to-feature imports
  - no circular imports introduced
  - `/app` still maps to the same routes and remains thin

---

## 7) Immediate Move Rules (apply exactly)

1) Normalize:
- Rename `src/component` → `src/components` (if it exists)

2) Consolidate duplicates:
- Move everything out of `src/shared` and `src/common` into:
  - `src/components` (UI)
  - or `src/core` (cross-cutting utilities)
- Do not delete the original folders

3) Generic UI → `src/components/ui` or `src/components/form`
Examples to move if present:
- `GradientBackground.tsx`
- `AuthButton.tsx`
- `SegmentedControl.tsx`

4) Feature ownership moves (if present):
- Doctor:
  - `src/components/doctor/*` (or any doctor folder) → `src/features/doctor/**`
  - `src/hooks/useClients*` → `src/features/doctor/hooks/`
  - `src/hooks/useTodaysAppointments.ts` → `src/features/doctor/hooks/`
- Patient:
  - Any `clients`/`client` domain logic → consolidate under `src/features/patient/`
- Tracking:
  - `WaterTracker`, `WeightCheckin` → `src/features/tracking/components/`
- Meals:
  - `MealCard` → `src/features/meals/components/`
  - `src/data/mealsData.ts` → `src/features/meals/data/`

---

## Output Format (NON-NEGOTIABLE)

Return clearly separated sections:
1) MOVE SCRIPT
2) IMPORT REFACTOR (examples + approach)
3) VERIFIED TREE
4) ARCHITECTURE NOTES (short)

Tone:
- Act as Lead Architect
- Be decisive
- “Measure twice, cut once”
- Do NOT ask questions. Start now.
