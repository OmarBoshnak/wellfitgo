import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";
import { Id } from "./_generated/dataModel";

// ============ TYPES ============

type TimeRange = "7days" | "30days" | "3months";

type ClientStatus = "on_track" | "needs_support" | "at_risk";

interface DailyActivity {
    date: string; // "YYYY-MM-DD"
    messages: number;
    plans: number;
    checkIns: number;
}

interface ClientCheckIn {
    id: Id<"users">;
    name: string;
    lastCheckIn: string | null;
    status: ClientStatus;
}

interface DoctorStats {
    overview: {
        activeClients: number;
        avgProgress: number | null;
        checkInRate: number;
        responseTime: number | null;
    };
    progressBuckets: {
        onTrack: number;
        needsSupport: number;
        atRisk: number;
    };
    dailyActivity: DailyActivity[];
    clients: ClientCheckIn[];
}

// ============ HELPERS ============

/**
 * Get the start timestamp for a given time range
 */
function getTimeRangeStart(timeRange: TimeRange): number {
    const now = Date.now();
    switch (timeRange) {
        case "7days":
            return now - 7 * 24 * 60 * 60 * 1000;
        case "30days":
            return now - 30 * 24 * 60 * 60 * 1000;
        case "3months":
            return now - 90 * 24 * 60 * 60 * 1000;
    }
}

/**
 * Format a timestamp to YYYY-MM-DD in a given timezone
 */
function formatDateInTimezone(timestamp: number, timezone: string): string {
    try {
        const date = new Date(timestamp);
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        return formatter.format(date);
    } catch {
        // Fallback to UTC if timezone is invalid
        return new Date(timestamp).toISOString().split("T")[0];
    }
}

/**
 * Get the number of days in a time range
 */
function getDaysInRange(timeRange: TimeRange): number {
    switch (timeRange) {
        case "7days":
            return 7;
        case "30days":
            return 30;
        case "3months":
            return 90;
    }
}

/**
 * Determine client status based on adherence score and last activity
 * - On Track: >80% adherence
 * - Needs Support: 50-80% adherence
 * - At Risk: <50% OR no activity in 3 days
 */
function determineClientStatus(
    adherenceScore: number,
    daysSinceLastActivity: number | null
): ClientStatus {
    // At Risk if no activity in 3+ days
    if (daysSinceLastActivity === null || daysSinceLastActivity >= 3) {
        return "at_risk";
    }

    // At Risk if less than 50% adherence
    if (adherenceScore < 50) {
        return "at_risk";
    }

    // Needs Support if 50-80%
    if (adherenceScore < 80) {
        return "needs_support";
    }

    // On Track if >80%
    return "on_track";
}

// ============ MAIN QUERY ============

/**
 * Get comprehensive doctor statistics for the analytics dashboard
 * Aggregates data from users, mealCompletions, weeklyMealPlans, and messages
 */
