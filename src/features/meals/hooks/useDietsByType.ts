/**
 * Diet Plans by Type Hook
 *
 * Fetches diet plans filtered by category type from Convex
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
    | "custom"
    | (string & {}); // Allow any string (for custom category IDs) while preserving autocomplete

/**
 * Diet plan as returned from Convex
 */
export interface DietPlan {
    id: Id<"dietPlans">;
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
export function useDietsByType(type: string) {
    const diets = useQuery(api.plans.getDietsByType, { type });

    const isLoading = diets === undefined;

    return {
        diets: diets as DietPlan[] | undefined,
        isLoading,
        error: null, // Error handling would require error boundary
    };
}
