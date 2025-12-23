import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/theme';
import { isRTL } from '@/src/i18n';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/utils/scaling';
import { HOUR_HEIGHT, TIME_COLUMN_WIDTH, generateTimeSlots } from '../utils/time';
import { formatHourLabel } from '../translations';

export const TimeColumn: React.FC = () => {
    const timeSlots = generateTimeSlots();

    return (
        <View style={[
            styles.container,
            isRTL && styles.containerRTL
        ]}>
            {timeSlots.map((slot, index) => (
                <View key={slot.hour} style={styles.timeSlot}>
                    <Text style={[
                        styles.timeText,
                        isRTL && styles.timeTextRTL
                    ]}>
                        {formatHourLabel(slot.hour)}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: TIME_COLUMN_WIDTH,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        backgroundColor: colors.bgPrimary,
        paddingTop: 10
    },
    containerRTL: {
        borderRightWidth: 0,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
    },
    timeSlot: {
        height: HOUR_HEIGHT,
        justifyContent: 'flex-start',
        paddingTop: -8, // Offset to align with grid lines
    },
    timeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
        textAlign: 'right',
        paddingRight: horizontalScale(8),
        position: 'absolute',
        top: -8,
        right: 0,
    },
    timeTextRTL: {
        textAlign: 'left',
        paddingRight: 0,
        paddingLeft: horizontalScale(8),
        right: undefined,
        left: 0,
    },
});

export default TimeColumn;
