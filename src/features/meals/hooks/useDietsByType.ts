/**
 * Diet Plans by Type Hook
 *
 * Fetches diet plans filtered by category type from Convex
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ============ TYPE DEFINITIONS ============

/**
 * Diet plan type - matches schema union
 */
export type DietType =
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

/**
 * Diet plan as returned from Convex
 */
export interface DietPlan {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    targetCalories?: number;
    emoji: string;
    mealsCount: number;
    usageCount: number;
}

// ============ HOOK ============

/**
 * Hook for fetching diet plans by type
 */
export function useDietsByType(type: DietType) {
    const diets = useQuery(api.plans.getDietsByType, { type });

    const isLoading = diets === undefined;

    return {
        diets: diets as DietPlan[] | undefined,
        isLoading,
        error: null, // Error handling would require error boundary
    };
}
