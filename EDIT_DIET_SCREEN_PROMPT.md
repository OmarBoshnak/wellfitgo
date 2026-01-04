# Edit/Create Diet Screen Refactor Prompt

## Role
You are an expert Senior React Native Engineer specializing in high-fidelity UI implementations and performant state management. You are tasked with porting a provided HTML/Tailwind design into a production-ready React Native Expo application.

## Goal
Convert the provided HTML/Tailwind design into two React Native components:
1.  **Refactor** `src/features/meals/components/EditDietScreen.tsx` to match the new design.
2.  **Create** `src/features/meals/components/CreateDietScreen.tsx` using the same design patterns but adapted for creating a new diet plan.

## Source Material (The "Target Design")
The following HTML represents the desired UI. Note the use of collapsible sections, specific shadows, rounded corners, and the "Add Food Item" modal.

```html
<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>WellFitGo Edit Diet Program</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#714dfe",
                        "background-light": "#f6f5f8",
                        "background-dark": "#130f23",
                    },
                    fontFamily: {
                        "display": ["Lexend", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<!-- [Rest of the HTML body provided in the task] -->
<!-- Please refer to the user input for the full body content, specifically:
     - Header with Back/Save buttons
     - Collapsible "Basic Info" section
     - Collapsible "Meal Plan Editor" with meal times (Breakfast, Lunch, Dinner)
     - Inner cards for Categories (Carbs, Protein)
     - Bottom Sheet Modal for "Add to Carbs" -->
```

## Technical Constraints & Environment
1.  **Styling System:**
    *   **NO NativeWind/Tailwind classes.** You must use `StyleSheet.create` and standard React Native View/Text styles.
    *   **Theme Integration:** Use `src/constants/Themes.ts`.
        *   Map HTML `primary` (#714dfe) to `colors.primaryDark` (#5073FE) or `colors.primaryLight` depending on the gradient. If the specific purple (#714dfe) is critical, add it to the theme or use it as a constant in the file, but prefer consistency.
        *   Map HTML `background-light` (#f6f5f8) to `colors.bgSecondary`.
        *   Map HTML `background-dark` (#130f23) to `colors.dark` or handle via the existing dark mode logic if present (currently the app seems light-mode focused or handled via `colors` object).
    *   **Scaling:** Use `src/utils/scaling.ts` (`horizontalScale`, `verticalScale`, `ScaleFontSize`) for all dimensions to ensure responsiveness.

2.  **Icons:**
    *   Use `lucide-react-native` (already installed) to replace the HTML's Google Material Symbols.
    *   Mappings:
        *   `arrow_back` -> `ArrowLeft` (or `ArrowRight` for RTL)
        *   `info` -> `Info`
        *   `local_fire_department` -> `Flame`
        *   `restaurant` -> `UtensilsCrossed`
        *   `remove`/`add` -> `Minus`/`Plus`
        *   `edit` -> `Pencil`
        *   `delete` -> `Trash2`
        *   `expand_more` -> `ChevronDown`
        *   `library_add`/`library_books` -> `LibraryBig`
        *   `post_add` -> `FilePlus` (or similar)

3.  **Components & Interaction:**
    *   **Collapsible Sections:** Implement the `<details>` behavior using `useState` and conditional rendering (as seen in the current `EditDietScreen.tsx`).
    *   **Modal:** The "Add Food Item" modal (bottom sheet style) must be implemented. Since `react-native-modal` is not standard, use a custom absolute positioned `View` with a semi-transparent background, or `react-native-reanimated` for entering/exiting animations if you are comfortable, otherwise a simple conditional render is acceptable for MVP.
    *   **RTL Support:** The app enforces RTL (`I18nManager.forceRTL(true)`). Ensure all `flexDirection: 'row'` are checked against `isRTL`. Text alignment must also be handled.

4.  **State Management:**
    *   **EditDietScreen:** Initialize state from the `diet` prop.
    *   **CreateDietScreen:** Initialize state with empty/default values.
    *   **Complex Editors:** The "Add Food Item" and category editing logic should modify *local state*. Do not trigger mutations until "Save" is pressed (unless specific sub-features require it, but for a form like this, batch saving is preferred).

## Implementation Plan

### Step 1: `CreateDietScreen.tsx`
Create this file in `src/features/meals/components/`.
*   Copy the structure from the refactored design.
*   Props: `onBack: () => void`, `onSave: (data: any) => void`.
*   Header title: "Create Diet Plan" (or similar).
*   Default state: Empty calorie range, default meals (Breakfast/Lunch/Dinner) with 0 options.

### Step 2: `EditDietScreen.tsx`
Refactor the existing file.
*   Maintain the existing `Props` interface.
*   Update the `render` method to match the new HTML styling exactly (border radius `xl` -> 24px approx, specific padding, shadow styles).
*   Ensure existing functionality (expanding meals, editing categories) works with the new UI structure.

### Step 3: "Add Food Item" Modal
*   Create a sub-component `AddFoodModal` within the file or in a separate file if it grows too large.
*   Match the HTML design: Rounded top corners (`rounded-t-[2rem]`), blur backdrop if possible (use `BlurView` from `expo-blur` if available, otherwise semi-transparent black), "Add a New Food Item" and "Add Food Item (from library)" options.

## Deliverables
Provide the full code for:
1.  `src/features/meals/components/CreateDietScreen.tsx`
2.  `src/features/meals/components/EditDietScreen.tsx` (Refactored)

## Notes
*   **Do not use `className="..."`.** Use `style={styles.container}`.
*   **Do not install new libraries.** Use what is in `package.json`.
*   **Be pixel perfect.** Pay attention to the padding (p-4), gaps (gap-5), and rounded corners (rounded-xl) in the HTML and translate them to React Native styles.
