// Day View specific types

export interface DayEvent {
    id: string;
    title: string;
    subtitle: string;
    startTime: string; // "10:00 AM"
    duration: string; // "30 min"
    type: 'video' | 'office' | 'phone';
    clientName: string;
    clientAvatar?: string;
    clientInitials?: string;
    clientId?: string; // For fetching profile data
    actionLabel: string;
    colorScheme: 'blue' | 'purple' | 'green';
}

export interface TimeSlotData {
    hour: number;
    label: string;
    event?: DayEvent;
}

export interface WeekDay {
    dayLetter: string;
    dayNumber: number;
    isSelected: boolean;
}
