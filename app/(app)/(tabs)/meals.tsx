import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '@/src/constants/Themes';
import { ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { Meal } from '@/src/types/meals';
import { MealCard } from '@/src/component/MealCard';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import {
    selectMeals,
    completeMeal,
    uncompleteMeal,
    selectOption as selectOptionAction,
    checkAndResetDaily,
    selectLastResetDate
} from '@/src/store/mealsSlice';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const getTodayDateString = () => new Date().toISOString().split('T')[0];

const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

const MealsScreen = () => {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();

    // --- State from Redux ---
    const meals = useAppSelector(selectMeals);
    const lastResetDate = useAppSelector(selectLastResetDate);
    const weightHistory = useAppSelector((state) => state.user.weightHistory);

    // --- Convex mutations ---
    const completeMealMutation = useMutation(api.mealCompletions.completeMeal);
    const uncompleteMealMutation = useMutation(api.mealCompletions.uncompleteMeal);

    // Check and reset meals on mount if it's a new day
    useEffect(() => {
        dispatch(checkAndResetDaily());
    }, [dispatch]);

    // Get account creation date from first weight entry or use a default
    const accountCreatedDate = useMemo(() => {
        if (weightHistory.length > 0) {
            return new Date(weightHistory[0].date);
        }
        // Default to Dec 1, 2024 if no weight history
        return new Date(2024, 11, 1);
    }, [weightHistory]);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // --- Local UI State ---
    const [showHelp, setShowHelp] = useState(false);
    const [expandedBottomSheet, setExpandedBottomSheet] = useState<{ mealId: string; categoryId: string } | null>(null);
    const [showChangeRequest, setShowChangeRequest] = useState(false);
    const [changeRequestReason, setChangeRequestReason] = useState('other');
    const [changeRequestMessage, setChangeRequestMessage] = useState('');
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    // Meal completion data by date - dynamically updates when meals are completed
    const mealCompletionByDate = useMemo(() => {
        const data: Record<string, { completed: number; total: number }> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate completion data from account creation to today
        const currentDate = new Date(accountCreatedDate);
        currentDate.setHours(0, 0, 0, 0);

        while (currentDate <= today) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const daysSinceStart = Math.floor((currentDate.getTime() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24));

            // Check if this is today - use actual meals completion from Redux
            if (currentDate.toDateString() === today.toDateString()) {
                const completedMeals = meals.filter(m => m.completed).length;
                data[dateKey] = { completed: completedMeals, total: meals.length };
            } else if (daysSinceStart < 3) {
                // Simulate: First 3 days - full completion
                data[dateKey] = { completed: 4, total: 4 };
            } else if (daysSinceStart < 6) {
                // Simulate: Days 4-6 - partial completion
                data[dateKey] = { completed: 3, total: 4 };
            } else {
                // Simulate: Other past days
                data[dateKey] = { completed: 2, total: 4 };
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return data;
    }, [accountCreatedDate, meals]); // React to meals changes

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

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add the days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }, [currentMonth, currentYear]);

    // Check if a day should show completion status - wrapped in useCallback for reactivity
    const getDayStatus = useCallback((day: number): 'complete' | 'partial' | 'none' | 'future' | 'before' => {
        const date = new Date(currentYear, currentMonth, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        // Before account creation
        const accountStart = new Date(accountCreatedDate);
        accountStart.setHours(0, 0, 0, 0);
        if (date < accountStart) {
            return 'before';
        }

        // Future dates
        if (date > today) {
            return 'future';
        }

        const dateKey = date.toISOString().split('T')[0];
        const completion = mealCompletionByDate[dateKey];

        if (!completion) return 'none';
        if (completion.completed === completion.total && completion.total > 0) return 'complete';
        if (completion.completed > 0) return 'partial';
        return 'none';
    }, [currentYear, currentMonth, accountCreatedDate, mealCompletionByDate]);

    // --- Handlers using Redux ---
    const selectOption = (mealId: string, categoryId: string, optionId: string) => {
        dispatch(selectOptionAction({ mealId, categoryId, optionId }));
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
        // Update local Redux state
        dispatch(completeMeal(mealId));
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 1500);

        // Sync with Convex
        try {
            const meal = meals.find(m => m.id === mealId);
            if (meal) {
                const selectedOptions = meal.categories
                    .filter(cat => cat.options.some(opt => opt.selected))
                    .map(cat => {
                        const selectedOpt = cat.options.find(opt => opt.selected)!;
                        return {
                            categoryId: cat.id,
                            categoryName: isRTL ? cat.nameAr : cat.name,
                            optionId: selectedOpt.id,
                            optionText: selectedOpt.text,
                        };
                    });

                await completeMealMutation({
                    mealId,
                    date: getTodayDateString(),
                    mealType: meal.name.toLowerCase(),
                    selectedOptions,
                });
                console.log('[Meals] Completed meal synced with Convex');
            }
        } catch (error) {
            console.error('[Meals] Failed to sync meal completion:', error);
        }
    };

    const changeMealChoices = async (mealId: string) => {
        // Update local Redux state
        dispatch(uncompleteMeal(mealId));

        // Sync with Convex - remove completion
        try {
            await uncompleteMealMutation({
                mealId,
                date: getTodayDateString(),
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
                {/* Diet Program Card */}
                <View style={styles.dietCard}>
                    <View style={[styles.dietCardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.dietCardEmoji}>🥗</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.dietCardTitle, isRTL && styles.textRTL]}>
                                {isRTL ? 'النظام الكلاسيكي' : 'Classic Diet'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.tagsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        {['Classic', 'Egyptian', 'Balanced'].map((tag, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={[styles.dietCardDescription, isRTL && styles.textRTL]}>
                        {isRTL
                            ? 'فقدان وزن معتدل مع تغذية متوازنة. اختر من خيارات الطعام المصري يومياً.'
                            : 'Moderate weight loss with balanced nutrition. Choose from Egyptian food options daily.'}
                    </Text>
                    <Text style={[styles.dietCardDate, isRTL && styles.textRTL]}>
                        📅 {isRTL ? 'بدأ: 1 ديسمبر 2024 (منذ 6 أيام)' : 'Started: Dec 1, 2024 (6 days ago)'}
                    </Text>
                </View>

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
                                new Date().getDate() === day &&
                                new Date().getMonth() === currentMonth &&
                                new Date().getFullYear() === currentYear;

                            return (
                                <View key={index} style={styles.calendarDayCell}>
                                    {day !== null && (
                                        <View style={[
                                            styles.calendarDay,
                                            isToday && styles.calendarDayToday,
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
                                </View>
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

                {/* Today Indicator */}
                <View style={styles.dateNavigator}>
                    <Ionicons name="calendar" size={18} color={colors.primaryDark} />
                    <Text style={styles.dateText}>
                        {isRTL
                            ? `اليوم، ${new Date().getDate()} ${MONTH_NAMES_AR[new Date().getMonth()]}`
                            : `Today, ${MONTH_NAMES_EN[new Date().getMonth()]} ${new Date().getDate()}`}
                    </Text>
                </View>

                {/* Meals List */}
                {meals.map(meal => (
                    <MealCard
                        key={meal.id}
                        meal={meal}
                        onSelectOption={selectOption}
                        onOpenBottomSheet={openBottomSheet}
                        onCompleteMeal={handleCompleteMeal}
                        onChangeMeal={changeMealChoices}
                        isReadyToComplete={isMealReadyToComplete(meal)}
                        summary={getMealSummary(meal)}
                        onRequestChange={() => setShowChangeRequest(true)}
                    />
                ))}
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
                            const meal = meals.find(m => m.id === expandedBottomSheet.mealId);
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
                        <Text style={styles.successEmoji}>✅</Text>
                        <Text style={styles.successTitle}>{isRTL ? 'عمل رائع! 🎉' : 'Great job! 🎉'}</Text>
                        <Text style={styles.successSubtitle}>{isRTL ? 'تم إكمال الوجبة' : 'Meal completed'}</Text>
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
                        <Text style={[styles.changeReasonLabel, isRTL && styles.textRTL]}>{isRTL ? 'أخبر مدربك بما تحتاج:' : 'Tell your coach what you need:'}</Text>
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
                        <TouchableOpacity style={[styles.sendRequestButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]} onPress={() => { setShowChangeRequest(false); setChangeRequestMessage(''); }}>
                            <Ionicons name="send" size={20} color={colors.white} style={isRTL && { transform: [{ scaleX: -1 }] }} />
                            <Text style={styles.sendRequestButtonText}>{isRTL ? 'إرسال الطلب للمدرب' : 'Send Request to Coach'}</Text>
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
    successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    successContent: { backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 40, alignItems: 'center' },
    successEmoji: { fontSize: 64, marginBottom: 16 },
    successTitle: { fontSize: ScaleFontSize(20), fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
    successSubtitle: { fontSize: ScaleFontSize(14), color: colors.textSecondary },

    // Change Request Modal
    changeReasonLabel: { fontSize: ScaleFontSize(14), color: colors.textSecondary, marginBottom: 16 },
    reasonOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.border, marginBottom: 8 },
    reasonOptionSelected: { borderColor: colors.primaryDark, backgroundColor: 'rgba(76, 175, 80, 0.08)' },
    reasonOptionText: { fontSize: ScaleFontSize(14), color: colors.textPrimary },
    changeTextInput: { backgroundColor: colors.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, minHeight: 100, textAlignVertical: 'top', fontSize: ScaleFontSize(14), color: colors.textPrimary, marginVertical: 16 },
    sendRequestButton: { backgroundColor: colors.primaryDark, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendRequestButtonText: { fontSize: ScaleFontSize(16), fontWeight: '600', color: colors.white },
});

export default MealsScreen;
