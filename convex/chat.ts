import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth, requireConversationAccess } from "./auth";

/**
 * Get or create a conversation between client and coach
 */
export const getOrCreateConversation = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);

        // For clients, find their assigned coach's conversation
        if (user.role === "client" && user.assignedCoachId) {
            // Check if conversation already exists
            const existing = await ctx.db
                .query("conversations")
                .withIndex("by_client", (q) => q.eq("clientId", user._id))
                .first();

            if (existing) return existing;

            // Create new conversation
            const now = Date.now();
            const conversationId = await ctx.db.insert("conversations", {
                clientId: user._id,
                coachId: user.assignedCoachId,
                status: "active",
                lastMessageAt: now,
                unreadByClient: 0,
                unreadByCoach: 0,
                isPinned: false,
                priority: "normal",
                createdAt: now,
            });

            return await ctx.db.get(conversationId);
        }

        // For now, return null if no assigned coach
        return null;
    },
});

/**
 * Get conversation for current user
 */
export const getMyConversation = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        if (user.role === "client") {
            return await ctx.db
                .query("conversations")
                .withIndex("by_client", (q) => q.eq("clientId", user._id))
                .first();
        }

        // For coaches, this would return their list of conversations
        if (user.role === "coach") {
            return await ctx.db
                .query("conversations")
                .withIndex("by_coach", (q) => q.eq("coachId", user._id))
                .collect();
        }

        return null;
    },
});

/**
 * Get messages for a conversation (real-time subscription)
 */
export const getMessages = query({
    args: {
        conversationId: v.optional(v.id("conversations")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        if (!args.conversationId) return [];

        const user = await getCurrentUser(ctx);
        if (!user) return [];

        // Verify access
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return [];

        if (
            user._id !== conversation.clientId &&
            user._id !== conversation.coachId &&
            user.role !== "admin"
        ) {
            return [];
        }

        // Get messages ordered by creation time
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_time", (q) =>
                q.eq("conversationId", args.conversationId!)
            )
            .order("asc")
            .take(args.limit || 100);

        return messages;
    },
});

/**
 * Send a text message
 */
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        messageType: v.optional(
            v.union(
                v.literal("text"),
                v.literal("image"),
                v.literal("voice")
            )
        ),
        mediaUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Verify access
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        if (
            user._id !== conversation.clientId &&
            user._id !== conversation.coachId
        ) {
            throw new Error("Access denied");
        }

        // Create message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id,
            senderRole: user.role,
            content: args.content,
            messageType: args.messageType || "text",
            mediaUrl: args.mediaUrl,
            isReadByClient: user.role === "client",
            isReadByCoach: user.role === "coach",
            isEdited: false,
            isDeleted: false,
            createdAt: now,
        });

        // Update conversation
        const isClient = user._id === conversation.clientId;
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: now,
            lastMessagePreview: args.content.substring(0, 50),
            ...(isClient
                ? { unreadByCoach: conversation.unreadByCoach + 1 }
                : { unreadByClient: conversation.unreadByClient + 1 }),
        });

        return messageId;
    },
});

/**
 * Mark messages as read
 */
export const markAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return;

        const isClient = user._id === conversation.clientId;

        // Update unread count
        await ctx.db.patch(args.conversationId, {
            ...(isClient ? { unreadByClient: 0 } : { unreadByCoach: 0 }),
        });

        // Mark all messages as read
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        for (const message of messages) {
            if (isClient && !message.isReadByClient) {
                await ctx.db.patch(message._id, {
                    isReadByClient: true,
                    readAt: Date.now(),
                });
            } else if (!isClient && !message.isReadByCoach) {
                await ctx.db.patch(message._id, {
                    isReadByCoach: true,
                    readAt: Date.now(),
                });
            }
        }
    },
});

/**
 * Generate upload URL for image
 */
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAuth(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Get URL for stored file
 */
export const getFileUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
