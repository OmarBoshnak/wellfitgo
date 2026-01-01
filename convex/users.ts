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
                newMessages: true,
                appointments: true,
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
                newMessages: true,
                appointments: true,
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
        newMessages: v.optional(v.boolean()),
        appointments: v.optional(v.boolean()),
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
 * Update language and regional settings
 */
export const updateRegionalSettings = mutation({
    args: {
        preferredLanguage: v.optional(v.union(v.literal("ar"), v.literal("en"))),
        dateFormat: v.optional(v.union(
            v.literal("MM/DD/YYYY"),
            v.literal("DD/MM/YYYY"),
            v.literal("YYYY-MM-DD")
        )),
        timeFormat: v.optional(v.union(v.literal("12h"), v.literal("24h"))),
        timezone: v.optional(v.string()),
        autoDetectTimezone: v.optional(v.boolean()),
        firstDayOfWeek: v.optional(v.union(
            v.literal("saturday"),
            v.literal("sunday"),
            v.literal("monday")
        )),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const updates: Record<string, unknown> = { updatedAt: Date.now() };

        // Update language if provided
        if (args.preferredLanguage !== undefined) {
            updates.preferredLanguage = args.preferredLanguage;
        }

        // Build regional settings update
        const regionalUpdates: Record<string, unknown> = {};
        if (args.dateFormat !== undefined) regionalUpdates.dateFormat = args.dateFormat;
        if (args.timeFormat !== undefined) regionalUpdates.timeFormat = args.timeFormat;
        if (args.timezone !== undefined) regionalUpdates.timezone = args.timezone;
        if (args.autoDetectTimezone !== undefined) regionalUpdates.autoDetectTimezone = args.autoDetectTimezone;
        if (args.firstDayOfWeek !== undefined) regionalUpdates.firstDayOfWeek = args.firstDayOfWeek;

        if (Object.keys(regionalUpdates).length > 0) {
            updates.regionalSettings = {
                ...user.regionalSettings,
                ...regionalUpdates,
            };
        }

        await ctx.db.patch(user._id, updates);
        return await ctx.db.get(user._id);
    },
});

/**
 * Get notification settings for the current user
 * Returns safe defaults if settings are missing
 */
export const getNotificationSettings = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            return null;
        }

        // Return settings with safe defaults if any field is missing
        const defaults = {
            pushEnabled: true,
            newMessages: true,
            appointments: true,
        };

        return {
            ...defaults,
            ...user.notificationSettings,
        };
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

/**
 * Admin-only: Set a user's role
 * Allows admins to promote users to coach or demote back to client
 */
export const setUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(v.literal("client"), v.literal("coach"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        const currentUser = await requireAuth(ctx);

        // Only admins can change roles
        if (currentUser.role !== "admin") {
            throw new Error("Only admins can change user roles");
        }

        // Don't allow changing your own admin role
        if (args.userId === currentUser._id && args.role !== "admin") {
            throw new Error("Cannot remove your own admin role");
        }

        await ctx.db.patch(args.userId, {
            role: args.role,
            updatedAt: Date.now(),
        });

        const updatedUser = await ctx.db.get(args.userId);
        return {
            success: true,
            message: `User role changed to ${args.role}`,
            user: updatedUser,
        };
    },
});

/**
 * Admin-only: Set a user's role by email address
 * Useful for pre-registering doctors before they sign in
 */
export const setUserRoleByEmail = mutation({
    args: {
        email: v.string(),
        role: v.union(v.literal("client"), v.literal("coach"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        const currentUser = await requireAuth(ctx);

        // Only admins can change roles
        if (currentUser.role !== "admin") {
            throw new Error("Only admins can change user roles");
        }

        // Find user by email
        const users = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .collect();

        if (users.length === 0) {
            throw new Error(`No user found with email: ${args.email}`);
        }

        const targetUser = users[0];

        await ctx.db.patch(targetUser._id, {
            role: args.role,
            updatedAt: Date.now(),
        });

        return {
            success: true,
            message: `User ${args.email} role changed to ${args.role}`,
        };
    },
});

/**
 * Get all users with a specific role (for admin management)
 */
export const getUsersByRole = query({
    args: {
        role: v.union(v.literal("client"), v.literal("coach"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        // Allow both admins and coaches to query users
        if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "coach")) {
            return [];
        }

        const users = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", args.role))
            .collect();

        return users.map((user) => ({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            createdAt: user.createdAt,
        }));
    },
});

/**
 * Admin-only: Set the assigned doctor for a client
 * Quick way to assign doctors using the enum values
 */
export const setAssignedDoctor = mutation({
    args: {
        userId: v.id("users"),
        assignedDoctor: v.union(v.literal("gehad"), v.literal("mostafa"), v.literal("none")),
    },
    handler: async (ctx, args) => {
        const currentUser = await requireAuth(ctx);

        // Only admins and coaches can assign doctors
        if (currentUser.role !== "admin" && currentUser.role !== "coach") {
            throw new Error("Only admins and coaches can assign doctors");
        }

        // Verify the target user exists and is a client
        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) {
            throw new Error("User not found");
        }

        if (targetUser.role !== "client") {
            throw new Error("Can only assign doctors to clients");
        }

        await ctx.db.patch(args.userId, {
            assignedDoctor: args.assignedDoctor,
            updatedAt: Date.now(),
        });

        return {
            success: true,
            message: `Assigned doctor ${args.assignedDoctor} to ${targetUser.firstName}`,
        };
    },
});

/**
 * Get clients by assigned doctor
 */
export const getClientsByAssignedDoctor = query({
    args: {
        assignedDoctor: v.union(v.literal("gehad"), v.literal("mostafa"), v.literal("none")),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "coach")) {
            return [];
        }

        const clients = await ctx.db
            .query("users")
            .filter((q) =>
                q.and(
                    q.eq(q.field("role"), "client"),
                    q.eq(q.field("assignedDoctor"), args.assignedDoctor)
                )
            )
            .collect();

        return clients.map((client) => ({
            _id: client._id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            avatarUrl: client.avatarUrl,
            assignedDoctor: client.assignedDoctor,
            createdAt: client.createdAt,
        }));
    },
});

