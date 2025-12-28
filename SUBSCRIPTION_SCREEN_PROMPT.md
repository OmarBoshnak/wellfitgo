# Role: Senior Frontend Engineer (React Native + Expo)

**Context:**
You are converting a provided HTML/Tailwind "Subscription Plans" design into a React Native Expo screen.
This screen will appear as a **Modal** after the user completes the "Book Call" flow.
The user can choose a plan OR close the modal (skip payment for now).

**Files of Interest:**
- New File: `app/(app)/subscription_modal.tsx` (Route)
- New Component: `src/features/subscription/components/SubscriptionScreen.tsx`
- Source HTML: *[See provided HTML in context]*

---

## 1. The Mission

Convert the HTML design pixel-perfectly to React Native, using the existing project theme and scaling utilities.

### Design Elements to Port
1.  **Header**:
    *   "Choose Your Plan" title.
    *   "X" Close button (Top Left/Right based on RTL).
2.  **Trial Banner**:
    *   "7-day free trial" gradient icon + text.
3.  **Plan Cards (3 Options)**:
    *   **Monthly**: Standard border.
    *   **Quarterly**: "Most Popular" badge, gradient border/glow effect.
    *   **Annual**: "Best Value" badge.
    *   *Features*: List with checkmarks.
4.  **Social Proof**:
    *   Avatars overlap + "Join 10,000+ healthy members".
5.  **Footer**:
    *   "Continue" gradient button (Sticky bottom).
    *   Terms/Privacy links.

---

## 2. Implementation Specs

### A. Localization (RTL Support)
*   Separate ALL text strings into a `t` object (or `translations.ts`).
*   Example:
    ```typescript
    const t = {
      choosePlan: isRTL ? 'اختر خطتك' : 'Choose Your Plan',
      monthly: isRTL ? 'شهري' : 'Monthly Plan',
      mostPopular: isRTL ? 'الأكثر شيوعاً' : 'Most Popular',
      // ...
    };
    ```
*   Use `flexDirection: isRTL ? 'row-reverse' : 'row'` for all horizontal layouts (headers, lists, prices).
*   Align text (`textAlign: isRTL ? 'right' : 'left'`).

### B. Styling (Theme & Scaling)
*   **Colors**: Map HTML colors to `src/theme/colors.ts`.
    *   `brand-blue` -> `colors.primary` (or `#5073FE`)
    *   `brand-cyan` -> `colors.secondary` (or `#02C3CD`)
    *   `bg-page` -> `colors.bgPrimary`
*   **Scaling**: Use `horizontalScale`, `verticalScale`, `ScaleFontSize`.
*   **Shadows**: Use React Native `shadowColor`, `shadowOpacity`, `elevation`.
*   **Gradients**: Use `LinearGradient` from `expo-linear-gradient` for the "Continue" button and "Most Popular" badge.

### C. Logic & Interaction
1.  **State**: `selectedPlan` ('monthly' | 'quarterly' | 'annual').
2.  **Close Action**:
    *   The "X" button must `router.back()` or navigate to the main dashboard.
    *   This fulfills the "Skip" requirement.
3.  **Continue Action**:
    *   Console log the selected plan for now (or navigate to a payment placeholder).

---

## 3. Deliverables

1.  `src/features/subscription/components/SubscriptionScreen.tsx`
    *   The core UI component.
2.  `app/(app)/subscription_modal.tsx`
    *   The page wrapper that imports the component.
    *   Set `presentation: 'modal'` in `_layout.tsx` if needed (or just assume it's a standard screen for now).

**Tone**:
Pixel-perfect. Native feel. RTL-first.
