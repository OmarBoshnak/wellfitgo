/**
 * Doctor Plans Dashboard Hook
 *
 * Provides real-time Convex queries and mutations for the doctor's plans dashboard.
 * Includes TypeScript types for UI-friendly data structures.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ============ TYPE DEFINITIONS ============

/**
 * Active plan item as displayed in the UI
 */
export interface DoctorPlanItem {
    id: Id<"weeklyMealPlans">;
    clientId: Id<"users">;
    clientName: string;
    avatar: string | null;
    clientGoal: "weight_loss" | "maintain" | "gain_muscle";
    dietProgram: string;
    daysLeft: number;
    weekNumber: number;
    startDate: string;
    mealsCompleted: number;
    totalMeals: number;
    weightChange: number;
    status: "good" | "warning" | "paused";
    statusMessage: string | null;
    missedMeals: number;
    weekStartDate: string;
    weekEndDate: string;
    planStatus: string;
}

/**
 * Draft plan item as displayed in the UI
 */
export interface DraftPlanItem {
    id: Id<"weeklyMealPlans">;
    title: string;
    basedOn: string;
    lastEditedHours: number;
    progressPercent: number;
    clientId: Id<"users">;
}

/**
 * Client item for assignment modal
 */
export interface AssignmentClient {
    id: Id<"users">;
    name: string;
    avatar: string | null;
    goal: "weight_loss" | "maintain" | "gain_muscle";
    hasActivePlan: boolean;
    currentPlanName: string | null;
}

/**
 * Diet program for recommendations
 */
export interface DietProgramItem {
    id: Id<"dietPlans">;
    name: string;
    nameAr?: string;
    emoji?: string;
    type: string;
    targetGoal?: "weight_loss" | "maintain" | "gain_muscle";
    targetCalories?: number;
    description?: string;
    tags: string[];
}

// ============ HOOKS ============

/**
 * Hook for fetching doctor plans data
 * Returns all queries needed for the plans dashboard
 */
export function useDoctorPlans() {
    const activePlans = useQuery(api.doctorPlans.getActivePlans);
    const draftPlans = useQuery(api.doctorPlans.getDraftPlans);
    const clientsForAssignment = useQuery(api.doctorPlans.getClientsForAssignment);
    const dietPrograms = useQuery(api.doctorPlans.getDietPrograms);

    // Loading state - true if any query is still loading
    const isLoading =
        activePlans === undefined ||
        draftPlans === undefined;

    // Error state - would need error boundary handling in practice
    const hasError = false;

    return {
        // Data
        activePlans: activePlans as DoctorPlanItem[] | undefined,
        draftPlans: draftPlans as DraftPlanItem[] | undefined,
        clientsForAssignment: clientsForAssignment as AssignmentClient[] | undefined,
        dietPrograms: dietPrograms as DietProgramItem[] | undefined,

        // Status
        isLoading,
        hasError,

        // Counts for tab badges
        activePlansCount: activePlans?.length ?? 0,
        draftPlansCount: draftPlans?.length ?? 0,
    };
}

/**
 * Hook for plan mutations
 * Returns all mutations needed for managing plans
 */
export function usePlanMutations() {
    const assignPlanMutation = useMutation(api.doctorPlans.assignPlan);
    const pausePlanMutation = useMutation(api.doctorPlans.pausePlan);
    const resumePlanMutation = useMutation(api.doctorPlans.resumePlan);
    const archivePlanMutation = useMutation(api.doctorPlans.archivePlan);
    const deleteDraftMutation = useMutation(api.doctorPlans.deleteDraft);

    /**
     * Assign a diet plan to clients
     */
    const assignPlan = async (
        dietPlanId: Id<"dietPlans">,
        clientIds: Id<"users">[],
        weekStartDate?: string
    ) => {
        return assignPlanMutation({
            dietPlanId,
            clientIds,
            weekStartDate,
        });
    };

    /**
     * Pause an active plan
     */
    const pausePlan = async (planId: Id<"weeklyMealPlans">) => {
        return pausePlanMutation({ planId });
    };

    /**
     * Resume a paused plan
     */
    const resumePlan = async (planId: Id<"weeklyMealPlans">) => {
        return resumePlanMutation({ planId });
    };

    /**
     * Archive a plan
     */
    const archivePlan = async (planId: Id<"weeklyMealPlans">) => {
        return archivePlanMutation({ planId });
    };

    /**
     * Delete a draft plan
     */
    const deleteDraft = async (planId: Id<"weeklyMealPlans">) => {
        return deleteDraftMutation({ planId });
    };

    return {
        assignPlan,
        pausePlan,
        resumePlan,
        archivePlan,
        deleteDraft,
    };
}

/**
 * Helper: Check if a diet plan is recommended for a client's goal
 */
export function isDietPlanRecommended(
    plan: DietProgramItem,
    clientGoal: "weight_loss" | "maintain" | "gain_muscle"
): boolean {
    // Direct goal match
    if (plan.targetGoal === clientGoal) {
        return true;
    }

    // For weight loss, also recommend keto and low_carb plans
    if (clientGoal === "weight_loss") {
        return (
            plan.type === "keto" ||
            plan.type === "low_carb" ||
            plan.type === "classic"
        );
    }

    // For muscle gain, recommend high protein
    if (clientGoal === "gain_muscle") {
        return plan.type === "high_protein" || plan.type === "muscle_gain";
    }

    // For maintenance
    if (clientGoal === "maintain") {
        return plan.type === "maintenance" || plan.type === "classic";
    }

    return false;
}
