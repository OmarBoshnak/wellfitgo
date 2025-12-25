import { I18nManager } from 'react-native';

// RTL detection - defaults to true for Arabic-first app
export const isRTL = I18nManager.isRTL || true;

// Auth screen translations
export const authTranslations = {
    // Welcome
    welcomeTitle: isRTL ? 'مرحباً بعودتك' : 'Welcome Back',
    welcomeSubtitle: isRTL ? 'سجل الدخول للمتابعة' : 'Login to continue your journey',

    // Labels
    phoneLabel: isRTL ? 'رقم الهاتف' : 'Phone Number',
    emailLabel: isRTL ? 'البريد الإلكتروني' : 'Email',
    passwordLabel: isRTL ? 'كلمة المرور' : 'Password',

    // Buttons
    sendOTP: isRTL ? 'إرسال رمز التحقق' : 'Send OTP',
    login: isRTL ? 'تسجيل الدخول' : 'Login',
    loginWithEmail: isRTL ? 'تسجيل الدخول بالبريد الإلكتروني' : 'Login with Email',
    loginWithPhone: isRTL ? 'تسجيل الدخول برقم الهاتف' : 'Login with Phone',
    loginWithFacebook: isRTL ? 'تسجيل الدخول بإستخدام فيسبوك' : 'Login with Facebook',
    loginWithGoogle: isRTL ? 'تسجيل الدخول بإستخدام جوجل' : 'Login with Google',
    backToPhone: isRTL ? 'العودة إلى تسجيل الدخول بالهاتف' : 'Back to Phone Login',

    // Links
    forgotPassword: isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?',
    noAccount: isRTL ? 'ليس لديك حساب؟' : "Don't have an account?",
    signUp: isRTL ? 'إنشاء حساب' : 'Sign Up',

    // Other
    orContinueWith: isRTL ? 'أو تابع مع' : 'Or continue with',
    orLoginWith: isRTL ? 'أو سجل دخول عن طريق' : 'Or login with',
    selectCountry: isRTL ? 'اختر الدولة' : 'Select Country',

    // App Welcome
    appWelcome: isRTL ? 'أهلا بيك في ويل. فيت. جو!' : 'Welcome to WellFit Go!',
};

// OTP verification translations
export const otpTranslations = {
    title: isRTL ? 'أدخل رمز التحقق' : 'Enter Verification Code',
    subtitle: isRTL ? 'أرسلنا رمزًا مكونًا من 6 أرقام إلى' : 'We sent a 6-digit code to',
    resendIn: isRTL ? 'إعادة الإرسال خلال' : 'Resend code in',
    resendCode: isRTL ? 'إعادة إرسال الرمز' : 'Resend Code',
    verifying: isRTL ? 'جاري التحقق...' : 'Verifying...',
    verified: isRTL ? 'تم التحقق بنجاح!' : 'Verified Successfully!',
    didntReceive: isRTL ? 'لم تستلم الرمز؟' : "Didn't receive the code?",
    changePhone: isRTL ? 'تغيير رقم الهاتف' : 'Change Phone Number',
};

// Health history / onboarding translations
export const healthTranslations = {
    quickSetup: isRTL ? 'الإعداد السريع' : 'Quick Setup',
    firstName: isRTL ? 'الاسم الأول' : 'First Name',
    lastName: isRTL ? 'الاسم الاخير' : 'Last Name',
    phoneNumber: isRTL ? 'رقم الموبايل' : 'Phone Number',
    enterName: isRTL ? 'أدخل اسمك' : 'Enter your name',
    gender: isRTL ? 'الجنس' : 'Gender',
    male: isRTL ? 'ذكر' : 'Male',
    female: isRTL ? 'أنثى' : 'Female',
    yourAge: isRTL ? 'السن' : 'Your age',
    whatHeight: isRTL ? 'ما هو طولك؟' : 'What is your height?',
    currentWeight: isRTL ? 'الوزن الحالي' : 'Current Weight',
    targetWeight: isRTL ? 'الوزن المستهدف' : 'Target Weight',
    goal: isRTL ? 'الهدف' : 'Goal',
    weightLoss: isRTL ? 'فقدان الوزن' : 'Weight Loss',
    maintainWeight: isRTL ? 'الحفاظ على الوزن' : 'Maintain Weight',
    gainMuscle: isRTL ? 'زيادة العضلات' : 'Gain Muscle',
    medicalConditions: isRTL ? 'هل لديك أي أمراض أخرى؟' : 'Do you have any other medical conditions?',
    medicalPlaceholder: isRTL ? ' مثل الضغط أو السكري' : 'Optional: e.g. blood pressure, diabetes',
    startJourney: isRTL ? 'ابدأ رحلتك' : 'Start Your Journey',
};

