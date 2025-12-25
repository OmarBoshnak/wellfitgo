import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";

/**
 * Get weekly activity statistics for the coach dashboard
 * Returns: messages sent, plans published, check-ins received, daily breakdown
 */
export const getWeeklyActivity = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return null;
        }

        // Calculate week boundaries (Sunday to Saturday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStartTimestamp = weekStart.getTime();
        const weekEndTimestamp = weekEnd.getTime();

        // ============ 1. MESSAGES SENT BY COACH THIS WEEK ============
        // Get all conversations for this coach
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .collect();

        const conversationIds = conversations.map((c) => c._id);

        // Count messages sent by coach this week
        let totalMessagesSent = 0;
        const dailyMessages: number[] = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

        for (const convId of conversationIds) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", convId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("senderId"), user._id),
                        q.gte(q.field("createdAt"), weekStartTimestamp),
                        q.lte(q.field("createdAt"), weekEndTimestamp)
                    )
                )
                .collect();

            totalMessagesSent += messages.length;

            // Count by day of week
            for (const msg of messages) {
                const msgDate = new Date(msg.createdAt);
                const dayIndex = msgDate.getDay();
                dailyMessages[dayIndex]++;
            }
        }

        // ============ 2. PLANS PUBLISHED THIS WEEK ============
        const publishedPlans = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) =>
                q.and(
                    q.or(
                        q.eq(q.field("status"), "published"),
                        q.eq(q.field("status"), "active")
                    ),
                    q.gte(q.field("createdAt"), weekStartTimestamp),
                    q.lte(q.field("createdAt"), weekEndTimestamp)
                )
            )
            .collect();

        const totalPlansPublished = publishedPlans.length;
        const dailyPlans: number[] = [0, 0, 0, 0, 0, 0, 0];

        for (const plan of publishedPlans) {
            const planDate = new Date(plan.publishedAt || plan.createdAt);
            const dayIndex = planDate.getDay();
            dailyPlans[dayIndex]++;
        }

        // ============ 3. CLIENT CHECK-INS (WEIGHT LOGS) THIS WEEK ============
        // Get coach's active clients
        const clients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("subscriptionStatus"), "active"),
                    q.eq(q.field("subscriptionStatus"), "trial")
                )
            )
            .collect();

        let totalCheckins = 0;
        const dailyCheckins: number[] = [0, 0, 0, 0, 0, 0, 0];

        for (const client of clients) {
            const logs = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .filter((q) =>
                    q.and(
                        q.gte(q.field("createdAt"), weekStartTimestamp),
                        q.lte(q.field("createdAt"), weekEndTimestamp)
                    )
                )
                .collect();

            totalCheckins += logs.length;

            for (const log of logs) {
                const logDate = new Date(log.createdAt);
                const dayIndex = logDate.getDay();
                dailyCheckins[dayIndex]++;
            }
        }

        // ============ 4. CALCULATE CHART DATA ============
        // Combine daily activity: messages + plans + checkins (normalized to percentage)
        const maxDailyActivity = Math.max(
            ...dailyMessages.map((m, i) => m + dailyPlans[i] + dailyCheckins[i]),
            1 // Prevent division by zero
        );

        const chartData = dailyMessages.map((m, i) => {
            const total = m + dailyPlans[i] + dailyCheckins[i];
            return Math.round((total / maxDailyActivity) * 100);
        });

        return {
            // Summary stats
            stats: {
                messages: totalMessagesSent,
                plans: totalPlansPublished,
                checkins: totalCheckins,
            },

            // Chart data (percentages for each day: Sun-Sat)
            chartData,

            // Week range for display
            weekRange: {
                start: weekStart.toISOString().split("T")[0],
                end: weekEnd.toISOString().split("T")[0],
            },
        };
    },
});
