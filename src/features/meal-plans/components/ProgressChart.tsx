/**
 * ProgressChart Component
 * Circular SVG progress chart for displaying meal completion
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, gradients } from '@/src/core/constants/Themes';
import { ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';

interface ProgressChartProps {
    completed: number;
    total: number;
    size?: number;
    strokeWidth?: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
    completed,
    total,
    size = 140,
    strokeWidth = 12,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = total > 0 ? completed / total : 0;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg
                width={size}
                height={size}
                style={{ transform: [{ rotate: '-90deg' }] }}
            >
                <Defs>
                    <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={gradients.primary[0]} />
                        <Stop offset="100%" stopColor={gradients.primary[1]} />
                    </LinearGradient>
                </Defs>

                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth={strokeWidth}
                />

                {/* Progress Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>

            {/* Center Text */}
            <View style={styles.centerContent}>
                <Text style={styles.statsText}>
                    {completed}/{total}
                </Text>
                <Text style={styles.labelText}>
                    {isRTL ? 'وجبات مكتملة' : 'Meals Done'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsText: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    labelText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '500',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
});

export default ProgressChart;
