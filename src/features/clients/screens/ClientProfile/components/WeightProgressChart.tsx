import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, colors } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { styles as profileStyles, SCREEN_WIDTH } from '../styles';
import { t, chartPeriodLabels } from '../translations';
import { ChartPeriod, CHART_PERIODS } from '../types';

interface WeightEntry {
    date: string;
    dateAr?: string;
    weight: number;
    feeling: string;
}

interface WeightProgressChartProps {
    period: ChartPeriod;
    onPeriodChange: (period: ChartPeriod) => void;
    weightHistory?: WeightEntry[];
    targetWeight?: number;
    projectedDate?: string;
    projectedDateAr?: string;
}

// Default mock data
const defaultWeightHistory: WeightEntry[] = [
    { date: 'Nov 1', dateAr: 'نوف ١', weight: 75, feeling: '😐' },
    { date: 'Nov 8', dateAr: 'نوف ٨', weight: 74, feeling: '😊' },
    { date: 'Nov 15', dateAr: 'نوف ١٥', weight: 72.5, feeling: '😊' },
    { date: 'Nov 22', dateAr: 'نوف ٢٢', weight: 71, feeling: '😃' },
    { date: 'Nov 29', dateAr: 'نوف ٢٩', weight: 69.5, feeling: '😊' },
    { date: 'Dec 6', dateAr: 'ديس ٦', weight: 68, feeling: '😊' },
];

export function WeightProgressChart({
    period,
    onPeriodChange,
    weightHistory = defaultWeightHistory,
    targetWeight = 60,
    projectedDate = 'March 2025 ',
    projectedDateAr = 'مارس ٢٠٢٥ ',
}: WeightProgressChartProps) {
    // Calculate chart dimensions
    const maxWeight = Math.max(...weightHistory.map(w => w.weight));
    const minWeight = Math.min(...weightHistory.map(w => w.weight));
    const range = maxWeight - minWeight || 1;
    const chartHeight = verticalScale(180);

    // Data is displayed as-is, FlatList `inverted` prop handles RTL direction
    const displayData = weightHistory;

    const renderBar = ({ item, index }: { item: WeightEntry; index: number }) => {
        const heightPercent = ((item.weight - minWeight) / range) * 100;
        const barHeight = Math.max((heightPercent / 100) * chartHeight, verticalScale(20));

        return (
            <View style={styles.barContainer}>
                <Text style={styles.feeling}>{item.feeling}</Text>
                <Text style={styles.weightLabel}>{item.weight}kg</Text>
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.bar, { height: barHeight }]}
                />
                <Text style={styles.dateLabel}>
                    {isRTL ? item.dateAr : item.date}
                </Text>
            </View>
        );
    };

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

            {/* Bar Chart */}
            <View style={styles.chartContainer}>
                <FlatList
                    horizontal
                    data={displayData}
                    keyExtractor={(item, index) => `${item.date}-${index}`}
                    renderItem={renderBar}
                    contentContainerStyle={[
                        styles.barsContainer,
                        isRTL && { flexGrow: 1, justifyContent: 'flex-end' }
                    ]}
                    showsHorizontalScrollIndicator={false}
                    inverted={isRTL}
                />
            </View>

            {/* Footer - Goal & Projected */}
            <View style={styles.footer}>
                <View style={[styles.footerRow, isRTL && styles.footerRowRTL]}>
                    <View style={[styles.footerItem, isRTL && styles.footerItemRTL]}>
                        <Text style={styles.footerValue}>{targetWeight} kg </Text>

                        <Text style={styles.footerLabel}>
                            {t.goal}:
                        </Text>
                    </View>
                    <View style={[styles.footerItem, isRTL && styles.footerItemRTL]}>
                        <Text style={styles.footerValue}>
                            {isRTL ? projectedDateAr : projectedDate}
                        </Text>
                        <Text style={styles.footerLabel}>
                            {t.projected}:
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

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
});
