/**
 * Meal Plan Types
 * TypeScript interfaces for the Create Meal Plan flow
 */

// Client information display
export interface ClientInfo {
    id: string;
    name: string;
    nameAr: string;
    avatarUrl?: string;
    currentWeight: number;
    targetWeight: number;
    goal: 'weight_loss' | 'maintain' | 'muscle_gain';
}

// Current assigned plan (for the bottom sheet)
export interface CurrentPlan {
    id: string;
    name: string;
    assignedDate: string;
}

// Plan option in the bottom sheet
export interface PlanOption {
    id: 'library' | 'custom' | 'copy';
    icon: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
}

// Template plan for "Based On" selector
export interface PlanTemplate {
    id: string;
    name: string;
    nameAr: string;
}

// Food category item within a meal
export interface FoodCategory {
    id: string;
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
}

// Meal section (Breakfast, Lunch, etc.)
export interface MealSection {
    id: string;
    name: string;
    nameAr: string;
    emoji: string;
    categories: FoodCategory[];
    isExpanded: boolean;
}

// Duration options
export type PlanDuration = 'week' | '2weeks' | 'month' | 'ongoing';

// Number of meals options
export type NumberOfMeals = 3 | 4 | 5 | 6;

// Notification settings
export interface NotificationSettings {
    push: boolean;
    email: boolean;
    whatsapp: boolean;
}

// Full meal plan draft state
export interface MealPlanDraft {
    // Basic Info (Step 1)
    planName: string;
    basedOn: string | null;
    calories: number;
    numberOfMeals: NumberOfMeals;
    duration: PlanDuration;

    // Meals (Step 2)
    meals: MealSection[];

    // Assign Settings (Step 4)
    startDate: Date;
    notifications: NotificationSettings;
    personalMessage: string;
    saveAsTemplate: boolean;
}

// Macros for the donut chart
export interface MacroSplit {
    protein: number;
    carbs: number;
    fat: number;
}

// Meal preview for review screen
export interface MealPreview {
    id: string;
    name: string;
    nameAr: string;
    icon: string;
    iconBgColor: string;
    iconColor: string;
    categoryCount: number;
    optionCount: number;
}

// Validation warning
export interface PlanWarning {
    id: string;
    message: string;
    messageAr: string;
    action?: string;
    actionAr?: string;
}

// Action types for useReducer
export type MealPlanAction =
    | { type: 'SET_PLAN_NAME'; payload: string }
    | { type: 'SET_BASED_ON'; payload: string | null }
    | { type: 'SET_CALORIES'; payload: number }
    | { type: 'SET_NUMBER_OF_MEALS'; payload: NumberOfMeals }
    | { type: 'SET_DURATION'; payload: PlanDuration }
    | { type: 'UPDATE_MEAL'; payload: MealSection }
    | { type: 'TOGGLE_MEAL_EXPANDED'; payload: string }
    | { type: 'SET_EXPANDED_MEAL'; payload: string | null }
    | { type: 'ADD_CATEGORY'; payload: { mealId: string; category: FoodCategory } }
    | { type: 'UPDATE_CATEGORY'; payload: { mealId: string; category: FoodCategory } }
    | { type: 'REMOVE_CATEGORY'; payload: { mealId: string; categoryId: string } }
    | { type: 'SET_START_DATE'; payload: Date }
    | { type: 'SET_NOTIFICATIONS'; payload: Partial<NotificationSettings> }
    | { type: 'SET_PERSONAL_MESSAGE'; payload: string }
    | { type: 'SET_SAVE_AS_TEMPLATE'; payload: boolean }
    | { type: 'RESET' };

// Category type options for add category modal
export type CategoryType =
    | 'protein'
    | 'carbs'
    | 'dairy'
    | 'fruits'
    | 'vegetables'
    | 'fats'
    | 'beverages';

export interface CategoryTypeOption {
    id: CategoryType;
    name: string;
    nameAr: string;
    emoji: string;
}
