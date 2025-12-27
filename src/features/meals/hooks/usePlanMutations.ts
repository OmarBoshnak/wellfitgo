/**
 * Plan Mutations Hook
 *
 * Provides mutations for creating and updating diet plans and weekly plans
 */

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useCallback } from "react";

// ============ TYPE DEFINITIONS ============

export type DietPlanType =
    | "keto"
    | "weekly"
    | "classic"
    | "low_carb"
    | "high_protein"
    | "intermittent_fasting"
    | "vegetarian"
    | "maintenance"
    | "muscle_gain"
    | "medical"
    | "custom";

export type WeeklyPlanStatus = "draft" | "published" | "active" | "completed" | "archived";

export interface CreateDietPlanArgs {
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    type: DietPlanType;
    targetCalories?: number;
    tags?: string[];
}

// Meal structure types for updating diet plans
export interface MealOption {
    id: string;
    text: string;
    textEn?: string;
}

export interface MealCategory {
    id: string;
    emoji?: string;
    name: string;
    nameAr?: string;
    options: MealOption[];
}

export interface MealData {
    id: string;
    emoji?: string;
    name: string;
    nameAr?: string;
    time?: string;
    note?: string;
    noteAr?: string;
    categories: MealCategory[];
}

export interface UpdateDietPlanArgs {
    id: Id<"dietPlans">;
    name?: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    descriptionAr?: string;
    targetCalories?: number;
    tags?: string[];
    isActive?: boolean;
    meals?: MealData[];
}

export interface CreateWeeklyPlanArgs {
    clientId: Id<"users">;
    weekStartDate: string;
    notes?: string;
    totalCalories?: number;
    specialInstructions?: string;
    isTemplate?: boolean;
    templateName?: string;
}

export interface UpdateWeeklyPlanArgs {
    id: Id<"weeklyMealPlans">;
    status?: WeeklyPlanStatus;
    notes?: string;
    totalCalories?: number;
    specialInstructions?: string;
}

// ============ HOOK ============

export function usePlanMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Raw mutations
    const createDietPlanMutation = useMutation(api.plans.createDietPlan);
    const updateDietPlanMutation = useMutation(api.plans.updateDietPlan);
    const createWeeklyPlanMutation = useMutation(api.plans.createWeeklyPlan);
    const updateWeeklyPlanMutation = useMutation(api.plans.updateWeeklyPlan);

    // Wrapped mutations with loading/error handling
    const createDietPlan = useCallback(async (args: CreateDietPlanArgs) => {
        setIsLoading(true);
        setError(null);
        try {
            const id = await createDietPlanMutation(args);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [createDietPlanMutation]);

    const updateDietPlan = useCallback(async (args: UpdateDietPlanArgs) => {
        setIsLoading(true);
        setError(null);
        try {
            const id = await updateDietPlanMutation(args);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [updateDietPlanMutation]);

    const createWeeklyPlan = useCallback(async (args: CreateWeeklyPlanArgs) => {
        setIsLoading(true);
        setError(null);
        try {
            const id = await createWeeklyPlanMutation(args);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [createWeeklyPlanMutation]);

    const updateWeeklyPlan = useCallback(async (args: UpdateWeeklyPlanArgs) => {
        setIsLoading(true);
        setError(null);
        try {
            const id = await updateWeeklyPlanMutation(args);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [updateWeeklyPlanMutation]);

    return {
        createDietPlan,
        updateDietPlan,
        createWeeklyPlan,
        updateWeeklyPlan,
        isLoading,
        error,
    };
}
