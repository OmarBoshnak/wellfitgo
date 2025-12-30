import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/src/core/theme';
import { isRTL, doctorTranslations as t } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

// ============ TYPES ============
export interface WeeklyStats {
    messages: number;
    plans: number;
    checkins: number;
}

export interface WeeklyActivitySectionProps {
    chartData: number[];
    stats: WeeklyStats;
    isLoading?: boolean;
    isEmpty?: boolean;
    onViewAnalytics: () => void;
}

// ============ HELPER COMPONENTS ============

// Directional Arrow Component
function DirectionalArrow({ size = 16, color = colors.success }: { size?: number; color?: string }) {
    const scaledSize = horizontalScale(size);
    return isRTL ? <ArrowLeft size={scaledSize} color={color} /> : <ArrowRight size={scaledSize} color={color} />;
}

// Skeleton loader for chart
function ChartSkeleton() {
    return (
        <View style={[styles.chartContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            {[40, 60, 35, 80, 50, 70, 25].map((height, i) => (
                <View key={i} style={styles.chartBarWrapper}>
                    <View style={[styles.chartBarSkeleton, { height: `${height}%` }]} />
                    <View style={styles.chartLabelSkeleton} />
                </View>
            ))}
        </View>
    );
}

// Skeleton loader for stats
function StatsSkeleton() {
    return (
        <View style={[styles.weeklyStatsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.weeklyStat}>
                    <View style={styles.statLabelSkeleton} />
                    <View style={styles.statValueSkeleton} />
                </View>
            ))}
        </View>
    );
}

// Empty state component
function EmptyState() {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📊</Text>
            <Text style={styles.emptyStateText}>
                {isRTL ? 'لا يوجد نشاط هذا الأسبوع بعد' : 'No activity this week yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
                {isRTL ? 'ابدأ بإرسال الرسائل وخطط الوجبات!' : 'Start sending messages and meal plans!'}
            </Text>
        </View>
    );
}

// ============ MAIN COMPONENT ============
export function WeeklyActivitySection({
    chartData,
    stats,
    isLoading = false,
    isEmpty = false,
    onViewAnalytics
}: WeeklyActivitySectionProps) {
    // Loading state
    if (isLoading) {
        return (
            <View style={styles.sectionCard}>
                <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t.thisWeeksActivity}
                </Text>
                <ChartSkeleton />
                <StatsSkeleton />
            </View>
        );
    }

    // Empty state
    if (isEmpty) {
        return (
            <View style={styles.sectionCard}>
                <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t.thisWeeksActivity}
                </Text>
                <EmptyState />
            </View>
        );
    }

    return (
        <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'left' : 'right' }]}>
                {t.thisWeeksActivity}
            </Text>

            {/* Bar Chart */}
            <View style={[styles.chartContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {chartData.map((height, i) => (
                    <View key={i} style={styles.chartBarWrapper}>
                        <View style={[styles.chartBar, { height: `${Math.max(height, 5)}%` }]} />
                        <Text style={styles.chartLabel}>{t.dayLabels[i]}</Text>
                    </View>
                ))}
            </View>

            {/* Stats Row */}
            <View style={[styles.weeklyStatsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.weeklyStat}>
                    <Text style={styles.weeklyStatLabel}>{t.messages}</Text>
                    <Text style={styles.weeklyStatValue}>{stats.messages}</Text>
                </View>
                <View style={styles.weeklyStat}>
                    <Text style={styles.weeklyStatLabel}>{t.plans}</Text>
                    <Text style={styles.weeklyStatValue}>{stats.plans}</Text>
                </View>
                <View style={styles.weeklyStat}>
                    <Text style={styles.weeklyStatLabel}>{t.checkins}</Text>
                    <Text style={styles.weeklyStatValue}>{stats.checkins}</Text>
                </View>
            </View>

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
    chartContainer: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: verticalScale(10),
        height: verticalScale(100),
        marginBottom: verticalScale(16),
    },
    chartBarWrapper: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBar: {
        width: '60%',
        backgroundColor: colors.success,
        borderRadius: horizontalScale(4),
    },
    chartLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    weeklyStatsRow: {
        justifyContent: 'space-around',
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    weeklyStat: {
        alignItems: 'center',
    },
    weeklyStatLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginBottom: verticalScale(4),
    },
    weeklyStatValue: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
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
    // Skeleton styles
    chartBarSkeleton: {
        width: '60%',
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    chartLabelSkeleton: {
        width: horizontalScale(20),
        height: verticalScale(10),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(2),
        marginTop: verticalScale(4),
    },
    statLabelSkeleton: {
        width: horizontalScale(50),
        height: verticalScale(12),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(2),
        marginBottom: verticalScale(4),
    },
    statValueSkeleton: {
        width: horizontalScale(30),
        height: verticalScale(20),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(2),
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
    },
});
