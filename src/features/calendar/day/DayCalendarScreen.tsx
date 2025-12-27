import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { colors } from '@/src/core/theme';
import { verticalScale } from '@/src/core/utils/scaling';
import { DayEvent } from './types';
import { dayViewTranslations as t, formatHour } from './translations';
import { generateDayTimeSlots } from './utils/time';
import DayViewHeader from './components/DayViewHeader';
import DayTimeSlot from './components/DayTimeSlot';
import DayEventCard from './components/DayEventCard';
import DayCurrentTimeLine from './components/DayCurrentTimeLine';
import FloatingAddButton from './components/FloatingAddButton';
import AddCallModal from './components/AddCallModal';
import EditEventModal from './components/EditEventModal';
import ClientProfileModal from './components/ClientProfileModal';
import { usePhoneCall } from '@/src/features/doctor/hooks/usePhoneCall';

// ============================================================
// HELPER: Convert Convex event to DayEvent for rendering
// ============================================================

const convertToDisplayEvent = (event: any): DayEvent & { clientPhone?: string } => {
    // Parse start time for display
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const displayHour = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
    const period = startHour >= 12 ? 'PM' : 'AM';
    const startTimeDisplay = `${displayHour}:${startMin.toString().padStart(2, '0')} ${period}`;

    // Calculate duration
    const [endHour, endMin] = event.endTime.split(':').map(Number);
    const durationMins = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    return {
        id: event._id,
        title: event.reason,
        subtitle: event.notes || t.phoneCall,
        startTime: startTimeDisplay,
        duration: `${durationMins} min`,
        type: 'phone',
        clientName: event.clientName || 'Unknown',
        clientAvatar: event.clientAvatar,
        clientId: event.clientId, // Pass clientId for profile fetching
        clientPhone: event.clientPhone, // For phone calls
        actionLabel: t.call,
        colorScheme: 'green',
    };
};

// ============================================================
// DAY CALENDAR SCREEN
// ============================================================

export const DayCalendarScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [currentDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [optimisticEvents, setOptimisticEvents] = useState<any[]>([]);

    // Phone call hook
    const { callClient } = usePhoneCall();

    // Format date for Convex query
    const isoDate = currentDate.toISOString().split('T')[0];

    // Fetch events from Convex
    const convexEvents = useQuery(api.calendar.getEventsByDate, { date: isoDate });

    // Fetch selected client profile for modal
    const clientProfile = useQuery(
        api.users.getUserById,
        selectedClientId ? { userId: selectedClientId as Id<"users"> } : "skip"
    );

    // Combine Convex events with optimistic updates
    const allEvents = [...(convexEvents || []), ...optimisticEvents];

    // Store raw events for edit modal
    const rawEventsByHour: Record<number, any> = {};
    allEvents.forEach((event) => {
        const [hour] = event.startTime.split(':').map(Number);
        rawEventsByHour[hour] = event;
    });

    // Group events by hour for rendering (extended with clientPhone)
    const eventsByHour: Record<number, DayEvent & { clientPhone?: string }> = {};
    allEvents.forEach((event) => {
        const [hour] = event.startTime.split(':').map(Number);
        eventsByHour[hour] = convertToDisplayEvent(event);
    });

    const timeSlots = generateDayTimeSlots();

    // Handle schedule press - open modal with pre-filled time
    const handleSchedulePress = useCallback((hour: number) => {
        setSelectedHour(hour);
        setShowAddModal(true);
    }, []);

    // Handle FAB press - open modal with current hour (within 12PM-10PM range)
    const handleAddPress = useCallback(() => {
        const currentHour = new Date().getHours();
        const hour = currentHour >= 12 && currentHour <= 22 ? currentHour : 12;
        setSelectedHour(hour);
        setShowAddModal(true);
    }, []);

    // Handle event created - optimistic update
    const handleEventCreated = useCallback((event: any) => {
        // Only add to optimistic events if the event is for the current display date
        if (event.date === isoDate) {
            setOptimisticEvents((prev) => [...prev, event]);

            // Clear optimistic events after Convex syncs (usually instant)
            setTimeout(() => {
                setOptimisticEvents([]);
            }, 2000);
        }
        // Note: Events for other dates won't show here - they'll appear when navigating to that date
    }, [isoDate]);

    // Handle edit button press on event
    const handleEditPress = useCallback((rawEvent: any) => {
        setSelectedEvent(rawEvent);
        setShowEditModal(true);
    }, []);

    // Handle event updated/deleted
    const handleEventUpdated = useCallback(() => {
        // Convex will auto-refresh the query
        setOptimisticEvents([]);
    }, []);

    // Handle avatar press - show profile modal
    const handleAvatarPress = useCallback((clientId?: string) => {
        if (clientId) {
            setSelectedClientId(clientId);
            setShowProfileModal(true);
        }
    }, []);

    const handleCalendarPress = () => {
        // Could navigate to week view
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View>
                <DayViewHeader
                    currentDate={currentDate}
                    onCalendarPress={handleCalendarPress}
                    style={{ paddingTop: insets.top }}
                />
            </View>

            {/* Scrollable Timeline */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.timeline}>
                    {/* Current Time Line */}
                    <DayCurrentTimeLine />

                    {/* Time Slots */}
                    {timeSlots.map((hour) => {
                        const event = eventsByHour[hour];

                        if (event) {
                            const rawEvent = rawEventsByHour[hour];
                            return (
                                <DayEventCard
                                    key={hour}
                                    event={event}
                                    hour={hour}
                                    onPress={() => console.log('Event pressed:', event.id)}
                                    onActionPress={() => console.log('Action pressed:', event.id)}
                                    onPhoneCallPress={() => {
                                        // Initiate phone call to client
                                        callClient(
                                            event.clientId || '',
                                            event.clientName,
                                            event.clientPhone
                                        );
                                    }}
                                    onEditPress={() => handleEditPress(rawEvent)}
                                    onAvatarPress={() => handleAvatarPress(event.clientId)}
                                />
                            );
                        }

                        return (
                            <DayTimeSlot
                                key={hour}
                                hour={hour}
                                hasEvent={false}
                                onSchedulePress={() => handleSchedulePress(hour)}
                            />
                        );
                    })}
                </View>
            </ScrollView>

            {/* Floating Add Button */}
            <FloatingAddButton onPress={handleAddPress} />

            {/* Add Call Modal */}
            <AddCallModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                selectedDate={currentDate}
                selectedHour={selectedHour}
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

            {/* Client Profile Modal */}
            <ClientProfileModal
                visible={showProfileModal}
                onClose={() => {
                    setShowProfileModal(false);
                    setSelectedClientId(null);
                }}
                client={clientProfile || null}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: verticalScale(24),
        paddingBottom: verticalScale(120),
    },
    timeline: {
        position: 'relative',
        minHeight: 800,
    },
});

export default DayCalendarScreen;
