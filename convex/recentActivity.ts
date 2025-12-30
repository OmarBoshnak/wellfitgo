import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";
import { Id } from "./_generated/dataModel";

// Activity type definitions
type ActivityType =
    | "weight_log"
    | "message"
    | "meal_completed"
    | "plan_published"
    | "new_client";

interface RawActivity {
    id: string;
    type: ActivityType;
    clientId: Id<"users">;
    clientName: string;
    clientAvatar?: string;
    timestamp: number;
    metadata: Record<string, unknown>;
}

/**
 * Get recent activity feed for the coach dashboard
 * Aggregates events from multiple tables, sorted by time
 */
export const getRecentActivity = query({
    args: {
        limit: v.optional(v.number()), // Default: 10
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        const limit = args.limit || 10;
        const activities: RawActivity[] = [];

        // Get time boundary (last 7 days for performance)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // ============ 1. GET COACH'S CLIENTS ============
        const clients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .collect();

        // Create client lookup map
        const clientMap = new Map(
            clients.map((c) => [
                c._id,
                {
                    name: `${c.firstName} ${c.lastName || ""}`.trim(),
                    avatar: c.avatarUrl,
                },
            ])
        );

        // ============ 2. WEIGHT LOGS ============
        for (const client of clients) {
            const logs = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
                .order("desc")
                .take(3); // Limit per client

            for (const log of logs) {
                activities.push({
                    id: `weight_${log._id}`,
                    type: "weight_log",
                    clientId: client._id,
                    clientName: clientMap.get(client._id)?.name || "Client",
                    clientAvatar: clientMap.get(client._id)?.avatar,
                    timestamp: log.createdAt,
                    metadata: {
                        weight: log.weight,
                        unit: log.unit,
                    },
                });
            }
        }

        // ============ 3. CLIENT MESSAGES ============
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .collect();

        for (const conv of conversations) {
            // Get recent messages from client (not coach)
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                .filter((q) =>
                    q.and(
                        q.neq(q.field("senderId"), user._id), // Not sent by coach
                        q.gte(q.field("createdAt"), sevenDaysAgo)
                    )
                )
                .order("desc")
                .take(2); // Limit per conversation

            for (const msg of messages) {
                const clientInfo = clientMap.get(conv.clientId);
                activities.push({
                    id: `msg_${msg._id}`,
                    type: "message",
                    clientId: conv.clientId,
                    clientName: clientInfo?.name || "Client",
                    clientAvatar: clientInfo?.avatar,
                    timestamp: msg.createdAt,
                    metadata: {
                        preview: msg.content.substring(0, 50),
                    },
                });
            }
        }

        // ============ 4. MEAL COMPLETIONS ============
        for (const client of clients) {
            const completions = await ctx.db
                .query("mealCompletions")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
                .order("desc")
                .take(2);

            for (const completion of completions) {
                activities.push({
                    id: `meal_${completion._id}`,
                    type: "meal_completed",
                    clientId: client._id,
                    clientName: clientMap.get(client._id)?.name || "Client",
                    clientAvatar: clientMap.get(client._id)?.avatar,
                    timestamp: completion.createdAt,
                    metadata: {
                        mealType: completion.mealType,
                    },
                });
            }
        }

        // ============ 5. PLANS PUBLISHED BY COACH ============
        const plans = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) =>
                q.and(
                    q.gte(q.field("createdAt"), sevenDaysAgo),
                    q.or(
                        q.eq(q.field("status"), "published"),
                        q.eq(q.field("status"), "active")
                    )
                )
            )
            .order("desc")
            .take(3);

        for (const plan of plans) {
            const clientInfo = clientMap.get(plan.clientId);
            activities.push({
                id: `plan_${plan._id}`,
                type: "plan_published",
                clientId: plan.clientId,
                clientName: clientInfo?.name || "Client",
                clientAvatar: clientInfo?.avatar,
                timestamp: plan.publishedAt || plan.createdAt,
                metadata: {
                    status: plan.status,
                },
            });
        }

        // ============ 6. NEW CLIENTS ============
        const newClients = clients.filter((c) => c.createdAt >= sevenDaysAgo);

        for (const client of newClients) {
            activities.push({
                id: `new_${client._id}`,
                type: "new_client",
                clientId: client._id,
                clientName: clientMap.get(client._id)?.name || "Client",
                clientAvatar: clientMap.get(client._id)?.avatar,
                timestamp: client.createdAt,
                metadata: {
                    subscriptionStatus: client.subscriptionStatus,
                },
            });
        }

        // ============ 7. SORT AND LIMIT ============
        // Sort by timestamp descending (newest first)
        activities.sort((a, b) => b.timestamp - a.timestamp);

        // Return limited results
        return activities.slice(0, limit);
    },
});

