import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export type UserRole = "client" | "coach" | "admin";

/**
 * Get the current authenticated user from Clerk identity
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

    return user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");
    return user;
}

/**
 * Require specific role(s) - throws if user doesn't have required role
 */
export async function requireRole(
    ctx: QueryCtx | MutationCtx,
    allowedRoles: UserRole[]
) {
    const user = await requireAuth(ctx);
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
    }
    return user;
}

/**
 * Shorthand for requiring coach or admin role
 */
export async function requireCoachOrAdmin(ctx: QueryCtx | MutationCtx) {
    return requireRole(ctx, ["coach", "admin"]);
}

/**
 * Shorthand for requiring admin role
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
    return requireRole(ctx, ["admin"]);
}

/**
 * Check if the current user has access to a specific client
 * - Admins can access all clients
 * - Coaches can only access their assigned clients
 * - Clients can only access themselves
 */
export async function requireClientAccess(
    ctx: QueryCtx | MutationCtx,
    clientId: Id<"users">
) {
    const user = await requireAuth(ctx);

    if (user.role === "admin") return user; // Admins can access all

    if (user.role === "coach") {
        const client = await ctx.db.get(clientId);
        if (!client || client.assignedCoachId !== user._id) {
            throw new Error("You don't have access to this client");
        }
        return user;
    }

    if (user.role === "client" && user._id !== clientId) {
        throw new Error("Access denied");
    }

    return user;
}

/**
 * Check if user can access a conversation
 */
export async function requireConversationAccess(
    ctx: QueryCtx | MutationCtx,
    conversationId: Id<"conversations">
) {
    const user = await requireAuth(ctx);
    const conversation = await ctx.db.get(conversationId);

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    if (user.role === "admin") return { user, conversation };

    if (
        user._id !== conversation.clientId &&
        user._id !== conversation.coachId
    ) {
        throw new Error("Access denied to this conversation");
    }

    return { user, conversation };
}
