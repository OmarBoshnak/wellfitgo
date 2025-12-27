/**
 * MacroDonutChart Component
 * SVG donut chart showing protein, carbs, fat split
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';
import { mealPlanColors, borderRadius } from '../constants';
import { t } from '../translations';
import type { MacroSplit } from '../types';

interface MacroDonutChartProps {
    macros: MacroSplit;
    foodOptionsCount?: number;
}

export function MacroDonutChart({ macros, foodOptionsCount = 48 }: MacroDonutChartProps) {
    const size = horizontalScale(128);
    const strokeWidth = horizontalScale(20);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate stroke dash arrays for each segment
    const proteinDash = (macros.protein / 100) * circumference;
    const carbsDash = (macros.carbs / 100) * circumference;
    const fatDash = (macros.fat / 100) * circumference;

    // Calculate offsets (rotations)
    const proteinOffset = 0;
    const carbsOffset = proteinDash;
    const fatOffset = proteinDash + carbsDash;

    return (
        <View style={styles.container}>
            <View style={[styles.chartRow, isRTL && styles.chartRowRTL]}>
                {/* Donut Chart */}
                <View style={styles.chartContainer}>
                    <Svg width={size} height={size}>
                        {/* Protein */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={mealPlanColors.chartProtein}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${proteinDash} ${circumference - proteinDash}`}
                            strokeDashoffset={circumference * 0.25}
                            strokeLinecap="round"
                        />
                        {/* Carbs */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={mealPlanColors.chartCarbs}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${carbsDash} ${circumference - carbsDash}`}
                            strokeDashoffset={circumference * 0.25 - carbsOffset}
                            strokeLinecap="round"
                        />
                        {/* Fat */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={mealPlanColors.chartFat}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${fatDash} ${circumference - fatDash}`}
                            strokeDashoffset={circumference * 0.25 - fatOffset}
                            strokeLinecap="round"
                        />
                    </Svg>
                    {/* Center Text */}
                    <View style={styles.centerTextContainer}>
                        <Text style={styles.centerLabel}>{t.total}</Text>
                        <Text style={styles.centerValue}>100%</Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.legendDot, { backgroundColor: mealPlanColors.chartProtein }]} />
                        <Text style={[styles.legendLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{t.protein}</Text>
                        <Text style={styles.legendValue}>{macros.protein}%</Text>
                    </View>
                    <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.legendDot, { backgroundColor: mealPlanColors.chartCarbs }]} />
                        <Text style={[styles.legendLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{t.carbs}</Text>
                        <Text style={styles.legendValue}>{macros.carbs}%</Text>
                    </View>
                    <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.legendDot, { backgroundColor: mealPlanColors.chartFat }]} />
                        <Text style={[styles.legendLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{t.fat}</Text>
                        <Text style={styles.legendValue}>{macros.fat}%</Text>
                    </View>
                </View>
            </View>

            {/* Food Options Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerIcon}>🍽️</Text>
                <Text style={styles.footerText}>
                    {foodOptionsCount} {t.foodOptionsAvailable}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.lg,
        padding: horizontalScale(10),
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(15),
    },
    chartRowRTL: {
        flexDirection: 'row-reverse',
    },
    chartContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabel: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: mealPlanColors.textDesc,
    },
    centerValue: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: mealPlanColors.textMain,
    },
    legend: {
        flex: 1,
        gap: verticalScale(12),
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: horizontalScale(12),
        height: horizontalScale(12),
        borderRadius: horizontalScale(6),
        marginRight: horizontalScale(8),
    },
    legendLabel: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    legendValue: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: mealPlanColors.textMain,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
        borderTopWidth: 1,
        borderTopColor: `${mealPlanColors.border}50`,
        marginTop: verticalScale(20),
        paddingTop: verticalScale(16),
    },
    footerIcon: {
        fontSize: ScaleFontSize(20),
    },
    footerText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
    },
});
