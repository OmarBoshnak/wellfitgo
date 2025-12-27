/**
 * ProgressSteps Component
 * Step indicators for meal plan flow (1-4)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { horizontalScale } from '@/src/core/utils/scaling';
import { mealPlanColors } from '../constants';

interface ProgressStepsProps {
    currentStep: 1 | 2 | 3 | 4;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
    return (
        <View style={styles.container}>
            {[1, 2, 3, 4].map((step) => (
                <View
                    key={step}
                    style={[
                        styles.dot,
                        step === currentStep && styles.activeDot,
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(4),
    },
    dot: {
        width: horizontalScale(8),
        height: horizontalScale(8),
        borderRadius: horizontalScale(5),
        backgroundColor: mealPlanColors.dragHandle,
    },
    activeDot: {
        width: horizontalScale(10),
        borderRadius: horizontalScale(4),
        backgroundColor: mealPlanColors.primary,
    },
});
