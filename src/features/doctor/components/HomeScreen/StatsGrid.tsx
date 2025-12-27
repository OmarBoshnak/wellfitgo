import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

// Types
interface StatCardProps {
    icon: React.ReactNode;
    iconBgColor: string;
    value: string;
    label: string;
    trend?: string;
    trendUp?: boolean;
    subtext?: string;
    onPress?: () => void;
}

export interface StatsGridProps {
    stats: StatCardProps[];
}

// StatCard Component
function StatCard({
    icon,
    iconBgColor,
    value,
    label,
    trend,
    trendUp,
    subtext,
    onPress,
}: StatCardProps) {
    return (
        <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <View style={[styles.statIconContainer, { backgroundColor: iconBgColor }]}>
                    {icon}
                </View>
            </View>
            <Text style={[styles.statValue, { textAlign: isRTL ? 'left' : 'right' }]}>{value}</Text>
            <Text style={[styles.statLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{label}</Text>
            {trend && (
                <View style={[styles.statTrendContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {trendUp ? (
                        <TrendingUp size={horizontalScale(12)} color={colors.success} />
                    ) : (
                        <TrendingDown size={horizontalScale(12)} color={colors.textSecondary} />
                    )}
                    <Text
                        style={[
                            styles.statTrendText,
                            { color: trendUp ? colors.success : colors.textSecondary },
                        ]}
                    >
                        {trend}
                    </Text>
                </View>
            )}
            {subtext && <Text style={[styles.statSubtext, { textAlign: isRTL ? 'left' : 'right' }]}>{subtext}</Text>}
        </TouchableOpacity>
    );
}

// StatsGrid Component
export function StatsGrid({ stats }: StatsGridProps) {
    return (
        <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    statsGrid: {
        flexWrap: 'wrap',
        gap: horizontalScale(12),
        marginBottom: verticalScale(16),
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    statIconContainer: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(12),
    },
    statValue: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    statLabel: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginBottom: verticalScale(8),
    },
    statTrendContainer: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    statTrendText: {
        fontSize: ScaleFontSize(12),
    },
    statSubtext: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
});
