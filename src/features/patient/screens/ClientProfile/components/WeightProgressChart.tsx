import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, colors } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { styles as profileStyles } from '../styles';
import { t, chartPeriodLabels } from '../translations';
import { ChartPeriod, CHART_PERIODS } from '../types';

// ============ TYPES ============

export interface ChartPoint {
    date: string;
    weight: number;
    timestamp: number;
    feeling?: string;
}

export interface ChartData {
    points: ChartPoint[];
    targetWeight: number;
    minWeight: number;
    maxWeight: number;
    currentWeight: number;
    startWeight: number;
}

interface WeightProgressChartProps {
    period: ChartPeriod;
    onPeriodChange: (period: ChartPeriod) => void;
    chartData?: ChartData | null;
    isLoading?: boolean;
}

// ============ FEELING EMOJIS ============

const feelingEmojis: Record<string, string> = {
    excellent: "🤩",
    great: "😃",
    good: "😊",
    ok: "😐",
    challenging: "😓",
    very_hard: "😢",
};

// ============ HELPER FUNCTIONS ============

function formatDateLabel(dateString: string): { en: string; ar: string } {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const day = date.getDate();
    const monthIndex = date.getMonth();

    return {
        en: `${months[monthIndex]} ${day}`,
        ar: `${day} ${monthsAr[monthIndex]}`,
    };
}

// ============ COMPONENT ============

export function WeightProgressChart({
    period,
    onPeriodChange,
    chartData,
    isLoading = false,
}: WeightProgressChartProps) {
    // Calculate chart dimensions
    const points = chartData?.points ?? [];
    const hasData = points.length > 0;

    const maxWeight = hasData ? Math.max(...points.map(p => p.weight)) : 100;
    const minWeight = hasData ? Math.min(...points.map(p => p.weight)) : 0;
    const range = maxWeight - minWeight || 1;
    const chartHeight = verticalScale(180);

    const renderBar = ({ item, index }: { item: ChartPoint; index: number }) => {
        const heightPercent = ((item.weight - minWeight) / range) * 100;
        const barHeight = Math.max((heightPercent / 100) * chartHeight, verticalScale(20));
        const dateLabel = formatDateLabel(item.date);
        const emoji = item.feeling ? feelingEmojis[item.feeling] ?? "😊" : "";

        return (
            <View style={styles.barContainer}>
                <Text style={styles.feeling}>{emoji}</Text>
                <Text style={styles.weightLabel}>{item.weight}kg</Text>
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.bar, { height: barHeight }]}
                />
                <Text style={styles.dateLabel}>
                    {isRTL ? dateLabel.ar : dateLabel.en}
                </Text>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {isRTL ? "لا توجد بيانات وزن" : "No weight data"}
            </Text>
            <Text style={styles.emptySubtext}>
                {isRTL ? "سيتم عرض الوزن هنا بعد التسجيل" : "Weight logs will appear here"}
            </Text>
        </View>
    );

    return (
        <View style={profileStyles.chartCard}>
            {/* Header */}
            <View style={[profileStyles.chartHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={profileStyles.chartTitle}>{t.weightProgress}</Text>
            </View>

            {/* Period Chips */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    profileStyles.periodChipsContainer,
                    isRTL && { flexGrow: 1, justifyContent: 'flex-end' }
                ]}
                data={CHART_PERIODS}
                keyExtractor={(item) => item}
                inverted={isRTL}
                renderItem={({ item: chipPeriod }) => (
                    <TouchableOpacity
                        onPress={() => onPeriodChange(chipPeriod)}
                        activeOpacity={0.8}
                    >
                        {period === chipPeriod ? (
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={profileStyles.periodChipActive}
                            >
                                <Text style={profileStyles.periodChipTextActive}>{chartPeriodLabels[chipPeriod]}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={profileStyles.periodChip}>
                                <Text style={profileStyles.periodChipText}>{chartPeriodLabels[chipPeriod]}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />

            {/* Bar Chart or Loading/Empty */}
            <View style={styles.chartContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primaryDark} />
                    </View>
                ) : hasData ? (
                    <FlatList
                        horizontal
                        data={points}
                        keyExtractor={(item, index) => `${item.date}-${index}`}
                        renderItem={renderBar}
                        contentContainerStyle={[
                            styles.barsContainer,
                            isRTL && { flexGrow: 1, justifyContent: 'flex-end' }
                        ]}
                        showsHorizontalScrollIndicator={false}
                        inverted={isRTL}
                    />
                ) : (
                    renderEmptyState()
                )}
            </View>

            {/* Footer - Goal & Progress */}
            {hasData && chartData && (
                <View style={styles.footer}>
                    <View style={[styles.footerRow, isRTL && styles.footerRowRTL]}>
                        <View style={[styles.footerItem, isRTL && styles.footerItemRTL]}>
                            <Text style={styles.footerValue}>{chartData.targetWeight} kg </Text>
                            <Text style={styles.footerLabel}>
                                {t.goal}:
                            </Text>
                        </View>
                        <View style={[styles.footerItem, isRTL && styles.footerItemRTL]}>
                            <Text style={[styles.footerValue, { color: colors.success }]}>
                                -{(chartData.startWeight - chartData.currentWeight).toFixed(1)} kg
                            </Text>
                            <Text style={styles.footerLabel}>
                                {isRTL ? "الفقدان" : "Lost"}:
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    chartContainer: {
        height: verticalScale(240),
        marginTop: verticalScale(16),
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: horizontalScale(8),
        gap: horizontalScale(16),
        flex: 1,
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: horizontalScale(50),
    },
    feeling: {
        fontSize: ScaleFontSize(18),
        marginBottom: verticalScale(4),
    },
    weightLabel: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.primaryDark,
        marginBottom: verticalScale(4),
    },
    bar: {
        width: horizontalScale(40),
        borderTopLeftRadius: horizontalScale(6),
        borderTopRightRadius: horizontalScale(6),
        minHeight: verticalScale(20),
    },
    dateLabel: {
        fontSize: ScaleFontSize(11),
        color: '#64748B',
        marginTop: verticalScale(8),
    },
    footer: {
        marginTop: verticalScale(16),
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerRowRTL: {
        flexDirection: 'row-reverse',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerItemRTL: {
        flexDirection: 'row-reverse',
    },
    footerLabel: {
        fontSize: ScaleFontSize(14),
        color: '#64748B',
    },
    footerValue: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#1E293B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textSecondary,
    },
    emptySubtext: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
});
