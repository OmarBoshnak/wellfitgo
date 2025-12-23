// Layout calculation utilities for event positioning

import { CalendarEvent, PositionedEvent } from '../types';
import { HOUR_HEIGHT, START_HOUR, getMinutesFromMidnight, getDurationMinutes } from './time';

/**
 * Calculate the top position of an event based on its start time
 */
export const calculateEventTop = (startTime: Date): number => {
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();

    // Hours from grid start (8 AM)
    const hoursFromStart = startHour - START_HOUR;

    // Position in pixels
    return (hoursFromStart * 60 + startMinutes) * (HOUR_HEIGHT / 60);
};

/**
 * Calculate the height of an event based on its duration
 */
export const calculateEventHeight = (startTime: Date, endTime: Date): number => {
    const durationMinutes = getDurationMinutes(startTime, endTime);
    return durationMinutes * (HOUR_HEIGHT / 60);
};

/**
 * Check if two events overlap in time
 */
const eventsOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
    return (
        event1.startTime < event2.endTime &&
        event2.startTime < event1.endTime
    );
};

/**
 * Group overlapping events together
 */
const groupOverlappingEvents = (events: CalendarEvent[]): CalendarEvent[][] => {
    if (events.length === 0) return [];

    // Sort events by start time
    const sorted = [...events].sort((a, b) =>
        a.startTime.getTime() - b.startTime.getTime()
    );

    const groups: CalendarEvent[][] = [];
    let currentGroup: CalendarEvent[] = [sorted[0]];
    let groupEnd = sorted[0].endTime;

    for (let i = 1; i < sorted.length; i++) {
        const event = sorted[i];

        // Check if event overlaps with current group
        if (event.startTime < groupEnd) {
            currentGroup.push(event);
            // Extend group end if needed
            if (event.endTime > groupEnd) {
                groupEnd = event.endTime;
            }
        } else {
            // Start new group
            groups.push(currentGroup);
            currentGroup = [event];
            groupEnd = event.endTime;
        }
    }

    // Don't forget the last group
    groups.push(currentGroup);

    return groups;
};

/**
 * Calculate positioned events with overlap handling
 * Returns events with calculated top, height, left, and width
 */
export const calculatePositionedEvents = (
    events: CalendarEvent[],
    columnWidth: number,
    padding: number = 2
): PositionedEvent[] => {
    const groups = groupOverlappingEvents(events);
    const positionedEvents: PositionedEvent[] = [];

    for (const group of groups) {
        const eventCount = group.length;
        const eventWidth = (columnWidth - padding * 2) / eventCount;

        group.forEach((event, index) => {
            positionedEvents.push({
                ...event,
                top: calculateEventTop(event.startTime),
                height: calculateEventHeight(event.startTime, event.endTime),
                left: padding + index * eventWidth,
                width: eventWidth - padding,
                columnIndex: index,
            });
        });
    }

    return positionedEvents;
};

/**
 * Get events for a specific day
 */
export const getEventsForDay = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
    return events.filter(event => {
        const eventDate = event.startTime;
        return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
        );
    });
};
