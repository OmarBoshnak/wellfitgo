import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { colors } from '@/src/theme';
import { CalendarEvent, CalendarView } from './types';
import { useCalendar } from './hooks/useCalendar';
import CalendarHeader from './components/CalendarHeader';
import ViewToggle from './components/ViewToggle';
import DateNavigator from './components/DateNavigator';
import DayHeader from './components/DayHeader';
import WeekGrid from './components/WeekGrid';
import AddCallModal from './day/components/AddCallModal';
import EditEventModal from './day/components/EditEventModal';

// ============================================================
// HELPER: Convert Convex event to CalendarEvent for rendering
// ============================================================

const convertToCalendarEvent = (event: any): CalendarEvent => {
    // Parse start time
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);

    // Parse date
    const [year, month, day] = event.date.split('-').map(Number);

    // Create Date objects
    const startDate = new Date(year, month - 1, day, startHour, startMin, 0, 0);
    const endDate = new Date(year, month - 1, day, endHour, endMin, 0, 0);

    // Calculate duration
    const durationMins = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Determine color scheme based on reason/type
    let color = '#4d6efe';
    let gradientColors: [string, string] = ['#4d6efe', '#3b82f6'];
    let icon: CalendarEvent['icon'] = 'call';

    if (event.reason?.toLowerCase().includes('video')) {
        color = '#4d6efe';
        gradientColors = ['#4d6efe', '#3b82f6'];
        icon = 'videocam';
    } else if (event.reason?.toLowerCase().includes('meal') || event.reason?.toLowerCase().includes('plan')) {
        color = '#10b981';
        gradientColors = ['#10b981', '#059669'];
        icon = 'restaurant';
    } else if (event.reason?.toLowerCase().includes('check')) {
        color = '#8b5cf6';
        gradientColors = ['#8b5cf6', '#7c3aed'];
        icon = 'check_circle';
    } else if (event.reason?.toLowerCase().includes('consult')) {
        color = '#f59e0b';
        gradientColors = ['#f59e0b', '#d97706'];
        icon = 'person_add';
    }

    return {
        id: event._id,
        title: event.reason || 'Phone Call',
        startTime: startDate,
        endTime: endDate,
        color,
        gradientColors,
        icon,
        clientName: event.clientName,
        duration: `${durationMins}m`,
    };
};

// ============================================================
// CALENDAR SCREEN
// ============================================================

export const CalendarScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [optimisticEvents, setOptimisticEvents] = useState<any[]>([]);
    const {
        currentView,
        currentDate,
        weekDays,
        displayMonth,
        displayYear,
        setView,
        goToPrevious,
        goToNext,
        goToToday,
    } = useCalendar();

    // Get date range for the current week
    const weekDates = useMemo(() => {
        return weekDays.map(d => d.date.toISOString().split('T')[0]);
    }, [weekDays]);

    // Fetch events from Convex for the week range
    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    const convexEvents = useQuery(api.calendar.getEventsByDateRange, { startDate, endDate });

    // Combine Convex events with optimistic updates
    const allEvents = [...(convexEvents || []), ...optimisticEvents];

    // Convert Convex events to CalendarEvents for rendering
    const events: CalendarEvent[] = useMemo(() => {
        return allEvents.map(convertToCalendarEvent);
    }, [allEvents]);

    // Handle add button press - open AddCallModal
    const handleAddPress = useCallback(() => {
        setShowAddModal(true);
    }, []);

    // Handle view change - navigate to Day Calendar for Day view
    const handleViewChange = (view: CalendarView) => {
        if (view === 'day') {
            router.push('/(app)/doctor/day-calendar');
        } else {
            setView(view);
        }
    };

    // Handle event created - optimistic update
    const handleEventCreated = useCallback((event: any) => {
        // Add to optimistic events (will be replaced by Convex on next query)
        setOptimisticEvents((prev) => [...prev, event]);
        setShowAddModal(false);

        // Clear optimistic events after Convex syncs (usually instant)
        setTimeout(() => {
            setOptimisticEvents([]);
        }, 2000);
    }, []);

    // Handle event press - open edit modal
    const handleEventPress = useCallback((event: any) => {
        // Find the raw event from allEvents
        const rawEvent = allEvents.find(e => e._id === event.id);
        if (rawEvent) {
            setSelectedEvent(rawEvent);
            setShowEditModal(true);
        }
    }, [allEvents]);

    // Handle event updated/deleted
    const handleEventUpdated = useCallback(() => {
        // Convex will auto-refresh the query
        setOptimisticEvents([]);
        setShowEditModal(false);
    }, []);

    // For day view, show only selected day
    const displayDays = currentView === 'day'
        ? weekDays.filter(d =>
            d.date.getDate() === currentDate.getDate() &&
            d.date.getMonth() === currentDate.getMonth()
        )
        : weekDays;

    return (
        <SafeAreaView
            edges={['left', 'right']}
            style={styles.container}
        >
            {/* Header */}
            <CalendarHeader onEditPress={handleAddPress} style={{ paddingTop: insets.top }} />

            {/* View Toggle */}
            <View style={styles.controlsContainer}>
                <ViewToggle
                    currentView={currentView}
                    onViewChange={handleViewChange}
                />

                {/* Date Navigator */}
                <DateNavigator
                    month={displayMonth}
                    year={displayYear}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                    onToday={goToToday}
                />
            </View>

            {/* Day Names Header */}
            <DayHeader
                days={displayDays}
                isWeekView={currentView === 'week'}
            />

            {/* Time Grid */}
            <WeekGrid
                days={displayDays}
                events={events}
                isWeekView={currentView === 'week'}
                onEventPress={handleEventPress}
            />

            {/* Add Call Modal */}
            <AddCallModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                selectedDate={currentDate}
                selectedHour={12}
                onEventCreated={handleEventCreated}
            />

            {/* Edit Event Modal */}
            <EditEventModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                event={selectedEvent}
                onEventUpdated={handleEventUpdated}
                onEventDeleted={handleEventUpdated}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    controlsContainer: {
        backgroundColor: colors.bgPrimary,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default CalendarScreen;