export const getDoctorStats = query({
    args: {
        timeRange: v.union(
            v.literal("7days"),
            v.literal("30days"),
            v.literal("3months")
        ),
        timezone: v.string(),
    },
    handler: async (ctx, args): Promise<DoctorStats | null> => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return null;
        }

        const coachId = user._id;
        const rangeStart = getTimeRangeStart(args.timeRange);
        const now = Date.now();
        const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

        // ============ 1. GET ACTIVE CLIENTS ============
        const allClients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", coachId))
            .collect();

        const activeClients = allClients.filter((c) => c.isActive);
        const activeClientIds = activeClients.map((c) => c._id);

        // Create client lookup map
        const clientMap = new Map(
            activeClients.map((c) => [
                c._id,
                {
                    name: `${c.firstName} ${c.lastName || ""}`.trim(),
                    currentWeight: c.currentWeight,
                    startingWeight: c.startingWeight,
                },
            ])
        );

        // ============ 2. CALCULATE OVERVIEW STATS ============

        // Average progress (weight change)
        let avgProgress: number | null = null;
        if (activeClients.length > 0) {
            const totalProgress = activeClients.reduce((sum, client) => {
                return sum + (client.currentWeight - client.startingWeight);
            }, 0);
            avgProgress = totalProgress / activeClients.length;
        }

        // Get meal completions for check-in rate
        const allCompletions: Array<{
            clientId: Id<"users">;
            createdAt: number;
            date: string;
        }> = [];
        for (const clientId of activeClientIds) {
            const completions = await ctx.db
                .query("mealCompletions")
                .withIndex("by_client", (q) => q.eq("clientId", clientId))
                .filter((q) => q.gte(q.field("createdAt"), rangeStart))
                .collect();
            allCompletions.push(
                ...completions.map((c) => ({
                    clientId: c.clientId,
                    createdAt: c.createdAt,
                    date: c.date,
                }))
            );
        }

        // Get weekly meal plans to calculate total scheduled meals
        const activePlans: Array<{
            clientId: Id<"users">;
            dietPlanId: Id<"dietPlans"> | undefined;
            status: string;
            createdAt: number;
        }> = [];
        for (const clientId of activeClientIds) {
            const plans = await ctx.db
                .query("weeklyMealPlans")
                .withIndex("by_client", (q) => q.eq("clientId", clientId))
                .filter((q) =>
                    q.and(
                        q.gte(q.field("createdAt"), rangeStart),
                        q.or(
                            q.eq(q.field("status"), "published"),
                            q.eq(q.field("status"), "active")
                        )
                    )
                )
                .collect();
            activePlans.push(
                ...plans.map((p) => ({
                    clientId: p.clientId,
                    dietPlanId: p.dietPlanId,
                    status: p.status,
                    createdAt: p.createdAt,
                }))
            );
        }

        // Estimate scheduled meals: 3 meals/day * days * active plans per client
        // This is simplified; ideal would be counting actual meal entries
        const daysInRange = getDaysInRange(args.timeRange);
        const mealsPerDay = 3; // Assuming breakfast, lunch, dinner
        const totalScheduledMeals = activeClients.length * daysInRange * mealsPerDay;
        const totalCompletions = allCompletions.length;

        const checkInRate =
            totalScheduledMeals > 0
                ? Math.round((totalCompletions / totalScheduledMeals) * 100)
                : 0;

        // Response time (simplified: would need message timestamps analysis)
        // For now, return null as we don't track this metric
        const responseTime: number | null = null;

        // ============ 3. CALCULATE PROGRESS BUCKETS ============

        let onTrack = 0;
        let needsSupport = 0;
        let atRisk = 0;

        const clientCheckIns: ClientCheckIn[] = [];

        for (const client of activeClients) {
            // Get this client's completions
            const clientCompletions = allCompletions.filter(
                (c) => c.clientId === client._id
            );

            // Calculate adherence score
            const expectedMeals = daysInRange * mealsPerDay;
            const adherenceScore =
                expectedMeals > 0
                    ? (clientCompletions.length / expectedMeals) * 100
                    : 0;

            // Find last check-in
            const lastCompletion = clientCompletions.sort(
                (a, b) => b.createdAt - a.createdAt
            )[0];

            let daysSinceLastActivity: number | null = null;
            let lastCheckIn: string | null = null;

            if (lastCompletion) {
                daysSinceLastActivity = Math.floor(
                    (now - lastCompletion.createdAt) / (24 * 60 * 60 * 1000)
                );
                lastCheckIn = new Date(lastCompletion.createdAt).toISOString();
            }

            const status = determineClientStatus(adherenceScore, daysSinceLastActivity);

            // Increment bucket counts
            switch (status) {
                case "on_track":
                    onTrack++;
                    break;
                case "needs_support":
                    needsSupport++;
                    break;
                case "at_risk":
                    atRisk++;
                    break;
            }

            // Add to client list
            clientCheckIns.push({
                id: client._id,
                name: clientMap.get(client._id)?.name || "Client",
                lastCheckIn,
                status,
            });
        }

        // ============ 4. AGGREGATE DAILY ACTIVITY ============

        // Initialize daily activity map
        const dailyActivityMap = new Map<
            string,
            { messages: number; plans: number; checkIns: number }
        >();

        // Generate dates for the range
        for (let i = 0; i < daysInRange; i++) {
            const dayTimestamp = now - i * 24 * 60 * 60 * 1000;
            const dateStr = formatDateInTimezone(dayTimestamp, args.timezone);
            dailyActivityMap.set(dateStr, { messages: 0, plans: 0, checkIns: 0 });
        }

        // Count check-ins by day
        for (const completion of allCompletions) {
            const dateStr = formatDateInTimezone(completion.createdAt, args.timezone);
            const existing = dailyActivityMap.get(dateStr);
            if (existing) {
                existing.checkIns++;
            }
        }

        // Count plans by day
        for (const plan of activePlans) {
            const dateStr = formatDateInTimezone(plan.createdAt, args.timezone);
            const existing = dailyActivityMap.get(dateStr);
            if (existing) {
                existing.plans++;
            }
        }

        // Count messages by day
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", coachId))
            .collect();

        for (const conv of conversations) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                .filter((q) => q.gte(q.field("createdAt"), rangeStart))
                .collect();

            for (const msg of messages) {
                const dateStr = formatDateInTimezone(msg.createdAt, args.timezone);
                const existing = dailyActivityMap.get(dateStr);
                if (existing) {
                    existing.messages++;
                }
            }
        }

        // Convert to array sorted by date (most recent first for chart display)
        const dailyActivity: DailyActivity[] = Array.from(dailyActivityMap.entries())
            .map(([date, data]) => ({
                date,
                ...data,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending for chart

        // Only return last 7 days for bar chart (regardless of time range)
        const recentDailyActivity = dailyActivity.slice(-7);

        // ============ 5. RETURN AGGREGATED STATS ============

        return {
            overview: {
                activeClients: activeClients.length,
                avgProgress,
                checkInRate,
                responseTime,
            },
            progressBuckets: {
                onTrack,
                needsSupport,
                atRisk,
            },
            dailyActivity: recentDailyActivity,
            clients: clientCheckIns.sort((a, b) => {
                // Sort: at_risk first, then needs_support, then on_track
                const statusOrder = { at_risk: 0, needs_support: 1, on_track: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            }),
        };
    },
});
