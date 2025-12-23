import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./auth";

/**
 * Get the current logged-in user
 */
export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        return await getCurrentUser(ctx);
    },
});

/**
 * Get or create a user after Clerk authentication
 * This should be called after successful OAuth sign-in
 */
export const getOrCreateUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.optional(v.string()),
        firstName: v.string(),
        lastName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            // Update last active and return existing user
            await ctx.db.patch(existingUser._id, {
                lastActiveAt: Date.now(),
                updatedAt: Date.now(),
                // Optionally update avatar if changed
                ...(args.avatarUrl && { avatarUrl: args.avatarUrl }),
            });
            return existingUser;
        }

        // Create new user with default values
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            avatarUrl: args.avatarUrl,
            role: "client", // Default role for new users
            gender: "male", // Will be updated in onboarding
            currentWeight: 0, // Will be updated in onboarding
            targetWeight: 0, // Will be updated in onboarding
            startingWeight: 0, // Will be updated in onboarding
            goal: "weight_loss", // Default, will be updated in onboarding
            subscriptionStatus: "trial", // Default for new users
            preferredLanguage: "ar", // Default to Arabic
            preferredUnits: "metric", // Default to metric
            notificationSettings: {
                pushEnabled: true,
                mealReminders: true,
                weeklyCheckin: true,
                coachMessages: true,
                motivational: true,
            },
            isActive: true,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        });

        return await ctx.db.get(userId);
    },
});

/**
 * Get the current authenticated user
 */
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        return await getCurrentUser(ctx);
    },
});

/**
 * Update user profile after onboarding
 */
export const updateProfile = mutation({
    args: {
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
        dateOfBirth: v.optional(v.string()),
        height: v.optional(v.number()),
        activityLevel: v.optional(v.string()),
        currentWeight: v.optional(v.number()),
        targetWeight: v.optional(v.number()),
        startingWeight: v.optional(v.number()),
        goal: v.optional(
            v.union(
                v.literal("weight_loss"),
                v.literal("maintain"),
                v.literal("gain_muscle")
            )
        ),
        preferredLanguage: v.optional(v.union(v.literal("ar"), v.literal("en"))),
        preferredUnits: v.optional(
            v.union(v.literal("metric"), v.literal("imperial"))
        ),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        // Filter out undefined values
        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        for (const [key, value] of Object.entries(args)) {
            if (value !== undefined) {
                updates[key] = value;
            }
        }

        await ctx.db.patch(user._id, updates);
        return await ctx.db.get(user._id);
    },
});

/**
 * Update user avatar with a storage ID
 * Converts the storage ID to a URL and saves it
 */
export const updateAvatar = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        // Get the URL from the storage ID
        const avatarUrl = await ctx.storage.getUrl(args.storageId);
        if (!avatarUrl) {
            throw new Error("Failed to get URL for uploaded image");
        }

        await ctx.db.patch(user._id, {
            avatarUrl,
            updatedAt: Date.now(),
        });

        return await ctx.db.get(user._id);
    },
});

/**
 * Complete onboarding - save all health history data
 * Called from HealthHistoryScreen when user submits the form
 */
export const completeOnboarding = mutation({
    args: {
        firstName: v.string(),
        lastName: v.string(),
        phone: v.string(),
        gender: v.union(v.literal("male"), v.literal("female")),
        age: v.number(),
        height: v.number(),
        heightUnit: v.union(v.literal("cm"), v.literal("ft")),
        currentWeight: v.number(),
        targetWeight: v.number(),
        goal: v.union(
            v.literal("weight_loss"),
            v.literal("maintain"),
            v.literal("gain_muscle")
        ),
        medicalConditions: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        const now = Date.now();
        // Convert height to cm if in feet
        const heightInCm = args.heightUnit === "ft"
            ? Math.round(args.height * 30.48)
            : args.height;

        const userData = {
            firstName: args.firstName,
            lastName: args.lastName,
            phone: args.phone,
            gender: args.gender,
            dateOfBirth: calculateDOB(args.age),
            height: heightInCm,
            currentWeight: args.currentWeight,
            targetWeight: args.targetWeight,
            startingWeight: args.currentWeight,
            goal: args.goal,
            activityLevel: args.medicalConditions,
            preferredUnits: (args.heightUnit === "ft" ? "imperial" : "metric") as "metric" | "imperial",
            updatedAt: now,
            // Ensure these fields exist if creating new user
            clerkId: identity.subject,
            email: identity.email,
            role: "client" as const,
            subscriptionStatus: "trial" as const,
            preferredLanguage: "ar" as const, // Default
            isActive: true,
            createdAt: now,
            lastActiveAt: now,
            notificationSettings: {
                pushEnabled: true,
                mealReminders: true,
                weeklyCheckin: true,
                coachMessages: true,
                motivational: true,
            },
        };

        if (user) {
            // Update existing user - only patch what changes
            await ctx.db.patch(user._id, {
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                gender: userData.gender,
                dateOfBirth: userData.dateOfBirth,
                height: userData.height,
                currentWeight: userData.currentWeight,
                targetWeight: userData.targetWeight,
                startingWeight: userData.startingWeight,
                goal: userData.goal,
                activityLevel: userData.activityLevel,
                preferredUnits: userData.preferredUnits,
                updatedAt: userData.updatedAt,
            });
            return { success: true, message: "Profile updated successfully" };
        } else {
            // Create new user if not found (recovery from failed sync)
            console.log("[Onboarding] Creating user record that was missing");
            await ctx.db.insert("users", userData);
            return { success: true, message: "Profile created successfully" };
        }
    },
});

