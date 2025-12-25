import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";
import { Id, Doc } from "./_generated/dataModel";

// ============ CONFIGURABLE THRESHOLDS ============
const MISSING_CHECKIN_THRESHOLD_DAYS = 7;
const LATE_MESSAGE_THRESHOLD_HOURS = 48;

// ============ TYPES ============
type AttentionType = "missing_checkin" | "weight_gain" | "late_message";

interface AttentionClient {
    id: Id<"users">;
    name: string;
    avatarUrl: string | null;
    attentionType: AttentionType;
    // For missing_checkin
    daysSinceCheckin: number | null;
    hasAnyCheckins: boolean;
    // For weight_gain
    weightChange: number | null;
    currentWeight: number | null;
    feeling: string | null;
    // For late_message
    lastMessageTime: number | null;
    lastMessagePreview: string | null;
}

/**
 * Get clients needing attention for a coach's dashboard
 * Returns clients sorted by priority: critical > warning > info
 * 
 * Attention types:
 * 1. Missing check-in (critical): No weight log in last 7 days
 * 2. Weight gain (warning): Weight increased from previous week
 * 3. Late messages (info): Unread client message within 48 hours
 */
export const getClientsNeedingAttention = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<AttentionClient[]> => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        const limit = args.limit ?? 50;
        const now = Date.now();

        // ============ FETCH ACTIVE CLIENTS ============
        // Use existing by_assigned_coach index to get coach's clients
        const allClients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .collect();

        // Filter to active/trial subscription clients only
        const activeClients = allClients.filter(
            (c) => c.subscriptionStatus === "active" || c.subscriptionStatus === "trial"
        );

        if (activeClients.length === 0) {
            return [];
        }

        // ============ COLLECT ATTENTION DATA ============
        // Map to store highest priority attention for each client
        const clientAttention = new Map<Id<"users">, AttentionClient>();

        // Process each client to check all attention types
        for (const client of activeClients) {
            // ==== 1. Check Missing Check-in (Priority 1 - Critical) ====
            const weightLogs = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .order("desc")
                .take(10); // Get recent logs for analysis

            const hasAnyCheckins = weightLogs.length > 0;
            let daysSinceCheckin: number | null = null;

            if (hasAnyCheckins) {
                const latestLog = weightLogs[0];
                const logDate = new Date(latestLog.date).getTime();
                daysSinceCheckin = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
            }

            const isMissingCheckin = !hasAnyCheckins ||
                (daysSinceCheckin !== null && daysSinceCheckin >= MISSING_CHECKIN_THRESHOLD_DAYS);

            if (isMissingCheckin) {
                // Missing check-in is highest priority, add immediately
                clientAttention.set(client._id, {
                    id: client._id,
                    name: `${client.firstName}${client.lastName ? ` ${client.lastName}` : ""}`,
                    avatarUrl: client.avatarUrl ?? null,
                    attentionType: "missing_checkin",
                    daysSinceCheckin,
                    hasAnyCheckins,
                    weightChange: null,
                    currentWeight: null,
                    feeling: null,
                    lastMessageTime: null,
                    lastMessagePreview: null,
                });
                continue; // Skip lower priority checks for this client
            }

            // ==== 2. Check Weight Gain (Priority 2 - Warning) ====
            // Need at least 2 logs to compare
            if (weightLogs.length >= 2) {
                // Group logs by week
                const logsByWeek = new Map<string, Doc<"weightLogs">>();
                for (const log of weightLogs) {
                    const weekKey = `${log.year}-${log.weekNumber}`;
                    // Keep only the latest log per week
                    if (!logsByWeek.has(weekKey)) {
                        logsByWeek.set(weekKey, log);
                    }
                }

                // Get last two weeks' logs
                const sortedWeeks = Array.from(logsByWeek.entries()).sort((a, b) => {
                    const [yearA, weekA] = a[0].split("-").map(Number);
                    const [yearB, weekB] = b[0].split("-").map(Number);
                    if (yearA !== yearB) return yearB - yearA;
                    return weekB - weekA;
                });

                if (sortedWeeks.length >= 2) {
                    const currentWeekLog = sortedWeeks[0][1];
                    const previousWeekLog = sortedWeeks[1][1];
                    const weightChange = currentWeekLog.weight - previousWeekLog.weight;

                    // Only show if weight increased (positive change)
                    if (weightChange > 0) {
                        clientAttention.set(client._id, {
                            id: client._id,
                            name: `${client.firstName}${client.lastName ? ` ${client.lastName}` : ""}`,
                            avatarUrl: client.avatarUrl ?? null,
                            attentionType: "weight_gain",
                            daysSinceCheckin: null,
                            hasAnyCheckins: true,
                            // Round to 1 decimal place
                            weightChange: Math.round(weightChange * 10) / 10,
                            currentWeight: currentWeekLog.weight,
                            feeling: currentWeekLog.feeling ?? null,
                            lastMessageTime: null,
                            lastMessagePreview: null,
                        });
                        continue; // Skip lower priority checks
                    }
                }
            }

            // ==== 3. Check Late Messages (Priority 3 - Info) ====
            // Find conversation for this client
            const conversation = await ctx.db
                .query("conversations")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .first();

            if (conversation && conversation.unreadByCoach > 0) {
                // Get the latest message to check if it's from client
                const latestMessage = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation_time", (q) =>
                        q.eq("conversationId", conversation._id)
                    )
                    .order("desc")
                    .first();

                if (latestMessage && latestMessage.senderRole === "client") {
                    // Check if within threshold (48 hours)
                    const hoursSinceMessage = (now - latestMessage.createdAt) / (1000 * 60 * 60);

                    if (hoursSinceMessage <= LATE_MESSAGE_THRESHOLD_HOURS) {
                        clientAttention.set(client._id, {
                            id: client._id,
                            name: `${client.firstName}${client.lastName ? ` ${client.lastName}` : ""}`,
                            avatarUrl: client.avatarUrl ?? null,
                            attentionType: "late_message",
                            daysSinceCheckin: null,
                            hasAnyCheckins,
                            weightChange: null,
                            currentWeight: null,
                            feeling: null,
                            lastMessageTime: latestMessage.createdAt,
                            lastMessagePreview: latestMessage.content.substring(0, 50),
                        });
                    }
                }
            }
        }

        // ============ SORT BY PRIORITY AND SUB-CRITERIA ============
        const attentionList = Array.from(clientAttention.values());

        // Priority order: missing_checkin (1), weight_gain (2), late_message (3)
        const priorityOrder: Record<AttentionType, number> = {
            missing_checkin: 1,
            weight_gain: 2,
            late_message: 3,
        };

        attentionList.sort((a, b) => {
            // First, sort by priority
            const priorityDiff = priorityOrder[a.attentionType] - priorityOrder[b.attentionType];
            if (priorityDiff !== 0) return priorityDiff;

            // Within same priority, apply sub-sorting
            switch (a.attentionType) {
                case "missing_checkin":
                    // Longest overdue first (highest daysSinceCheckin)
                    // Clients with no check-ins at all come first (null treated as infinity)
                    const aDays = a.hasAnyCheckins ? (a.daysSinceCheckin ?? 0) : Infinity;
                    const bDays = b.hasAnyCheckins ? (b.daysSinceCheckin ?? 0) : Infinity;
                    return bDays - aDays;

                case "weight_gain":
                    // Largest gain first
                    return (b.weightChange ?? 0) - (a.weightChange ?? 0);

                case "late_message":
                    // Most recent message first (smallest age = largest timestamp)
                    return (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0);

                default:
                    return 0;
            }
        });

        // Apply limit
        return attentionList.slice(0, limit);
    },
});
