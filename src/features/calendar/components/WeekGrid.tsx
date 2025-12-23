import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/src/theme';
import { isRTL } from '@/src/i18n';
import { horizontalScale } from '@/src/utils/scaling';
import { DayInfo, CalendarEvent, PositionedEvent } from '../types';
import { HOUR_HEIGHT, TOTAL_HOURS, TIME_COLUMN_WIDTH } from '../utils/time';
import { calculatePositionedEvents, getEventsForDay } from '../utils/layout';
import TimeColumn from './TimeColumn';
import EventCard from './EventCard';
import CurrentTimeLine from './CurrentTimeLine';

interface WeekGridProps {
    days: DayInfo[];
    events: CalendarEvent[];
    isWeekView: boolean;
    onEventPress?: (event: PositionedEvent) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const WeekGrid: React.FC<WeekGridProps> = ({
    days,
    events,
    isWeekView,
    onEventPress,
}) => {
    // Calculate column width
    const gridWidth = screenWidth - TIME_COLUMN_WIDTH - horizontalScale(8);
    const columnCount = isWeekView ? 7 : 1;
    const columnWidth = gridWidth / columnCount;

    // For RTL, reverse the day order
    const displayDays = isRTL ? [...days].reverse() : days;

    // Calculate positioned events for each day
    const positionedEventsByDay = useMemo(() => {
        const result: Record<number, PositionedEvent[]> = {};

        displayDays.forEach((day, index) => {
            const dayEvents = getEventsForDay(events, day.date);
            result[index] = calculatePositionedEvents(
                dayEvents,
                100, // Use percentage for width
                4 // Padding
            );
        });

        return result;
    }, [events, displayDays]);

    // Grid hours count (for grid lines)
    const gridHours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i);

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={[
                styles.gridContainer,
                { flexDirection: isRTL ? 'row' : 'row-reverse' }
            ]}>
                {/* Time Column */}
                <TimeColumn />

                {/* Day Columns */}
                <View style={styles.daysContainer}>
                    {/* Horizontal Grid Lines */}
                    <View style={styles.gridLines} pointerEvents="none">
                        {gridHours.map((hour) => (
                            <View
                                key={hour}
                                style={[
                                    styles.gridLine,
                                    hour === TOTAL_HOURS && styles.lastGridLine
                                ]}
                            />
                        ))}
                    </View>

                    {/* Current Time Line */}
                    <CurrentTimeLine />

                    {/* Day Columns with Events */}
                    <View style={[
                        styles.columnsContainer,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' }
                    ]}>
                        {displayDays.map((day, dayIndex) => (
                            <View
                                key={dayIndex}
                                style={[
                                    styles.dayColumn,
                                    day.isToday && styles.todayColumn,
                                    dayIndex < displayDays.length - 1 && styles.columnBorder
                                ]}
                            >
                                {/* Events for this day */}
                                {positionedEventsByDay[dayIndex]?.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onPress={onEventPress}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    gridContainer: {
        flexDirection: 'row',
        minHeight: (TOTAL_HOURS + 1) * HOUR_HEIGHT,
        alignItems: 'center',
    },
    daysContainer: {
        flex: 1,
        position: 'relative',
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    gridLine: {
        height: HOUR_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    lastGridLine: {
        borderBottomWidth: 0,
    },
    columnsContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    dayColumn: {
        flex: 1,
        position: 'relative',
        height: (TOTAL_HOURS + 1) * HOUR_HEIGHT,
    },
    todayColumn: {
        backgroundColor: 'rgba(77, 110, 254, 0.02)',
    },
    columnBorder: {
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
});

export default WeekGrid;
