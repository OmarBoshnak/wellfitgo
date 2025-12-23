import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
import { ChatMessage, ChatConversation } from './types';
import { MealPlan } from './MealPlanSelectorSheet';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useChatScreen } from '../hooks/useMessaging';
import { Id } from '@/convex/_generated/dataModel';

// Arabic translations
const t = {
    voiceMessage: 'رسالة صوتية',
    image: 'صورة',
    document: 'مستند',
    mealPlanAttached: 'تم إرفاق الخطة الغذائية',
    loading: 'جاري التحميل...',
    noMessages: 'لا توجد رسائل بعد',
};

interface Props {
    conversation: ChatConversation;
    conversationId?: Id<"conversations">; // Convex conversation ID
    onBack: () => void;
}

export default function ChatScreen({ conversation, conversationId, onBack }: Props) {
    // Use Convex real-time messages if conversationId is provided
    const { messages: convexMessages, isLoading, sendMessage } = useChatScreen(conversationId);

    // Transform Convex messages to our ChatMessage format
    const messages: ChatMessage[] = useMemo(() => {
        if (!convexMessages || convexMessages.length === 0) {
            return [];
        }

        return convexMessages.map((msg: any) => ({
            id: msg._id,
            type: msg.messageType === 'voice' ? 'audio' : msg.messageType || 'text',
            sender: msg.senderRole === 'coach' ? 'me' : 'client',
            content: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            status: msg.isReadByClient ? 'read' : 'sent',
            audioUri: msg.mediaUrl,
            audioDuration: msg.mediaDuration,
        }));
    }, [convexMessages]);

    const handleOptions = useCallback(() => {
        console.log('Options menu pressed');
    }, []);

    const handleSendText = useCallback(async (text: string) => {
        if (conversationId) {
            await sendMessage(text, 'text');
        }
    }, [conversationId, sendMessage]);

    const handleSendAudio = useCallback(async (uri: string) => {
        if (conversationId) {
            await sendMessage(t.voiceMessage, 'voice', uri);
        }
    }, [conversationId, sendMessage]);

    const handleSendImage = useCallback(async (uri: string, name: string) => {
        if (conversationId) {
            await sendMessage(`${t.image}: ${name}`, 'image', uri);
        }
    }, [conversationId, sendMessage]);

    const handleSendDocument = useCallback(async (uri: string, name: string) => {
        if (conversationId) {
            await sendMessage(`${t.document}: ${name}`, 'text');
        }
    }, [conversationId, sendMessage]);

    const handleSendMealPlan = useCallback(async (plan: MealPlan) => {
        if (conversationId) {
            await sendMessage(`${t.mealPlanAttached}: ${plan.nameAr}`, 'text');
        }
    }, [conversationId, sendMessage]);

    // Show loading state
    if (isLoading && conversationId) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ChatHeader
                    conversation={conversation}
                    onBack={onBack}
                    onOptions={handleOptions}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <ChatHeader
                    conversation={conversation}
                    onBack={onBack}
                    onOptions={handleOptions}
                />

                {/* Message List */}
                <MessageList
                    messages={messages}
                    avatarUri={conversation.avatar}
                />

                {/* Input */}
                <ChatInput
                    onSendText={handleSendText}
                    onSendAudio={handleSendAudio}
                    onSendImage={handleSendImage}
                    onSendDocument={handleSendDocument}
                    onSendMealPlan={handleSendMealPlan}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});
