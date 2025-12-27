import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Meal } from '@/src/types/meals';
import { initialMealsData } from '@/src/features/meals/data/mealsData';

// Helper to get today's date as ISO string (YYYY-MM-DD)
const getTodayDate = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

// Deep clone initial meals with reset selections
const getResetMeals = (): Meal[] => {
    return JSON.parse(JSON.stringify(initialMealsData)).map((meal: Meal) => ({
        ...meal,
        completed: false,
        categories: meal.categories.map(cat => ({
            ...cat,
            options: cat.options.map(opt => ({
                ...opt,
                selected: false,
            })),
        })),
    }));
};

interface MealsState {
    meals: Meal[];
    lastResetDate: string; // Track which date the meals were last reset
    currentDate: string; // Current viewing date
}

const initialState: MealsState = {
    meals: getResetMeals(),
    lastResetDate: getTodayDate(),
    currentDate: getTodayDate(),
};

const mealsSlice = createSlice({
    name: 'meals',
    initialState,
    reducers: {
        // Check and reset meals if it's a new day
        checkAndResetDaily: (state) => {
            const today = getTodayDate();
            if (state.lastResetDate !== today) {
                // It's a new day - reset all meals
                state.meals = getResetMeals();
                state.lastResetDate = today;
                state.currentDate = today;
            }
        },
        // Mark a meal as completed
        completeMeal: (state, action: PayloadAction<string>) => {
            const mealId = action.payload;
            const meal = state.meals.find(m => m.id === mealId);
            if (meal) {
                meal.completed = true;
            }
        },
        // Mark a meal as not completed (to change choices)
        uncompleteMeal: (state, action: PayloadAction<string>) => {
            const mealId = action.payload;
            const meal = state.meals.find(m => m.id === mealId);
            if (meal) {
                meal.completed = false;
            }
        },
        // Select an option within a category
        selectOption: (state, action: PayloadAction<{ mealId: string; categoryId: string; optionId: string }>) => {
            const { mealId, categoryId, optionId } = action.payload;
            const meal = state.meals.find(m => m.id === mealId);
            if (meal) {
                const category = meal.categories.find(c => c.id === categoryId);
                if (category) {
                    category.options.forEach(opt => {
                        opt.selected = opt.id === optionId;
                    });
                }
            }
        },
        // Reset all meals to initial state (manual reset)
        resetMeals: (state) => {
            state.meals = getResetMeals();
            state.lastResetDate = getTodayDate();
        },
        // Set current viewing date
        setCurrentDate: (state, action: PayloadAction<string>) => {
            state.currentDate = action.payload;
        },
    },
});

export const {
    completeMeal,
    uncompleteMeal,
    selectOption,
    resetMeals,
    checkAndResetDaily,
    setCurrentDate
} = mealsSlice.actions;

// Selectors
export const selectMeals = (state: { meals: MealsState }) => state.meals.meals;
export const selectMealById = (mealId: string) => (state: { meals: MealsState }) =>
    state.meals.meals.find(m => m.id === mealId);
export const selectLastResetDate = (state: { meals: MealsState }) => state.meals.lastResetDate;
export const selectCurrentDate = (state: { meals: MealsState }) => state.meals.currentDate;

export default mealsSlice.reducer;

