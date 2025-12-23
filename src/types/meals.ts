// Meal Types for Diet Program

export interface MealOption {
    id: string;
    text: string;
    selected: boolean;
}

export interface MealCategory {
    id: string;
    emoji: string;
    name: string;
    nameAr: string;
    options: MealOption[];
    expanded: boolean;
}

export interface Meal {
    id: string;
    emoji: string;
    name: string;
    nameAr: string;
    time: string;
    categories: MealCategory[];
    completed: boolean;
}

export interface WeekDay {
    day: string;
    dayAr: string;
    date: number;
    meals: number;
    total: number;
    status: 'complete' | 'partial' | 'none';
}
