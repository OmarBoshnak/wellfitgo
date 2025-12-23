/**
 * Meal Plan Constants
 * Design tokens and configuration matching HTML/Tailwind mockups
 */

// Colors extracted from HTML designs
export const mealPlanColors = {
    // Primary palette
    primary: '#5f38fa',
    primaryLight: '#7b5aff',
    primaryDark: '#4a2bc2',
    primarySoft: '#e9e6f4',

    // Backgrounds
    backgroundLight: '#f6f5f8',
    backgroundDark: '#130f23',
    cardLight: '#ffffff',
    cardDark: '#1e1b2e',
    cardDarkAlt: '#25203b',

    // Text colors
    textMain: '#100d1c',
    textSlate: '#526477',
    textDesc: '#8093A5',
    textSubtext: '#8093A5',

    // Status colors
    warningBorder: '#E2B93B',
    warningBg: 'rgba(226, 185, 59, 0.1)',
    statusGreen: '#27AE61',
    statusRed: '#EB5757',
    actionBlue: '#5073FE',

    // Chart colors
    chartProtein: '#5f38fa',
    chartCarbs: '#0ea5e9',
    chartFat: '#f59e0b',

    // UI elements
    dragHandle: '#d3cee9',
    border: '#d3cee9',
    borderDark: '#4b5563',
    backdrop: 'rgba(20, 20, 20, 0.4)',
};

// Gradients
export const mealPlanGradients = {
    primary: ['#5f38fa', '#7b5aff'] as const,
    card: ['#5f38fa', '#896dfc'] as const,
    heroCard: ['#5f38fa', '#7a5af8'] as const,
    button: ['#5f38fa', '#7c5dfa'] as const,
};

// Border radius values
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

// Shadows
export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    bottomSheet: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 20,
    },
    primaryButton: {
        shadowColor: '#5f38fa',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
};

// Default calorie range
export const calorieConfig = {
    min: 1000,
    max: 2500,
    default: 1300,
    recommendedMin: 1300,
    recommendedMax: 1400,
};

// Duration options
export const durationOptions = [
    { id: 'week', label: '1 week', labelAr: 'أسبوع واحد' },
    { id: '2weeks', label: '2 weeks', labelAr: 'أسبوعين' },
    { id: 'month', label: '1 month', labelAr: 'شهر واحد' },
    { id: 'ongoing', label: 'Ongoing', labelAr: 'مستمر' },
] as const;

// Number of meals options
export const mealCountOptions = [3, 4, 5, 6] as const;

// Default meals structure
export const defaultMeals = [
    {
        id: 'breakfast',
        name: 'Breakfast',
        nameAr: 'الافطار',
        emoji: '☀️',
        categories: [],
        isExpanded: true,
    },
    {
        id: 'morning-snack',
        name: 'Morning Snack',
        nameAr: 'سناك الصباح',
        emoji: '🍎',
        categories: [],
        isExpanded: false,
    },
    {
        id: 'lunch',
        name: 'Lunch',
        nameAr: 'الغداء',
        emoji: '🍽️',
        categories: [],
        isExpanded: false,
    },
    {
        id: 'afternoon-snack',
        name: 'Afternoon Snack',
        nameAr: 'سناك العصر',
        emoji: '🥜',
        categories: [],
        isExpanded: false,
    },
    {
        id: 'dinner',
        name: 'Dinner',
        nameAr: 'العشاء',
        emoji: '🌙',
        categories: [],
        isExpanded: false,
    },
];

// Plan options for bottom sheet
export const planOptions = [
    {
        id: 'library',
        icon: 'library-outline',
        title: 'Assign from Library',
        titleAr: 'تعيين من المكتبة',
        description: 'Choose an existing diet program',
        descriptionAr: 'اختر برنامج غذائي موجود',
    },
    {
        id: 'custom',
        icon: 'create-outline',
        title: 'Create Custom Plan',
        titleAr: 'إنشاء خطة مخصصة',
        description: 'Build a personalized plan from scratch',
        descriptionAr: 'أنشئ خطة مخصصة من البداية',
    },
    {
        id: 'copy',
        icon: 'copy-outline',
        title: 'Copy from Another Client',
        titleAr: 'نسخ من عميل آخر',
        description: "Use a plan that's working well",
        descriptionAr: 'استخدم خطة تعمل بشكل جيد',
    },
] as const;

// Template plans for "Based On" selector
export const templatePlans = [
    { id: 'fresh', name: 'Start fresh', nameAr: 'ابدأ من جديد' },
    { id: 'classic', name: 'Classic 1200-1300', nameAr: 'كلاسيكي 1200-1300' },
    { id: 'keto', name: 'Keto Beginner', nameAr: 'كيتو للمبتدئين' },
];

// Default macro split for review screen
export const defaultMacros = {
    protein: 30,
    carbs: 45,
    fat: 25,
};

// Category types for add category modal
export const categoryTypes = [
    { id: 'protein', name: 'Protein', nameAr: 'بروتين', emoji: '🥩' },
    { id: 'carbs', name: 'Carbs', nameAr: 'كربوهيدرات', emoji: '🍞' },
    { id: 'dairy', name: 'Dairy', nameAr: 'ألبان', emoji: '🥛' },
    { id: 'fruits', name: 'Fruits', nameAr: 'فواكه', emoji: '🍎' },
    { id: 'vegetables', name: 'Vegetables', nameAr: 'خضروات', emoji: '🥗' },
    { id: 'fats', name: 'Fats', nameAr: 'دهون', emoji: '🥑' },
    { id: 'beverages', name: 'Beverages', nameAr: 'مشروبات', emoji: '☕' },
] as const;

// Meal preview icons config
export const mealIcons = {
    breakfast: { icon: 'wb_twilight', bgLight: '#FED7AA', bgDark: 'rgba(234, 88, 12, 0.3)', color: '#EA580C' },
    lunch: { icon: 'light_mode', bgLight: '#BFDBFE', bgDark: 'rgba(37, 99, 235, 0.3)', color: '#2563EB' },
    dinner: { icon: 'dark_mode', bgLight: '#C7D2FE', bgDark: 'rgba(79, 70, 229, 0.3)', color: '#4F46E5' },
    snack: { icon: 'nutrition', bgLight: '#CCFBF1', bgDark: 'rgba(20, 184, 166, 0.3)', color: '#14B8A6' },
};
