import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth, requireConversationAccess } from "./auth";

/**
 * Get or create a conversation between client and their assigned chat doctor
 * Uses assignedChatDoctorId for chat (separate from diet coach)
 */
export const getOrCreateConversation = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireAuth(ctx);

        // Only clients can create conversations
        if (user.role !== "client") {
            throw new Error("Only clients can create conversations");
        }

        // Check if client has an assigned chat doctor
        if (!user.assignedChatDoctorId) {
            return null; // No doctor assigned yet
        }

        // Check if active conversation already exists with current doctor
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("coachId"), user.assignedChatDoctorId),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (existing) return existing;

        // Create new conversation with assigned chat doctor
        const now = Date.now();
        const conversationId = await ctx.db.insert("conversations", {
            clientId: user._id,
            coachId: user.assignedChatDoctorId,
            status: "active",
            lastMessageAt: now,
            unreadByClient: 0,
            unreadByCoach: 0,
            isPinned: false,
            priority: "normal",
            createdAt: now,
        });

        return await ctx.db.get(conversationId);
    },
});

/**
 * Get conversation for current client user
 * Returns the active conversation with their assigned chat doctor
 */
export const getMyConversation = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        if (user.role === "client") {
            // Get active conversation with assigned chat doctor
            if (!user.assignedChatDoctorId) return null;

            return await ctx.db
                .query("conversations")
                .withIndex("by_client", (q) => q.eq("clientId", user._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("coachId"), user.assignedChatDoctorId),
                        q.eq(q.field("status"), "active")
                    )
                )
                .first();
        }

        // For coaches, use getCoachInbox instead
        if (user.role === "coach") {
            return await ctx.db
                .query("conversations")
                .withIndex("by_coach", (q) => q.eq("coachId", user._id))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();
        }

        return null;
    },
});

/**
 * Get assigned chat doctor info for client display
 * Returns doctor name, avatar, and online status
 */
export const getMyChatDoctor = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "client") return null;

        if (!user.assignedChatDoctorId) {
            return null; // No doctor assigned
        }

        const doctor = await ctx.db.get(user.assignedChatDoctorId);
        if (!doctor) return null;

        return {
            _id: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            avatarUrl: doctor.avatarUrl,
            role: doctor.role,
        };
    },
});

/**
 * Get coach inbox with role-based filtering
 * - Admin: ALL active conversations
 * - Coach: ONLY clients assigned to them via assignedChatDoctorId
 * Filters by subscription status (active/trial only)
 */
export const getCoachInbox = query({
    args: {
        filter: v.optional(v.union(
            v.literal("all"),
            v.literal("unread"),
            v.literal("pinned"),
            v.literal("urgent")
        )),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || (user.role !== "coach" && user.role !== "admin")) {
            return [];
        }

        let conversations;

        if (user.role === "admin") {
            // Admin sees ALL active conversations
            conversations = await ctx.db
                .query("conversations")
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();
        } else {
            // Coach sees ONLY conversations where they are the assigned chat doctor
            conversations = await ctx.db
                .query("conversations")
                .withIndex("by_coach", (q) => q.eq("coachId", user._id))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();
        }

        // Enrich with client data and filter by subscription
        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();
        const enrichedConversations = [];
        for (const conv of conversations) {
            const client = await ctx.db.get(conv.clientId);
            if (!client) continue;

            // Filter: only show active/trial subscriptions
            if (client.subscriptionStatus !== "active" && client.subscriptionStatus !== "trial") {
                continue;
            }

            // Verify this client is actually assigned to this coach (for coaches)
            if (user.role === "coach" && client.assignedChatDoctorId !== user._id) {
                continue;
            }

            // Calculate online status based on lastActiveAt
            const isOnline = client.lastActiveAt
                ? (now - client.lastActiveAt) < ONLINE_THRESHOLD_MS
                : false;

            enrichedConversations.push({
                ...conv,
                client: {
                    _id: client._id,
                    name: `${client.firstName} ${client.lastName || ""}`.trim(),
                    firstName: client.firstName,
                    lastName: client.lastName,
                    avatarUrl: client.avatarUrl,
                    subscriptionStatus: client.subscriptionStatus,
                    isOnline,
                    lastActiveAt: client.lastActiveAt,
                },
            });
        }

        // Apply filters
        let filtered = enrichedConversations;
        if (args.filter === "unread") {
            filtered = enrichedConversations.filter((c) => c.unreadByCoach > 0);
        } else if (args.filter === "pinned") {
            filtered = enrichedConversations.filter((c) => c.isPinned);
        } else if (args.filter === "urgent") {
            filtered = enrichedConversations.filter((c) => c.priority === "urgent");
        }

        // Sort: pinned first, then urgent, then by last message
        filtered.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            if (a.priority === "urgent" && b.priority !== "urgent") return -1;
            if (b.priority === "urgent" && a.priority !== "urgent") return 1;
            return b.lastMessageAt - a.lastMessageAt;
        });

        return filtered;
    },
});

