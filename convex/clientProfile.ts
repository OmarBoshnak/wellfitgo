import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";
import { Id } from "./_generated/dataModel";

// ============ HELPER FUNCTIONS ============

/**
 * Format date for display (e.g., "Nov 25")
 */
function formatDateShort(timestamp: number): string {
    const date = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Format date with time (e.g., "Dec 6 • 08:30 AM")
 */
function formatDateWithTime(timestamp: number): string {
    const date = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    return `${month} ${day} • ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// ============ QUERIES ============

/**
 * Get detailed client profile for the profile screen
 */
export const getClientProfile = query({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return null;
        }

        // Get client
        const client = await ctx.db.get(args.clientId);
        if (!client) return null;

        // Verify access (coach owns this client or is admin)
        if (user.role !== "admin" && client.assignedCoachId !== user._id) {
            return null;
        }

        // ============ WEIGHT LOGS ============
        const weightLogs = await ctx.db
            .query("weightLogs")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .order("desc")
            .collect();

        const latestWeight = weightLogs[0];
        const firstWeight = weightLogs[weightLogs.length - 1];

        // Calculate weekly change (compare last 2 weeks)
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const twoWeeksAgo = oneWeekAgo - 7 * 24 * 60 * 60 * 1000;

        const recentLogs = weightLogs.filter((log) => log.createdAt >= oneWeekAgo);
        const olderLogs = weightLogs.filter(
            (log) => log.createdAt < oneWeekAgo && log.createdAt >= twoWeeksAgo
        );

        const currentWeekAvg = recentLogs.length > 0
            ? recentLogs.reduce((sum, log) => sum + log.weight, 0) / recentLogs.length
            : latestWeight?.weight ?? client.currentWeight;

        const lastWeekAvg = olderLogs.length > 0
            ? olderLogs.reduce((sum, log) => sum + log.weight, 0) / olderLogs.length
            : currentWeekAvg;

        const weeklyChange = Math.round((currentWeekAvg - lastWeekAvg) * 10) / 10;

        // ============ MEAL PLAN ============
        const activePlan = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "active"),
                    q.eq(q.field("status"), "published")
                )
            )
            .order("desc")
            .first();

        // ============ CONVERSATION ============
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .first();

        return {
            // Basic Info
            id: client._id,
            name: `${client.firstName} ${client.lastName ?? ""}`.trim(),
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email ?? "",
            phone: client.phone ?? "",
            avatar: client.avatarUrl ?? null,
            location: "", // Not in schema

            // Weight Data
            startWeight: firstWeight?.weight ?? client.startingWeight,
            currentWeight: latestWeight?.weight ?? client.currentWeight,
            targetWeight: client.targetWeight,
            weeklyChange,

            // Dates
            startDate: formatDateShort(client.createdAt),
            joinedAt: client.createdAt,
            lastActiveAt: client.lastActiveAt,

            // Subscription
            subscriptionStatus: client.subscriptionStatus,

            // Related Data
            conversationId: conversation?._id ?? null,
            unreadMessages: conversation?.unreadByCoach ?? 0,

            // Meal Plan
            hasActivePlan: !!activePlan,
            activePlanId: activePlan?._id ?? null,
            planWeekStart: activePlan?.weekStartDate,
            planWeekEnd: activePlan?.weekEndDate,

            // Weight History (for chart - last 50 logs)
            weightHistory: weightLogs.slice(0, 50).map((log) => ({
                id: log._id,
                weight: log.weight,
                unit: log.unit,
                date: log.date,
                feeling: log.feeling,
                createdAt: log.createdAt,
            })),
        };
    },
});

/**
 * Get activity timeline for a client
 */
export const getClientActivity = query({
    args: {
        clientId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        const limit = args.limit ?? 20;

        // Activity items array
        const activities: Array<{
            id: string;
            type: "weight" | "meals" | "message" | "missed" | "plan";
            color: string;
            date: string;
            text: string;
            subtext: string;
            timestamp: number;
        }> = [];

        // Time boundary (last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        // ============ WEIGHT LOGS ============
        const weightLogs = await ctx.db
            .query("weightLogs")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
            .order("desc")
            .take(10);

        const feelingEmojis: Record<string, string> = {
            excellent: "🤩",
            great: "😊",
            good: "🙂",
            challenging: "😓",
            very_hard: "😢",
        };

        for (const log of weightLogs) {
            activities.push({
                id: `weight_${log._id}`,
                type: "weight",
                color: "#60A5FA",
                date: formatDateWithTime(log.createdAt),
                text: `Logged weight: ${log.weight} ${log.unit}`,
                subtext: log.feeling
                    ? `${feelingEmojis[log.feeling] ?? ""} ${log.feeling.replace("_", " ")}`
                    : "",
                timestamp: log.createdAt,
            });
        }

        // ============ MEAL COMPLETIONS ============
        const mealCompletions = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
            .order("desc")
            .take(30);

        // Group meal completions by day
        const mealsByDay = new Map<string, number>();
        for (const meal of mealCompletions) {
            const day = meal.date;
            mealsByDay.set(day, (mealsByDay.get(day) ?? 0) + 1);
        }

        for (const [day, count] of mealsByDay) {
            const date = new Date(day);
            activities.push({
                id: `meals_${day}`,
                type: "meals",
                color: "#27AE61",
                date: formatDateShort(date.getTime()),
                text: count >= 5 ? "Completed all meals ✓" : `Completed ${count} meals`,
                subtext: "",
                timestamp: date.getTime(),
            });
        }

        // ============ MESSAGES (from client) ============
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .first();

        if (conversation) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
                .filter((q) =>
                    q.and(
                        q.neq(q.field("senderId"), user._id), // Messages FROM client
                        q.gte(q.field("createdAt"), thirtyDaysAgo)
                    )
                )
                .order("desc")
                .take(5);

            for (const msg of messages) {
                activities.push({
                    id: `msg_${msg._id}`,
                    type: "message",
                    color: "#5073FE",
                    date: formatDateWithTime(msg.createdAt),
                    text: "Sent message",
                    subtext: msg.content.substring(0, 40) + (msg.content.length > 40 ? "..." : ""),
                    timestamp: msg.createdAt,
                });
            }
        }

        // ============ SORT BY TIMESTAMP ============
        activities.sort((a, b) => b.timestamp - a.timestamp);

        return activities.slice(0, limit);
    },
});

/**
 * Get weight chart data for different periods
 */
export const getWeightChartData = query({
    args: {
        clientId: v.id("users"),
        period: v.union(
            v.literal("1M"),
            v.literal("3M"),
            v.literal("6M"),
            v.literal("1Y"),
            v.literal("All")
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        // Calculate date boundary
        const now = Date.now();
        let startDate: number;

        switch (args.period) {
            case "1M":
                startDate = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "3M":
                startDate = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case "6M":
                startDate = now - 180 * 24 * 60 * 60 * 1000;
                break;
            case "1Y":
                startDate = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "All":
            default:
                startDate = 0;
                break;
        }

        // Get weight logs for period
        const logs = await ctx.db
            .query("weightLogs")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.gte(q.field("createdAt"), startDate))
            .order("asc")
            .collect();

        // Get client for target weight
        const client = await ctx.db.get(args.clientId);

        // Format chart points
        const chartPoints = logs.map((log) => ({
            date: log.date,
            weight: log.weight,
            timestamp: log.createdAt,
        }));

        // Calculate min/max for chart scaling
        const weights = logs.map((l) => l.weight);
        const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
        const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;

        return {
            points: chartPoints,
            targetWeight: client?.targetWeight ?? 0,
            minWeight: Math.floor(minWeight - 5),
            maxWeight: Math.ceil(maxWeight + 5),
            currentWeight: logs.length > 0 ? logs[logs.length - 1].weight : client?.currentWeight ?? 0,
            startWeight: logs.length > 0 ? logs[0].weight : client?.startingWeight ?? 0,
        };
    },
});

/**
 * Get weekly stats for a client (meals completed, weight check-in)
 */
export const getWeeklyStats = query({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        // Calculate this week's boundaries (Monday to Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);

        const weekStart = monday.getTime();
        const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

        // ============ MEAL COMPLETIONS ============
        const mealCompletions = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) =>
                q.and(
                    q.gte(q.field("createdAt"), weekStart),
                    q.lt(q.field("createdAt"), weekEnd)
                )
            )
            .collect();

        // ============ WEIGHT LOG THIS WEEK ============
        const weightLog = await ctx.db
            .query("weightLogs")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) =>
                q.and(
                    q.gte(q.field("createdAt"), weekStart),
                    q.lt(q.field("createdAt"), weekEnd)
                )
            )
            .order("desc")
            .first();

        return {
            mealsCompleted: mealCompletions.length,
            mealsTotal: 21, // 3 meals * 7 days
            hasWeightLog: !!weightLog,
            lastWeightLogDate: weightLog?.date ?? null,
            lastWeightLogFeeling: weightLog?.feeling ?? null,
        };
    },
});

// ============ MEAL PLAN TAB FUNCTIONS ============

import { mutation } from "./_generated/server";

/**
 * Get all meal plans for a client
 */
export const getClientMealPlans = query({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Fetch all meal plans for this client
        const plans = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .order("desc")
            .collect();

        // Enrich with meal completion data
        const enrichedPlans = await Promise.all(
            plans.map(async (plan) => {
                // Count completed meals for this plan
                const completedMeals = await ctx.db
                    .query("mealCompletions")
                    .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
                    .filter((q) =>
                        q.and(
                            q.gte(q.field("date"), plan.weekStartDate),
                            q.lte(q.field("date"), plan.weekEndDate)
                        )
                    )
                    .collect();

                return {
                    id: plan._id,
                    weekStartDate: plan.weekStartDate,
                    weekEndDate: plan.weekEndDate,
                    status: plan.status,
                    notes: plan.notes,
                    totalCalories: plan.totalCalories,
                    createdAt: plan.createdAt,
                    updatedAt: plan.updatedAt,
                    publishedAt: plan.publishedAt,
                    mealsCompleted: completedMeals.length,
                    mealsTotal: 21, // 3 meals x 7 days
                };
            })
        );

        return enrichedPlans;
    },
});

/**
 * Archive a meal plan
 */
export const archiveMealPlan = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.planId, {
            status: "archived",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// ============ NOTES TAB FUNCTIONS ============

/**
 * Get coach notes for a client (legacy single note)
 */
export const getClientNotes = query({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return null;
        }

        // Get coach profile to check for client notes
        const coachProfile = await ctx.db
            .query("coachProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        // For now, we'll store notes in the client's user record
        // Future: Could create a separate clientNotes table
        const client = await ctx.db.get(args.clientId);

        return {
            coachNotes: client?.coachNotes ?? "",
            lastUpdated: client?.coachNotesUpdatedAt ?? null,
        };
    },
});

/**
 * Update coach notes for a client (legacy single note)
 */
export const updateClientNotes = mutation({
    args: {
        clientId: v.id("users"),
        notes: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.clientId, {
            coachNotes: args.notes,
            coachNotesUpdatedAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, savedAt: Date.now() };
    },
});

// ============ MULTI-NOTE FUNCTIONS (using clientNotes table) ============

/**
 * Get all notes for a client (multiple notes as cards)
 */
export const getAllClientNotes = query({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Get all notes for this client from the clientNotes table
        const notes = await ctx.db
            .query("clientNotes")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .order("desc")
            .collect();

        return notes.map((note) => ({
            id: note._id,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        }));
    },
});

/**
 * Add a new note for a client
 */
export const addClientNote = mutation({
    args: {
        clientId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        if (!args.content.trim()) {
            throw new Error("Note content cannot be empty");
        }

        const noteId = await ctx.db.insert("clientNotes", {
            clientId: args.clientId,
            coachId: user._id,
            content: args.content.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, noteId };
    },
});

/**
 * Update an existing note
 */
export const updateSingleNote = mutation({
    args: {
        noteId: v.id("clientNotes"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        const note = await ctx.db.get(args.noteId);
        if (!note) {
            throw new Error("Note not found");
        }

        // Verify ownership (coach created this note or is admin)
        if (user.role !== "admin" && note.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.noteId, {
            content: args.content.trim(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Delete a note
 */
export const deleteClientNote = mutation({
    args: {
        noteId: v.id("clientNotes"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        const note = await ctx.db.get(args.noteId);
        if (!note) {
            throw new Error("Note not found");
        }

        // Verify ownership (coach created this note or is admin)
        if (user.role !== "admin" && note.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.noteId);

        return { success: true };
    },
});

// ============ SETTINGS TAB FUNCTIONS ============

/**
 * Get client settings (subscription, notifications)
 */
export const getClientSettings = query({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return null;
        }

        const client = await ctx.db.get(args.clientId);
        if (!client) return null;

        // Get coach info
        const coach = client.assignedCoachId
            ? await ctx.db.get(client.assignedCoachId)
            : null;

        return {
            // Subscription
            subscriptionStatus: client.subscriptionStatus,
            subscriptionEndDate: client.subscriptionEndDate ?? null,

            // Notifications
            notificationSettings: {
                mealReminders: client.notificationSettings?.mealReminders ?? true,
                weeklyCheckin: client.notificationSettings?.weeklyCheckin ?? true,
                coachMessages: client.notificationSettings?.coachMessages ?? true,
            },

            // Coach
            coach: coach
                ? {
                    id: coach._id,
                    name: `${coach.firstName} ${coach.lastName ?? ""}`.trim(),
                    avatar: coach.avatarUrl ?? null,
                }
                : null,

            // Chat Doctor Assignment
            assignedChatDoctor: client.assignedChatDoctorId ?? null,

            // Account
            isActive: client.isActive,
            createdAt: client.createdAt,
        };
    },
});

/**
 * Update client notification settings
 */
export const updateClientNotifications = mutation({
    args: {
        clientId: v.id("users"),
        mealReminders: v.optional(v.boolean()),
        weeklyCheckin: v.optional(v.boolean()),
        coachMessages: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        const client = await ctx.db.get(args.clientId);
        if (!client) throw new Error("Client not found");

        const currentSettings = client.notificationSettings ?? {};

        await ctx.db.patch(args.clientId, {
            notificationSettings: {
                ...currentSettings,
                mealReminders: args.mealReminders ?? currentSettings.mealReminders ?? true,
                weeklyCheckin: args.weeklyCheckin ?? currentSettings.weeklyCheckin ?? true,
                coachMessages: args.coachMessages ?? currentSettings.coachMessages ?? true,
            },
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Archive/deactivate a client
 */
export const archiveClient = mutation({
    args: {
        clientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.clientId, {
            isActive: false,
            subscriptionStatus: "cancelled",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// ============ DIET PLAN ASSIGNMENT ============

/**
 * Get all available diet plans for selection
 */
export const getDietPlans = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        const plans = await ctx.db
            .query("dietPlans")
            .filter((q) => q.eq(q.field("isActive"), true))
            .order("desc")
            .collect();

        return plans.map((plan) => ({
            id: plan._id,
            name: plan.name,
            nameAr: plan.nameAr,
            description: plan.description,
            descriptionAr: plan.descriptionAr,
            emoji: plan.emoji,
            type: plan.type,
            targetGoal: plan.targetGoal,
            targetCalories: plan.targetCalories,
            format: plan.format,
        }));
    },
});

/**
 * Assign a diet plan to a client (create weeklyMealPlan)
 */
export const assignDietPlan = mutation({
    args: {
        clientId: v.id("users"),
        dietPlanId: v.id("dietPlans"),
        weekStartDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        // Get the diet plan
        const dietPlan = await ctx.db.get(args.dietPlanId);
        if (!dietPlan) {
            throw new Error("Diet plan not found");
        }

        // Calculate week dates
        const now = new Date();
        let weekStart: Date;

        if (args.weekStartDate) {
            weekStart = new Date(args.weekStartDate);
        } else {
            // Default to next Monday
            const dayOfWeek = now.getDay();
            const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
            weekStart = new Date(now);
            weekStart.setDate(now.getDate() + daysUntilMonday);
        }
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        // Calculate week number
        const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(
            ((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
        );

        // Create the weekly meal plan
        const planId = await ctx.db.insert("weeklyMealPlans", {
            clientId: args.clientId,
            coachId: user._id,
            weekStartDate: weekStartStr,
            weekEndDate: weekEndStr,
            weekNumber,
            year: weekStart.getFullYear(),
            status: "active",
            notes: `Assigned from: ${dietPlan.name}`,
            totalCalories: dietPlan.targetCalories,
            isTemplate: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return {
            success: true,
            planId,
            weekStartDate: weekStartStr,
            weekEndDate: weekEndStr,
        };
    },
});

/**
 * Delete a meal plan permanently
 */
export const deleteMealPlan = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        // Verify the plan exists and belongs to the coach
        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Plan not found");
        }

        if (user.role !== "admin" && plan.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        // Delete the plan
        await ctx.db.delete(args.planId);

        return { success: true };
    },
});

/**
 * Update a meal plan with a new diet plan and/or start date
 */
export const updateMealPlanDiet = mutation({
    args: {
        planId: v.id("weeklyMealPlans"),
        dietPlanId: v.id("dietPlans"),
        weekStartDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        // Verify the plan exists
        const existingPlan = await ctx.db.get(args.planId);
        if (!existingPlan) {
            throw new Error("Plan not found");
        }

        if (user.role !== "admin" && existingPlan.coachId !== user._id) {
            throw new Error("Unauthorized");
        }

        // Get the new diet plan
        const dietPlan = await ctx.db.get(args.dietPlanId);
        if (!dietPlan) {
            throw new Error("Diet plan not found");
        }

        // Calculate week dates if provided
        let weekStartStr = existingPlan.weekStartDate;
        let weekEndStr = existingPlan.weekEndDate;
        let weekNumber = existingPlan.weekNumber;
        let year = existingPlan.year;

        if (args.weekStartDate) {
            const weekStart = new Date(args.weekStartDate);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            weekStartStr = weekStart.toISOString().split('T')[0];
            weekEndStr = weekEnd.toISOString().split('T')[0];

            // Calculate week number
            const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
            weekNumber = Math.ceil(
                ((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
            );
            year = weekStart.getFullYear();
        }

        // Update the plan
        await ctx.db.patch(args.planId, {
            weekStartDate: weekStartStr,
            weekEndDate: weekEndStr,
            weekNumber,
            year,
            notes: `Updated to: ${dietPlan.name}`,
            totalCalories: dietPlan.targetCalories,
            updatedAt: Date.now(),
        });

        return {
            success: true,
            weekStartDate: weekStartStr,
            weekEndDate: weekEndStr,
        };
    },
});
