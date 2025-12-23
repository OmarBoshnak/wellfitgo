/**
 * Messaging hooks for Convex integration
 * Wraps Convex queries/mutations for real-time messaging
 */
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useEffect } from 'react';

// ============ COACH INBOX ============

export type InboxFilter = 'all' | 'unread' | 'pinned' | 'urgent';

/**
 * Get coach inbox with real-time updates
 * For doctor/coach app - shows all client conversations
 */
export function useCoachInbox(filter: InboxFilter = 'all') {
    // Get all conversations for the coach
    const conversations = useQuery(api.chat.getMyConversation);

    if (!conversations || !Array.isArray(conversations)) {
        return {
            conversations: [],
            isLoading: conversations === undefined,
            totalUnread: 0,
            oldestUnread: null,
        };
    }

    // Apply client-side filters
    let filtered = conversations;
    if (filter === 'unread') {
        filtered = conversations.filter((c: any) => c.unreadByCoach > 0);
    } else if (filter === 'pinned') {
        filtered = conversations.filter((c: any) => c.isPinned);
    } else if (filter === 'urgent') {
        filtered = conversations.filter((c: any) => c.priority === 'urgent');
    }

    // Sort: pinned first, then priority, then by last message
    const sorted = [...filtered].sort((a: any, b: any) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
        return b.lastMessageAt - a.lastMessageAt;
    });

    // Find the oldest unread conversation (smallest lastMessageAt among unread)
    const unreadConversations = conversations.filter((c: any) => c.unreadByCoach > 0);
    const oldestUnreadConv = unreadConversations.length > 0
        ? unreadConversations.reduce((oldest: any, current: any) =>
            current.lastMessageAt < oldest.lastMessageAt ? current : oldest
        )
        : null;

    // Calculate relative time for oldest unread message
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

    return {
        conversations: sorted,
        isLoading: false,
        totalUnread: conversations.reduce((sum: number, c: any) => sum + (c.unreadByCoach || 0), 0),
        // Oldest unread info for dashboard display
        oldestUnread: oldestUnreadConv ? {
            preview: oldestUnreadConv.lastMessagePreview || '',
            relativeTime: getRelativeTime(oldestUnreadConv.lastMessageAt),
            conversationId: oldestUnreadConv._id,
        } : null,
    };
}

// ============ CLIENT CONVERSATION ============

/**
 * Get client's conversation with their coach
 * For client app - single conversation view
 */
export function useClientConversation() {
    const conversation = useQuery(api.chat.getMyConversation);

    return {
        conversation: conversation && !Array.isArray(conversation) ? conversation : null,
        isLoading: conversation === undefined,
    };
}

// ============ MESSAGES ============

/**
 * Get messages for a conversation with real-time updates
 */
export function useConversation(conversationId: Id<"conversations"> | null | undefined) {
    const messages = useQuery(
        api.chat.getMessages,
        conversationId ? { conversationId, limit: 100 } : "skip"
    );

    return {
        messages: messages || [],
        isLoading: messages === undefined,
        hasMore: false, // TODO: implement pagination
    };
}

// ============ MUTATIONS ============

/**
 * Send message mutation
 */
export function useSendMessage() {
    const sendMutation = useMutation(api.chat.sendMessage);

    const sendMessage = useCallback(async (
        conversationId: Id<"conversations">,
        content: string,
        messageType: 'text' | 'image' | 'voice' = 'text',
        mediaUrl?: string
    ) => {
        try {
            const messageId = await sendMutation({
                conversationId,
                content,
                messageType,
                mediaUrl,
            });
            return { success: true, messageId };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error };
        }
    }, [sendMutation]);

    return { sendMessage };
}

/**
 * Mark conversation as read
 */
export function useMarkAsRead() {
    const markAsReadMutation = useMutation(api.chat.markAsRead);

    const markAsRead = useCallback(async (conversationId: Id<"conversations">) => {
        try {
            await markAsReadMutation({ conversationId });
            return { success: true };
        } catch (error) {
            console.error('Error marking as read:', error);
            return { success: false, error };
        }
    }, [markAsReadMutation]);

    return { markAsRead };
}

/**
 * Get or create conversation (for clients)
 */
export function useGetOrCreateConversation() {
    const getOrCreateMutation = useMutation(api.chat.getOrCreateConversation);

    const getOrCreate = useCallback(async () => {
        try {
            const conversation = await getOrCreateMutation({});
            return { success: true, conversation };
        } catch (error) {
            console.error('Error getting/creating conversation:', error);
            return { success: false, error };
        }
    }, [getOrCreateMutation]);

    return { getOrCreate };
}

// ============ COMBINED HOOK FOR CHAT SCREEN ============

/**
 * Combined hook for chat screen - handles messages, sending, and read status
 */
export function useChatScreen(conversationId: Id<"conversations"> | null | undefined) {
    const { messages, isLoading } = useConversation(conversationId);
    const { sendMessage } = useSendMessage();
    const { markAsRead } = useMarkAsRead();

    // Mark as read when conversation opens
    useEffect(() => {
        if (conversationId) {
            markAsRead(conversationId);
        }
    }, [conversationId, markAsRead]);

    const send = useCallback(async (
        content: string,
        messageType: 'text' | 'image' | 'voice' = 'text',
        mediaUrl?: string
    ) => {
        if (!conversationId) return { success: false, error: 'No conversation' };
        return sendMessage(conversationId, content, messageType, mediaUrl);
    }, [conversationId, sendMessage]);

    return {
        messages,
        isLoading,
        sendMessage: send,
        markAsRead: () => conversationId && markAsRead(conversationId),
    };
}
