import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./auth";
import { Id } from "./_generated/dataModel";

// ============ CLIENT STATUS TYPES ============
type ClientStatus = "active" | "new" | "atRisk" | "overdue" | "inactive";

// ============ CONFIGURABLE THRESHOLDS (in days) ============
const THRESHOLDS = {
    NEW_CLIENT_DAYS: 7,
    ACTIVE_DAYS: 3,
    AT_RISK_DAYS: 7,
    OVERDUE_DAYS: 14,
};

// ============ HELPER FUNCTIONS ============

/**
 * Calculate days since a given timestamp
 * Returns Infinity if timestamp is undefined (never occurred)
 */
function daysSince(timestamp: number | undefined): number {
    if (!timestamp) return Infinity;
    return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

/**
 * Determine client status based on activity and subscription
 * Priority: inactive > new > overdue > atRisk > active
 */
function determineClientStatus(
    client: {
        createdAt: number;
        lastActiveAt?: number;
        subscriptionStatus: string;
    },
    lastWeightLogDate?: number
): ClientStatus {
    const daysSinceCreated = daysSince(client.createdAt);
    const daysSinceActive = daysSince(client.lastActiveAt);
    const daysSinceWeightLog = daysSince(lastWeightLogDate);

    // 1. Check subscription status first
    if (client.subscriptionStatus === "paused" || client.subscriptionStatus === "cancelled") {
        return "inactive";
    }

    // 2. New client (created within 7 days)
    if (daysSinceCreated <= THRESHOLDS.NEW_CLIENT_DAYS) {
        return "new";
    }

    // 3. Overdue (no activity in 14+ days)
    if (daysSinceActive > THRESHOLDS.OVERDUE_DAYS || daysSinceWeightLog > THRESHOLDS.OVERDUE_DAYS) {
        return "overdue";
    }

    // 4. At risk (no activity in 7-14 days)
    if (daysSinceActive > THRESHOLDS.AT_RISK_DAYS) {
        return "atRisk";
    }

    // 5. Active (default)
    return "active";
}

// ============ QUERIES ============

/**
 * Get all clients for the coach with enriched data
 * Includes: status, weight progress, unread messages, active plan info
 */
export const getCoachClients = query({
    args: {
        filter: v.optional(v.union(
            v.literal("all"),
            v.literal("active"),
            v.literal("inactive"),
            v.literal("new"),
            v.literal("atRisk")
        )),
        searchQuery: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // ============ 1. FETCH CLIENTS ============
        let clients;
        if (user.role === "admin") {
            // Admin sees all clients
            clients = await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "client"))
                .collect();
        } else {
            // Coach sees only assigned clients
            clients = await ctx.db
                .query("users")
                .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
                .collect();
        }

        // ============ 2. ENRICH EACH CLIENT WITH RELATED DATA ============
        const enrichedClients = await Promise.all(
            clients.map(async (client) => {
                // Get latest weight log (for current weight and last check-in)
                const latestWeightLog = await ctx.db
                    .query("weightLogs")
                    .withIndex("by_client", (q) => q.eq("clientId", client._id))
                    .order("desc")
                    .first();

                // Get first weight log (for calculating progress from actual logs)
                const firstWeightLog = await ctx.db
                    .query("weightLogs")
                    .withIndex("by_client", (q) => q.eq("clientId", client._id))
                    .order("asc")
                    .first();

                // Get conversation for unread messages count
                const conversation = await ctx.db
                    .query("conversations")
                    .withIndex("by_client", (q) => q.eq("clientId", client._id))
                    .first();

                // Get active meal plan
                const activePlan = await ctx.db
                    .query("weeklyMealPlans")
                    .withIndex("by_client", (q) => q.eq("clientId", client._id))
                    .filter((q) =>
                        q.or(
                            q.eq(q.field("status"), "active"),
                            q.eq(q.field("status"), "published")
                        )
                    )
                    .order("desc")
                    .first();

                // Determine client status
                const status = determineClientStatus(
                    client,
                    latestWeightLog?.createdAt
                );

                // Calculate weight progress
                const startWeight = firstWeightLog?.weight ?? client.startingWeight;
                const currentWeight = latestWeightLog?.weight ?? client.currentWeight;
                const targetWeight = client.targetWeight;
                const totalToLose = startWeight - targetWeight;
                const actuallyLost = startWeight - currentWeight;
                const progress = totalToLose > 0
                    ? Math.min(100, Math.max(0, Math.round((actuallyLost / totalToLose) * 100)))
                    : 0;

                // Calculate days since last check-in
                const lastCheckInTime = latestWeightLog?.createdAt ?? client.lastActiveAt;
                const daysSinceCheckIn = daysSince(lastCheckInTime);

                return {
                    id: client._id,
                    clerkId: client.clerkId,
                    name: `${client.firstName} ${client.lastName ?? ""}`.trim(),
                    firstName: client.firstName,
                    lastName: client.lastName,
                    email: client.email ?? "",
                    phone: client.phone,
                    avatar: client.avatarUrl ?? null,
                    gender: client.gender,

                    // Status
                    status,
                    subscriptionStatus: client.subscriptionStatus,
                    isActive: client.isActive,

                    // Weight data
                    startWeight,
                    currentWeight,
                    targetWeight,
                    progress,

                    // Activity tracking
                    lastActiveAt: client.lastActiveAt,
                    lastCheckInDays: daysSinceCheckIn === Infinity ? null : daysSinceCheckIn,
                    lastWeightLogDate: latestWeightLog?.date,

                    // Messages
                    unreadMessages: conversation?.unreadByCoach ?? 0,
                    conversationId: conversation?._id,

                    // Plan info
                    hasActivePlan: !!activePlan,
                    planExpiresAt: activePlan?.weekEndDate,

                    // Timestamps
                    createdAt: client.createdAt,
                    daysSinceJoined: daysSince(client.createdAt),
                };
            })
        );

        // ============ 3. APPLY FILTERS ============
        let filtered = enrichedClients;

        // Status filter
        if (args.filter && args.filter !== "all") {
            filtered = filtered.filter((c) => {
                switch (args.filter) {
                    case "active":
                        return c.status === "active";
                    case "inactive":
                        return c.status === "inactive";
                    case "new":
                        return c.status === "new";
                    case "atRisk":
                        // atRisk includes both atRisk and overdue
                        return c.status === "atRisk" || c.status === "overdue";
                    default:
                        return true;
                }
            });
        }

        // Search filter (name or email)
        if (args.searchQuery && args.searchQuery.trim()) {
            const query = args.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    c.email.toLowerCase().includes(query)
            );
        }

        // ============ 4. SORT BY PRIORITY ============
        // Priority: overdue > atRisk > active > new > inactive
        const statusOrder: Record<ClientStatus, number> = {
            overdue: 0,
            atRisk: 1,
            active: 2,
            new: 3,
            inactive: 4,
        };

        filtered.sort((a, b) => {
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            // Secondary sort by last active (most recent first)
            return (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0);
        });

        // ============ 5. APPLY LIMIT ============
        if (args.limit) {
            filtered = filtered.slice(0, args.limit);
        }

        return filtered;
    },
});

