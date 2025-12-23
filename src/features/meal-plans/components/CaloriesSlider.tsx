/**
 * CaloriesSlider Component
 * Custom slider for daily calorie selection with AI hint
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, calorieConfig, borderRadius } from '../constants';
import { t } from '../translations';

interface CaloriesSliderProps {
    value: number;
    onValueChange: (value: number) => void;
}

export function CaloriesSlider({ value, onValueChange }: CaloriesSliderProps) {
    return (
        <View style={styles.container}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{t.dailyCalories}</Text>
                <Text style={styles.value}>{value} {t.calPerDay}</Text>
            </View>

            <View style={styles.sliderContainer}>
                <Slider
                    style={[styles.slider, isRTL && { transform: [{ scaleX: -1 }] }]}
                    minimumValue={calorieConfig.min}
                    maximumValue={calorieConfig.max}
                    step={50}
                    value={value}
                    onValueChange={(val) => onValueChange(Math.round(val))}
                    minimumTrackTintColor={mealPlanColors.primary}
                    maximumTrackTintColor={mealPlanColors.dragHandle}
                    thumbTintColor={mealPlanColors.primary}
                    inverted={isRTL}
                />
                <View style={[styles.rangeLabels, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.rangeText}>{calorieConfig.min}</Text>
                    <Text style={styles.rangeText}>{calorieConfig.max}</Text>
                </View>
            </View>

            <View style={styles.aiHint}>
                <Text style={[styles.aiText, { textAlign: isRTL ? 'left' : 'right' }]}>
                    <Text style={styles.aiHighlight}>{t.aiRecommended}</Text>
                    {' '}{calorieConfig.recommendedMin}-{calorieConfig.recommendedMax} {t.aiRecommendedHint}
                </Text>
                <Text style={styles.aiEmoji}>💡</Text>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: verticalScale(16),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    headerRTL: {
        flexDirection: 'row-reverse',
    },
    label: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    value: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: mealPlanColors.primary,
    },
    sliderContainer: {
        paddingHorizontal: horizontalScale(4),
    },
    slider: {
        width: '100%',
        height: verticalScale(40),
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: verticalScale(-8),
    },
    rangeLabelsRTL: {
        flexDirection: 'row-reverse',
    },
    rangeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    aiHint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: `${mealPlanColors.primary}08`,
        borderWidth: 1,
        borderColor: `${mealPlanColors.primary}15`,
        borderRadius: borderRadius.sm,
        padding: horizontalScale(12),
        gap: horizontalScale(12),
    },
    aiEmoji: {
        fontSize: ScaleFontSize(18),
    },
    aiText: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: mealPlanColors.textSlate,
        lineHeight: ScaleFontSize(20),
    },
    aiHighlight: {
        fontWeight: '600',
        color: mealPlanColors.primary,
    },
    textRTL: {
        textAlign: 'right',
    },
});
