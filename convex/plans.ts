import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./auth";

// ============ TYPE MAPPINGS ============

/**
 * Map diet plan type to display name (English)
 */
const TYPE_TO_NAME: Record<string, string> = {
    keto: "Keto",
    weekly: "Weekly",
    classic: "Classic",
    low_carb: "Low Carb",
    high_protein: "High Protein",
    intermittent_fasting: "Intermittent Fasting",
    vegetarian: "Vegetarian",
    maintenance: "Maintenance",
    muscle_gain: "Muscle Gain",
    medical: "Medical",
    custom: "Custom",
};

/**
 * Map diet plan type to Arabic display name
 */
const TYPE_TO_NAME_AR: Record<string, string> = {
    keto: "كيتو",
    weekly: "أسبوعي",
    classic: "كلاسيكي",
    low_carb: "قليل النشويات",
    high_protein: "عالي البروتين",
    intermittent_fasting: "الصيام المتقطع",
    vegetarian: "نباتي",
    maintenance: "صيانة",
    muscle_gain: "بناء العضلات",
    medical: "طبي",
    custom: "مخصص",
};

/**
 * Default emojis for diet types (fallback when plan has no emoji)
 */
const TYPE_TO_DEFAULT_EMOJI: Record<string, string> = {
    keto: "🥑",
    weekly: "📅",
    classic: "🥗",
    low_carb: "🥦",
    high_protein: "🥩",
    intermittent_fasting: "⏰",
    vegetarian: "🥬",
    maintenance: "⚖️",
    muscle_gain: "💪",
    medical: "🏥",
    custom: "✨",
};

// ============ QUERIES ============

/**
 * Get diet categories by aggregating dietPlans by type
 * Returns categories with counts of active plans
 */
export const getDietCategories = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Fetch all active diet plans
        const allPlans = await ctx.db
            .query("dietPlans")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        // Group plans by type
        const categoryMap = new Map<
            string,
            {
                plans: Array<{
                    emoji?: string;
                    updatedAt: number;
                }>;
                count: number;
            }
        >();

        for (const plan of allPlans) {
            const type = plan.type;
            const existing = categoryMap.get(type);

            if (existing) {
                existing.plans.push({
                    emoji: plan.emoji,
                    updatedAt: plan.updatedAt,
                });
                existing.count++;
            } else {
                categoryMap.set(type, {
                    plans: [
                        {
                            emoji: plan.emoji,
                            updatedAt: plan.updatedAt,
                        },
                    ],
                    count: 1,
                });
            }
        }

        // Convert to array with proper structure
        const categories = Array.from(categoryMap.entries()).map(([type, data]) => {
            // Sort plans by updatedAt descending to get most recent
            const sortedPlans = data.plans.sort((a, b) => b.updatedAt - a.updatedAt);

            // Get emoji from most recently updated plan that has one
            const planWithEmoji = sortedPlans.find((p) => p.emoji);
            const emoji = planWithEmoji?.emoji ?? TYPE_TO_DEFAULT_EMOJI[type] ?? "📋";

            return {
                id: type,
                name: TYPE_TO_NAME[type] ?? type,
                nameAr: TYPE_TO_NAME_AR[type] ?? type,
                emoji,
                count: data.count,
            };
        });

        // Sort categories by count (most plans first), then by name
        categories.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });

        return categories;
    },
});

/**
 * Get diet plans by type
 * Returns individual plans filtered by diet type
 */