// Helper function to calculate approximate date of birth from age
function calculateDOB(age: number): string {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return `${birthYear}-01-01`; // Approximate DOB
}

/**
 * Update notification settings
 */
export const updateNotificationSettings = mutation({
    args: {
        pushEnabled: v.optional(v.boolean()),
        mealReminders: v.optional(v.boolean()),
        weeklyCheckin: v.optional(v.boolean()),
        coachMessages: v.optional(v.boolean()),
        motivational: v.optional(v.boolean()),
        quietHoursStart: v.optional(v.string()),
        quietHoursEnd: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const currentSettings = user.notificationSettings;
        const newSettings = {
            ...currentSettings,
            ...Object.fromEntries(
                Object.entries(args).filter(([_, v]) => v !== undefined)
            ),
        };

        await ctx.db.patch(user._id, {
            notificationSettings: newSettings,
            updatedAt: Date.now(),
        });

        return await ctx.db.get(user._id);
    },
});

/**
 * Get user by ID (for coaches/admins to view client profiles)
 */
export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser) return null;

        // Clients can only see themselves
        if (currentUser.role === "client" && currentUser._id !== args.userId) {
            return null;
        }

        // Coaches can only see their assigned clients
        if (currentUser.role === "coach") {
            const targetUser = await ctx.db.get(args.userId);
            if (targetUser?.assignedCoachId !== currentUser._id) {
                return null;
            }
        }

        // Admins can see everyone
        return await ctx.db.get(args.userId);
    },
});

/**
 * Delete user account and all associated data
 * This will permanently delete the user from Convex
 */
export const deleteAccount = mutation({
    args: {},
    handler: async (ctx) => {
        // Get current user identity from Clerk
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Find user by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        // If user exists in Convex, delete them
        if (user) {
            await ctx.db.delete(user._id);
            console.log(`[Convex] User ${user._id} deleted successfully`);
        } else {
            console.log(`[Convex] User with Clerk ID ${identity.subject} not found, nothing to delete`);
        }

        return { success: true, message: "Account deleted successfully" };
    },
});

/**
 * Get dashboard statistics for coaches/admins
 * Returns active client count and trend based on new subscriptions
 */
