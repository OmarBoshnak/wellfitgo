import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./auth";
import { Id } from "./_generated/dataModel";

// ============ HELPER FUNCTIONS ============

/**
 * Format date for display (e.g., "Nov 25")
 */
function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Calculate days remaining until a date
 */
function daysUntil(dateStr: string): number {
    const endDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Determine plan status based on adherence
 * - good: >= 80% meals completed
 * - warning: < 50% meals completed
 * - paused: plan status is 'draft' with publishedAt set (paused state)
 */
function determineDisplayStatus(
    planStatus: string,
    mealsCompleted: number,
    totalMeals: number,
    publishedAt?: number
): "good" | "warning" | "paused" {
    // Check if plan is paused (draft with previously published)
    if (planStatus === "draft" && publishedAt) {
        return "paused";
    }

    // Calculate adherence
    if (totalMeals === 0) return "good";
    const adherence = mealsCompleted / totalMeals;

    if (adherence >= 0.8) return "good";
    if (adherence < 0.5) return "warning";
    return "good";
}

// ============ QUERIES ============

/**
 * Get all active client plans for the coach
 * Includes client info, diet program name, progress, and status
 */
export const getActivePlans = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Fetch active/published plans for this coach
        const plans = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "active"),
                    q.eq(q.field("status"), "published"),
                    // Include draft plans that were previously published (paused)
                    q.and(
                        q.eq(q.field("status"), "draft"),
                        q.neq(q.field("publishedAt"), undefined)
                    )
                )
            )
            .order("desc")
            .collect();

        // Enrich each plan with client data, diet program, and progress
        const enrichedPlans = await Promise.all(
            plans.map(async (plan) => {
                // Get client info
                const client = await ctx.db.get(plan.clientId);
                if (!client) return null;

                // Count completed meals for this plan's date range
                const mealCompletions = await ctx.db
                    .query("mealCompletions")
                    .withIndex("by_client", (q) => q.eq("clientId", plan.clientId))
                    .filter((q) =>
                        q.and(
                            q.gte(q.field("date"), plan.weekStartDate),
                            q.lte(q.field("date"), plan.weekEndDate)
                        )
                    )
                    .collect();

                // Get latest weight logs for weight change calculation
                const recentWeightLogs = await ctx.db
                    .query("weightLogs")
                    .withIndex("by_client", (q) => q.eq("clientId", plan.clientId))
                    .order("desc")
                    .take(2);

                // Calculate weight change
                let weightChange = 0;
                if (recentWeightLogs.length >= 2) {
                    weightChange = Math.round(
                        (recentWeightLogs[0].weight - recentWeightLogs[1].weight) * 10
                    ) / 10;
                }

                // Extract diet program name from notes (e.g., "Assigned from: Classic 1200-1300")
                const dietProgramMatch = plan.notes?.match(/Assigned from: (.+)/);
                const dietProgram = dietProgramMatch ? dietProgramMatch[1] : "Custom Plan";

                // Calculate totals
                const totalMeals = 21; // 3 meals x 7 days
                const mealsCompleted = mealCompletions.length;
                const missedMeals = Math.max(0, totalMeals - mealsCompleted);

                // Determine display status
                const displayStatus = determineDisplayStatus(
                    plan.status,
                    mealsCompleted,
                    totalMeals,
                    plan.publishedAt
                );

                // Calculate days left
                const daysLeft = daysUntil(plan.weekEndDate);

                // Determine status message
                let statusMessage: string | null = null;
                if (displayStatus === "paused") {
                    statusMessage = "not started";
                } else if (daysLeft <= 2 && mealsCompleted > 0) {
                    statusMessage = "finishing";
                }

                return {
                    id: plan._id,
                    clientId: client._id,
                    clientName: `${client.firstName} ${client.lastName ?? ""}`.trim(),
                    avatar: client.avatarUrl ?? null,
                    clientGoal: client.goal,
                    dietProgram,
                    daysLeft,
                    weekNumber: plan.weekNumber,
                    startDate: formatDateShort(plan.weekStartDate),
                    mealsCompleted,
                    totalMeals,
                    weightChange,
                    status: displayStatus,
                    statusMessage,
                    missedMeals,
                    // For action handling
                    weekStartDate: plan.weekStartDate,
                    weekEndDate: plan.weekEndDate,
                    planStatus: plan.status, // Raw status for mutations
                };
            })
        );

        // Filter out null values and return
        return enrichedPlans.filter((plan): plan is NonNullable<typeof plan> => plan !== null);
    },
});

/**
 * Get draft plans for the coach
 */
export const getDraftPlans = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Fetch draft plans that were never published
        const drafts = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "draft"),
                    q.eq(q.field("publishedAt"), undefined)
                )
            )
            .order("desc")
            .collect();

        // Enrich draft plans
        const enrichedDrafts = await Promise.all(
            drafts.map(async (draft) => {
                // Get client info
                const client = await ctx.db.get(draft.clientId);

                // Extract diet program from notes
                const dietProgramMatch = draft.notes?.match(/Assigned from: (.+)/);
                const basedOn = dietProgramMatch ? dietProgramMatch[1] : "Custom Template";

                // Calculate hours since last edit
                const lastEditedHours = Math.floor(
                    (Date.now() - draft.updatedAt) / (1000 * 60 * 60)
                );

                // Calculate progress (placeholder - would need actual meal planning data)
                const progressPercent = 70; // TODO: Calculate based on meal planning completion

                return {
                    id: draft._id,
                    title: client
                        ? `Custom Plan for ${client.firstName}`
                        : draft.templateName ?? "Untitled Draft",
                    basedOn,
                    lastEditedHours,
                    progressPercent,
                    clientId: draft.clientId,
                };
            })
        );

        return enrichedDrafts;
    },
});

