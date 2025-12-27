import { isRTL } from '@/src/core/i18n';

// Day View translations
export const dayViewTranslations = {
    // Header
    dayView: isRTL ? 'عرض اليوم' : 'Day View',

    // Days of week (single letter for week strip)
    dayLetters: isRTL
        ? ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'] // سبت، أحد، إثنين، ثلاثاء، أربعاء، خميس، جمعة
        : ['S', 'S', 'M', 'T', 'W', 'T', 'F'],

    // Full day names
    dayNames: isRTL
        ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
        : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],

    // Month names
    monthNames: isRTL
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

    // Time slots
    noAppointments: isRTL ? 'لا توجد مواعيد' : 'No appointments',
    schedule: isRTL ? 'جدولة' : 'Schedule',

    // Event cards
    joinCall: isRTL ? 'انضم للمكالمة' : 'Join Call',
    call: isRTL ? 'اتصال' : 'Call',
    details: isRTL ? 'التفاصيل' : 'Details',
    min: isRTL ? 'د' : 'min',

    // Time labels
    am: isRTL ? 'ص' : 'AM',
    pm: isRTL ? 'م' : 'PM',

    // ===== Add Call Modal =====
    newAppointment: isRTL ? 'موعد جديد' : 'New Appointment',
    client: isRTL ? 'العميل' : 'Client',
    selectClient: isRTL ? 'اختر العميل...' : 'Select client...',
    date: isRTL ? 'التاريخ' : 'Date',
    time: isRTL ? 'الوقت' : 'Time',
    reason: isRTL ? 'السبب' : 'Reason',
    reasonPlaceholder: isRTL ? 'مثال: متابعة النظام الغذائي' : 'e.g., Diet plan follow-up',
    notes: isRTL ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: isRTL ? 'أضف ملاحظات...' : 'Add notes...',
    reminders: isRTL ? 'التذكيرات' : 'Reminders',
    remind15Min: isRTL ? 'ذكرني قبل 15 دقيقة' : 'Remind me 15 minutes before',
    remindClient1Hour: isRTL ? 'ذكر العميل قبل ساعة' : 'Remind client 1 hour before',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    createAppointment: isRTL ? 'إنشاء الموعد' : 'Create Appointment',
    creating: isRTL ? 'جاري الإنشاء...' : 'Creating...',
    phoneCall: isRTL ? 'مكالمة هاتفية' : 'Phone Call',
    errorSelectClient: isRTL ? 'يرجى اختيار عميل' : 'Please select a client',
    errorEnterReason: isRTL ? 'يرجى إدخال السبب' : 'Please enter a reason',
    errorOverlap: isRTL ? 'يوجد موعد آخر في هذا الوقت' : 'This time slot overlaps with an existing appointment',
};

// Get day name from JS day index (0=Sun, 6=Sat)
export const getDayNameFromIndex = (dayIndex: number): string => {
    // Convert JS day (0=Sun, 6=Sat) to our format (0=Sat)
    const adjustedIndex = dayIndex === 6 ? 0 : dayIndex + 1;
    return dayViewTranslations.dayNames[adjustedIndex];
};

// Get day letter from JS day index
export const getDayLetterFromIndex = (dayIndex: number): string => {
    const adjustedIndex = dayIndex === 6 ? 0 : dayIndex + 1;
    return dayViewTranslations.dayLetters[adjustedIndex];
};

// Get month name
export const getMonthName = (monthIndex: number): string => {
    return dayViewTranslations.monthNames[monthIndex];
};

// Format hour label
export const formatHour = (hour: number): string => {
    const { am, pm } = dayViewTranslations;
    if (hour === 12) return `12 ${pm}`;
    if (hour > 12) return `${hour - 12} ${pm}`;
    return `${hour} ${am}`;
};

