// Day View time utilities

// Time range: 12 PM to 10:30 PM
export const DAY_START_HOUR = 12;
export const DAY_END_HOUR = 22;
export const HOUR_HEIGHT = 100; // Taller for day view cards

/**
 * Get current hour for time indicator
 */
export const getCurrentHour = (): number => {
    return new Date().getHours();
};

/**
 * Get current minutes
 */
export const getCurrentMinutes = (): number => {
    return new Date().getMinutes();
};

/**
 * Calculate time indicator position
 */
export const getTimeIndicatorPosition = (): number | null => {
    const hour = getCurrentHour();
    const minutes = getCurrentMinutes();

    // Only show if within time range (12 PM - 10:30 PM)
    if (hour < DAY_START_HOUR || hour > DAY_END_HOUR) {
        return null;
    }

    const hoursFromStart = hour - DAY_START_HOUR;
    return (hoursFromStart + minutes / 60) * HOUR_HEIGHT;
};

/**
 * Get 5-day week strip around selected date
 */
export const getWeekStripDays = (selectedDate: Date): { date: Date; dayNumber: number; dayOfWeek: number }[] => {
    const days = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 1); // Start from day before

    for (let i = 0; i < 5; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        days.push({
            date,
            dayNumber: date.getDate(),
            dayOfWeek: date.getDay(),
        });
    }

    return days;
};

/**
 * Generate time slots for the day
 */
export const generateDayTimeSlots = (): number[] => {
    const slots = [];
    for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour++) {
        slots.push(hour);
    }
    return slots;
};
