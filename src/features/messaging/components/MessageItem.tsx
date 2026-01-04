import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/i18n';

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
    clientId?: string; // Client user ID for profile navigation
    isPinned?: boolean;
    priority?: 'normal' | 'high' | 'urgent';
}

interface Props {
    message: Message;
    onPress: () => void;
    onArchive: () => void;
    onDelete: () => void;
}

// Action button component using Reanimated
function ActionButton({
    dragX,
    outputRange,
    style,
    onPress,
    iconName,
    label
}: {
    dragX: SharedValue<number>;
    outputRange: number;
    style: object;
    onPress: () => void;
    iconName: 'delete' | 'archive';
    label: string;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            dragX.value,
            [0, 140],
            [outputRange, 0],
            Extrapolation.CLAMP
        );
        return { transform: [{ translateX }] };
    });

    return (
        <Animated.View style={[styles.actionButton, style, animatedStyle]}>
            <TouchableOpacity style={styles.actionContent} onPress={onPress}>
                <MaterialIcons name={iconName} size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function MessageItem({ message, onPress, onArchive, onDelete }: Props) {
    const isUnread = message.unreadCount > 0;

    // RTL: Swipe actions on left side (swipe right to reveal)
    const renderLeftActions = (
        _progress: SharedValue<number>,
        dragX: SharedValue<number>
    ) => {
        return (
            <View style={styles.leftActionsContainer}>
                <ActionButton
                    dragX={dragX}
                    outputRange={-140}
                    style={styles.deleteButton}
                    onPress={onDelete}
                    iconName="delete"
                    label={t.delete}
                />
                <ActionButton
                    dragX={dragX}
                    outputRange={-70}
                    style={styles.archiveButton}
                    onPress={onArchive}
                    iconName="archive"
                    label={t.archive}
                />
            </View>
        );
    };

    return (
        <ReanimatedSwipeable
            renderLeftActions={renderLeftActions}
            overshootLeft={false}
            friction={2}
        >
            <TouchableOpacity
                style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {/* Unread Indicator Strip - Right side for RTL */}
                {isUnread && <View style={styles.unreadStrip} />}

                {/* Content - RTL Layout: Avatar on right, text on left */}
                <View style={styles.contentContainer}>
                    <View style={[styles.headerRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text
                            style={[styles.name, isUnread && styles.nameUnread, { textAlign: isRTL ? 'left' : 'right' }]}
                            numberOfLines={1}
                        >
                            {message.name}
                        </Text>
                        <Text style={[styles.timestamp, { textAlign: isRTL ? 'left' : 'right' }]}>{message.timestamp}</Text>
                    </View>
                    <View style={[styles.messageRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {isUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>{message.unreadCount}</Text>
                            </View>
                        )}
                        <Text style={[styles.lastMessage, { textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={2}>
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
                            <Text style={styles.initialsText}>
                                {message.initials || message.name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                    {message.isOnline && <View style={styles.onlineDot} />}
                </View>
            </TouchableOpacity>
        </ReanimatedSwipeable>
    );
}

const styles = StyleSheet.create({
    container: {
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
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
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
        alignItems: 'flex-start',
        gap: horizontalScale(8),
    },
    lastMessage: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        fontWeight: '400',
        color: colors.textSecondary,
        lineHeight: ScaleFontSize(20),
        marginHorizontal: horizontalScale(8),
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
