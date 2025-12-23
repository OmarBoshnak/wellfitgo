// Time calculation utilities for calendar

/**
 * Calendar constants
 */
export const HOUR_HEIGHT = 60; // pixels per hour
export const START_HOUR = 12; // 12 PM
export const END_HOUR = 23; // 10:30 PM (using 23 to get 11 hours: 12PM-10PM + half hour)
export const TOTAL_HOURS = END_HOUR - START_HOUR; // 11 hours (12PM to 10:30PM)
export const TIME_COLUMN_WIDTH = 60;

/**
 * Get the week days starting from Saturday
 * @param date - Any date in the target week
 * @returns Array of 7 dates starting from Saturday
 */
export const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const current = new Date(date);

    // Get day of week (0=Sun, 6=Sat)
    const dayOfWeek = current.getDay();

    // Calculate offset to Saturday (Saturday = 6)
    // If today is Sunday (0), we need to go back 1 day
    // If today is Saturday (6), we need to go back 0 days
    const offset = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

    // Set to Saturday of current week
    current.setDate(current.getDate() - offset);

    // Generate 7 days
    for (let i = 0; i < 7; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return days;
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
};

/**
 * Get minutes from midnight for a given date
 */
export const getMinutesFromMidnight = (date: Date): number => {
    return date.getHours() * 60 + date.getMinutes();
};

/**
 * Get the current time position (pixels from top of grid)
 * Returns null if current time is outside the grid hours
 */
export const getCurrentTimePosition = (): number | null => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check if current time is within grid range
    if (hours < START_HOUR || hours >= END_HOUR) {
        return null;
    }

    // Calculate position
    const hoursFromStart = hours - START_HOUR;
    const position = (hoursFromStart * 60 + minutes) * (HOUR_HEIGHT / 60);

    return position;
};

/**
 * Format time for display (e.g., "10:15")
 */
export const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const paddedMinutes = minutes.toString().padStart(2, '0');

    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${hour12}:${paddedMinutes}`;
};

/**
 * Get duration in minutes between two dates
 */
export const getDurationMinutes = (start: Date, end: Date): number => {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Navigate to previous period (day or week)
 */
export const getPreviousPeriod = (date: Date, view: 'day' | 'week'): Date => {
    const newDate = new Date(date);
    if (view === 'week') {
        newDate.setDate(newDate.getDate() - 7);
    } else {
        newDate.setDate(newDate.getDate() - 1);
    }
    return newDate;
};

/**
 * Navigate to next period (day or week)
 */
export const getNextPeriod = (date: Date, view: 'day' | 'week'): Date => {
    const newDate = new Date(date);
    if (view === 'week') {
        newDate.setDate(newDate.getDate() + 7);
    } else {
        newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
};

/**
 * Generate time slots for the grid (8 AM - 8 PM)
 */
export const generateTimeSlots = (): { hour: number; label: string }[] => {
    const slots = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        slots.push({
            hour,
            label: `${displayHour} ${period}`,
        });
    }
    return slots;
};
