import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

// Arabic translations for swipe actions
const t = {
    archive: 'أرشفة',
    delete: 'حذف',
};

export interface Message {
    id: string;
    name: string;
    avatar: string | null;
    initials?: string;
    lastMessage: string;
    unreadCount: number;
    isOnline: boolean;
    category: 'client' | 'team';
    timestamp: string;
    conversationId?: string; // Convex conversation ID
    isPinned?: boolean;
    priority?: 'normal' | 'high' | 'urgent';
}

interface Props {
    message: Message;
    onPress: () => void;
    onArchive: () => void;
    onDelete: () => void;
}

export default function MessageItem({ message, onPress, onArchive, onDelete }: Props) {
    const isUnread = message.unreadCount > 0;

    // RTL: Swipe actions on left side (swipe right to reveal)
    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const translateArchive = dragX.interpolate({
            inputRange: [0, 140],
            outputRange: [-70, 0],
            extrapolate: 'clamp',
        });
        const translateDelete = dragX.interpolate({
            inputRange: [0, 140],
            outputRange: [-140, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.leftActionsContainer}>
                <Animated.View style={[styles.actionButton, styles.deleteButton, { transform: [{ translateX: translateDelete }] }]}>
                    <TouchableOpacity style={styles.actionContent} onPress={onDelete}>
                        <MaterialIcons name="delete" size={24} color="#FFFFFF" />
                        <Text style={styles.actionText}>{t.delete}</Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={[styles.actionButton, styles.archiveButton, { transform: [{ translateX: translateArchive }] }]}>
                    <TouchableOpacity style={styles.actionContent} onPress={onArchive}>
                        <MaterialIcons name="archive" size={24} color="#FFFFFF" />
                        <Text style={styles.actionText}>{t.archive}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    };

    return (
        <Swipeable
            renderLeftActions={renderLeftActions}
            overshootLeft={false}
            friction={2}
        >
            <TouchableOpacity
                style={styles.container}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {/* Unread Indicator Strip - Right side for RTL */}
                {isUnread && <View style={styles.unreadStrip} />}

                {/* Content - RTL Layout: Avatar on right, text on left */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                        <Text
                            style={[styles.name, isUnread && styles.nameUnread]}
                            numberOfLines={1}
                        >
                            {message.name}
                        </Text>
                    </View>
                    <View style={styles.messageRow}>
                        {isUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>{message.unreadCount}</Text>
                            </View>
                        )}
                        <Text style={styles.lastMessage} numberOfLines={2}>
                            {message.lastMessage}
                        </Text>
                    </View>
                </View>

                {/* Avatar - Right side for RTL */}
                <View style={styles.avatarContainer}>
                    {message.avatar ? (
                        <Image source={{ uri: message.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.initialsContainer}>
                            <Text style={styles.initialsText}>{message.initials}</Text>
                        </View>
                    )}
                    {message.isOnline && <View style={styles.onlineDot} />}
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse', // RTL: Avatar on right
        alignItems: 'center',
        gap: horizontalScale(12),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        minHeight: verticalScale(76),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    unreadStrip: {
        position: 'absolute',
        right: 0, // RTL: Indicator on right
        top: 0,
        bottom: 0,
        width: horizontalScale(4),
        backgroundColor: colors.primaryDark,
        borderTopLeftRadius: horizontalScale(2),
        borderBottomLeftRadius: horizontalScale(2),
    },
    // Avatar
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: horizontalScale(52),
        height: horizontalScale(52),
        borderRadius: horizontalScale(26),
    },
    initialsContainer: {
        width: horizontalScale(52),
        height: horizontalScale(52),
        borderRadius: horizontalScale(26),
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: 'rgb(99, 102, 241)',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        left: 0, // RTL: Dot on left of avatar
        width: horizontalScale(14),
        height: horizontalScale(14),
        borderRadius: horizontalScale(7),
        backgroundColor: '#27AE61',
        borderWidth: 2,
        borderColor: colors.bgPrimary,
    },
    // Content
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: verticalScale(2),
    },
    name: {
        flex: 1,
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: colors.textPrimary,
        textAlign: 'right',
        marginLeft: horizontalScale(8),
    },
    nameUnread: {
        fontWeight: '600',
    },
    timestamp: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#AAB8C5',
    },
    messageRow: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: horizontalScale(8),
    },
    lastMessage: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        fontWeight: '400',
        color: colors.textSecondary,
        lineHeight: ScaleFontSize(20),
        textAlign: 'right',
    },
    unreadBadge: {
        minWidth: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(6),
        marginTop: verticalScale(2),
    },
    unreadCount: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Swipe Actions - Left side for RTL
    leftActionsContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    actionButton: {
        width: horizontalScale(70),
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(4),
        flex: 1,
        width: '100%',
    },
    archiveButton: {
        backgroundColor: '#9CA3AF',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    actionText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '500',
        color: '#FFFFFF',
    },
});
