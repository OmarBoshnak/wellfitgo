import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ArrowRight, ArrowLeft, Scale, MessageSquare, Utensils, FileText, UserPlus } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// ============ TYPES ============
type ActivityType =
    | "weight_log"
    | "message"
    | "meal_completed"
    | "plan_published"
    | "new_client";

export interface Activity {
    id: string;
    text: string;
    time: string;
    type?: ActivityType;
    clientId?: string;
    clientName?: string;
    clientAvatar?: string;
}

export interface RecentActivitySectionProps {
    activities: Activity[];
    isLoading?: boolean;
    isEmpty?: boolean;
    onSeeAll?: () => void;
    onActivityPress?: (activity: Activity) => void;
}

// ============ HELPER COMPONENTS ============

// Directional Arrow Component
function DirectionalArrow({ size = 16, color = colors.success }: { size?: number; color?: string }) {
    const scaledSize = horizontalScale(size);
    return isRTL ? <ArrowLeft size={scaledSize} color={color} /> : <ArrowRight size={scaledSize} color={color} />;
}

// Activity icon based on type
function ActivityIcon({ type }: { type?: ActivityType }) {
    const iconSize = horizontalScale(16);

    switch (type) {
        case "weight_log":
            return <Scale size={iconSize} color="#3B82F6" />;
        case "message":
            return <MessageSquare size={iconSize} color="#10B981" />;
        case "meal_completed":
            return <Utensils size={iconSize} color="#F59E0B" />;
        case "plan_published":
            return <FileText size={iconSize} color="#8B5CF6" />;
        case "new_client":
            return <UserPlus size={iconSize} color="#EC4899" />;
        default:
            return <View style={styles.defaultIcon} />;
    }
}

// Skeleton loader
function ActivitySkeleton() {
    return (
        <View>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.activityItem, styles.skeletonItem]}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonTextContainer}>
                        <View style={styles.skeletonText} />
                        <View style={styles.skeletonTime} />
                    </View>
                </View>
            ))}
        </View>
    );
}

// Empty state
function EmptyState() {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📭</Text>
            <Text style={styles.emptyStateText}>
                {isRTL ? "لا يوجد نشاط حديث" : "No recent activity"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
                {isRTL
                    ? "سيظهر هنا نشاط عملائك"
                    : "Your clients' activity will appear here"}
            </Text>
        </View>
    );
}

// ============ MAIN COMPONENT ============
export function RecentActivitySection({
    activities,
    isLoading = false,
    isEmpty = false,
    onSeeAll,
    onActivityPress,
}: RecentActivitySectionProps) {
    // Loading state
    if (isLoading) {
        return (
            <View style={styles.sectionCard}>
                <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t.recentActivity}
                </Text>
                <ActivitySkeleton />
            </View>
        );
    }

    // Empty state
    if (isEmpty || activities.length === 0) {
        return (
            <View style={styles.sectionCard}>
                <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'left' : 'right' }]}>
                    {t.recentActivity}
                </Text>
                <EmptyState />
            </View>
        );
    }

    return (
        <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t.recentActivity}
            </Text>

            {activities.map((activity) => (
                <TouchableOpacity
                    key={activity.id}
                    style={[styles.activityItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                    onPress={() => onActivityPress?.(activity)}
                    activeOpacity={onActivityPress ? 0.7 : 1}
                >
                    {/* Activity Icon */}
                    <View style={[
                        styles.activityIconContainer,
                        isRTL ? { marginLeft: horizontalScale(12) } : { marginRight: horizontalScale(12) }
                    ]}>
                        <ActivityIcon type={activity.type} />
                    </View>

                    {/* Activity Content */}
                    <View style={styles.activityContent}>
                        <Text
                            style={[styles.activityText, { textAlign: isRTL ? 'right' : 'left' }]}
                            numberOfLines={2}
                        >
                            {activity.text}
                        </Text>
                        <Text style={[styles.activityTime, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {activity.time}
                        </Text>
                    </View>

                    {/* Client Avatar (optional) */}
                    {activity.clientAvatar && (
                        <Image
                            source={{ uri: activity.clientAvatar }}
                            style={styles.clientAvatar}
                        />
                    )}
                </TouchableOpacity>
            ))}

            {/* See All Link */}
            {onSeeAll && (
                <TouchableOpacity
                    style={[styles.viewAnalyticsLink, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                    onPress={onSeeAll}
                >
                    <Text style={styles.viewAnalyticsText}>{t.seeAllActivity}</Text>
                    <DirectionalArrow />
                </TouchableOpacity>
            )}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    sectionTitleSmall: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
    activityItem: {
        marginBottom: verticalScale(12),
        alignItems: 'center',
        paddingVertical: verticalScale(8),
        paddingHorizontal: horizontalScale(4),
        borderRadius: horizontalScale(8),
    },
    activityIconContainer: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
        marginBottom: verticalScale(2),
    },
    activityTime: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    clientAvatar: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(14),
    },
    viewAnalyticsLink: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: verticalScale(16),
        gap: horizontalScale(4),
    },
    viewAnalyticsText: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        fontWeight: '500',
    },
    defaultIcon: {
        width: horizontalScale(16),
        height: horizontalScale(16),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.textSecondary,
    },
    // Skeleton styles
    skeletonItem: {
        flexDirection: isRTL ? 'row' : 'row-reverse',
    },
    skeletonIcon: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(8),
        backgroundColor: '#E5E7EB',
        marginHorizontal: horizontalScale(12),
    },
    skeletonTextContainer: {
        flex: 1,
    },
    skeletonText: {
        width: '80%',
        height: verticalScale(14),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        marginBottom: verticalScale(6),
    },
    skeletonTime: {
        width: '40%',
        height: verticalScale(10),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    // Empty state styles
    emptyState: {
        alignItems: 'center',
        paddingVertical: verticalScale(32),
    },
    emptyStateEmoji: {
        fontSize: ScaleFontSize(40),
        marginBottom: verticalScale(12),
    },
    emptyStateText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    emptyStateSubtext: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
