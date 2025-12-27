# Role: Senior Frontend Engineer (React Native + Convex)

**Context:**
You are refining the `EditDietScreen.tsx` component.
The user wants to make the **granular edit buttons** inside the "Meal Plan Editor" functional.
Currently, buttons like the Trash icon (delete meal), Pencil icon (edit name), and Plus icon (add food item) are static and do nothing.

**Files of Interest:**
- UI: `src/features/meals/components/EditDietScreen.tsx`
- Schema: `convex/schema.ts` (`dietPlans` -> nested `meals` structure)

---

## 1. The Mission

Make every button inside the Meal Editor functional by manipulating the **local state**.
The changes will be persisted to Convex only when the main "Save" button is clicked.

### Specific Actions to Implement

1.  **Meal Level**:
    *   **Trash Icon**: Remove the meal from the local `meals` state. Show a confirmation alert ("Delete Breakfast?").
    *   **Pencil Icon**: Open a simple modal (or toggle inline edit mode) to rename the meal (e.g., change "Breakfast" to "Late Breakfast").
    *   **"Add Food Category" Button**: Add a new empty category (e.g., "Snacks") to the meal.

2.  **Category Level**:
    *   **Pencil Icon**: Rename the category (e.g., change "Carbs" to "Slow Carbs").
    *   **"Add Food Item" Button**:
        *   Show a small input modal or inline text input.
        *   Add a new food item string/object to the category's `items` array.

3.  **Food Item Level**:
    *   **X Icon**: Remove the food item from the category.

---

## 2. State Management Strategy

Since `dietPlans` stores meals as a nested JSON structure (or related table), you must manage a deep local state.

1.  **Initialization**:
    *   `const [localMeals, setLocalMeals] = useState<Meal[]>(diet.meals || []);`
2.  **Helper Functions**:
    *   Create robust helper functions to avoid deep nesting bugs:
        *   `addFoodItem(mealId, categoryId, itemText)`
        *   `removeFoodItem(mealId, categoryId, itemId)`
        *   `deleteMeal(mealId)`
        *   `updateMealName(mealId, newName)`
3.  **Schema Compliance**:
    *   Ensure every new item/category generated has a unique temporary ID (e.g., `Date.now().toString()`) if the schema requires IDs.
    *   Ensure the structure matches `Meal -> Category -> Item`.

---

## 3. Convex Integration

*   The "Save" button (top right) is already wired to `updateDietPlan`.
*   **Your Task**: Ensure that when `updateDietPlan` is called, it sends the **updated `localMeals` array** as part of the payload.
*   *Note*: The backend mutation `updateDietPlan` must be capable of accepting a full `meals` array replacement.

---

## 4. Frontend Implementation Steps

1.  **Create State**: Replace `MOCK_MEALS` with `localMeals` state initialized from props.
2.  **Implement Handlers**: Write the add/remove/edit functions.
3.  **Wire Buttons**: Connect the `TouchableOpacity` elements to these handlers.
4.  **UI Feedback**:
    *   When an item is deleted, animate it out (LayoutAnimation) or just remove it instantly.
    *   When adding an item, ensure the list scrolls to show it.

## 5. Deliverables

- `src/features/meals/components/EditDietScreen.tsx`
    - Fully functional granular buttons.
    - No more `MOCK_MEALS`.
    - Local state manipulation logic.

**Tone**:
Interactive. Detailed. State-aware.
