import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import {
    MessageItem,
    FilterChips,
    EmptyState,
    ChatScreen,
    useCoachInbox,
    type Message,
    type FilterType,
    type ChatConversation,
    type InboxFilter,
} from '@/src/features/messaging';
import { Id } from '@/convex/_generated/dataModel';

// Arabic Translations
const t = {
    title: 'الرسائل',
    search: 'بحث',
    newMessage: 'رسالة جديدة',
    loading: 'جاري التحميل...',
};

// Format timestamp for Arabic
const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} د`;
    if (hours < 24) return `منذ ${hours} س`;
    if (days < 7) {
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return dayNames[new Date(timestamp).getDay()];
    }
    return new Date(timestamp).toLocaleDateString('ar-EG');
};

// Filter mapping
const filterToInbox: Record<FilterType, InboxFilter> = {
    all: 'all',
    unread: 'unread',
    clients: 'all',
    team: 'all',
};

export default function MessagesScreen() {
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);

    // Use Convex hook for real-time inbox
    const { conversations, isLoading } = useCoachInbox(filterToInbox[activeFilter]);

    // Transform Convex conversations to Message format for UI
    const messages: Message[] = useMemo(() => {
        if (!conversations || conversations.length === 0) {
            return [];
        }

        return conversations.map((conv: any) => ({
            id: conv._id,
            name: conv.client?.name || 'عميل',
            avatar: conv.client?.avatarUrl || null,
            lastMessage: conv.lastMessagePreview || '',
            unreadCount: conv.unreadByCoach || 0,
            isOnline: false,
            category: 'client' as const,
            timestamp: conv.lastMessageAt ? formatTimestamp(conv.lastMessageAt) : '',
            isPinned: conv.isPinned,
            priority: conv.priority,
            conversationId: conv._id,
        }));
    }, [conversations]);

    // Filter messages based on active filter
    const filteredMessages = useMemo(() => {
        if (activeFilter === 'clients') {
            return messages.filter(m => m.category === 'client');
        }
        if (activeFilter === 'team') {
            return messages.filter(m => m.category === 'team');
        }
        return messages;
    }, [messages, activeFilter]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleMessagePress = useCallback((message: Message) => {
        console.log('Open chat:', message.id, message.name);
        setSelectedConversation({
            id: message.id,
            conversationId: message.conversationId,
            name: message.name,
            avatar: message.avatar || '',
            isOnline: message.isOnline,
            unreadCount: message.unreadCount,
        });
        if (message.conversationId) {
            setSelectedConversationId(message.conversationId as Id<"conversations">);
        }
    }, []);

    const handleBack = useCallback(() => {
        setSelectedConversation(null);
        setSelectedConversationId(null);
    }, []);

    const handleArchive = useCallback((messageId: string) => {
        console.log('Archive message:', messageId);
    }, []);

    const handleDelete = useCallback((messageId: string) => {
        console.log('Delete message:', messageId);
    }, []);

    // Show chat screen if a conversation is selected
    if (selectedConversation) {
        return (
            <ChatScreen
                conversation={selectedConversation}
                conversationId={selectedConversationId || undefined}
                onBack={handleBack}
            />
        );
    }

    const renderItem = useCallback(({ item }: { item: Message }) => (
        <MessageItem
            message={item}
            onPress={() => handleMessagePress(item)}
            onArchive={() => handleArchive(item.id)}
            onDelete={() => handleDelete(item.id)}
        />
    ), [handleMessagePress, handleArchive, handleDelete]);

    const keyExtractor = useCallback((item: Message) => item.id, []);

    // Show loading state
    if (isLoading) {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaView edges={['top']} style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t.title}</Text>
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primaryDark} />
                        <Text style={styles.loadingText}>{t.loading}</Text>
                    </View>
                </SafeAreaView>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView edges={['top']} style={styles.container}>
                {/* Header - RTL Layout */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        {/* Actions on Left (RTL) */}
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.headerButton}>
                                <MaterialIcons name="edit" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerButton}>
                                <MaterialIcons name="search" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {/* Title on Right (RTL) */}
                        <Text style={styles.title}>{t.title}</Text>
                    </View>

                    {/* Filter Chips */}
                    <FilterChips
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />
                </View>

                {/* Message List */}
                {filteredMessages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <FlatList
                        data={filteredMessages}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.primaryDark}
                            />
                        }
                    />
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(8),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    title: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: horizontalScale(8),
    },
    headerButton: {
        padding: horizontalScale(8),
    },
    listContent: {
        paddingVertical: verticalScale(8),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(16),
    },
    loadingText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
});