/**
 * Get ALL recent activity for the coach (no time limit)
 * Used for full-screen activity history
 */
export const getAllRecentActivity = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        // Helper to format time (e.g., "2:30 PM")
        const formatTime = (timestamp: number): string => {
            const date = new Date(timestamp);
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${minutes} ${ampm}`;
        };

        // Helper to format date (e.g., "Dec 10, 2024")
        const formatDate = (timestamp: number): string => {
            const date = new Date(timestamp);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        };

        // Activity items with extended info
        const activities: Array<{
            id: string;
            type: ActivityType;
            clientId: Id<"users">;
            clientName: string;
            clientAvatar?: string;
            time: string;
            date: string;
            title: string;
            description: string;
            actor: "coach" | "client" | "system";
            timestamp: number;
        }> = [];

        // ============ 1. GET COACH'S CLIENTS ============
        const clients = await ctx.db
            .query("users")
            .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
            .collect();

        const clientMap = new Map(
            clients.map((c) => [
                c._id,
                {
                    name: `${c.firstName} ${c.lastName || ""}`.trim(),
                    avatar: c.avatarUrl,
                },
            ])
        );

        // ============ 2. WEIGHT LOGS ============
        for (const client of clients) {
            const logs = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .order("desc")
                .take(20);

            for (const log of logs) {
                activities.push({
                    id: `weight_${log._id}`,
                    type: "weight_log",
                    clientId: client._id,
                    clientName: clientMap.get(client._id)?.name || "Client",
                    clientAvatar: clientMap.get(client._id)?.avatar,
                    time: formatTime(log.createdAt),
                    date: formatDate(log.createdAt),
                    title: "Weight Logged",
                    description: `${log.weight} ${log.unit}`,
                    actor: "client",
                    timestamp: log.createdAt,
                });
            }
        }

        // ============ 3. CLIENT MESSAGES ============
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .collect();

        for (const conv of conversations) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                .filter((q) => q.neq(q.field("senderId"), user._id))
                .order("desc")
                .take(10);

            const clientInfo = clientMap.get(conv.clientId);
            for (const msg of messages) {
                activities.push({
                    id: `msg_${msg._id}`,
                    type: "message",
                    clientId: conv.clientId,
                    clientName: clientInfo?.name || "Client",
                    clientAvatar: clientInfo?.avatar,
                    time: formatTime(msg.createdAt),
                    date: formatDate(msg.createdAt),
                    title: "Message Received",
                    description: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
                    actor: "client",
                    timestamp: msg.createdAt,
                });
            }
        }

        // ============ 4. MEAL COMPLETIONS ============
        for (const client of clients) {
            const completions = await ctx.db
                .query("mealCompletions")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .order("desc")
                .take(10);

            for (const completion of completions) {
                activities.push({
                    id: `meal_${completion._id}`,
                    type: "meal_completed",
                    clientId: client._id,
                    clientName: clientMap.get(client._id)?.name || "Client",
                    clientAvatar: clientMap.get(client._id)?.avatar,
                    time: formatTime(completion.createdAt),
                    date: formatDate(completion.createdAt),
                    title: "Meal Completed",
                    description: `${completion.mealType.charAt(0).toUpperCase() + completion.mealType.slice(1)}`,
                    actor: "client",
                    timestamp: completion.createdAt,
                });
            }
        }

        // ============ 5. PLANS PUBLISHED ============
        const plans = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "published"),
                    q.eq(q.field("status"), "active")
                )
            )
            .order("desc")
            .take(20);

        for (const plan of plans) {
            const clientInfo = clientMap.get(plan.clientId);
            activities.push({
                id: `plan_${plan._id}`,
                type: "plan_published",
                clientId: plan.clientId,
                clientName: clientInfo?.name || "Client",
                clientAvatar: clientInfo?.avatar,
                time: formatTime(plan.publishedAt || plan.createdAt),
                date: formatDate(plan.publishedAt || plan.createdAt),
                title: "Plan Published",
                description: `Week: ${plan.weekStartDate}`,
                actor: "coach",
                timestamp: plan.publishedAt || plan.createdAt,
            });
        }

        // ============ 6. NEW CLIENTS ============
        for (const client of clients) {
            activities.push({
                id: `new_${client._id}`,
                type: "new_client",
                clientId: client._id,
                clientName: clientMap.get(client._id)?.name || "Client",
                clientAvatar: clientMap.get(client._id)?.avatar,
                time: formatTime(client.createdAt),
                date: formatDate(client.createdAt),
                title: "New Client Joined",
                description: `Subscription: ${client.subscriptionStatus}`,
                actor: "system",
                timestamp: client.createdAt,
            });
        }

        // Sort by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);

        return activities;
    },
});
