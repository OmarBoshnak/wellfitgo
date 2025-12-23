import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth, requireClientAccess } from "./auth";

/**
 * Get meal completions for a specific date
 */
export const getMealCompletionsForDate = query({
    args: {
        date: v.string(), // ISO date string "2025-12-09"
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const completions = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client_date", (q) =>
                q.eq("clientId", user._id).eq("date", args.date)
            )
            .collect();

        return completions;
    },
});

/**
 * Mark a meal as completed
 */
export const completeMeal = mutation({
    args: {
        mealId: v.string(),
        date: v.string(), // ISO date string
        mealType: v.string(), // breakfast, lunch, dinner, etc.
        selectedOptions: v.array(
            v.object({
                categoryId: v.string(),
                categoryName: v.string(),
                optionId: v.string(),
                optionText: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Check if completion already exists for this meal/date
        const existing = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client_date", (q) =>
                q.eq("clientId", user._id).eq("date", args.date)
            )
            .filter((q) => q.eq(q.field("mealId"), args.mealId))
            .unique();

        if (existing) {
            // Update existing completion
            await ctx.db.patch(existing._id, {
                selectedOptions: args.selectedOptions,
                completedAt: now,
            });
            return existing._id;
        }

        // Create new completion
        const id = await ctx.db.insert("mealCompletions", {
            clientId: user._id,
            mealId: args.mealId,
            date: args.date,
            mealType: args.mealType,
            selectedOptions: args.selectedOptions,
            completedAt: now,
            createdAt: now,
        });

        return id;
    },
});

/**
 * Uncomplete a meal (remove completion)
 */
export const uncompleteMeal = mutation({
    args: {
        mealId: v.string(),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const existing = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client_date", (q) =>
                q.eq("clientId", user._id).eq("date", args.date)
            )
            .filter((q) => q.eq(q.field("mealId"), args.mealId))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }

        return true;
    },
});

/**
 * Get completion stats for a date range (for calendar view)
 */
export const getCompletionStats = query({
    args: {
        startDate: v.string(),
        endDate: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Get all completions in date range
        const completions = await ctx.db
            .query("mealCompletions")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .collect();

        // Filter to date range and group by date
        const filtered = completions.filter(
            (c) => c.date >= args.startDate && c.date <= args.endDate
        );

        // Group by date and count
        const statsByDate: Record<string, number> = {};
        for (const completion of filtered) {
            statsByDate[completion.date] = (statsByDate[completion.date] || 0) + 1;
        }

        return Object.entries(statsByDate).map(([date, count]) => ({
            date,
            completedMeals: count,
        }));
    },
});
