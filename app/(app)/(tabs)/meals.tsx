import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '@/src/core/constants/Themes';
import { ScaleFontSize, verticalScale, horizontalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';
import { Meal, MealCategory } from '@/src/types/meals';
import { MealCard } from '@/src/features/meals/components/MealCard';
import { DailyMealCard } from '@/src/features/meals/components/DailyMealCard';
import { DayNavigator } from '@/src/features/meals/components/DayNavigator';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// ============ TIMEZONE-SAFE DATE HELPERS ============

/**
 * Get local date string in YYYY-MM-DD format
 * CRITICAL: Use local timezone, NOT toISOString() which uses UTC
 */
const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date in local timezone
 */
const getTodayDateString = (): string => getLocalDateString(new Date());

// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

// ============ SKELETON LOADER COMPONENT ============

const MealsSkeleton = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[styles.skeletonBox, { width: 150, height: 24 }]} />
            </View>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Diet Card Skeleton */}
                <View style={[styles.dietCard, styles.skeletonCard]}>
                    <View style={[styles.skeletonBox, { width: '60%', height: 20, marginBottom: 12 }]} />
                    <View style={[styles.skeletonBox, { width: '40%', height: 16, marginBottom: 8 }]} />
                    <View style={[styles.skeletonBox, { width: '80%', height: 14 }]} />
                </View>
                {/* Calendar Skeleton */}
                <View style={[styles.calendarCard, styles.skeletonCard]}>
                    <View style={[styles.skeletonBox, { width: '50%', height: 20, marginBottom: 16 }]} />
                    <View style={styles.calendarGrid}>
                        {Array(35).fill(0).map((_, i) => (
                            <View key={i} style={styles.calendarDayCell}>
                                <View style={[styles.skeletonBox, { width: 32, height: 32, borderRadius: 8 }]} />
                            </View>
                        ))}
                    </View>
                </View>
                {/* Meal Cards Skeleton */}
                {[1, 2, 3].map((i) => (
                    <View key={i} style={[styles.skeletonMealCard, styles.skeletonCard]}>
                        <View style={[styles.skeletonBox, { width: '50%', height: 18, marginBottom: 8 }]} />
                        <View style={[styles.skeletonBox, { width: '70%', height: 14, marginBottom: 6 }]} />
                        <View style={[styles.skeletonBox, { width: '60%', height: 14 }]} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

// ============ NO PLAN STATE COMPONENT ============

const NoPlanState = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
                    {isRTL ? 'برنامج التغذية' : 'My Diet Program'}
                </Text>
            </View>
            <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateEmoji}>🥗</Text>
                <Text style={[styles.emptyStateTitle, isRTL && styles.textRTL]}>
                    {isRTL ? 'في انتظار خطة النظام الغذائي' : 'Waiting for Your Diet Plan'}
                </Text>
                <Text style={[styles.emptyStateSubtitle, isRTL && styles.textRTL]}>
                    {isRTL
                        ? 'سيقوم مدربك بتعيين خطة نظام غذائي لك قريباً. سيتم تحديث هذه الشاشة تلقائياً.'
                        : 'Your coach will assign a diet plan for you soon. This screen will update automatically.'}
                </Text>
                <View style={styles.emptyStateHint}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.primaryDark} />
                    <Text style={[styles.emptyStateHintText, isRTL && styles.textRTL]}>
                        {isRTL ? 'تواصل مع مدربك للبدء' : 'Message your coach to get started'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// ============ ERROR STATE COMPONENT ============

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Text style={styles.headerTitle}>{isRTL ? 'برنامج التغذية' : 'My Diet Program'}</Text>
            </View>
            <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateEmoji}>⚠️</Text>
                <Text style={[styles.emptyStateTitle, isRTL && styles.textRTL]}>
                    {isRTL ? 'حدث خطأ' : 'Something went wrong'}
                </Text>
                <Text style={[styles.emptyStateSubtitle, isRTL && styles.textRTL]}>
                    {isRTL ? 'تعذر تحميل خطة الوجبات الخاصة بك.' : 'Could not load your meal plan.'}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Ionicons name="refresh" size={20} color={colors.white} />
                    <Text style={styles.retryButtonText}>{isRTL ? 'حاول مرة أخرى' : 'Try Again'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ============ MAIN COMPONENT ============

const MealsScreen = () => {
    const insets = useSafeAreaInsets();

    // --- Today's date in local timezone ---
    const today = useMemo(() => new Date(), []);
    const todayString = useMemo(() => getTodayDateString(), []);

    // --- Calendar state ---
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(todayString);

    // --- Daily format day navigation (must be before queries) ---
    const [dayOffset, setDayOffset] = useState(0); // 0 = today, -1 = yesterday, +1 = tomorrow

    // Calculate viewing date for daily format based on offset
    const viewingDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        return getLocalDateString(date);
    }, [dayOffset]);

    // --- Convex queries ---
    const activePlan = useQuery(api.meals.getMyActivePlan);

    // For daily format, use viewingDate (based on dayOffset); for general format, use selectedDate
    // We need two queries because we don't know the format until we get the active plan
    const generalDayView = useQuery(api.meals.getDayView, { date: selectedDate });
    const dailyDayView = useQuery(api.meals.getDayView,
        activePlan?.format === 'daily' ? { date: viewingDate } : 'skip'
    );

    // Use the appropriate query based on format
    const dayView = activePlan?.format === 'daily' ? dailyDayView : generalDayView;

    const mealHistory = useQuery(api.meals.getMyFullMealHistory, {
        month: currentMonth + 1, // API expects 1-12
        year: currentYear,
    });

    // --- Convex mutations ---
    const completeMealMutation = useMutation(api.mealCompletions.completeMeal);
    const uncompleteMealMutation = useMutation(api.mealCompletions.uncompleteMeal);
    const selectMealOptionMutation = useMutation(api.meals.selectMealOption);
    const requestPlanChangeMutation = useMutation(api.meals.requestPlanChange);

    // --- Local UI State ---
    const [showHelp, setShowHelp] = useState(false);
    const [expandedBottomSheet, setExpandedBottomSheet] = useState<{ mealId: string; categoryId: string } | null>(null);
    const [showChangeRequest, setShowChangeRequest] = useState(false);
    const [changeRequestMeal, setChangeRequestMeal] = useState<{ name: string; nameAr?: string } | null>(null);
    const [changeRequestReason, setChangeRequestReason] = useState('other');
    const [changeRequestMessage, setChangeRequestMessage] = useState('');
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [successType, setSuccessType] = useState<'meal' | 'message'>('meal');

    // --- Optimistic UI state ---
    const [optimisticCompletions, setOptimisticCompletions] = useState<Set<string>>(new Set());
    const [optimisticDailyCompletions, setOptimisticDailyCompletions] = useState<Set<string>>(new Set());
    const [optimisticSelections, setOptimisticSelections] = useState<Map<string, { categoryId: string; optionId: string }>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calendar navigation
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days: (number | null)[] = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }, [currentMonth, currentYear]);

    // Check if a day should show completion status
    const getDayStatus = useCallback((day: number): 'complete' | 'partial' | 'none' | 'future' | 'before' | 'selected' => {
        const date = new Date(currentYear, currentMonth, day);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        // Future dates
        if (date > todayDate) {
            return 'future';
        }

        const dateKey = getLocalDateString(date);

        // Check if this date is selected
        if (dateKey === selectedDate && dateKey !== todayString) {
            return 'selected';
        }

        // Check completion from real backend data
        const completion = mealHistory?.[dateKey];

        if (!completion) return 'none';
        if (completion.completed === completion.total && completion.total > 0) return 'complete';
        if (completion.completed > 0) return 'partial';
        return 'none';
    }, [currentYear, currentMonth, mealHistory, selectedDate, todayString]);

    // Handle calendar day press
    const handleDayPress = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        // Don't allow selecting future dates
        if (date > todayDate) return;

        const dateKey = getLocalDateString(date);
        setSelectedDate(dateKey);
    };

    // --- Handlers ---
    const selectOption = (mealId: string, categoryId: string, optionId: string) => {
        // Only update local state - selection will be saved when user presses "اكلت هذا"
        const key = `${mealId}_${categoryId}`;
        setOptimisticSelections(prev => new Map(prev).set(key, { categoryId, optionId }));
    };

    const openBottomSheet = (mealId: string, categoryId: string) => {
        setExpandedBottomSheet({ mealId, categoryId });
    };

    const selectFromBottomSheet = (optionId: string) => {
        if (expandedBottomSheet) {
            selectOption(expandedBottomSheet.mealId, expandedBottomSheet.categoryId, optionId);
            setExpandedBottomSheet(null);
        }
    };

    const handleCompleteMeal = async (mealId: string) => {
        const meal = dayView?.meals.find(m => m.id === mealId);
        if (!meal) return;

        // Optimistic update
        setOptimisticCompletions(prev => new Set([...prev, mealId]));
        setSuccessType('meal');
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 1500);

        try {
            const selectedOptions = meal.categories
                .filter(cat => cat.options.some(opt => opt.selected))
                .map(cat => {
                    const selectedOpt = cat.options.find(opt => opt.selected)!;
                    return {
                        categoryId: cat.id,
                        categoryName: isRTL ? (cat.nameAr || cat.name) : cat.name,
                        optionId: selectedOpt.id,
                        optionText: selectedOpt.text,
                    };
                });

            await completeMealMutation({
                mealId,
                date: selectedDate,
                mealType: meal.name.toLowerCase(),
                selectedOptions,
            });
            console.log('[Meals] Completed meal synced with Convex');
        } catch (error) {
            console.error('[Meals] Failed to sync meal completion:', error);
            // Rollback optimistic update
            setOptimisticCompletions(prev => {
                const next = new Set(prev);
                next.delete(mealId);
                return next;
            });
        }
    };

    const changeMealChoices = async (mealId: string) => {
        // Optimistic update - remove from completions
        setOptimisticCompletions(prev => {
            const next = new Set(prev);
            next.delete(mealId);
            return next;
        });

        try {
            await uncompleteMealMutation({
                mealId,
                date: selectedDate,
            });
            console.log('[Meals] Meal uncompleted synced with Convex');
        } catch (error) {
            console.error('[Meals] Failed to sync meal uncomplete:', error);
        }
    };

    const isMealReadyToComplete = (meal: Meal) => {
        return meal.categories.every(cat => cat.options.some(opt => opt.selected));
    };

    const getMealSummary = (meal: Meal) => {
        return meal.categories.map(cat => {
            const selected = cat.options.find(opt => opt.selected);
            return selected ? selected.text : '';
        }).filter(Boolean);
    };

    const handleSendChangeRequest = async () => {
        setIsSubmitting(true);
        try {
            await requestPlanChangeMutation({
                reason: changeRequestReason,
                message: changeRequestMessage,
                mealName: changeRequestMeal?.name || '',
                mealNameAr: changeRequestMeal?.nameAr || '',
            });
            setShowChangeRequest(false);
            setChangeRequestMessage('');
            setChangeRequestReason('other');
            setChangeRequestMeal(null);
            // Show success animation with message sent feedback
            setSuccessType('message');
            setShowSuccessAnimation(true);
            setTimeout(() => setShowSuccessAnimation(false), 2000);
        } catch (error) {
            console.error('[Meals] Failed to send change request:', error);
            // TODO: Show error toast
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============ DAILY FORMAT HANDLERS ============

    // Handle daily meal completion
    const handleDailyMealComplete = async (dailyMealId: string, noteAr: string) => {
        // Optimistic update
        setOptimisticDailyCompletions(prev => new Set([...prev, dailyMealId]));
        setSuccessType('meal');
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 1500);

        try {
            await completeMealMutation({
                mealId: dailyMealId,
                date: viewingDate,
                mealType: dailyMealId.split('-')[1] || 'meal', // Extract meal type from dailyId
                selectedOptions: [{
                    categoryId: 'daily-note',
                    categoryName: isRTL ? 'ملاحظات الوجبة' : 'Meal Note',
                    optionId: 'note',
                    optionText: noteAr,
                }],
            });
            console.log('[Meals] Daily meal completed synced with Convex');
        } catch (error) {
            console.error('[Meals] Failed to sync daily meal completion:', error);
            // Rollback optimistic update
            setOptimisticDailyCompletions(prev => {
                const next = new Set(prev);
                next.delete(dailyMealId);
                return next;
            });
        }
    };

    // Handle daily meal uncomplete
    const handleDailyMealUncomplete = async (dailyMealId: string) => {
        // Optimistic update
        setOptimisticDailyCompletions(prev => {
            const next = new Set(prev);
            next.delete(dailyMealId);
            return next;
        });

        try {
            await uncompleteMealMutation({
                mealId: dailyMealId,
                date: viewingDate,
            });
            console.log('[Meals] Daily meal uncompleted synced with Convex');
        } catch (error) {
            console.error('[Meals] Failed to sync daily meal uncomplete:', error);
        }
    };

    // Day navigation for daily format
    const goToPreviousDay = () => {
        setDayOffset(prev => prev - 1);
    };

    const goToNextDay = () => {
        // Can't go to future days for completion (disable when offset >= 0)
        if (dayOffset < 0) {
            setDayOffset(prev => prev + 1);
        }
    };

    // Check if viewing a future day
    const isViewingFutureDay = dayOffset > 0;

    // Merge real data with optimistic updates
    const getMealsWithOptimisticState = useMemo(() => {
        if (!dayView?.meals) return [];

        return dayView.meals.map(meal => {
            const isOptimisticallyCompleted = optimisticCompletions.has(meal.id);
            const mealCompleted = meal.completed || isOptimisticallyCompleted;

            // Apply optimistic selections
            const categoriesWithOptimistic = meal.categories.map(category => {
                const key = `${meal.id}_${category.id}`;
                const optimisticSelection = optimisticSelections.get(key);

                if (optimisticSelection) {
                    return {
                        ...category,
                        options: category.options.map(opt => ({
                            ...opt,
                            selected: opt.id === optimisticSelection.optionId,
                        })),
                    };
                }
                return category;
            });

            return {
                ...meal,
                completed: mealCompleted,
                categories: categoriesWithOptimistic,
            };
        });
    }, [dayView?.meals, optimisticCompletions, optimisticSelections]);

    // --- Loading state ---
    if (activePlan === undefined || dayView === undefined) {
        return <MealsSkeleton />;
    }

    // --- No plan state ---
    if (activePlan === null) {
        return <NoPlanState />;
    }

    // --- Render ---
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
                    {isRTL ? 'برنامج التغذية' : 'My Diet Program'}
                </Text>
                <View style={[styles.headerIcons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.iconButton}>
                        <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Diet Program Card - Now from real data */}
                <View style={styles.dietCard}>
                    <View style={[styles.dietCardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.dietCardEmoji}>{activePlan.emoji || '🥗'}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.dietCardTitle, isRTL && styles.textRTL]}>
                                {isRTL ? (activePlan.nameAr || activePlan.name) : activePlan.name}
                            </Text>
                        </View>
                    </View>
                    {activePlan.tags && activePlan.tags.length > 0 && (
                        <View style={[styles.tagsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            {activePlan.tags.map((tag, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {(activePlan.description || activePlan.descriptionAr) && (
                        <Text style={[styles.dietCardDescription, isRTL && styles.textRTL]}>
                            {isRTL ? (activePlan.descriptionAr || activePlan.description) : activePlan.description}
                        </Text>
                    )}
                    <Text style={[styles.dietCardDate, isRTL && styles.textRTL]}>
                        📅 {isRTL ? `بدأ: ${activePlan.startDate}` : `Started: ${activePlan.startDate}`}
                    </Text>
                </View>

                {/* CONDITIONAL RENDERING BASED ON FORMAT */}
                {dayView?.format === 'daily' ? (
                    // ============ DAILY FORMAT VIEW ============
                    <>
                        {/* Day Navigator */}
                        {dayView.currentDay && (
                            <DayNavigator
                                currentDay={dayView.currentDay}
                                onPreviousDay={goToPreviousDay}
                                onNextDay={goToNextDay}
                                canGoBack={true}
                                canGoForward={dayOffset < 0}
                            />
                        )}

                        {/* Before Plan Start State */}
                        {dayView.beforePlanStart && (
                            <View style={styles.noMealsCard}>
                                <Text style={styles.noMealsEmoji}>📅</Text>
                                <Text style={[styles.noMealsText, isRTL && styles.textRTL]}>
                                    {isRTL ? 'البرنامج لم يبدأ بعد' : 'Plan has not started yet'}
                                </Text>
                            </View>
                        )}

                        {/* Daily Meals List */}
                        {dayView.meals && dayView.meals.length > 0 ? (
                            dayView.meals.map((meal: {
                                id: string;
                                dailyId: string;
                                emoji?: string;
                                name: string;
                                nameAr?: string;
                                note?: string;
                                noteAr?: string;
                                isCompleted: boolean;
                            }) => (
                                <DailyMealCard
                                    key={meal.dailyId}
                                    meal={{
                                        ...meal,
                                        isCompleted: meal.isCompleted || optimisticDailyCompletions.has(meal.dailyId),
                                    }}
                                    onComplete={handleDailyMealComplete}
                                    onUncomplete={handleDailyMealUncomplete}
                                    disabled={isViewingFutureDay}
                                />
                            ))
                        ) : !dayView.beforePlanStart && (
                            <View style={styles.noMealsCard}>
                                <Text style={styles.noMealsEmoji}>📋</Text>
                                <Text style={[styles.noMealsText, isRTL && styles.textRTL]}>
                                    {isRTL ? 'لا توجد وجبات لهذا اليوم' : 'No meals for this day'}
                                </Text>
                            </View>
                        )}

                        {/* General Notes Section */}
                        {(dayView.activePlan?.generalNotesAr || dayView.activePlan?.generalNotes) && (
                            <View style={styles.generalNotesCard}>
                                <View style={[styles.generalNotesHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <Ionicons name="document-text-outline" size={20} color={colors.primaryDark} />
                                    <Text style={[styles.generalNotesTitle, isRTL && styles.textRTL]}>
                                        {isRTL ? 'ملاحظات عامة' : 'General Notes'}
                                    </Text>
                                </View>
                                <Text style={[styles.generalNotesText, isRTL && styles.textRTL]}>
                                    {isRTL
                                        ? (dayView.activePlan.generalNotesAr || dayView.activePlan.generalNotes)
                                        : (dayView.activePlan.generalNotes || dayView.activePlan.generalNotesAr)}
                                </Text>
                            </View>
                        )}
                    </>
                ) : (
                    // ============ GENERAL FORMAT VIEW (EXISTING) ============
                    <>
                        {/* Live Calendar Card */}
                        <View style={styles.calendarCard}>
                            {/* Calendar Header with Navigation */}
                            <View style={[styles.calendarHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
                                    <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color={colors.primaryDark} />
                                </TouchableOpacity>
                                <Text style={styles.calendarMonthTitle}>
                                    {isRTL ? MONTH_NAMES_AR[currentMonth] : MONTH_NAMES_EN[currentMonth]} {currentYear}
                                </Text>
                                <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
                                    <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={24} color={colors.primaryDark} />
                                </TouchableOpacity>
                            </View>

                            {/* Day Names Header */}
                            <View style={[styles.calendarDayNamesRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                {(isRTL ? DAY_NAMES_AR : DAY_NAMES_EN).map((dayName, index) => (
                                    <View key={index} style={styles.calendarDayNameCell}>
                                        <Text style={styles.calendarDayNameText}>{dayName}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Calendar Grid */}
                            <View style={styles.calendarGrid}>
                                {calendarDays.map((day, index) => {
                                    const status = day ? getDayStatus(day) : null;
                                    const isToday = day !== null &&
                                        today.getDate() === day &&
                                        today.getMonth() === currentMonth &&
                                        today.getFullYear() === currentYear;
                                    const dateKey = day ? getLocalDateString(new Date(currentYear, currentMonth, day)) : '';
                                    const isSelected = dateKey === selectedDate;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.calendarDayCell}
                                            onPress={() => day && handleDayPress(day)}
                                            disabled={!day || status === 'future'}
                                        >
                                            {day !== null && (
                                                <View style={[
                                                    styles.calendarDay,
                                                    isToday && styles.calendarDayToday,
                                                    isSelected && !isToday && styles.calendarDaySelected,
                                                    status === 'complete' && styles.calendarDayComplete,
                                                    status === 'partial' && styles.calendarDayPartial,
                                                    status === 'before' && styles.calendarDayBefore,
                                                    status === 'future' && styles.calendarDayFuture,
                                                ]}>
                                                    <Text style={[
                                                        styles.calendarDayText,
                                                        isToday && styles.calendarDayTextToday,
                                                        status === 'complete' && styles.calendarDayTextComplete,
                                                        (status === 'before' || status === 'future') && styles.calendarDayTextDisabled,
                                                    ]}>
                                                        {day}
                                                    </Text>
                                                    {status === 'complete' && (
                                                        <Ionicons name="checkmark" size={10} color={colors.white} style={styles.calendarCheckmark} />
                                                    )}
                                                    {status === 'partial' && (
                                                        <View style={styles.calendarPartialDot} />
                                                    )}
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Legend */}
                            <View style={[styles.calendarLegend, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                                    <Text style={styles.legendText}>{isRTL ? 'مكتمل' : 'Complete'}</Text>
                                </View>
                                <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                                    <Text style={styles.legendText}>{isRTL ? 'جزئي' : 'Partial'}</Text>
                                </View>
                                <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                                    <Text style={styles.legendText}>{isRTL ? 'لم يكتمل' : 'None'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Date Indicator */}
                        <View style={styles.dateNavigator}>
                            <Ionicons name="calendar" size={18} color={colors.primaryDark} />
                            <Text style={styles.dateText}>
                                {selectedDate === todayString
                                    ? (isRTL
                                        ? `اليوم، ${today.getDate()} ${MONTH_NAMES_AR[today.getMonth()]}`
                                        : `Today, ${MONTH_NAMES_EN[today.getMonth()]} ${today.getDate()}`)
                                    : (isRTL
                                        ? `${parseInt(selectedDate.split('-')[2])} ${MONTH_NAMES_AR[parseInt(selectedDate.split('-')[1]) - 1]}`
                                        : `${MONTH_NAMES_EN[parseInt(selectedDate.split('-')[1]) - 1]} ${parseInt(selectedDate.split('-')[2])}`)}
                            </Text>
                            {selectedDate !== todayString && (
                                <TouchableOpacity onPress={() => setSelectedDate(todayString)} style={styles.todayButton}>
                                    <Text style={styles.todayButtonText}>{isRTL ? 'اليوم' : 'Today'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Meals List - Real-time from Convex */}
                        {getMealsWithOptimisticState.length > 0 ? (
                            getMealsWithOptimisticState.map(meal => (
                                <MealCard
                                    key={meal._id || meal.id}
                                    meal={meal as Meal}
                                    onSelectOption={selectOption}
                                    onOpenBottomSheet={openBottomSheet}
                                    onCompleteMeal={handleCompleteMeal}
                                    onChangeMeal={changeMealChoices}
                                    isReadyToComplete={isMealReadyToComplete(meal as Meal)}
                                    summary={getMealSummary(meal as Meal)}
                                    onRequestChange={() => {
                                        setChangeRequestMeal({ name: meal.name, nameAr: meal.nameAr });
                                        setShowChangeRequest(true);
                                    }}
                                />
                            ))
                        ) : (
                            <View style={styles.noMealsCard}>
                                <Text style={styles.noMealsEmoji}>📋</Text>
                                <Text style={[styles.noMealsText, isRTL && styles.textRTL]}>
                                    {isRTL ? 'لا توجد وجبات لهذا اليوم' : 'No meals for this day'}
                                </Text>
                            </View>
                        )}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Help Modal */}
            <Modal visible={showHelp} animationType="fade" transparent onRequestClose={() => setShowHelp(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{isRTL ? 'كيف يعمل برنامجك' : 'How Your Diet Works'}</Text>
                            <TouchableOpacity onPress={() => setShowHelp(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {[
                            { icon: '1️⃣', text: isRTL ? 'كل وجبة لها فئات (نشويات، بروتين، إلخ)' : 'Each meal has categories (Carbs, Protein, etc.)' },
                            { icon: '2️⃣', text: isRTL ? 'اختر خيار واحد من كل فئة' : 'Choose ONE option from each category' },
                            { icon: '3️⃣', text: isRTL ? 'اضغط "أكلت هذا" عند الانتهاء' : 'Mark "I ate this" when you finish' },
                            { icon: '4️⃣', text: isRTL ? 'مدربك يرى ما اخترته' : 'Your coach sees what you chose' },
                        ].map((item, i) => (
                            <View key={i} style={[styles.helpRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.helpIcon}>{item.icon}</Text>
                                <Text style={[styles.helpText, isRTL && styles.textRTL]}>{item.text}</Text>
                            </View>
                        ))}
                        <View style={styles.helpTip}>
                            <Text style={styles.helpTipText}>
                                {isRTL ? 'لديك المرونة! اختر ما تحب وما هو متاح' : 'You have flexibility! Pick what you like and have available.'}
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bottom Sheet Modal */}
            <Modal visible={!!expandedBottomSheet} animationType="slide" transparent onRequestClose={() => setExpandedBottomSheet(null)}>
                <View style={styles.bottomSheetOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setExpandedBottomSheet(null)} />
                    <View style={[styles.bottomSheetContent, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.bottomSheetHandle} />
                        {expandedBottomSheet && (() => {
                            const meal = getMealsWithOptimisticState.find(m => m.id === expandedBottomSheet.mealId);
                            const category = meal?.categories.find(c => c.id === expandedBottomSheet.categoryId);
                            if (!meal || !category) return null;
                            return (
                                <>
                                    <Text style={[styles.bottomSheetTitle, isRTL && styles.textRTL]}>
                                        {category.emoji} {isRTL ? category.nameAr : category.name}
                                    </Text>
                                    <Text style={[styles.bottomSheetSubtitle, isRTL && styles.textRTL]}>
                                        {isRTL ? `اختر خيار واحد لـ${meal.nameAr}` : `Choose 1 option for ${meal.name.toLowerCase()}`}
                                    </Text>
                                    <ScrollView style={{ maxHeight: 300 }}>
                                        {category.options.map((option) => (
                                            <TouchableOpacity
                                                key={option.id}
                                                style={[styles.bottomSheetOption, option.selected && styles.bottomSheetOptionSelected, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                                onPress={() => selectFromBottomSheet(option.id)}
                                            >
                                                <View style={[styles.radioOuter, option.selected && styles.radioOuterSelected]}>
                                                    {option.selected && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[styles.bottomSheetOptionText, isRTL && styles.textRTL]}>{option.text}</Text>
                                                {option.selected && <Text>✓</Text>}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity style={styles.confirmButton} onPress={() => setExpandedBottomSheet(null)}>
                                        <Text style={styles.confirmButtonText}>{isRTL ? 'تأكيد' : 'Confirm'}</Text>
                                    </TouchableOpacity>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            {/* Success Animation Modal */}
            <Modal visible={showSuccessAnimation} animationType="fade" transparent>
                <View style={styles.successOverlay}>
                    <View style={styles.successContent}>
                        {/* Handle */}
                        <View style={styles.successHandle} />

                        {/* Check Icon with Glow */}
                        <View style={styles.successIconContainer}>
                            <View style={styles.successIconGlow} />
                            <Ionicons
                                name={successType === 'message' ? 'chatbubble-ellipses' : 'checkmark-circle'}
                                size={64}
                                color={colors.primaryDark}
                            />
                        </View>

                        {/* Title */}
                        <Text style={styles.successTitle}>
                            {successType === 'message'
                                ? (isRTL ? 'تم الإرسال!' : 'Sent!')
                                : (isRTL ? 'عمل رائع!' : 'Great job!')}
                        </Text>

                        {/* Subtitle */}
                        <Text style={styles.successSubtitle}>
                            {successType === 'message'
                                ? (isRTL ? 'تم إرسال طلبك للدكتور' : 'Your request was sent to your doctor')
                                : (isRTL ? 'تم إكمال الوجبة بنجاح' : 'Meal completed successfully')}
                        </Text>

                        {/* Gradient Done Button */}
                        <TouchableOpacity
                            style={styles.successDoneButton}
                            onPress={() => setShowSuccessAnimation(false)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#28af62', '#2cc56f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.successDoneGradient}
                            >
                                <Text style={styles.successDoneText}>
                                    {isRTL ? 'تم' : 'Done'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Change Request Modal */}
            <Modal visible={showChangeRequest} animationType="fade" transparent onRequestClose={() => setShowChangeRequest(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{isRTL ? 'طلب تغيير النظام' : 'Request Diet Change'}</Text>
                            <TouchableOpacity onPress={() => setShowChangeRequest(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.changeReasonLabel, isRTL && styles.textRTL]}>{isRTL ? 'أخبر دكتورك بما تحتاج:' : 'Tell your coach what you need:'}</Text>
                        <ScrollView>
                            {[
                                { id: 'dislike', label: isRTL ? 'لا أحب هذه الأطعمة' : "I don't like these foods" },
                                { id: 'ingredients', label: isRTL ? 'لا أجد هذه المكونات' : "I can't find these ingredients" },
                                { id: 'allergy', label: isRTL ? 'لدي حساسية من شيء' : "I'm allergic to something" },
                                { id: 'variety', label: isRTL ? 'أريد المزيد من التنوع' : 'I need more variety' },
                                { id: 'other', label: isRTL ? 'أخرى (يرجى الشرح)' : 'Other (please explain)' }
                            ].map((reason) => (
                                <TouchableOpacity
                                    key={reason.id}
                                    style={[styles.reasonOption, changeRequestReason === reason.id && styles.reasonOptionSelected, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                    onPress={() => setChangeRequestReason(reason.id)}
                                >
                                    <View style={[styles.radioOuter, changeRequestReason === reason.id && styles.radioOuterSelected]}>
                                        {changeRequestReason === reason.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[styles.reasonOptionText, isRTL && styles.textRTL]}>{reason.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TextInput
                            value={changeRequestMessage}
                            onChangeText={setChangeRequestMessage}
                            placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                            placeholderTextColor={colors.textSecondary}
                            style={[styles.changeTextInput, isRTL && styles.textRTL]}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendRequestButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }, isSubmitting && styles.buttonDisabled]}
                            onPress={handleSendChangeRequest}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <>
                                    <Text style={styles.sendRequestButtonText}>{isRTL ? 'إرسال الطلب للمدرب' : 'Send Request to Coach'}</Text>
                                    <Ionicons name="send" size={20} color={colors.white} style={isRTL && { transform: [{ scaleX: -1 }] }} />
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowChangeRequest(false)} style={{ alignSelf: 'center', padding: 8 }}>
                            <Text style={{ color: colors.textSecondary }}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: ScaleFontSize(20), fontWeight: '600', color: colors.textPrimary },
    headerIcons: { flexDirection: 'row', gap: 8 },
    textRTL: { textAlign: 'left' },
    progressBarFillRTL: { alignSelf: 'flex-end' },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },

    // Skeleton styles
    skeletonBox: { backgroundColor: colors.border, borderRadius: 8, opacity: 0.5 },
    skeletonCard: { padding: 20 },
    skeletonMealCard: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 16, marginBottom: 12, minHeight: 80 },

    // Empty state styles
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyStateEmoji: { fontSize: 64, marginBottom: 16 },
    emptyStateTitle: { fontSize: ScaleFontSize(20), fontWeight: '600', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
    emptyStateSubtitle: { fontSize: ScaleFontSize(14), color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    emptyStateHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryLightBg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    emptyStateHintText: { fontSize: ScaleFontSize(14), color: colors.primaryDark, fontWeight: '500' },
    retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryDark, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryButtonText: { fontSize: ScaleFontSize(16), fontWeight: '600', color: colors.white },

    // Diet Card
    dietCard: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 20, marginBottom: 12, ...shadows.light },
    dietCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    dietCardEmoji: { fontSize: 32 },
    dietCardTitle: { fontSize: ScaleFontSize(20), fontWeight: '600', color: colors.textPrimary },
    dietCardCalories: { fontSize: ScaleFontSize(14), color: colors.textSecondary, marginTop: 4 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tag: { backgroundColor: colors.primaryLightBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    tagText: { fontSize: ScaleFontSize(12), color: colors.primaryDark, fontWeight: '600' },
    dietCardDescription: { fontSize: ScaleFontSize(14), color: colors.textSecondary, lineHeight: 22, marginBottom: 12 },
    dietCardDate: { fontSize: ScaleFontSize(12), color: colors.textSecondary },

    // Progress Card
    progressCard: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 16, marginBottom: 16, ...shadows.light },
    progressTitle: { fontSize: ScaleFontSize(16), fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
    progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primaryDark },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    progressMeals: { fontSize: ScaleFontSize(14), fontWeight: '600', color: colors.textPrimary },
    progressPercent: { fontSize: ScaleFontSize(14), fontWeight: '600', color: colors.primaryDark },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    dayColumn: { alignItems: 'center', paddingVertical: 8 },
    dayName: { fontSize: ScaleFontSize(10), color: colors.textSecondary, marginBottom: 4 },
    dayMeals: { fontSize: ScaleFontSize(12), fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    dayStatus: { fontSize: 16 },

    // Date Navigator
    dateNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary, borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
    navArrow: { padding: 8 },
    dateText: { fontSize: ScaleFontSize(16), fontWeight: '600', color: colors.textPrimary },
    todayButton: { backgroundColor: colors.primaryLightBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
    todayButtonText: { fontSize: ScaleFontSize(12), fontWeight: '600', color: colors.primaryDark },

    // Calendar Card
    calendarCard: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.light },
    calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    calendarNavButton: { padding: 8 },
    calendarMonthTitle: { fontSize: ScaleFontSize(18), fontWeight: '600', color: colors.textPrimary },
    calendarDayNamesRow: { flexDirection: 'row', marginBottom: 8 },
    calendarDayNameCell: { flex: 1, alignItems: 'center' },
    calendarDayNameText: { fontSize: ScaleFontSize(12), color: colors.textSecondary, fontWeight: '500' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarDayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
    calendarDay: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.bgSecondary },
    calendarDayToday: { borderWidth: 2, borderColor: colors.primaryDark },
    calendarDaySelected: { borderWidth: 2, borderColor: colors.textSecondary },
    calendarDayComplete: { backgroundColor: colors.success },
    calendarDayPartial: { backgroundColor: colors.warning },
    calendarDayBefore: { backgroundColor: 'transparent' },
    calendarDayFuture: { backgroundColor: colors.bgSecondary, opacity: 0.5 },
    calendarDayText: { fontSize: ScaleFontSize(14), fontWeight: '500', color: colors.textPrimary },
    calendarDayTextToday: { fontWeight: '700', color: colors.primaryDark },
    calendarDayTextComplete: { color: colors.white },
    calendarDayTextDisabled: { color: colors.textSecondary, opacity: 0.5 },
    calendarCheckmark: { position: 'absolute', bottom: 2, right: 2 },
    calendarPartialDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.white },
    calendarLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: ScaleFontSize(12), color: colors.textSecondary },

    // No meals card
    noMealsCard: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 32, alignItems: 'center', ...shadows.light },
    noMealsEmoji: { fontSize: 40, marginBottom: 12 },
    noMealsText: { fontSize: ScaleFontSize(14), color: colors.textSecondary, textAlign: 'center' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalContent: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: ScaleFontSize(20), fontWeight: '600', color: colors.textPrimary },
    helpRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    helpIcon: { fontSize: 24 },
    helpText: { flex: 1, fontSize: ScaleFontSize(14), color: colors.textSecondary, lineHeight: 22 },
    helpTip: { backgroundColor: colors.primaryLightBg, borderRadius: 12, padding: 12, marginTop: 16 },
    helpTipText: { fontSize: ScaleFontSize(14), color: colors.primaryDark, textAlign: 'center' },

    // Bottom Sheet
    bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheetContent: { backgroundColor: colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    bottomSheetHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
    bottomSheetTitle: { fontSize: ScaleFontSize(18), fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
    bottomSheetSubtitle: { fontSize: ScaleFontSize(14), color: colors.textSecondary, marginBottom: 16 },
    bottomSheetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    bottomSheetOptionSelected: { backgroundColor: colors.primaryLightBg },
    bottomSheetOptionText: { flex: 1, fontSize: ScaleFontSize(14), color: colors.textPrimary },
    confirmButton: { backgroundColor: colors.primaryDark, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
    confirmButtonText: { fontSize: ScaleFontSize(16), fontWeight: '600', color: colors.white },

    // Radio Button (used in modals)
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    radioOuterSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },

    // Success Animation
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContent: {
        width: 300,
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 12,
        alignItems: 'center',
        ...shadows.medium,
    },
    successHandle: {
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.border,
        marginBottom: 16,
    },
    successIconContainer: {
        position: 'relative',
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIconGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(40, 175, 98, 0.2)',
    },
    successTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: '#526477',
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: ScaleFontSize(14),
        color: '#8093A5',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    successDoneButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    successDoneGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successDoneText: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.white,
    },

    // Change Request Modal
    changeReasonLabel: { fontSize: ScaleFontSize(14), color: colors.textSecondary, marginBottom: 16 },
    reasonOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.border, marginBottom: 8 },
    reasonOptionSelected: { borderColor: colors.primaryDark, backgroundColor: 'rgba(76, 175, 80, 0.08)' },
    reasonOptionText: { fontSize: ScaleFontSize(14), color: colors.textPrimary },
    changeTextInput: { backgroundColor: colors.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, minHeight: 100, textAlignVertical: 'top', fontSize: ScaleFontSize(14), color: colors.textPrimary, marginVertical: 16 },
    sendRequestButton: { backgroundColor: colors.primaryDark, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendRequestButtonText: { fontSize: ScaleFontSize(16), fontWeight: '600', color: colors.white },
    buttonDisabled: { opacity: 0.6 },

    // General Notes Card (Daily Format)
    generalNotesCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        ...shadows.light,
    },
    generalNotesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    generalNotesTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    generalNotesText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        lineHeight: 22,
    },
});

export default MealsScreen;
