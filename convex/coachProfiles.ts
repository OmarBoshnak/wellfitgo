import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./auth";

/**
 * Get the current coach's profile
 * Returns the coach profile for the authenticated user
 */
export const getMyCoachProfile = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        // Only coaches and admins have coach profiles
        if (user.role !== "coach" && user.role !== "admin") {
            return null;
        }

        const coachProfile = await ctx.db
            .query("coachProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        return coachProfile;
    },
});

/**
 * Get a coach profile by user ID
 * Can be used by clients to view their coach's profile
 */
export const getCoachProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const coachProfile = await ctx.db
            .query("coachProfiles")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        return coachProfile;
    },
});

/**
 * Create or update coach profile
 * Used when a user becomes a coach or updates their profile
 * 
 * workingHours format:
 * {
 *   timezone: "Africa/Cairo",
 *   days: {
 *     sunday: { enabled: true, from: 540, to: 1080 },  // 540 = 9:00 AM, 1080 = 6:00 PM
 *     monday: { enabled: true, from: 540, to: 1080 },
 *     // ...etc
 *   }
 * }
 * Times are stored as minutes since midnight (0-1440)
 */
const dayAvailabilityValidator = v.object({
    enabled: v.boolean(),
    from: v.number(),  // minutes since midnight (e.g., 540 = 9:00 AM)
    to: v.number(),    // minutes since midnight (e.g., 1080 = 6:00 PM, 1440 = midnight)
});

export const updateCoachProfile = mutation({
    args: {
        specialization: v.optional(v.string()),
        bio: v.optional(v.string()),
        qualifications: v.optional(v.array(v.string())),
        maxClients: v.optional(v.number()),
        averageResponseTime: v.optional(v.string()),
        isAcceptingClients: v.optional(v.boolean()),
        workingHours: v.optional(
            v.object({
                timezone: v.string(),
                days: v.object({
                    sunday: dayAvailabilityValidator,
                    monday: dayAvailabilityValidator,
                    tuesday: dayAvailabilityValidator,
                    wednesday: dayAvailabilityValidator,
                    thursday: dayAvailabilityValidator,
                    friday: dayAvailabilityValidator,
                    saturday: dayAvailabilityValidator,
                }),
            })
        ),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        // Only coaches and admins can update coach profiles
        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can update coach profiles");
        }

        // Check if profile already exists
        const existingProfile = await ctx.db
            .query("coachProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        // Build update object (filter out undefined values)
        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(args)) {
            if (value !== undefined) {
                updates[key] = value;
            }
        }

        if (existingProfile) {
            // Update existing profile
            await ctx.db.patch(existingProfile._id, updates);
            return await ctx.db.get(existingProfile._id);
        } else {
            // Create new profile with defaults
            const profileId = await ctx.db.insert("coachProfiles", {
                userId: user._id,
                specialization: args.specialization,
                bio: args.bio,
                qualifications: args.qualifications || [],
                maxClients: args.maxClients || 50,
                currentClientCount: 0,
                averageResponseTime: args.averageResponseTime,
                isAcceptingClients: args.isAcceptingClients ?? true,
                workingHours: args.workingHours,
            });
            return await ctx.db.get(profileId);
        }
    },
});

/**
 * Update accepting clients status
 * Quick toggle for coaches to open/close their availability
 */
export const setAcceptingClients = mutation({
    args: {
        isAcceptingClients: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        if (user.role !== "coach" && user.role !== "admin") {
            throw new Error("Only coaches can update this setting");
        }

        const profile = await ctx.db
            .query("coachProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        if (!profile) {
            throw new Error("Coach profile not found");
        }

        await ctx.db.patch(profile._id, {
            isAcceptingClients: args.isAcceptingClients,
        });

        return { success: true };
    },
});

/**
 * Get all available coaches (for client assignment)
 */
export const getAvailableCoaches = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Get all coach profiles that are accepting clients
        const profiles = await ctx.db
            .query("coachProfiles")
            .filter((q) => q.eq(q.field("isAcceptingClients"), true))
            .collect();

        // Get the corresponding users and filter by available capacity
        const coaches = await Promise.all(
            profiles
                .filter((p) => p.currentClientCount < p.maxClients)
                .map(async (profile) => {
                    const coach = await ctx.db.get(profile.userId);
                    if (!coach || coach.role !== "coach") return null;

                    return {
                        _id: coach._id,
                        firstName: coach.firstName,
                        lastName: coach.lastName,
                        avatarUrl: coach.avatarUrl,
                        specialization: profile.specialization,
                        bio: profile.bio,
                        currentClientCount: profile.currentClientCount,
                        maxClients: profile.maxClients,
                        averageResponseTime: profile.averageResponseTime,
                    };
                })
        );

        return coaches.filter(Boolean);
    },
});