// Home screen translations
export const homeTranslations = {
    // Greetings
    goodMorning: isRTL ? 'صباح الخير' : 'Good morning',
    goodAfternoon: isRTL ? 'مساء الخير' : 'Good afternoon',
    goodEvening: isRTL ? 'مساء الخير' : 'Good evening',
    defaultName: isRTL ? 'أحمد' : 'Ahmed',

    // Card titles
    thisWeeksProgress: isRTL ? 'تقدم هذا الأسبوع' : "This Week's Progress",
    todaysPlan: isRTL ? 'خطة اليوم' : "Today's Plan",

    // Weight
    kgUnit: 'kg',
    kgFromLastWeek: isRTL ? 'كجم من الأسبوع الماضي' : 'kg from last week',
    logWeeklyWeight: isRTL ? 'سجل وزن هذا الأسبوع' : "Log This Week's Weight",

    // Today's Focus
    greatJobBreakfast: isRTL ? 'عمل رائع في إفطارك!' : 'Great job on your breakfast!',
    keepMomentum: isRTL ? 'استمر في هذا الزخم' : 'Keep up the momentum',

    // Meals
    proteinOatmeal: isRTL ? 'شوفان بروتين ' : 'Protein Oatmeal ',
    grilledChickenSalad: isRTL ? 'سلطة دجاج مشوي ' : 'Grilled Chicken Salad ',
    nutsFruit: isRTL ? 'مكسرات وفواكه ' : 'Nuts & Fruit ',
    fishVegetables: isRTL ? 'سمك وخضروات ' : 'Fish & Vegetables ',

    // Actions
    viewAll: isRTL ? 'عرض الكل' : 'View All',
    view: isRTL ? 'عرض' : 'View',
    messageCoach: isRTL ? 'رسالة المدرب' : 'Message Coach',
    waterTracker: isRTL ? 'متتبع المياه' : 'Water Tracker',

    // Banner
    newMessageFrom: isRTL ? 'رسالة جديدة من سارة' : 'New message from Sarah',
};

// Tab bar translations
export const tabTranslations = {
    home: isRTL ? 'الرئيسية' : 'Home',
    meals: isRTL ? 'الوجبات' : 'Meals',
    chat: isRTL ? 'المحادثة' : 'Chat',
    profile: isRTL ? 'الملف' : 'Profile',
    comingSoon: isRTL ? 'قريباً...' : 'Coming Soon...',
    profileTitle: isRTL ? 'الملف الشخصي' : 'Profile',
};

