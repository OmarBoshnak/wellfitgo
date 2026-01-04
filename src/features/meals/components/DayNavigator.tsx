import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';

interface DayNavigatorProps {
    currentDay: {
        dayKey: string;
        dayNumber: number;
        dayName: string;
        dayNameAr: string;
        isToday: boolean;
    };
    onPreviousDay: () => void;
    onNextDay: () => void;
    canGoBack?: boolean;
    canGoForward?: boolean;
}

/**
 * Day navigation header for daily format diets
 * Shows the current day name with prev/next arrows
 * 
 * ┌─────────────────────────────────┐
 * │  ◀  اليوم الثالث  ▶             │
 * │     (اليوم)                     │
 * └─────────────────────────────────┘
 */
export const DayNavigator: React.FC<DayNavigatorProps> = ({
    currentDay,
    onPreviousDay,
    onNextDay,
    canGoBack = true,
    canGoForward = true,
}) => {
    return (
        <View style={styles.container}>
            <View style={[styles.navigationRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {/* Previous Day Button */}
                <TouchableOpacity
                    style={[styles.arrowButton, !canGoBack && styles.arrowButtonDisabled]}
                    onPress={onPreviousDay}
                    disabled={!canGoBack}
                >
                    <Ionicons
                        name={isRTL ? "chevron-forward" : "chevron-back"}
                        size={24}
                        color={canGoBack ? colors.primaryDark : colors.border}
                    />
                </TouchableOpacity>

                {/* Day Name */}
                <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>
                        {isRTL ? currentDay.dayNameAr : currentDay.dayName}
                    </Text>
                    {currentDay.isToday && (
                        <View style={styles.todayBadge}>
                            <Text style={styles.todayText}>
                                {isRTL ? 'اليوم' : 'Today'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Next Day Button */}
                <TouchableOpacity
                    style={[styles.arrowButton, !canGoForward && styles.arrowButtonDisabled]}
                    onPress={onNextDay}
                    disabled={!canGoForward}
                >
                    <Ionicons
                        name={isRTL ? "chevron-back" : "chevron-forward"}
                        size={24}
                        color={canGoForward ? colors.primaryDark : colors.border}
                    />
                </TouchableOpacity>
            </View>

            {/* Day Number Indicator */}
            <Text style={styles.dayNumber}>
                {isRTL
                    ? `(يوم ${currentDay.dayNumber} من 7)`
                    : `(Day ${currentDay.dayNumber} of 7)`}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        alignItems: 'center',
    },
    navigationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    arrowButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primaryLightBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowButtonDisabled: {
        backgroundColor: colors.bgSecondary,
        opacity: 0.5,
    },
    dayInfo: {
        alignItems: 'center',
        flex: 1,
    },
    dayName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    todayBadge: {
        backgroundColor: colors.primaryDark,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        borderRadius: 12,
        marginTop: verticalScale(6),
    },
    todayText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.white,
    },
    dayNumber: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(8),
    },
});

export default DayNavigator;