export const getDietsByType = query({
    args: {
        type: v.union(
            v.literal("keto"),
            v.literal("weekly"),
            v.literal("classic"),
            v.literal("low_carb"),
            v.literal("high_protein"),
            v.literal("intermittent_fasting"),
            v.literal("vegetarian"),
            v.literal("maintenance"),
            v.literal("muscle_gain"),
            v.literal("medical"),
            v.literal("custom")
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Fetch plans by type using index
        const plans = await ctx.db
            .query("dietPlans")
            .withIndex("by_type_active", (q) =>
                q.eq("type", args.type).eq("isActive", true)
            )
            .collect();

        // Transform and sort plans
        const result = plans.map((plan) => {
            // Calculate mealsCount based on format
            let mealsCount = 0;

            if (plan.format === "general" && plan.meals) {
                mealsCount = plan.meals.length;
            } else if (plan.format === "daily" && plan.dailyMeals) {
                // Sum meals across all days
                const days = [
                    plan.dailyMeals.saturday,
                    plan.dailyMeals.sunday,
                    plan.dailyMeals.monday,
                    plan.dailyMeals.tuesday,
                    plan.dailyMeals.wednesday,
                    plan.dailyMeals.thursday,
                    plan.dailyMeals.friday,
                ];
                for (const day of days) {
                    if (day?.meals) {
                        mealsCount += day.meals.length;
                    }
                }
            }

            return {
                id: plan._id,
                name: plan.name,
                nameAr: plan.nameAr,
                description: plan.description,
                targetCalories: plan.targetCalories,
                emoji: plan.emoji ?? TYPE_TO_DEFAULT_EMOJI[plan.type] ?? "📋",
                mealsCount,
                usageCount: plan.usageCount,
                // For sorting
                _sortOrder: plan.sortOrder,
                _createdAt: plan.createdAt,
            };
        });

        // Sort deterministically: sortOrder → targetCalories → createdAt
        result.sort((a, b) => {
            // 1. sortOrder (ascending, undefined last)
            if (a._sortOrder !== undefined && b._sortOrder !== undefined) {
                if (a._sortOrder !== b._sortOrder) return a._sortOrder - b._sortOrder;
            } else if (a._sortOrder !== undefined) {
                return -1;
            } else if (b._sortOrder !== undefined) {
                return 1;
            }

            // 2. targetCalories (ascending, undefined last)
            if (a.targetCalories !== undefined && b.targetCalories !== undefined) {
                if (a.targetCalories !== b.targetCalories) return a.targetCalories - b.targetCalories;
            } else if (a.targetCalories !== undefined) {
                return -1;
            } else if (b.targetCalories !== undefined) {
                return 1;
            }

            // 3. createdAt (ascending)
            return a._createdAt - b._createdAt;
        });

        // Remove internal sorting fields
        return result.map(({ _sortOrder, _createdAt, ...rest }) => rest);
    },
});

/**
 * Get full diet plan details by ID
 * Returns the complete plan document
 */
export const getDietDetails = query({
    args: {
        id: v.id("dietPlans"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const plan = await ctx.db.get(args.id);
        if (!plan) return null;

        return plan;
    },
});

// ============ MUTATIONS ============

/**
 * Diet plan type enum for validation
 */
const DIET_PLAN_TYPE = v.union(
    v.literal("keto"),
    v.literal("weekly"),
    v.literal("classic"),
    v.literal("low_carb"),
    v.literal("high_protein"),
    v.literal("intermittent_fasting"),
    v.literal("vegetarian"),
    v.literal("maintenance"),
    v.literal("muscle_gain"),
    v.literal("medical"),
    v.literal("custom")
);

/**
 * Create a new diet plan
 */
export const createDietPlan = mutation({
    args: {
        name: v.string(),
        nameAr: v.optional(v.string()),
        emoji: v.optional(v.string()),
        description: v.optional(v.string()),
        type: DIET_PLAN_TYPE,
        targetCalories: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const now = Date.now();

        const planId = await ctx.db.insert("dietPlans", {
            name: args.name,
            nameAr: args.nameAr,
            emoji: args.emoji ?? TYPE_TO_DEFAULT_EMOJI[args.type] ?? "📋",
            description: args.description,
            type: args.type,
            targetCalories: args.targetCalories,
            tags: args.tags ?? [],
            format: "general",
            isActive: true,
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
        });

        return planId;
    },
});

/**
 * Meal structure validator for updateDietPlan
 */
const mealValidator = v.object({
    id: v.string(),
    emoji: v.optional(v.string()),
    name: v.string(),
    nameAr: v.optional(v.string()),
    time: v.optional(v.string()),
    note: v.optional(v.string()),
    noteAr: v.optional(v.string()),
    categories: v.array(v.object({
        id: v.string(),
        emoji: v.optional(v.string()),
        name: v.string(),
        nameAr: v.optional(v.string()),
        options: v.array(v.object({
            id: v.string(),
            text: v.string(),
            textEn: v.optional(v.string()),
        })),
    })),
});

/**
 * Update an existing diet plan
 */
export const updateDietPlan = mutation({
    args: {
        id: v.id("dietPlans"),
        name: v.optional(v.string()),
        nameAr: v.optional(v.string()),
        emoji: v.optional(v.string()),
        description: v.optional(v.string()),
        descriptionAr: v.optional(v.string()),
        targetCalories: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        isActive: v.optional(v.boolean()),
        // Full meals array for granular meal editing
        meals: v.optional(v.array(mealValidator)),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const { id, ...updates } = args;

        // Build updates object, only include defined fields
        const patchData: Record<string, unknown> = { updatedAt: Date.now() };

        if (updates.name !== undefined) patchData.name = updates.name;
        if (updates.nameAr !== undefined) patchData.nameAr = updates.nameAr;
        if (updates.emoji !== undefined) patchData.emoji = updates.emoji;
        if (updates.description !== undefined) patchData.description = updates.description;
        if (updates.descriptionAr !== undefined) patchData.descriptionAr = updates.descriptionAr;
        if (updates.targetCalories !== undefined) patchData.targetCalories = updates.targetCalories;
        if (updates.tags !== undefined) patchData.tags = updates.tags;
        if (updates.isActive !== undefined) patchData.isActive = updates.isActive;
        if (updates.meals !== undefined) patchData.meals = updates.meals;

        await ctx.db.patch(id, patchData);

        return id;
    },
});

/**
 * Weekly plan status enum
 */
const WEEKLY_PLAN_STATUS = v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived")
);

/**
 * Create a weekly meal plan for a client
 */
export const createWeeklyPlan = mutation({
    args: {
        clientId: v.id("users"),
        weekStartDate: v.string(),
        notes: v.optional(v.string()),
        totalCalories: v.optional(v.number()),
        specialInstructions: v.optional(v.string()),
        isTemplate: v.optional(v.boolean()),
        templateName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const now = Date.now();

        // Calculate week end date (7 days after start)
        const startDate = new Date(args.weekStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        // Calculate week number
        const firstDayOfYear = new Date(startDate.getFullYear(), 0, 1);
        const pastDaysOfYear = (startDate.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        const planId = await ctx.db.insert("weeklyMealPlans", {
            clientId: args.clientId,
            coachId: user._id,
            weekStartDate: args.weekStartDate,
            weekEndDate: endDate.toISOString().split('T')[0],
            weekNumber,
            year: startDate.getFullYear(),
            status: "draft",
            notes: args.notes,
            totalCalories: args.totalCalories,
            specialInstructions: args.specialInstructions,
            isTemplate: args.isTemplate ?? false,
            templateName: args.templateName,
            createdAt: now,
            updatedAt: now,
        });

        return planId;
    },
});

/**
 * Update a weekly meal plan
 */
export const updateWeeklyPlan = mutation({
    args: {
        id: v.id("weeklyMealPlans"),
        status: v.optional(WEEKLY_PLAN_STATUS),
        notes: v.optional(v.string()),
        totalCalories: v.optional(v.number()),
        specialInstructions: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const { id, ...updates } = args;

        const patchData: Record<string, unknown> = { updatedAt: Date.now() };

        if (updates.status !== undefined) {
            patchData.status = updates.status;
            if (updates.status === "published") {
                patchData.publishedAt = Date.now();
            }
        }
        if (updates.notes !== undefined) patchData.notes = updates.notes;
        if (updates.totalCalories !== undefined) patchData.totalCalories = updates.totalCalories;
        if (updates.specialInstructions !== undefined) patchData.specialInstructions = updates.specialInstructions;

        await ctx.db.patch(id, patchData);

        return id;
    },
});

// ============ CLIENT ASSIGNMENT ============

/**
 * Get all clients assigned to the current coach
 * Used for the "Assign to Client" modal
 */
export const getMyClients = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Only coaches can fetch their clients
        if (user.role !== "coach" && user.role !== "admin") {
            return [];
        }

        // Fetch clients assigned to this coach using index
        const clients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .collect();

        // Filter to only clients (double-check role)
        const validClients = clients.filter((c) => c.role === "client");

        // Check for active weekly plans for each client
        const clientsWithPlanStatus = await Promise.all(
            validClients.map(async (client) => {
                // Check if client has an active weekly plan
                const activePlan = await ctx.db
                    .query("weeklyMealPlans")
                    .withIndex("by_client", (q) => q.eq("clientId", client._id))
                    .filter((q) => q.eq(q.field("status"), "active"))
                    .first();

                return {
                    id: client._id,
                    firstName: client.firstName,
                    lastName: client.lastName || "",
                    avatarUrl: client.avatarUrl,
                    hasActivePlan: !!activePlan,
                };
            })
        );

        return clientsWithPlanStatus;
    },
});

