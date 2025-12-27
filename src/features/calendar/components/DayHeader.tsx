import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { DayInfo } from '../types';
import { TIME_COLUMN_WIDTH } from '../utils/time';

interface DayHeaderProps {
    days: DayInfo[];
    isWeekView: boolean;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ days, isWeekView }) => {
    // For RTL, reverse the day order
    const displayDays = isRTL ? [...days].reverse() : days;

    return (
        <View style={[
            styles.container,
            { flexDirection: isRTL ? 'row' : 'row-reverse' }
        ]}>
            {/* Empty corner for time column alignment */}
            <View style={styles.timeColumnSpace} />

            {/* Day columns */}
            <View style={[
                styles.daysContainer,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
                {displayDays.map((day, index) => (
                    <View key={index} style={styles.dayColumn}>
                        <Text style={[
                            styles.dayName,
                            day.isToday && styles.dayNameToday
                        ]}>
                            {day.dayName}
                        </Text>

                        {day.isToday ? (
                            <LinearGradient
                                colors={['#4d6efe', '#3b82f6']}
                                style={styles.todayCircle}
                            >
                                <Text style={styles.todayNumber}>
                                    {day.dayNumber}
                                </Text>
                            </LinearGradient>
                        ) : (
                            <Text style={styles.dayNumber}>
                                {day.dayNumber}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: verticalScale(12),
    },
    timeColumnSpace: {
        width: TIME_COLUMN_WIDTH,
    },
    daysContainer: {
        flex: 1,
        paddingRight: horizontalScale(8),
    },
    dayColumn: {
        flex: 1,
        alignItems: 'center',
        gap: verticalScale(4),
    },
    dayName: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    dayNameToday: {
        fontWeight: '700',
        color: '#4d6efe',
    },
    dayNumber: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textSecondary,
    },
    todayCircle: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4d6efe',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    todayNumber: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default DayHeader;