/**
 * Get total unread message count for the coach's tab bar badge
 * Sums unreadByCoach across all active conversations
 * Security: Only counts conversations where authenticated user is the coach
 */
export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "coach") return 0;

        // Query only active conversations for this coach using the existing by_coach index
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_coach", (q) => q.eq("coachId", user._id))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        // Sum unreadByCoach across all active conversations
        return conversations.reduce((sum, conv) => sum + (conv.unreadByCoach || 0), 0);
    },
});

/**
 * Get unread message count for the client's tab bar badge
 * Returns unreadByClient from their active conversation with assigned doctor
 */
export const getClientUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || user.role !== "client") return 0;

        // Check if client has an assigned chat doctor
        if (!user.assignedChatDoctorId) return 0;

        // Get active conversation with assigned chat doctor
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_client", (q) => q.eq("clientId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("coachId"), user.assignedChatDoctorId),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        return conversation?.unreadByClient || 0;
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
 * Authorization rules:
 * - Client: can only send to their assignedChatDoctorId
 * - Coach: can only reply to clients assigned to them
 * - Subscription must be active or trial
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
        mediaDuration: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Verify conversation exists
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Check conversation status
        if (conversation.status !== "active") {
            throw new Error("This conversation is archived and cannot receive new messages");
        }

        // ===== AUTHORIZATION RULES =====

        if (user.role === "client") {
            // Client must be the sender in their own conversation
            if (user._id !== conversation.clientId) {
                throw new Error("Access denied");
            }
            // Client can only message their assigned chat doctor
            if (user.assignedChatDoctorId !== conversation.coachId) {
                throw new Error("You can only send messages to your assigned doctor");
            }
            // Check subscription status
            if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trial") {
                throw new Error("Your subscription is not active. Please renew to send messages.");
            }
        } else if (user.role === "coach") {
            // Coach must be the recipient in the conversation
            if (user._id !== conversation.coachId) {
                throw new Error("Access denied");
            }
            // Verify client is assigned to this coach
            const client = await ctx.db.get(conversation.clientId);
            if (!client || client.assignedChatDoctorId !== user._id) {
                throw new Error("This client is not assigned to you");
            }
        } else {
            // Admin is currently read-only for conversations
            throw new Error("Admins cannot send messages in conversations");
        }

        // Create message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id,
            senderRole: user.role,
            content: args.content,
            messageType: args.messageType || "text",
            mediaUrl: args.mediaUrl,
            mediaDuration: args.mediaDuration,
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

/**
 * Edit a message
 * Only the message sender can edit their own messages
 */
export const editMessage = mutation({
    args: {
        messageId: v.id("messages"),
        newContent: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Get the message
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error("Message not found");
        }

        // Verify ownership - only sender can edit
        if (message.senderId !== user._id) {
            throw new Error("You can only edit your own messages");
        }

        // Cannot edit deleted messages
        if (message.isDeleted) {
            throw new Error("Cannot edit a deleted message");
        }

        // Update the message
        await ctx.db.patch(args.messageId, {
            content: args.newContent,
            isEdited: true,
            editedAt: now,
        });

        return { success: true };
    },
});

/**
 * Delete a message (soft delete)
 * Only the message sender can delete their own messages
 * Message content is replaced with a placeholder, not removed
 */
export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        // Get the message
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error("Message not found");
        }

        // Verify ownership - only sender can delete
        if (message.senderId !== user._id) {
            throw new Error("You can only delete your own messages");
        }

        // Already deleted
        if (message.isDeleted) {
            return { success: true, alreadyDeleted: true };
        }

        // Soft delete - replace content with placeholder
        await ctx.db.patch(args.messageId, {
            content: "تم حذف هذه الرسالة", // "This message was deleted" in Arabic
            isDeleted: true,
            deletedAt: now,
        });

        return { success: true };
    },
});
