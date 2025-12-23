/**
 * useMealPlanDraft Hook
 * State management for the meal plan creation flow
 */
import { useReducer, useCallback } from 'react';
import { defaultMeals, calorieConfig } from '../constants';
import type {
    MealPlanDraft,
    MealPlanAction,
    MealSection,
    FoodCategory,
    NumberOfMeals,
    PlanDuration,
    NotificationSettings,
} from '../types';

const initialState: MealPlanDraft = {
    planName: '',
    basedOn: null,
    calories: calorieConfig.default,
    numberOfMeals: 5,
    duration: 'ongoing',
    meals: defaultMeals.map(meal => ({ ...meal, categories: [] })),
    startDate: new Date(),
    notifications: {
        push: true,
        email: false,
        whatsapp: false,
    },
    personalMessage: '',
    saveAsTemplate: false,
};

function mealPlanReducer(state: MealPlanDraft, action: MealPlanAction): MealPlanDraft {
    switch (action.type) {
        case 'SET_PLAN_NAME':
            return { ...state, planName: action.payload };

        case 'SET_BASED_ON':
            return { ...state, basedOn: action.payload };

        case 'SET_CALORIES':
            return { ...state, calories: action.payload };

        case 'SET_NUMBER_OF_MEALS':
            return { ...state, numberOfMeals: action.payload };

        case 'SET_DURATION':
            return { ...state, duration: action.payload };

        case 'UPDATE_MEAL':
            return {
                ...state,
                meals: state.meals.map(meal =>
                    meal.id === action.payload.id ? action.payload : meal
                ),
            };

        case 'TOGGLE_MEAL_EXPANDED':
            return {
                ...state,
                meals: state.meals.map(meal =>
                    meal.id === action.payload
                        ? { ...meal, isExpanded: !meal.isExpanded }
                        : { ...meal, isExpanded: false } // Close all other meals
                ),
            };

        case 'SET_EXPANDED_MEAL':
            return {
                ...state,
                meals: state.meals.map(meal => ({
                    ...meal,
                    isExpanded: meal.id === action.payload,
                })),
            };

        case 'ADD_CATEGORY':
            return {
                ...state,
                meals: state.meals.map(meal =>
                    meal.id === action.payload.mealId
                        ? { ...meal, categories: [...meal.categories, action.payload.category] }
                        : meal
                ),
            };

        case 'UPDATE_CATEGORY':
            return {
                ...state,
                meals: state.meals.map(meal =>
                    meal.id === action.payload.mealId
                        ? {
                            ...meal,
                            categories: meal.categories.map(cat =>
                                cat.id === action.payload.category.id
                                    ? action.payload.category
                                    : cat
                            ),
                        }
                        : meal
                ),
            };

        case 'REMOVE_CATEGORY':
            return {
                ...state,
                meals: state.meals.map(meal =>
                    meal.id === action.payload.mealId
                        ? {
                            ...meal,
                            categories: meal.categories.filter(
                                cat => cat.id !== action.payload.categoryId
                            ),
                        }
                        : meal
                ),
            };

        case 'SET_START_DATE':
            return { ...state, startDate: action.payload };

        case 'SET_NOTIFICATIONS':
            return {
                ...state,
                notifications: { ...state.notifications, ...action.payload },
            };

        case 'SET_PERSONAL_MESSAGE':
            return { ...state, personalMessage: action.payload };

        case 'SET_SAVE_AS_TEMPLATE':
            return { ...state, saveAsTemplate: action.payload };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

export function useMealPlanDraft(clientName: string = '') {
    const [state, dispatch] = useReducer(mealPlanReducer, {
        ...initialState,
        planName: clientName ? `${clientName}'s Custom Plan` : '',
    });

    // Action creators
    const setPlanName = useCallback((name: string) => {
        dispatch({ type: 'SET_PLAN_NAME', payload: name });
    }, []);

    const setBasedOn = useCallback((basedOn: string | null) => {
        dispatch({ type: 'SET_BASED_ON', payload: basedOn });
    }, []);

    const setCalories = useCallback((calories: number) => {
        dispatch({ type: 'SET_CALORIES', payload: calories });
    }, []);

    const setNumberOfMeals = useCallback((count: NumberOfMeals) => {
        dispatch({ type: 'SET_NUMBER_OF_MEALS', payload: count });
    }, []);

    const setDuration = useCallback((duration: PlanDuration) => {
        dispatch({ type: 'SET_DURATION', payload: duration });
    }, []);

    const toggleMealExpanded = useCallback((mealId: string) => {
        dispatch({ type: 'TOGGLE_MEAL_EXPANDED', payload: mealId });
    }, []);

    const addCategory = useCallback((mealId: string, category: FoodCategory) => {
        dispatch({ type: 'ADD_CATEGORY', payload: { mealId, category } });
    }, []);

    const updateCategory = useCallback((mealId: string, category: FoodCategory) => {
        dispatch({ type: 'UPDATE_CATEGORY', payload: { mealId, category } });
    }, []);

    const removeCategory = useCallback((mealId: string, categoryId: string) => {
        dispatch({ type: 'REMOVE_CATEGORY', payload: { mealId, categoryId } });
    }, []);

    const setExpandedMeal = useCallback((mealId: string | null) => {
        dispatch({ type: 'SET_EXPANDED_MEAL', payload: mealId });
    }, []);

    const setStartDate = useCallback((date: Date) => {
        dispatch({ type: 'SET_START_DATE', payload: date });
    }, []);

    const setNotifications = useCallback((notifications: Partial<NotificationSettings>) => {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    }, []);

    const setPersonalMessage = useCallback((message: string) => {
        dispatch({ type: 'SET_PERSONAL_MESSAGE', payload: message });
    }, []);

    const setSaveAsTemplate = useCallback((save: boolean) => {
        dispatch({ type: 'SET_SAVE_AS_TEMPLATE', payload: save });
    }, []);

    const resetDraft = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    // Batch update from BasicInfo screen
    const updateBasicInfo = useCallback((data: {
        planName: string;
        basedOn: string | null;
        calories: number;
        numberOfMeals: NumberOfMeals;
        duration: PlanDuration;
    }) => {
        dispatch({ type: 'SET_PLAN_NAME', payload: data.planName });
        dispatch({ type: 'SET_BASED_ON', payload: data.basedOn });
        dispatch({ type: 'SET_CALORIES', payload: data.calories });
        dispatch({ type: 'SET_NUMBER_OF_MEALS', payload: data.numberOfMeals });
        dispatch({ type: 'SET_DURATION', payload: data.duration });
    }, []);

    return {
        state,
        setPlanName,
        setBasedOn,
        setCalories,
        setNumberOfMeals,
        setDuration,
        toggleMealExpanded,
        setExpandedMeal,
        addCategory,
        updateCategory,
        removeCategory,
        setStartDate,
        setNotifications,
        setPersonalMessage,
        setSaveAsTemplate,
        resetDraft,
        updateBasicInfo,
    };
}
