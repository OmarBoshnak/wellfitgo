// Calendar types - Day and Week views only (no Month!)

export type CalendarView = 'day' | 'week';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color: string;
    gradientColors: [string, string];
    icon?: 'videocam' | 'restaurant' | 'check_circle' | 'person_add' | 'call';
    clientName?: string;
    duration?: string;
}

export interface DayInfo {
    date: Date;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    isSelected?: boolean;
}

export interface TimeSlot {
    hour: number;
    label: string;
}

// Event positioning for overlap handling
export interface PositionedEvent extends CalendarEvent {
    top: number;
    height: number;
    left: number;
    width: number;
    columnIndex: number;
}
