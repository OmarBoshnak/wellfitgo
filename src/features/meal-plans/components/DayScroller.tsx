/**
 * DayScroller Component
 * Horizontal scrollable day picker showing full plan duration
 */
import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';

export type DayStatus = 'completed' | 'partial' | 'missed' | 'upcoming';

interface Day {
    date: string;
    label: string;
    labelAr: string;
    dayNum: number;
    status: DayStatus;
    isToday: boolean;
    weekNumber?: number;
}

interface DayScrollerProps {
    days: Day[];
    selectedDate: string;
    onDaySelect: (date: string) => void;
}

const STATUS_ICONS: Record<DayStatus, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    completed: { name: 'checkmark-circle', color: colors.success },
    partial: { name: 'timer-outline', color: colors.warning },
    missed: { name: 'close-circle', color: colors.error },
    upcoming: { name: 'radio-button-off', color: colors.gray },
};

// Month abbreviations
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export const DayScroller: React.FC<DayScrollerProps> = ({
    days,
    selectedDate,
    onDaySelect,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);

    // Determine which days should show month label
    const daysWithMonth = useMemo(() => {
        let prevMonth = -1;
        return days.map((day, index) => {
            const date = new Date(day.date);
            const month = date.getMonth();
            const showMonth = index === 0 || month !== prevMonth;
            prevMonth = month;
            return { ...day, showMonth, month };
        });
    }, [days]);

    // Auto-scroll to today on mount
    useEffect(() => {
        const todayIndex = days.findIndex((d) => d.isToday);
        if (todayIndex >= 0 && scrollViewRef.current) {
            // Scroll to center the today item
            const itemWidth = horizontalScale(70) + horizontalScale(8);
            const scrollX = todayIndex * itemWidth - itemWidth * 2;
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                    x: Math.max(0, scrollX),
                    animated: true,
                });
            }, 100);
        }
    }, [days]);

    const renderDayItem = (day: typeof daysWithMonth[0], index: number) => {
        const isSelected = day.date === selectedDate;
        const iconConfig = STATUS_ICONS[day.status];
        const monthLabel = isRTL ? MONTHS_AR[day.month] : MONTHS_EN[day.month];

        // Check if this is the start of a new week (every 7 days after first)
        const isNewWeek = index > 0 && index % 7 === 0;

        return (
            <React.Fragment key={day.date}>
                {/* Week separator */}
                {isNewWeek && (
                    <View style={styles.weekSeparator}>
                        <View style={styles.weekSeparatorLine} />
                        <Text style={styles.weekSeparatorText}>
                            {isRTL ? `أسبوع ${day.weekNumber}` : `Week ${day.weekNumber}`}
                        </Text>
                        <View style={styles.weekSeparatorLine} />
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.dayItem,
                        isSelected && styles.dayItemSelected,
                        day.isToday && styles.dayItemToday,
                        day.status === 'upcoming' && styles.dayItemUpcoming,
                    ]}
                    onPress={() => onDaySelect(day.date)}
                    activeOpacity={0.7}
                >
                    {/* Today Badge */}
                    {day.isToday && (
                        <View style={styles.todayBadge}>
                            <Text style={styles.todayBadgeText}>
                                {isRTL ? 'اليوم' : 'Today'}
                            </Text>
                        </View>
                    )}

                    {/* Month Label (shown for first day or month change) */}
                    {day.showMonth && (
                        <Text style={styles.monthLabel}>{monthLabel}</Text>
                    )}

                    {/* Day Label */}
                    <Text
                        style={[
                            styles.dayLabel,
                            isSelected && styles.dayLabelSelected,
                            day.isToday && styles.dayLabelToday,
                        ]}
                    >
                        {isRTL ? day.labelAr : day.label}
                    </Text>

                    {/* Day Number */}
                    <Text
                        style={[
                            styles.dayNum,
                            isSelected && styles.dayNumSelected,
                        ]}
                    >
                        {day.dayNum}
                    </Text>

                    {/* Status Icon */}
                    <Ionicons
                        name={iconConfig.name}
                        size={18}
                        color={isSelected && day.isToday ? colors.primaryDark : iconConfig.color}
                    />
                </TouchableOpacity>
            </React.Fragment>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate='normal'
            >
                {daysWithMonth.map((day, index) => renderDayItem(day, index))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(8),
        gap: horizontalScale(6),
        alignItems: 'center',
    },
    weekSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(4),
        gap: horizontalScale(4),
    },
    weekSeparatorLine: {
        width: 1,
        height: verticalScale(30),
        backgroundColor: colors.border,
    },
    weekSeparatorText: {
        fontSize: ScaleFontSize(9),
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
        writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    dayItem: {
        minWidth: horizontalScale(65),
        paddingVertical: verticalScale(8),
        paddingHorizontal: horizontalScale(8),
        borderRadius: 12,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        gap: verticalScale(4),
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dayItemSelected: {
        backgroundColor: `${colors.primaryDark}15`,
        borderColor: colors.primaryDark,
        borderWidth: 2,
    },
    dayItemToday: {
        position: 'relative',
        paddingTop: verticalScale(16),
    },
    dayItemUpcoming: {
        opacity: 0.6,
    },
    todayBadge: {
        position: 'absolute',
        top: 2,
        backgroundColor: colors.primaryDark,
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(1),
        borderRadius: 8,
    },
    todayBadgeText: {
        fontSize: ScaleFontSize(7),
        fontWeight: '700',
        color: colors.white,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    monthLabel: {
        fontSize: ScaleFontSize(9),
        fontWeight: '600',
        color: colors.primaryDark,
        marginBottom: verticalScale(2),
    },
    dayLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    dayLabelSelected: {
        color: colors.primaryDark,
    },
    dayLabelToday: {
        fontWeight: '600',
    },
    dayNum: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    dayNumSelected: {
        color: colors.primaryDark,
    },
});

export default DayScroller;
