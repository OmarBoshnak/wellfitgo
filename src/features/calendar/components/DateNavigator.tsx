import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { calendarTranslations as t, getMonthName } from '../translations';

interface DateNavigatorProps {
    month: string;
    year: number;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
    month,
    year,
    onPrevious,
    onNext,
    onToday,
}) => {
    // Get translated month name
    const monthIndex = new Date(`${month} 1, 2024`).getMonth();
    const displayMonth = getMonthName(monthIndex);

    return (
        <View style={[styles.container, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <TouchableOpacity
                style={styles.arrowButton}
                onPress={isRTL ? onPrevious : onNext}
            >
                <ChevronRight
                    size={horizontalScale(20)}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>

            <View style={[styles.centerSection, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <TouchableOpacity
                    style={styles.todayButton}
                    onPress={onToday}
                >
                    <Text style={styles.todayText}>{t.today}</Text>
                </TouchableOpacity>

                <Text style={styles.monthYearText}>
                    {displayMonth} {year}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.arrowButton}
                onPress={isRTL ? onNext : onPrevious}
            >
                <ChevronLeft
                    size={horizontalScale(20)}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        gap: horizontalScale(24),
    },
    arrowButton: {
        padding: horizontalScale(4),
        borderRadius: horizontalScale(16),
    },
    centerSection: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    todayButton: {
        backgroundColor: 'rgba(77, 110, 254, 0.1)',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(8),
    },
    todayText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#4d6efe',
    },
    monthYearText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textSecondary,
    },
});

export default DateNavigator;
