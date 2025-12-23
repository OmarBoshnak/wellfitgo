import { isRTL } from '@/src/constants/translations';

export const t = {
    premiumClient: isRTL ? 'عميل مميز' : 'Premium Client',
    start: isRTL ? 'البداية' : 'Start',
    current: isRTL ? 'الحالي' : 'Current',
    target: isRTL ? 'الهدف' : 'Target',
    toGo: isRTL ? 'متبقي' : 'to go',
    sendMessage: isRTL ? 'إرسال رسالة' : 'Send Message',
    createMealPlan: isRTL ? 'إنشاء خطة وجبات' : 'Create Meal Plan',
    scheduleCall: isRTL ? 'جدولة مكالمة' : 'Schedule Call',
    overview: isRTL ? 'نظرة عامة' : 'Overview',
    mealPlan: isRTL ? 'خطة الوجبات' : 'Meal Plan',
    progress: isRTL ? 'التقدم' : 'Progress',
    messages: isRTL ? 'الرسائل' : 'Messages',
    notes: isRTL ? 'الملاحظات' : 'Notes',
    settings: isRTL ? 'الإعدادات' : 'Settings',
    thisWeek: isRTL ? 'هذا الأسبوع' : 'This Week',
    mealsDone: isRTL ? 'وجبات مكتملة' : 'meals done',
    completed: isRTL ? 'مكتمل' : 'Completed',
    friday: isRTL ? 'الجمعة' : 'Friday',
    good: isRTL ? 'جيد' : 'Good',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    weightThisWeek: isRTL ? 'الوزن هذا الأسبوع' : 'Weight This Week',
    toTarget: isRTL ? 'للهدف' : 'to target',
    weightProgress: isRTL ? 'تقدم الوزن' : 'Weight Progress',
    recentActivity: isRTL ? 'النشاط الأخير' : 'Recent Activity',
    loadMore: isRTL ? 'تحميل المزيد' : 'Load More',
    weekDateRange: isRTL ? 'ديس 9-15' : 'Dec 9-15',
    placeholderText: isRTL ? 'سيتم عرض المحتوى هنا' : 'Content will be displayed here',
    // Chart period translations
    chartPeriod1M: isRTL ? 'شهر' : '1M',
    chartPeriod3M: isRTL ? '٣ أشهر' : '3M',
    chartPeriod6M: isRTL ? '٦ أشهر' : '6M',
    chartPeriod1Y: isRTL ? 'سنة' : '1Y',
    chartPeriodAll: isRTL ? 'الكل' : 'All',
    // Weight chart footer
    goal: isRTL ? 'الهدف' : 'Goal',
    projected: isRTL ? 'المتوقع' : 'Projected ',
};

// Chart period labels mapping
export const chartPeriodLabels: Record<string, string> = {
    '1M': t.chartPeriod1M,
    '3M': t.chartPeriod3M,
    '6M': t.chartPeriod6M,
    '1Y': t.chartPeriod1Y,
    'All': t.chartPeriodAll,
};