/**
 * Admin and Coach: Assign a chat doctor to a client
 * Handles reassignment by archiving old conversation and creating/reactivating new one
 * Idempotent: same doctor assignment is a no-op
 */
export const assignChatDoctor = mutation({
    args: {
        clientId: v.id("users"),
        doctorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await requireAuth(ctx);

        // Allow both admins and coaches to assign chat doctors
        if (currentUser.role !== "admin" && currentUser.role !== "coach") {
            throw new Error("Only admins and coaches can assign chat doctors");
        }

        // Verify client exists and is a client
        const client = await ctx.db.get(args.clientId);
        if (!client) {
            throw new Error("Client not found");
        }
        if (client.role !== "client") {
            throw new Error("Can only assign doctors to clients");
        }

        // Verify doctor exists and is a coach
        const doctor = await ctx.db.get(args.doctorId);
        if (!doctor) {
            throw new Error("Doctor not found");
        }
        if (doctor.role !== "coach") {
            throw new Error("Selected user is not a doctor/coach");
        }

        // Check if already assigned to this doctor (idempotent)
        if (client.assignedChatDoctorId === args.doctorId) {
            return {
                success: true,
                message: "Client is already assigned to this doctor",
                conversationId: null,
            };
        }

        const now = Date.now();

        // ===== Handle Reassignment: Archive old conversation =====
        if (client.assignedChatDoctorId) {
            // Find existing active conversation with old doctor
            const oldConversation = await ctx.db
                .query("conversations")
                .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("coachId"), client.assignedChatDoctorId),
                        q.eq(q.field("status"), "active")
                    )
                )
                .first();

            if (oldConversation) {
                // Archive the old conversation
                await ctx.db.patch(oldConversation._id, {
                    status: "archived",
                });
            }
        }

        // ===== Update client's assigned chat doctor =====
        await ctx.db.patch(args.clientId, {
            assignedChatDoctorId: args.doctorId,
            updatedAt: now,
        });

        // ===== Create or reactivate conversation with new doctor =====
        // Check if archived conversation exists with new doctor
        const existingConversation = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.eq(q.field("coachId"), args.doctorId))
            .first();

        let conversationId;

        if (existingConversation) {
            // Reactivate existing conversation
            await ctx.db.patch(existingConversation._id, {
                status: "active",
            });
            conversationId = existingConversation._id;
        } else {
            // Create new conversation
            conversationId = await ctx.db.insert("conversations", {
                clientId: args.clientId,
                coachId: args.doctorId,
                status: "active",
                lastMessageAt: now,
                unreadByClient: 0,
                unreadByCoach: 0,
                isPinned: false,
                priority: "normal",
                createdAt: now,
            });
        }

        return {
            success: true,
            message: `Assigned ${client.firstName} to Dr. ${doctor.firstName}`,
            conversationId,
        };
    },
});

/**
 * Save the user's Expo push notification token
 * Called when the app starts and gets push permissions
 */
export const savePushToken = mutation({
    args: {
        expoPushToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        // Validate it's an Expo push token format
        if (!args.expoPushToken.startsWith("ExponentPushToken[")) {
            throw new Error("Invalid Expo push token format");
        }

        await ctx.db.patch(user._id, {
            expoPushToken: args.expoPushToken,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Remove the user's push token (e.g., on logout)
 */
export const removePushToken = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);

        await ctx.db.patch(user._id, {
            expoPushToken: undefined,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
