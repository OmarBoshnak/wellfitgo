import { isRTL } from '@/src/core/i18n';

// Calendar translations - English and Arabic
export const calendarTranslations = {
    // Header
    calendar: isRTL ? 'التقويم' : 'Calendar',
    add: isRTL ? 'إضافة' : 'Add',

    // View Toggle
    day: isRTL ? 'اليوم' : 'Day',
    week: isRTL ? 'الأسبوع' : 'Week',

    // Navigation
    today: isRTL ? 'اليوم' : 'Today',

    // Day Names (short) - Starting from Saturday - with ال prefix for Arabic
    dayNames: isRTL
        ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
        : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],

    // Day Names (full)
    dayNamesFull: isRTL
        ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
        : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],

    // Month Names
    monthNames: isRTL
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

    // Time Labels
    am: isRTL ? 'ص' : 'AM',
    pm: isRTL ? 'م' : 'PM',

    // Event types
    videoCall: isRTL ? 'مكالمة فيديو' : 'Video Call',
    mealPlanReview: isRTL ? 'مراجعة خطة الوجبات' : 'Meal Plan Review',
    checkIn: isRTL ? 'تسجيل حضور' : 'Check-in',
    newConsult: isRTL ? 'استشارة جديدة' : 'New Consult',

    // Duration
    minutes: isRTL ? 'د' : 'm',
};

// Helper to get month name
export const getMonthName = (monthIndex: number): string => {
    return calendarTranslations.monthNames[monthIndex];
};

// Helper to get day name
// JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// Our array: 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
export const getDayName = (dayIndex: number, full: boolean = false): string => {
    // Convert JS day (0=Sun, 6=Sat) to our format (0=Sat, 1=Sun, ...)
    // Sat(6) -> 0, Sun(0) -> 1, Mon(1) -> 2, etc.
    const adjustedIndex = dayIndex === 6 ? 0 : dayIndex + 1;
    return full
        ? calendarTranslations.dayNamesFull[adjustedIndex]
        : calendarTranslations.dayNames[adjustedIndex];
};

// Helper to format hour
export const formatHourLabel = (hour: number): string => {
    const { am, pm } = calendarTranslations;
    if (hour === 0) return `12 ${am}`;
    if (hour === 12) return `12 ${pm}`;
    if (hour < 12) return `${hour} ${am}`;
    return `${hour - 12} ${pm}`;
};
