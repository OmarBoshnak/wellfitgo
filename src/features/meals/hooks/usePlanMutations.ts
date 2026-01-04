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

// Meal structure types (must be defined before interfaces that use them)
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

// Diet Plan args (now MealData is defined above)
export interface CreateDietPlanArgs {
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    type: DietPlanType;
    categoryId?: Id<"dietCategories">; // For linking to custom categories
    targetCalories?: number;
    tags?: string[];
    meals?: MealData[];
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

export interface CreateDietCategoryArgs {
    name: string;
    nameAr?: string;
    emoji: string;
    description?: string;
    autoGenerateRanges?: boolean;
}

// ============ HOOK ============

export function usePlanMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Raw mutations
    const createDietPlanMutation = useMutation(api.plans.createDietPlan);
    const updateDietPlanMutation = useMutation(api.plans.updateDietPlan);
    const deleteDietPlanMutation = useMutation(api.plans.deleteDietPlan);
    const createWeeklyPlanMutation = useMutation(api.plans.createWeeklyPlan);
    const updateWeeklyPlanMutation = useMutation(api.plans.updateWeeklyPlan);
    const createDietCategoryMutation = useMutation(api.plans.createDietCategory);
    const deleteDietCategoryMutation = useMutation(api.plans.deleteDietCategory);

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

    const deleteDietPlan = useCallback(async (id: Id<"dietPlans">) => {
        setIsLoading(true);
        setError(null);
        try {
            await deleteDietPlanMutation({ id });
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [deleteDietPlanMutation]);

    const createDietCategory = useCallback(async (args: CreateDietCategoryArgs) => {
        setIsLoading(true);
        setError(null);
        try {
            const id = await createDietCategoryMutation(args);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [createDietCategoryMutation]);

    const deleteDietCategory = useCallback(async (id: Id<"dietCategories">) => {
        setIsLoading(true);
        setError(null);
        try {
            await deleteDietCategoryMutation({ id });
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [deleteDietCategoryMutation]);

    return {
        createDietPlan,
        updateDietPlan,
        deleteDietPlan,
        createWeeklyPlan,
        updateWeeklyPlan,
        createDietCategory,
        deleteDietCategory,
        isLoading,
        error,
    };
}