/**
 * Assign a diet plan to one or more clients
 * Creates weeklyMealPlans records for each client
 */
export const assignPlanToClients = mutation({
    args: {
        dietPlanId: v.id("dietPlans"),
        clientIds: v.array(v.id("users")),
        startDate: v.string(), // ISO date string "2025-12-27"
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Verify the diet plan exists
        const dietPlan = await ctx.db.get(args.dietPlanId);
        if (!dietPlan) throw new Error("Diet plan not found");

        const now = Date.now();
        const startDate = new Date(args.startDate);

        // Calculate week end date (7 days after start)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        // Calculate week number
        const firstDayOfYear = new Date(startDate.getFullYear(), 0, 1);
        const pastDaysOfYear = (startDate.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        let successCount = 0;
        const errors: string[] = [];

        for (const clientId of args.clientIds) {
            try {
                // Validate client ownership - must be assigned to this coach
                const client = await ctx.db.get(clientId);
                if (!client) {
                    errors.push(`Client ${clientId} not found`);
                    continue;
                }

                if (client.role !== "client") {
                    errors.push(`User ${clientId} is not a client`);
                    continue;
                }

                if (client.assignedCoachId !== user._id) {
                    errors.push(`Client ${clientId} is not assigned to you`);
                    continue;
                }

                // Archive any existing active weekly plans for this client
                const existingActivePlans = await ctx.db
                    .query("weeklyMealPlans")
                    .withIndex("by_client", (q) => q.eq("clientId", clientId))
                    .filter((q) => q.eq(q.field("status"), "active"))
                    .collect();

                for (const existingPlan of existingActivePlans) {
                    await ctx.db.patch(existingPlan._id, {
                        status: "archived",
                        updatedAt: now,
                    });
                }

                // Create new weekly meal plan
                await ctx.db.insert("weeklyMealPlans", {
                    clientId,
                    coachId: user._id,
                    dietPlanId: args.dietPlanId,
                    weekStartDate: args.startDate,
                    weekEndDate: endDate.toISOString().split("T")[0],
                    weekNumber,
                    year: startDate.getFullYear(),
                    status: "active",
                    isTemplate: false,
                    totalCalories: dietPlan.targetCalories,
                    createdAt: now,
                    updatedAt: now,
                });

                successCount++;
            } catch (error) {
                errors.push(`Failed to assign to client ${clientId}: ${error}`);
            }
        }

        // Increment usage count on the diet plan
        if (successCount > 0) {
            await ctx.db.patch(args.dietPlanId, {
                usageCount: (dietPlan.usageCount || 0) + successCount,
                updatedAt: now,
            });
        }

        return {
            success: successCount > 0,
            successCount,
            totalClients: args.clientIds.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    },
});

