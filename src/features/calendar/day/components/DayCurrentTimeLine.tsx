import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { getTimeIndicatorPosition } from '../utils/time';

export const DayCurrentTimeLine: React.FC = () => {
    const [position, setPosition] = useState<number | null>(getTimeIndicatorPosition());
    const pulseScale = useSharedValue(0.5);

    useEffect(() => {
        // Pulsing animation
        pulseScale.value = withRepeat(
            withTiming(1.5, {
                duration: 1500,
                easing: Easing.out(Easing.ease)
            }),
            -1,
            false
        );

        // Update position every minute
        const interval = setInterval(() => {
            setPosition(getTimeIndicatorPosition());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: 2 - pulseScale.value,
    }));

    if (position === null) return null;

    return (
        <View
            style={[styles.container, { top: position }]}
            pointerEvents="none"
        >
            {/* Dot with pulse */}
            <View style={[
                styles.dotContainer,
                isRTL ? styles.dotContainerRTL : styles.dotContainerLTR
            ]}>
                <View style={styles.dot}>
                    <Animated.View style={[styles.pulseRing, pulseStyle]} />
                </View>
            </View>

            {/* Line */}
            <View style={styles.lineContainer}>
                <View style={[
                    styles.line,
                    isRTL ? styles.lineRTL : styles.lineLTR
                ]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
    },
    dotContainer: {
        width: horizontalScale(60),
        alignItems: 'center',
    },
    dotContainerLTR: {
        justifyContent: 'flex-end',
        paddingRight: horizontalScale(12),
    },
    dotContainerRTL: {
        justifyContent: 'flex-start',
        paddingLeft: horizontalScale(12),
    },
    dot: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: '#4d6efe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: '#4d6efe',
    },
    lineContainer: {
        flex: 1,
    },
    line: {
        height: 2,
        backgroundColor: '#4d6efe',
        opacity: 0.5,
    },
    lineLTR: {
        // Gradient effect simulated with opacity
    },
    lineRTL: {
        // Gradient reversed
    },
});

export default DayCurrentTimeLine;
