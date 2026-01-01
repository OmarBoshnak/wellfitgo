/**
 * Meal Plan Translations
 * English/Arabic strings for the Create Meal Plan flow
 */
import { isRTL } from '@/src/core/constants/translations';

export const t = {
    // Bottom Sheet
    mealPlanFor: isRTL ? 'خطة الوجبات لـ' : 'Meal Plan for',
    selectOption: isRTL ? 'اختر خياراً لإدارة الخطة' : 'Select an option to manage the plan',
    currentlyAssigned: isRTL ? 'معين حالياً' : 'Currently Assigned',
    since: isRTL ? 'منذ:' : 'Since:',
    modify: isRTL ? 'تعديل' : 'Modify',
    remove: isRTL ? 'إزالة' : 'Remove',

    // Plan Options
    assignFromLibrary: isRTL ? 'تعيين من المكتبة' : 'Assign from Library',
    assignFromLibraryDesc: isRTL ? 'اختر برنامج غذائي موجود' : 'Choose an existing diet program',
    createCustomPlan: isRTL ? 'إنشاء خطة مخصصة' : 'Create Custom Plan',
    createCustomPlanDesc: isRTL ? 'أنشئ خطة مخصصة من البداية' : 'Build a personalized plan from scratch',
    copyFromClient: isRTL ? 'نسخ من عميل آخر' : 'Copy from Another Client',
    copyFromClientDesc: isRTL ? 'استخدم خطة تعمل بشكل جيد' : "Use a plan that's working well",

    // Basic Info Screen
    customPlan: isRTL ? 'خطة مخصصة' : 'Custom Plan',
    planName: isRTL ? 'اسم الخطة' : 'Plan Name',
    basedOn: isRTL ? 'مبني على' : 'Based On',
    optional: isRTL ? '(اختياري)' : '(optional)',
    startFresh: isRTL ? 'ابدأ من جديد' : 'Start fresh',
    dailyCalories: isRTL ? 'السعرات اليومية' : 'Daily Calories',
    calPerDay: isRTL ? 'سعرة/يوم' : 'cal/day',
    aiRecommended: isRTL ? 'موصى به:' : 'Recommended:',
    aiRecommendedHint: isRTL
        ? 'بناءً على أهداف العميل ومعدل الأيض.'
        : 'based on client goals and metabolic rate.',
    numberOfMeals: isRTL ? 'عدد الوجبات' : 'Number of Meals',
    duration: isRTL ? 'المدة' : 'Duration',
    oneWeek: isRTL ? 'أسبوع واحد' : '1 week',
    twoWeeks: isRTL ? 'أسبوعين' : '2 weeks',
    oneMonth: isRTL ? 'شهر واحد' : '1 month',
    ongoing: isRTL ? 'مستمر' : 'Ongoing',
    nextAddMeals: isRTL ? 'التالي: إضافة الوجبات' : 'Next: Add Meals',

    // Client Card
    target: isRTL ? 'الهدف:' : 'Target:',
    goal: isRTL ? 'الهدف:' : 'Goal:',
    weightLoss: isRTL ? 'فقدان الوزن' : 'Weight Loss',

    // Add Meals Screen
    addMeals: isRTL ? 'إضافة الوجبات' : 'Add Meals',
    customizeMealsFor: isRTL ? 'تخصيص الوجبات لخطة' : "Customize meals for",
    plan: isRTL ? '' : "'s plan",
    categories: isRTL ? 'فئات' : 'categories',
    empty: isRTL ? 'فارغ' : 'Empty',
    addCategory: isRTL ? 'إضافة فئة' : 'Add Category',
    startAddingItems: isRTL ? 'ابدأ إضافة العناصر' : 'Start Adding Items',
    nextReview: isRTL ? 'التالي: المراجعة' : 'Next: Review',

    // Meal Names
    breakfast: isRTL ? 'الافطار' : 'Breakfast',
    morningSnack: isRTL ? 'سناك الصباح' : 'Morning Snack',
    lunch: isRTL ? 'الغداء' : 'Lunch',
    afternoonSnack: isRTL ? 'سناك العصر' : 'Afternoon Snack',
    dinner: isRTL ? 'العشاء' : 'Dinner',

    // Review Screen
    reviewPlan: isRTL ? 'مراجعة الخطة' : 'Review Plan',
    custom: isRTL ? 'مخصص' : 'Custom',
    highProtein: isRTL ? 'عالي البروتين' : 'High Protein',
    kcal: isRTL ? 'سعرة' : 'kcal',
    meals: isRTL ? 'وجبات' : 'meals',
    macroSplit: isRTL ? 'توزيع الماكروز' : 'Macro Split',
    dailyAvg: isRTL ? 'المتوسط اليومي' : 'Daily Avg',
    total: isRTL ? 'الإجمالي' : 'TOTAL',
    protein: isRTL ? 'بروتين' : 'Protein',
    carbs: isRTL ? 'كربوهيدرات' : 'Carbs',
    fat: isRTL ? 'دهون' : 'Fat',
    foodOptionsAvailable: isRTL ? 'خيارات طعام متاحة' : 'food options available',
    mealsPreview: isRTL ? 'معاينة الوجبات' : 'Meals Preview',
    options: isRTL ? 'خيارات' : 'options',
    nextAssignPlan: isRTL ? 'التالي: تعيين الخطة' : 'Next: Assign Plan',

    // Warnings
    warningNoProtein: isRTL ? 'الغداء ليس به خيارات بروتين' : 'Lunch has no protein options',
    addProteinCategory: isRTL ? 'إضافة فئة بروتين' : 'Add protein category',

    // Assign Screen
    assignPlan: isRTL ? 'تعيين الخطة' : 'Assign Plan',
    willReceive: isRTL ? 'سيتلقى:' : 'Will receive:',
    startDate: isRTL ? 'تاريخ البدء' : 'Start Date',
    tomorrow: isRTL ? 'غداً' : 'Tomorrow',
    notifications: isRTL ? 'الإشعارات' : 'Notifications',
    sendPushNotification: isRTL ? 'إرسال إشعار' : 'Send push notification',
    sendEmailWithPDF: isRTL ? 'إرسال بريد مع PDF' : 'Send email with PDF',
    sendViaWhatsApp: isRTL ? 'إرسال عبر واتساب' : 'Send via WhatsApp',
    personalMessage: isRTL ? 'رسالة شخصية' : 'Personal Message',
    addMessageFor: isRTL ? 'أضف رسالة لـ' : 'Add a message for',
    saveAsTemplate: isRTL ? 'حفظ كقالب للعملاء الآخرين' : 'Save as template for other clients',
    saveAsDraft: isRTL ? 'حفظ كمسودة' : 'Save as Draft',
    assign: isRTL ? 'تعيين الخطة' : 'Assign Plan',

    // Common
    back: isRTL ? 'رجوع' : 'Back',
    next: isRTL ? 'التالي' : 'Next',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    confirm: isRTL ? 'تأكيد' : 'Confirm',
    edit: isRTL ? 'تعديل' : 'Edit',
    save: isRTL ? 'حفظ' : 'Save',
    delete: isRTL ? 'حذف' : 'Delete',

    // Category Modal
    selectCategoryType: isRTL ? 'اختر نوع الفئة' : 'Select Category Type',
    itemDescription: isRTL ? 'وصف العنصر' : 'Item Description',
    itemDescriptionPlaceholder: isRTL ? 'مثال: 2 بيض مسلوق' : 'e.g., 2 Large Eggs, Boiled',
    editCategory: isRTL ? 'تعديل الفئة' : 'Edit Category',
    deleteCategory: isRTL ? 'حذف الفئة' : 'Delete Category',
    deleteCategoryConfirm: isRTL ? 'هل أنت متأكد من حذف هذه الفئة؟' : 'Are you sure you want to delete this category?',
    atLeastOneMeal: isRTL ? 'يجب إضافة فئة واحدة على الأقل' : 'Please add at least one category to a meal',

    // Dashboard
    active: isRTL ? 'نشط' : 'Active',
    thisWeek: isRTL ? 'هذا الأسبوع' : 'This Week',
    mealsDone: isRTL ? 'وجبات مكتملة' : 'Meals Done',
    reminderSet: isRTL ? 'تم ضبط التذكير' : 'Reminder Set',
    viewPlan: isRTL ? 'عرض الخطة' : 'View Plan',
    remind: isRTL ? 'تذكير' : 'Remind',
    contactCoach: isRTL ? 'تواصل مع المدرب' : 'Contact Coach',
    weekLabel: isRTL ? 'الأسبوع' : 'Week',
    started: isRTL ? 'بدأت' : 'Started',
    ongoingPlan: isRTL ? 'مستمر' : 'Ongoing',
    noActivePlan: isRTL ? 'لا توجد خطة نشطة' : 'No Active Plan',
    today: isRTL ? 'اليوم' : 'Today',
    completed: isRTL ? 'مكتمل' : 'Completed',
    scheduled: isRTL ? 'مجدول' : 'Scheduled',

    // Day Abbreviations (Saturday first)
    daySat: isRTL ? 'السبت' : 'Sat',
    daySun: isRTL ? 'الأحد' : 'Sun',
    dayMon: isRTL ? 'الإثنين' : 'Mon',
    dayTue: isRTL ? 'الثلاثاء' : 'Tue',
    dayWed: isRTL ? 'الأربعاء' : 'Wed',
    dayThu: isRTL ? 'الخميس' : 'Thu',
    dayFri: isRTL ? 'الجمعة' : 'Fri',
};
