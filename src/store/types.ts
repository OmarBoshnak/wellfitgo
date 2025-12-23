// Weight entry with unique id and timestamp
export interface WeightEntry {
    id: string;
    date: string; // ISO string
    value: number;
}

export interface UserState {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: 'male' | 'female' | '';
    age: string;
    height: string;
    heightUnit: 'cm' | 'ft';
    currentWeight: string;
    targetWeight: string;
    startWeight: number; // Initial weight from onboarding
    goal: 'loss' | 'maintain' | 'gain' | '';
    medicalConditions: string;
    // Weight history with full tracking
    weightHistory: WeightEntry[];
    isOnboarded: boolean;
}

import { Meal } from '@/src/types/meals';
import { WaterState } from './waterSlice';

export interface MealsState {
    meals: Meal[];
    lastResetDate: string;
    currentDate: string;
}

export interface RootState {
    user: UserState;
    meals: MealsState;
    water: WaterState;
}