export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return null;
        }

        // Get all clients
        let clients;
        if (user.role === "admin") {
            // Admin sees all clients
            clients = await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "client"))
                .collect();
        } else {
            // Coach sees assigned clients
            clients = await ctx.db
                .query("users")
                .withIndex("by_assigned_coach", (q) => q.eq("assignedCoachId", user._id))
                .collect();
        }

        // Count active clients (subscription is active or trial)
        const activeClients = clients.filter(
            (c) => c.subscriptionStatus === "active" || c.subscriptionStatus === "trial"
        );
        const totalActiveClients = activeClients.length;

        // Calculate trend: compare new clients this month vs last month
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

        const newClientsThisMonth = activeClients.filter(
            (c) => c.createdAt >= startOfThisMonth
        ).length;

        const newClientsLastMonth = activeClients.filter(
            (c) => c.createdAt >= startOfLastMonth && c.createdAt < startOfThisMonth
        ).length;

        // Calculate trend percentage
        let trendPercentage = 0;
        let trendUp = true;
        if (newClientsLastMonth > 0) {
            trendPercentage = Math.round(
                ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100
            );
            trendUp = trendPercentage >= 0;
        } else if (newClientsThisMonth > 0) {
            trendPercentage = 100;
            trendUp = true;
        }

        // ============ EXPIRING PLANS ============
        // Get meal plans ending within the next 7 days
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // "2025-12-23"
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

        // Get active meal plans for coach's clients
        const clientIds = activeClients.map(c => c._id);
        let allPlans = await ctx.db
            .query("weeklyMealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "active"),
                    q.eq(q.field("status"), "published")
                )
            )
            .collect();

        // Filter plans expiring within 7 days (weekEndDate >= today AND weekEndDate <= 7 days from now)
        const expiringPlans = allPlans.filter((plan) =>
            plan.weekEndDate >= todayStr && plan.weekEndDate <= sevenDaysStr
        );

        // Sort by end date to get the nearest expiring one
        const sortedExpiring = expiringPlans.sort((a, b) =>
            a.weekEndDate.localeCompare(b.weekEndDate)
        );

        // Get the nearest expiring plan details (including client name)
        let nearestExpiringPlan = null;
        if (sortedExpiring.length > 0) {
            const nearest = sortedExpiring[0];
            const client = await ctx.db.get(nearest.clientId);
            const daysUntilExpiry = Math.ceil(
                (new Date(nearest.weekEndDate).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
            );
            nearestExpiringPlan = {
                planId: nearest._id,
                clientId: nearest.clientId,
                clientName: client?.firstName || 'Client',
                weekEndDate: nearest.weekEndDate,
                daysUntilExpiry,
            };
        }

        // ============ NOTIFICATIONS COUNT ============
        // Count unread messages from coach's conversations
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .collect();
        const totalUnreadMessages = conversations.reduce(
            (sum, c) => sum + (c.unreadByCoach || 0), 0
        );

        // Count unreviewed weight logs from coach's active clients
        let unreviewedWeightLogs = 0;
        for (const client of activeClients) {
            const logs = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .filter((q) => q.eq(q.field("isReviewedByCoach"), false))
                .collect();
            unreviewedWeightLogs += logs.length;
        }

        // Total notifications = unread messages + unreviewed weight logs
        const totalNotifications = totalUnreadMessages + unreviewedWeightLogs;

        return {
            totalActiveClients,
            newClientsThisMonth,
            newClientsLastMonth,
            trendPercentage: Math.abs(trendPercentage),
            trendUp,
            // Expiring plans data
            expiringPlansCount: expiringPlans.length,
            nearestExpiringPlan,
            // Notification data for header badge
            totalNotifications,
            unreadMessages: totalUnreadMessages,
            unreviewedWeightLogs,
        };
    },
});

/**
 * Get detailed notification list for the notification dropdown
 * Returns recent unread messages and unreviewed weight logs with details
 */
export const getNotifications = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return { notifications: [], hasMore: false };
        }

        const notifications: Array<{
            id: string;
            type: 'message' | 'weight_log';
            title: string;
            subtitle: string;
            avatar?: string;
            timestamp: number;
            relativeTime: string;
            isRead: boolean;
            data: Record<string, unknown>;
        }> = [];

        // Helper for relative time
        const getRelativeTime = (timestamp: number): string => {
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            return `${Math.floor(days / 7)}w ago`;
        };

        // Get unread messages from conversations
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) => q.gt(q.field("unreadByCoach"), 0))
            .collect();

        for (const conv of conversations) {
            if (conv.unreadByCoach > 0) {
                const client = await ctx.db.get(conv.clientId);
                notifications.push({
                    id: `msg_${conv._id}`,
                    type: 'message',
                    title: client?.firstName || 'Client',
                    subtitle: conv.lastMessagePreview || 'New message',
                    avatar: client?.avatarUrl,
                    timestamp: conv.lastMessageAt,
                    relativeTime: getRelativeTime(conv.lastMessageAt),
                    isRead: false,
                    data: {
                        conversationId: conv._id,
                        clientId: conv.clientId,
                        unreadCount: conv.unreadByCoach,
                    },
                });
            }
        }

        // Get active clients for weight logs
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

        // Get unreviewed weight logs
        for (const client of clients) {
            const logs = await ctx.db
                .query("weightLogs")
                .withIndex("by_client", (q) => q.eq("clientId", client._id))
                .filter((q) => q.eq(q.field("isReviewedByCoach"), false))
                .order("desc")
                .take(5); // Limit per client

            for (const log of logs) {
                notifications.push({
                    id: `weight_${log._id}`,
                    type: 'weight_log',
                    title: client.firstName || 'Client',
                    subtitle: `Logged weight: ${log.weight}${log.unit}`,
                    avatar: client.avatarUrl,
                    timestamp: log.createdAt,
                    relativeTime: getRelativeTime(log.createdAt),
                    isRead: false,
                    data: {
                        logId: log._id,
                        clientId: client._id,
                        weight: log.weight,
                        unit: log.unit,
                    },
                });
            }
        }

        // Sort by timestamp (newest first)
        notifications.sort((a, b) => b.timestamp - a.timestamp);

        return {
            notifications: notifications.slice(0, 20), // Limit to 20 items
            hasMore: notifications.length > 20,
        };
    },
});
