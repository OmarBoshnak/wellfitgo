/**
 * Diet Categories Hook
 *
 * Fetches diet plan categories dynamically from Convex
 * by aggregating dietPlans by type.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ============ TYPE DEFINITIONS ============

/**
 * Diet category as returned from Convex
 */
export interface DietCategory {
    id: string;
    name: string;
    nameAr: string;
    emoji?: string;
    count: number;
}

// ============ HOOK ============

/**
 * Hook for fetching diet categories
 */
export function useDietCategories() {
    const categories = useQuery(api.plans.getDietCategories);

    const isLoading = categories === undefined;
    const error = null; // Would need error boundary for error handling

    return {
        categories: categories as DietCategory[] | undefined,
        isLoading,
        error,
    };
}
