import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { Scale, MessageSquare, Utensils, FileText, UserPlus } from 'lucide-react-native';
import { api } from '@/convex/_generated/api';
import { isRTL, doctorTranslations as t } from '@/src/core/i18n';
import { colors } from '@/src/core/theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Activity type from Convex
type ActivityType = 'weight_log' | 'message' | 'meal_completed' | 'plan_published' | 'new_client';

interface ActivityItem {
    id: string;
    type: ActivityType;
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    time: string;
    date: string;
    title: string;
    description: string;
    actor: 'coach' | 'client' | 'system';
    timestamp: number;
}

// Activity icon based on type
function ActivityIcon({ type }: { type: ActivityType }) {
    const iconSize = horizontalScale(18);
    switch (type) {
        case 'weight_log':
            return <Scale size={iconSize} color="#3B82F6" />;
        case 'message':
            return <MessageSquare size={iconSize} color="#10B981" />;
        case 'meal_completed':
            return <Utensils size={iconSize} color="#F59E0B" />;
        case 'plan_published':
            return <FileText size={iconSize} color="#8B5CF6" />;
        case 'new_client':
            return <UserPlus size={iconSize} color="#EC4899" />;
        default:
            return <View style={styles.defaultIcon} />;
    }
}

// Get activity color
function getActivityColor(type: ActivityType): string {
    switch (type) {
        case 'weight_log':
            return '#3B82F6';
        case 'message':
            return '#10B981';
        case 'meal_completed':
            return '#F59E0B';
        case 'plan_published':
            return '#8B5CF6';
        case 'new_client':
            return '#EC4899';
        default:
            return colors.textSecondary;
    }
}

// Timeline item component
function TimelineItem({
    activity,
    isFirst,
    isLast,
    onPress
}: {
    activity: ActivityItem;
    isFirst: boolean;
    isLast: boolean;
    onPress: () => void;
}) {
    const actorLabel = activity.actor === 'coach'
        ? (isRTL ? 'المدرب' : 'Coach')
        : activity.actor === 'client'
            ? (isRTL ? 'العميل' : 'Client')
            : (isRTL ? 'النظام' : 'System');

    return (
        <TouchableOpacity
            style={[styles.timelineItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Timeline Line & Dot */}
            <View style={styles.timelineLineContainer}>
                <View style={[styles.timelineLineTop, isFirst && styles.timelineLineTopFirst]} />
                <View style={[styles.timelineDot, { backgroundColor: getActivityColor(activity.type) }]} />
                <View style={[styles.timelineLineBottom, isLast && styles.timelineLineBottomLast]} />
            </View>

            {/* Content */}
            <View style={[styles.contentCard, isRTL && styles.contentCardRTL]}>
                {/* Header: Icon + Title + Time */}
                <View style={[styles.contentHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.iconContainer, isRTL ? { marginLeft: horizontalScale(8) } : { marginRight: horizontalScale(8) }]}>
                        <ActivityIcon type={activity.type} />
                    </View>
                    <Text style={[styles.contentTitle, { textAlign: isRTL ? 'left' : 'right', flex: 1 }]}>
                        {activity.title}
                    </Text>
                    <Text style={styles.contentTime}>{activity.time}</Text>
                </View>

                {/* Description */}
                {activity.description !== '' && (
                    <Text style={[styles.contentDescription, { textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={2}>
                        {activity.description}
                    </Text>
                )}

                {/* Footer: Client + Date */}
                <View style={[styles.contentFooter, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {activity.clientAvatar ? (
                        <Image source={{ uri: activity.clientAvatar }} style={styles.clientAvatar} />
                    ) : (
                        <View style={styles.clientAvatarPlaceholder}>
                            <Text style={styles.clientAvatarText}>
                                {activity.clientName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.clientName, isRTL ? { marginRight: horizontalScale(6) } : { marginLeft: horizontalScale(6) }]}>
                        {activity.clientName}
                    </Text>
                    <View style={styles.footerDot} />
                    <Text style={styles.contentDate}>{activity.date}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function CoachActivityHistoryScreen() {
    const router = useRouter();

    // Fetch all activities from Convex (extended query with no limit)
    const activities = useQuery(api.recentActivity.getAllRecentActivity);

    const isLoading = activities === undefined;
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        router.back();
    };

    const handleActivityPress = (activity: ActivityItem) => {
        // Navigate to client profile
        router.push({
            pathname: '/(app)/doctor/client-profile',
            params: { id: activity.clientId },
        });
    };

    // Render timeline item
    const renderItem = ({ item, index }: { item: ActivityItem; index: number }) => (
        <TimelineItem
            activity={item}
            isFirst={index === 0}
            isLast={index === (activities?.length ?? 0) - 1}
            onPress={() => handleActivityPress(item)}
        />
    );

    const keyExtractor = (item: ActivityItem) => item.id;

    const screenTitle = isRTL ? 'سجل النشاط' : 'Activity History';
    const loadingText = isRTL ? 'جاري التحميل...' : 'Loading...';
    const emptyText = isRTL ? 'لا يوجد نشاط بعد' : 'No activities yet';

    // Empty state
    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
    );

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{screenTitle}</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{loadingText}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sticky Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{screenTitle}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {/* Timeline FlatList */}
            <FlatList
                data={activities as ActivityItem[]}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmpty}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgSecondary,
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: horizontalScale(40),
    },
    listContent: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(32),
    },
    timelineItem: {
        marginBottom: 0,
    },
    timelineLineContainer: {
        width: horizontalScale(24),
        alignItems: 'center',
    },
    timelineLineTop: {
        width: 2,
        height: verticalScale(6),
        backgroundColor: colors.border,
    },
    timelineLineTopFirst: {
        backgroundColor: 'transparent',
    },
    timelineDot: {
        width: horizontalScale(12),
        height: horizontalScale(12),
        borderRadius: horizontalScale(6),
        borderWidth: 3,
        borderColor: colors.bgPrimary,
        zIndex: 1,
    },
    timelineLineBottom: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        minHeight: verticalScale(70),
    },
    timelineLineBottomLast: {
        backgroundColor: 'transparent',
    },
    contentCard: {
        flex: 1,
        paddingBottom: verticalScale(16),
    },
    contentCardRTL: {
        marginLeft: 0,
        marginRight: horizontalScale(12),
    },
    contentHeader: {
        alignItems: 'center',
    },
    iconContainer: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    contentTime: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    contentDescription: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
        lineHeight: ScaleFontSize(18),
    },
    contentFooter: {
        alignItems: 'center',
        marginTop: verticalScale(8),
    },
    clientAvatar: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        marginHorizontal: horizontalScale(4)
    },
    clientAvatarPlaceholder: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clientAvatarText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '600',
        color: colors.bgPrimary,
    },
    clientName: {
        fontSize: ScaleFontSize(12),
        color: colors.textPrimary,
        fontWeight: '500',
        marginHorizontal: horizontalScale(8)

    },
    footerDot: {
        width: horizontalScale(4),
        height: horizontalScale(4),
        borderRadius: horizontalScale(2),
        backgroundColor: colors.border,
        marginHorizontal: horizontalScale(6),
    },
    contentDate: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyIcon: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: verticalScale(12),
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    defaultIcon: {
        width: horizontalScale(18),
        height: horizontalScale(18),
        borderRadius: horizontalScale(9),
        backgroundColor: colors.textSecondary,
    },
});
