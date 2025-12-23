// Messaging feature - shared between client and doctor apps
export { default as ChatScreen } from './components/ChatScreen';
export { default as ChatHeader } from './components/ChatHeader';
export { default as ChatInput } from './components/ChatInput';
export { default as MessageBubble } from './components/MessageBubble';
export { default as MessageList } from './components/MessageList';
export { default as VoiceMessageBubble } from './components/VoiceMessageBubble';
export { default as AttachmentSheet } from './components/AttachmentSheet';
export { default as MealPlanSelectorSheet } from './components/MealPlanSelectorSheet';
export { default as MessageItem, type Message } from './components/MessageItem';
export { default as FilterChips, type FilterType } from './components/FilterChips';
export { default as EmptyState } from './components/EmptyState';

// Hooks
export * from './hooks/useMessaging';

// Types
export type { ChatMessage, ChatConversation } from './components/types';
export type { AttachmentResult } from './components/AttachmentSheet';
export type { MealPlan } from './components/MealPlanSelectorSheet';