// Country data with bilingual names
export const countries = [
    { code: '+20', name: 'Egypt', nameAr: 'مصر', flag: '🇪🇬' },
    { code: '+966', name: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', nameAr: 'الإمارات', flag: '🇦🇪' },
    { code: '+965', name: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼' },
    { code: '+974', name: 'Qatar', nameAr: 'قطر', flag: '🇶🇦' },
    { code: '+973', name: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭' },
    { code: '+968', name: 'Oman', nameAr: 'عمان', flag: '🇴🇲' },
    { code: '+962', name: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴' },
    { code: '+961', name: 'Lebanon', nameAr: 'لبنان', flag: '🇱🇧' },
];

export type Country = typeof countries[number];

// Doctor Dashboard translations
export const doctorTranslations = {
    // Stats Cards
    activeClients: isRTL ? 'العملاء النشطين' : 'Active Clients',
    pendingCheckins: isRTL ? 'تسجيلات الدخول المعلقة' : 'Pending Check-ins',
    unreadMessages: isRTL ? 'رسائل غير مقروءة' : 'Unread Messages',
    plansExpiring: isRTL ? 'خطط تنتهي قريباً' : 'Plans Expiring',
    thisMonth: isRTL ? 'هذا الشهر' : 'This month',
    dueThisWeek: isRTL ? 'مستحقة هذا الأسبوع' : 'Due this week',
    oldestMessage: isRTL ? 'الأقدم: منذ ساعتين' : 'Oldest: 2 hours ago',
    inNextDays: isRTL ? 'خلال 3 أيام' : 'In next 3 days',

    // Section Titles
    needsAttention: isRTL ? 'يحتاج اهتمام 🚨' : 'Needs Attention 🚨',
    todaysAppointments: isRTL ? 'مواعيد اليوم 📅' : "Today's Appointments 📅",
    quickActions: isRTL ? 'إجراءات سريعة' : 'Quick Actions',
    thisWeeksActivity: isRTL ? 'نشاط هذا الأسبوع' : "This Week's Activity",
    recentActivity: isRTL ? 'النشاط الأخير' : 'Recent Activity',

    // Actions
    viewAll: isRTL ? 'عرض الكل' : 'View All',
    message: isRTL ? 'رسالة' : 'Message',
    join: isRTL ? 'انضمام' : 'Join',

    // Quick Actions
    newMealPlan: isRTL ? 'خطة وجبات جديدة' : 'New Meal Plan',
    addClient: isRTL ? 'إضافة عميل' : 'Add Client',
    templates: isRTL ? 'القوالب' : 'Templates',
    reports: isRTL ? 'التقارير' : 'Reports',

    // Weekly Stats
    messages: isRTL ? 'الرسائل' : 'Messages',
    plans: isRTL ? 'الخطط' : 'Plans',
    checkins: isRTL ? 'التسجيلات' : 'Check-ins',

    // Links
    viewFullAnalytics: isRTL ? 'عرض التحليلات الكاملة' : 'View Full Analytics',
    seeAllActivity: isRTL ? 'عرض كل النشاط' : 'See All Activity',

    // Empty States
    noAppointmentsToday: isRTL ? 'لا توجد مواعيد اليوم' : 'No appointments today',
    scheduleOne: isRTL ? 'حدد موعداً' : 'Schedule one',

    // Client Status
    lastActive: isRTL ? 'آخر نشاط:' : 'Last active:',

    // Day Labels (for chart)
    dayLabels: isRTL
        ? ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س']
        : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],

    // Duration
    min: isRTL ? 'دقيقة' : 'min',
};

// Status message translations for mock data
export const statusTranslations: Record<string, string> = {
    // Critical
    'Missed 2 check-ins': isRTL ? 'فاتته 2 تسجيل دخول' : 'Missed 2 check-ins',
    // Warning
    'Weight +1.5kg this week': isRTL ? 'الوزن +1.5 كجم هذا الأسبوع' : 'Weight +1.5kg this week',
    // Info
    'Requested plan change': isRTL ? 'طلب تغيير الخطة' : 'Requested plan change',
};

// Time translations for mock data
export const timeTranslations: Record<string, string> = {
    '10 days ago': isRTL ? 'منذ 10 أيام' : '10 days ago',
    '2 hours ago': isRTL ? 'منذ ساعتين' : '2 hours ago',
    '2 min ago': isRTL ? 'منذ دقيقتين' : '2 min ago',
    '15 min ago': isRTL ? 'منذ 15 دقيقة' : '15 min ago',
    '1 hour ago': isRTL ? 'منذ ساعة' : '1 hour ago',
    '3 hours ago': isRTL ? 'منذ 3 ساعات' : '3 hours ago',
    '30 min': isRTL ? '30 دقيقة' : '30 min',
    '45 min': isRTL ? '45 دقيقة' : '45 min',
};

// Activity text translations
export const activityTranslations: Record<string, string> = {
    'Sara Ahmed logged weight 68kg': isRTL ? 'سارة أحمد سجلت وزن 68 كجم' : 'Sara Ahmed logged weight 68kg',
    'New message from Karim': isRTL ? 'رسالة جديدة من كريم' : 'New message from Karim',
    'Layla completed all meals': isRTL ? 'ليلى أكملت جميع الوجبات' : 'Layla completed all meals',
    'Mohamed opened meal plan': isRTL ? 'محمد فتح خطة الوجبات' : 'Mohamed opened meal plan',
    'You created plan for Ahmed': isRTL ? 'أنشأت خطة لأحمد' : 'You created plan for Ahmed',
};

// Helper function to translate status
export const translateStatus = (status: string): string => {
    return statusTranslations[status] || status;
};

// Helper function to translate time
export const translateTime = (time: string): string => {
    return timeTranslations[time] || time;
};

// Helper function to translate activity text
export const translateActivity = (text: string): string => {
    return activityTranslations[text] || text;
};

// Client names (bilingual)
export const clientNames: Record<string, string> = {
    'Ahmed Hassan': isRTL ? 'أحمد حسن' : 'Ahmed Hassan',
    'Layla Mohamed': isRTL ? 'ليلى محمد' : 'Layla Mohamed',
    'Karim Ali': isRTL ? 'كريم علي' : 'Karim Ali',
    'Sara Ahmed': isRTL ? 'سارة أحمد' : 'Sara Ahmed',
    'Mohamed Ali': isRTL ? 'محمد علي' : 'Mohamed Ali',
};

// Helper function to translate client names
export const translateName = (name: string): string => {
    return clientNames[name] || name;
};

// ============ ATTENTION DASHBOARD TRANSLATIONS ============
export const attentionTranslations = {
    // Status messages
    unreadMessage: isRTL ? 'رسالة غير مقروءة' : 'Unread message',
    weightGain: isRTL ? 'زيادة +{x} كجم هذا الأسبوع' : 'Weight +{x}kg this week',
    noCheckinDays: isRTL ? 'لا تسجيل منذ {x} أيام' : 'No check-in for {x} days',
    noCheckinYet: isRTL ? 'لا توجد تسجيلات وزن بعد' : 'No weigh-ins yet',

    // Empty state
    noClientsNeedAttention: isRTL ? 'لا يوجد عملاء يحتاجون انتباه' : 'No clients need attention',
    allClientsOnTrack: isRTL ? 'جميع العملاء على المسار الصحيح! 🎉' : 'All clients are on track! 🎉',

    // Loading state
    loadingClients: isRTL ? 'جاري تحميل العملاء...' : 'Loading clients...',

    // Error state
    errorLoadingClients: isRTL ? 'فشل في تحميل العملاء' : 'Failed to load clients',
    tapToRetry: isRTL ? 'اضغط لإعادة المحاولة' : 'Tap to retry',

    // Time ago
    justNow: isRTL ? 'الآن' : 'just now',
    minutesAgo: isRTL ? 'منذ {x} د' : '{x}m ago',
    hoursAgo: isRTL ? 'منذ {x} س' : '{x}h ago',
    daysAgo: isRTL ? 'منذ {x} ي' : '{x}d ago',
    weeksAgo: isRTL ? 'منذ {x} أ' : '{x}w ago',
};

// ============ APPOINTMENTS TRANSLATIONS ============
export const appointmentTranslations = {
    // Status badges
    startingSoon: isRTL ? 'يبدأ قريباً' : 'Starting soon',
    inProgress: isRTL ? 'جاري الآن' : 'In progress',
    upcoming: isRTL ? 'قادم' : 'Upcoming',

    // Call types
    videoCall: isRTL ? 'مكالمة فيديو' : 'Video call',
    phoneCall: isRTL ? 'مكالمة هاتفية' : 'Phone call',

    // Actions
    startCall: isRTL ? 'بدء المكالمة' : 'Start call',
    joinCall: isRTL ? 'انضمام' : 'Join',

    // Duration
    minutes: isRTL ? '{x} دقيقة' : '{x} min',

    // Loading/Empty/Error
    loadingAppointments: isRTL ? 'جاري تحميل المواعيد...' : 'Loading...',
    errorLoadingAppointments: isRTL ? 'فشل في تحميل المواعيد' : 'Failed to load',
    enjoyYourDay: isRTL ? 'استمتع بيومك الحر! 🎉' : 'Enjoy your free day! 🎉',

    // Time
    inXMinutes: isRTL ? 'خلال {x} دقيقة' : 'in {x} min',
    now: isRTL ? 'الآن' : 'Now',
};

