// Message types for chat
export interface ChatMessage {
    id: string;
    type: 'text' | 'audio' | 'system' | 'image' | 'meal_plan';
    sender: 'me' | 'client';
    content: string;
    timestamp: string;
    status: 'sending' | 'sent' | 'read';
    audioUri?: string;
    audioDuration?: number; // milliseconds
}

export interface ChatConversation {
    id: string;
    conversationId?: string; // Convex conversation ID
    name: string;
    avatar: string;
    isOnline: boolean;
    unreadCount?: number;
    lastMessage?: string;
    lastMessageAt?: number;
    isPinned?: boolean;
    priority?: 'normal' | 'high' | 'urgent';
}

