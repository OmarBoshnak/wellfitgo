import { isRTL } from '@/src/core/constants/translations';

export const t = {
    // Screen
    screenTitle: isRTL ? 'سجل النشاط' : 'Activity History',
    back: isRTL ? 'رجوع' : 'Back',

    // Actors
    byCoach: isRTL ? 'بواسطة المدرب' : 'By Coach',
    byClient: isRTL ? 'بواسطة العميل' : 'By Client',
    bySystem: isRTL ? 'النظام' : 'System',

    // Activity Types
    weightLogged: isRTL ? 'تم تسجيل الوزن' : 'Weight Logged',
    mealCompleted: isRTL ? 'وجبة مكتملة' : 'Meal Completed',
    messageSent: isRTL ? 'رسالة مرسلة' : 'Message Sent',
    planAssigned: isRTL ? 'تم تعيين خطة' : 'Plan Assigned',
    pausedPlan: isRTL ? 'خطة موقوفة' : 'Plan Paused',
    waterLogged: isRTL ? 'تم تسجيل الماء' : 'Water Logged',
    missedMeal: isRTL ? 'وجبة فائتة' : 'Missed Meal',

    // Empty State
    noActivities: isRTL ? 'لا يوجد نشاط بعد' : 'No activities yet',

    // Loading
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
};

// Actor label mapping
export const getActorLabel = (actor: 'coach' | 'client' | 'system'): string => {
    switch (actor) {
        case 'coach':
            return t.byCoach;
        case 'client':
            return t.byClient;
        case 'system':
            return t.bySystem;
        default:
            return '';
    }
};