/**
 * Get clients for assignment modal with smart sorting
 * - Clients without active plans first
 * - Includes client goal for recommendation matching
 */
export const getClientsForAssignment = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Fetch all clients for this coach
        const clients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .collect();

        // Enrich with active plan status
        const enrichedClients = await Promise.all(
            clients.map(async (client) => {
                // Check if client has an active plan
                const activePlan = await ctx.db
                    .query("weeklyMealPlans")
                    .withIndex("by_client", (q) => q.eq("clientId", client._id))
                    .filter((q) =>
                        q.or(
                            q.eq(q.field("status"), "active"),
                            q.eq(q.field("status"), "published")
                        )
                    )
                    .first();

                return {
                    id: client._id,
                    name: `${client.firstName} ${client.lastName ?? ""}`.trim(),
                    avatar: client.avatarUrl ?? null,
                    goal: client.goal,
                    hasActivePlan: !!activePlan,
                    currentPlanName: activePlan?.notes?.match(/Assigned from: (.+)/)?.[1] ?? null,
                };
            })
        );

        // Sort: clients without active plans first
        return enrichedClients.sort((a, b) => {
            if (a.hasActivePlan === b.hasActivePlan) return 0;
            return a.hasActivePlan ? 1 : -1;
        });
    },
});

/**
 * Get diet programs for recommendation
 * Returns all active diet plans with their target goals
 */
export const getDietPrograms = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const plans = await ctx.db
            .query("dietPlans")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        return plans.map((plan) => ({
            id: plan._id,
            name: plan.name,
            nameAr: plan.nameAr,
            emoji: plan.emoji,
            type: plan.type,
            targetGoal: plan.targetGoal,
            targetCalories: plan.targetCalories,
            description: plan.description,
            tags: plan.tags ?? [],
        }));
    },
});

// ============ MUTATIONS ============

/**
 * Assign a diet plan to one or more clients
 */
export const assignPlan = mutation({
    args: {
        dietPlanId: v.id("dietPlans"),
        clientIds: v.array(v.id("users")),
        weekStartDate: v.optional(v.string()), // ISO date string, defaults to next Monday
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can assign plans");
        }

        // Get diet plan details
        const dietPlan = await ctx.db.get(args.dietPlanId);
        if (!dietPlan) {
            throw new Error("Diet plan not found");
        }

        // Calculate week dates
        let weekStart: Date;
        if (args.weekStartDate) {
            weekStart = new Date(args.weekStartDate);
        } else {
            // Default to next Monday
            weekStart = new Date();
            const dayOfWeek = weekStart.getDay();
            const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
            weekStart.setDate(weekStart.getDate() + daysUntilMonday);
        }
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekStartStr = weekStart.toISOString().split("T")[0];
        const weekEndStr = weekEnd.toISOString().split("T")[0];

        // Calculate week number
        const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(
            ((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
        );

        // Create plans for each client
        const createdPlans: Id<"weeklyMealPlans">[] = [];

        for (const clientId of args.clientIds) {
            // Verify client exists and is assigned to this coach
            const client = await ctx.db.get(clientId);
            if (!client) continue;
            if (user.role !== "admin" && client.assignedCoachId !== user._id) continue;

            // Archive any existing active plans for this client
            const existingPlans = await ctx.db
                .query("weeklyMealPlans")
                .withIndex("by_client", (q) => q.eq("clientId", clientId))
                .filter((q) =>
                    q.or(
                        q.eq(q.field("status"), "active"),
                        q.eq(q.field("status"), "published")
                    )
                )
                .collect();

            for (const existingPlan of existingPlans) {
                await ctx.db.patch(existingPlan._id, {
                    status: "archived",
                    updatedAt: Date.now(),
                });
            }

            // Create new plan
            const planId = await ctx.db.insert("weeklyMealPlans", {
                clientId,
                coachId: user._id,
                weekStartDate: weekStartStr,
                weekEndDate: weekEndStr,
                weekNumber,
                year: weekStart.getFullYear(),
                status: "active",
                notes: `Assigned from: ${dietPlan.name}`,
                totalCalories: dietPlan.targetCalories,
                isTemplate: false,
                publishedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            createdPlans.push(planId);
        }

        return {
            success: true,
            createdPlans,
            count: createdPlans.length,
        };
    },
});

/**
 * Pause an active plan (sets status to draft but keeps publishedAt)
 */
export const pausePlan = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can pause plans");
        }

        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Plan not found");
        }

        if (user.role !== "admin" && plan.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        // Set to draft while preserving publishedAt to indicate paused state
        await ctx.db.patch(args.planId, {
            status: "draft",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Resume a paused plan
 */
export const resumePlan = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can resume plans");
        }

        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Plan not found");
        }

        if (user.role !== "admin" && plan.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.planId, {
            status: "active",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Archive a plan
 */
export const archivePlan = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can archive plans");
        }

        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Plan not found");
        }

        if (user.role !== "admin" && plan.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.planId, {
            status: "archived",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Delete a draft plan
 */
export const deleteDraft = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can delete drafts");
        }

        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Plan not found");
        }

        if (user.role !== "admin" && plan.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        // Only allow deleting drafts
        if (plan.status !== "draft") {
            throw new Error("Can only delete draft plans");
        }

        await ctx.db.delete(args.planId);

        return { success: true };
    },
});
