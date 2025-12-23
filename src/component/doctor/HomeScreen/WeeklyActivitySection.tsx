import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// Types
export interface WeeklyStats {
    messages: number;
    plans: number;
    checkins: number;
}

export interface WeeklyActivitySectionProps {
    chartData: number[];
    stats: WeeklyStats;
    onViewAnalytics: () => void;
}

// Directional Arrow Component
function DirectionalArrow({ size = 16, color = colors.success }: { size?: number; color?: string }) {
    const scaledSize = horizontalScale(size);
    return isRTL ? <ArrowLeft size={scaledSize} color={color} /> : <ArrowRight size={scaledSize} color={color} />;
}

export function WeeklyActivitySection({
    chartData,
    stats,
    onViewAnalytics
}: WeeklyActivitySectionProps) {
    return (
        <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'right' : 'left' }]}>{t.thisWeeksActivity}</Text>
            <View style={[styles.chartContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {chartData.map((height, i) => (
                    <View key={i} style={styles.chartBarWrapper}>
                        <View style={[styles.chartBar, { height: `${height}%` }]} />
                        <Text style={styles.chartLabel}>{t.dayLabels[i]}</Text>
                    </View>
                ))}
            </View>
            <View style={[styles.weeklyStatsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
            <TouchableOpacity
                style={[styles.viewAnalyticsLink, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                onPress={onViewAnalytics}
            >
                <Text style={styles.viewAnalyticsText}>{t.viewFullAnalytics}</Text>
                <DirectionalArrow />
            </TouchableOpacity>
        </View>
    );
}

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
        marginTop: verticalScale(16),
        gap: horizontalScale(4),
    },
    viewAnalyticsText: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        fontWeight: '500',
    },
});
