/**
 * Diet Details Hook
 *
 * Fetches a full diet plan by ID from Convex
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ============ HOOK ============

/**
 * Hook for fetching diet plan details by ID
 */
export function useDietDetails(id: Id<"dietPlans"> | undefined) {
    const plan = useQuery(
        api.plans.getDietDetails,
        id ? { id } : "skip"
    );

    const isLoading = plan === undefined;

    return {
        plan,
        isLoading,
        error: null,
    };
}
