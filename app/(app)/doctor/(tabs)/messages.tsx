import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/core/theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
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
    search: 'بحث...',
    newMessage: 'رسالة جديدة',
    loading: 'جاري التحميل...',
    noResults: 'لا توجد نتائج',
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

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
            isOnline: conv.client?.isOnline ?? false,
            category: 'client' as const,
            timestamp: conv.lastMessageAt ? formatTimestamp(conv.lastMessageAt) : '',
            isPinned: conv.isPinned,
            priority: conv.priority,
            conversationId: conv._id,
            clientId: conv.clientId, // Add clientId for profile navigation
        }));
    }, [conversations]);

    // Filter messages based on active filter and search query
    const filteredMessages = useMemo(() => {
        let filtered = messages;

        // Apply category filter
        if (activeFilter === 'clients') {
            filtered = filtered.filter(m => m.category === 'client');
        } else if (activeFilter === 'team') {
            filtered = filtered.filter(m => m.category === 'team');
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.lastMessage.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [messages, activeFilter, searchQuery]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleMessagePress = useCallback((message: Message) => {
        console.log('Open chat:', message.id, message.name);
        setSelectedConversation({
            id: message.id,
            conversationId: message.conversationId,
            clientId: message.clientId, // Pass clientId for profile navigation
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
                <SafeAreaView edges={['left', 'right']} style={styles.container}>
                    <View style={[styles.header, { paddingTop: insets.top }]}>
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
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                {/* Header - RTL Layout */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={styles.headerTop}>
                        {/* Search toggle on Left (RTL) */}
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => {
                                setIsSearchActive(!isSearchActive);
                                if (isSearchActive) setSearchQuery('');
                            }}
                        >
                            <MaterialIcons
                                name={isSearchActive ? "close" : "search"}
                                size={24}
                                color={isSearchActive ? colors.primaryDark : colors.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* Title or Search Input */}
                        {isSearchActive ? (
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t.search}
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                                returnKeyType="search"
                            />
                        ) : (
                            <Text style={styles.title}>{t.title}</Text>
                        )}
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
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
        textAlign: 'right',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        marginLeft: horizontalScale(12),
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
