import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { isRTL } from '@/src/i18n';
import { horizontalScale, ScaleFontSize } from '@/src/utils/scaling';
import { getCurrentTimePosition, formatTime, TIME_COLUMN_WIDTH } from '../utils/time';

export const CurrentTimeLine: React.FC = () => {
    const [position, setPosition] = useState<number | null>(getCurrentTimePosition());

    useEffect(() => {
        // Update position every minute
        const interval = setInterval(() => {
            setPosition(getCurrentTimePosition());
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, []);

    // Don't render if current time is outside grid hours
    if (position === null) {
        return null;
    }

    const currentTime = formatTime(new Date());

    return (
        <View
            style={[
                styles.container,
                { top: position }
            ]}
            pointerEvents="none"
        >
            {/* Time label */}
            <View style={[
                styles.timeLabel,
                isRTL ? styles.timeLabelRTL : styles.timeLabelLTR
            ]}>
                <Text style={styles.timeText}>{currentTime}</Text>
            </View>

            {/* Line with dot */}
            <View style={styles.lineContainer}>
                <View style={[
                    styles.dot,
                    isRTL ? styles.dotRTL : styles.dotLTR
                ]} />
                <View style={styles.line} />
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
    timeLabel: {
        width: TIME_COLUMN_WIDTH,
        paddingHorizontal: horizontalScale(4),
    },
    timeLabelLTR: {
        alignItems: 'flex-end',
    },
    timeLabelRTL: {
        alignItems: 'flex-start',
    },
    timeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#EF4444',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: horizontalScale(4),
    },
    lineContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: horizontalScale(8),
        height: horizontalScale(8),
        borderRadius: horizontalScale(4),
        backgroundColor: '#EF4444',
    },
    dotLTR: {
        marginLeft: -horizontalScale(4),
    },
    dotRTL: {
        marginRight: -horizontalScale(4),
        position: 'absolute',
        right: 0,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 2,
    },
});

export default CurrentTimeLine;
