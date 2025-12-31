# Feature: Assignment Success Modal (Visual Polish)

## Context
The user wants to enhance the "Assignment Successful" feedback loop when a Doctor assigns a diet plan to clients.
The goal is to replace a generic alert/toast with a **rich, pixel-perfect modal** based on the provided HTML/Tailwind design.

## Requirements

### 1. New Component: `AssignmentSuccessModal.tsx`
Create this component in `src/features/meal-plans/components/AssignmentSuccessModal.tsx`.

#### UI Specifications (Ported from HTML)
*   **Modal Structure:**
    *   Transparent black backdrop (`bg-slate-900/60`).
    *   Centered Card: White background, `rounded-lg`, width ~300px.
    *   **Animations:** Slide-in from bottom + Fade-in (use `react-native-reanimated` entering props or simple `Modal` animation).
*   **Content:**
    *   **Icon:** Large Green Check Circle (`check_circle`, size 64px) with a subtle green glow/blur behind it.
    *   **Headline:** "Plan Assigned!" (or Arabic equivalent).
    *   **Body:** Rich text: "**[Plan Name]** has been assigned to **[Count] clients**".
    *   **Avatar Group:**
        *   Row of overlapping circular avatars (`-space-x-3` in Tailwind -> negative margin in RN).
        *   White border rings to separate them.
        *   Show up to 3 avatars, then maybe a "+X" circle if more.
*   **Actions:**
    *   **"Done" Button:** Gradient background (`primary` -> lighter green). Full width. Shadow.
    *   **"View Client" Button:** Outlined/Bordered primary color.

#### Props Interface
```typescript
interface AssignmentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onViewClient: () => void;
  planName: string;
  assignedClientIds: Id<"users">[]; // To fetch avatars
}
```

#### Localization (Arabic/RTL)
*   **Headline:** "تم تعيين الخطة!"
*   **Body:** "**[Plan Name]** تم تعيينها لـ **[Count] عملاء**"
*   **Buttons:** "تم" (Done), "عرض العميل" (View Client).
*   **Layout:** Ensure text alignment and avatar overlap direction respects `isRTL`.

### 2. Backend Integration (Data Fetching)
*   The component needs to fetch the `avatarUrl` for the `assignedClientIds`.
*   Use `api.users.getUsersByIds` (or similar) to get the client details for the avatar group.

### 3. Integration Point
*   **File:** `src/features/meal-plans/components/AssignClientModal.tsx` (from previous prompt).
*   **Logic:**
    *   Instead of closing `AssignClientModal` immediately after success:
    *   **Hide** the Assign form.
    *   **Show** this `AssignmentSuccessModal`.
    *   Pass the necessary data (selected clients, plan name).

### 4. Navigation Logic
*   **onClose (Done):** Close modal -> Navigate back to Plans List.
*   **onViewClient:**
    *   If 1 client: Navigate to `ClientProfile` screen.
    *   If >1 client: Navigate to `MyClients` list screen.

## ✅ Definition of Done
- [ ] Modal visually matches the "Success" HTML design (Icon, Glow, Avatars).
- [ ] Avatars overlap correctly (and flip for RTL).
- [ ] "View Client" button routes intelligently based on client count.
- [ ] Arabic translations are applied.