/**
 * Get client counts by status for filter badges
 */
export const getClientCounts = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return { all: 0, active: 0, inactive: 0, new: 0, atRisk: 0 };
        }

        // Fetch clients
        let clients;
        if (user.role === "admin") {
            clients = await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "client"))
                .collect();
        } else {
            clients = await ctx.db
                .query("users")
                .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
                .collect();
        }

        // Initialize counts
        const counts = { all: 0, active: 0, inactive: 0, new: 0, atRisk: 0 };

        // Count each client by status
        for (const client of clients) {
            // Get latest weight log for status determination
            const latestWeightLog = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .order("desc")
                .first();

            const status = determineClientStatus(client, latestWeightLog?.createdAt);

            counts.all++;
            switch (status) {
                case "active":
                    counts.active++;
                    break;
                case "inactive":
                    counts.inactive++;
                    break;
                case "new":
                    counts.new++;
                    break;
                case "atRisk":
                case "overdue":
                    counts.atRisk++;
                    break;
            }
        }

        return counts;
    },
});

// ============ MUTATIONS ============

/**
 * Send reminder notification to inactive client
 * Creates a system message in the conversation
 */
export const sendClientReminder = mutation({
    args: {
        clientId: v.id("users"),
        reminderType: v.optional(v.union(
            v.literal("checkin"),
            v.literal("weight"),
            v.literal("general")
        )),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        // Only coaches and admins can send reminders
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can send reminders");
        }

        // Fetch client
        const client = await ctx.db.get(args.clientId);
        if (!client) {
            throw new Error("Client not found");
        }

        // Verify coach owns this client (unless admin)
        if (user.role !== "admin" && client.assignedCoachId !== user._id) {
            throw new Error("Not authorized to send reminder to this client");
        }

        // Get or create conversation
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .first();

        const now = Date.now();

        if (!conversation) {
            // Create conversation if it doesn't exist
            const convId = await ctx.db.insert("conversations", {
                clientId: args.clientId,
                coachId: user._id,
                status: "active",
                lastMessageAt: now,
                unreadByClient: 1,
                unreadByCoach: 0,
                isPinned: false,
                priority: "normal",
                createdAt: now,
            });
            conversation = await ctx.db.get(convId);
        }

        if (!conversation) {
            throw new Error("Failed to create conversation");
        }

        // Determine message based on language preference and reminder type
        const isRTL = client.preferredLanguage === "ar";
        const reminderType = args.reminderType ?? "general";

        const reminderMessages: Record<string, { ar: string; en: string }> = {
            checkin: {
                ar: `مرحباً ${client.firstName}! 👋 لاحظنا أنك لم تقم بتسجيل الدخول منذ فترة. كيف حالك؟`,
                en: `Hi ${client.firstName}! 👋 We noticed you haven't checked in for a while. How are you doing?`,
            },
            weight: {
                ar: `مرحباً ${client.firstName}! 📊 حان وقت تسجيل وزنك الأسبوعي. نحن هنا لدعمك!`,
                en: `Hi ${client.firstName}! 📊 It's time for your weekly weigh-in. We're here to support you!`,
            },
            general: {
                ar: `مرحباً ${client.firstName}! 💪 نفتقدك! تعال وشاهد خطتك الغذائية.`,
                en: `Hi ${client.firstName}! 💪 We miss you! Come check out your meal plan.`,
            },
        };

        const messageContent = isRTL
            ? reminderMessages[reminderType].ar
            : reminderMessages[reminderType].en;

        // Insert reminder message
        await ctx.db.insert("messages", {
            conversationId: conversation._id,
            senderId: user._id,
            senderRole: "coach",
            content: messageContent,
            messageType: "system",
            isReadByClient: false,
            isReadByCoach: true,
            isEdited: false,
            isDeleted: false,
            createdAt: now,
        });

        // Update conversation
        await ctx.db.patch(conversation._id, {
            lastMessageAt: now,
            lastMessagePreview: messageContent.substring(0, 50),
            unreadByClient: (conversation.unreadByClient ?? 0) + 1,
        });

        return {
            success: true,
            message: "Reminder sent successfully",
            clientName: client.firstName,
        };
    },
});

/**
 * Update client's last active timestamp
 * Called from client app when they open it
 */
export const updateLastActive = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);

        await ctx.db.patch(user._id, {
            lastActiveAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
