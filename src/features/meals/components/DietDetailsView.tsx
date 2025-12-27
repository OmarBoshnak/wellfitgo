import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Share2, MoreVertical, ChevronRight, ChevronDown, Users, Calendar, UserPlus } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useDietDetails } from '../hooks/useDietDetails';
import { Id } from '@/convex/_generated/dataModel';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AssignClientModal from './AssignClientModal';

// ============ TRANSLATIONS ============
const t = {
    caloriesDay: isRTL ? 'سعرات/يوم' : 'Calories/day',
    assignedTo: isRTL ? 'مخصص لـ' : 'Assigned to',
    clients: isRTL ? 'عملاء' : 'clients',
    created: isRTL ? 'تم الإنشاء' : 'Created',
    dailyMeals: isRTL ? 'الوجبات اليومية' : 'Daily Meals',
    weeklyMeals: isRTL ? 'وجبات الأسبوع' : 'Weekly Meals',
    mealsIncluded: isRTL ? 'وجبات مشمولة' : 'meals included',
    assignToClient: isRTL ? 'تعيين للعميل' : 'Assign to Client',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    notFound: isRTL ? 'الخطة غير موجودة' : 'Plan not found',
    noMeals: isRTL ? 'لا توجد وجبات' : 'No meals for this day',
    assignSuccess: isRTL ? 'تم التعيين بنجاح!' : 'Assignment successful!',
    assignFailed: isRTL ? 'فشل التعيين' : 'Assignment failed',
};

// Day keys for daily format
const WEEKDAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
type WeekDay = typeof WEEKDAYS[number];

const DAY_LABELS: Record<WeekDay, { en: string; ar: string }> = {
    saturday: { en: 'Sat', ar: 'سبت' },
    sunday: { en: 'Sun', ar: 'أحد' },
    monday: { en: 'Mon', ar: 'اثن' },
    tuesday: { en: 'Tue', ar: 'ثلا' },
    wednesday: { en: 'Wed', ar: 'أرب' },
    thursday: { en: 'Thu', ar: 'خمي' },
    friday: { en: 'Fri', ar: 'جمع' },
};

// Get current weekday
const getCurrentWeekday = (): WeekDay => {
    const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
};

// ============ TYPES ============
interface MealCategory {
    emoji?: string;
    name: string;
    nameAr?: string;
    items: string[]; // Mapped from options[].text
}

interface MealForUI {
    id: string;
    emoji?: string;
    name: string;
    nameAr?: string;
    categories: MealCategory[];
}

interface Props {
    dietId: Id<"dietPlans">;
    onBack: () => void;
    onAssign: () => void;
}

// ============ COMPONENT ============
export default function DietDetailsView({ dietId, onBack, onAssign }: Props) {
    const { plan, isLoading } = useDietDetails(dietId);
    const insets = useSafeAreaInsets();
    const assignMutation = useMutation(api.plans.assignPlanToClients);

    // State for daily format
    const [selectedDay, setSelectedDay] = useState<WeekDay>(getCurrentWeekday());
    const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

    // State for assign modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // Handle opening the assign modal
    const handleOpenAssignModal = useCallback(() => {
        setShowAssignModal(true);
    }, []);

    // Handle assigning to clients
    const handleAssignToClients = useCallback(async (clientIds: Id<"users">[]) => {
        if (clientIds.length === 0) return;

        setIsAssigning(true);
        try {
            // Get today's date as the start date
            const startDate = new Date().toISOString().split('T')[0];

            const result = await assignMutation({
                dietPlanId: dietId,
                clientIds,
                startDate,
            });

            setShowAssignModal(false);

            if (result.success) {
                Alert.alert(
                    t.assignSuccess,
                    `${result.successCount}/${result.totalClients} ${t.clients}`,
                    [{ text: 'OK', onPress: onAssign }]
                );
            } else {
                Alert.alert(t.assignFailed, result.errors?.join('\n'));
            }
        } catch (error) {
            Alert.alert(t.assignFailed, String(error));
        } finally {
            setIsAssigning(false);
        }
    }, [dietId, assignMutation, onAssign]);

    // ============ RESOLVE MEALS ============
    const mealsForUI = useMemo((): MealForUI[] => {
        if (!plan) return [];

        let rawMeals;

        if (plan.format === 'general') {
            // General format: same meals every day
            rawMeals = plan.meals;
        } else if (plan.format === 'daily') {
            // Daily format: different meals per day
            const dayData = plan.dailyMeals?.[selectedDay];
            rawMeals = dayData?.meals;
        }

        if (!rawMeals || rawMeals.length === 0) return [];

        // Map schema meals to UI structure
        return rawMeals.map((meal) => ({
            id: meal.id,
            emoji: meal.emoji,
            name: meal.name,
            nameAr: meal.nameAr,
            categories: meal.categories.map((cat) => ({
                emoji: cat.emoji,
                name: cat.name,
                nameAr: cat.nameAr,
                // CRITICAL: Map options to items (string[])
                items: cat.options.map((opt) => opt.text),
            })),
        }));
    }, [plan, selectedDay]);

    // Set first meal as expanded by default
    React.useEffect(() => {
        if (mealsForUI.length > 0 && expandedMeal === null) {
            setExpandedMeal(mealsForUI[0].id);
        }
    }, [mealsForUI.length]);

    // ============ RENDER HELPERS ============
    const BackArrow = () => isRTL
        ? <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />;

    const toggleMeal = (mealId: string) => {
        setExpandedMeal(expandedMeal === mealId ? null : mealId);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderTag = (text: string) => (
        <View style={styles.tag} key={text}>
            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tagGradientBorder}
            >
                <View style={styles.tagInner}>
                    <Text style={styles.tagText}>{text}</Text>
                </View>
            </LinearGradient>
        </View>
    );

    const renderCategory = (category: MealCategory, index: number) => (
        <View style={styles.categoryBlock} key={`${category.name}-${index}`}>
            <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={styles.categoryEmoji}>{category.emoji || '📋'}</Text>
                <Text style={styles.categoryTitle}>
                    {isRTL ? (category.nameAr || category.name) : category.name}
                </Text>
            </View>
            <View style={styles.itemsList}>
                {category.items.map((item, idx) => (
                    <View key={idx} style={[styles.itemRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={styles.bulletPoint} />
                        <Text style={[styles.itemText, { textAlign: isRTL ? 'left' : 'right' }]}>{item}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderMealAccordion = (meal: MealForUI) => {
        const isExpanded = expandedMeal === meal.id;

        return (
            <View key={meal.id} style={[styles.mealCard, isExpanded && styles.mealCardExpanded]}>
                <TouchableOpacity
                    style={[styles.mealHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                    onPress={() => toggleMeal(meal.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.mealHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.mealEmoji}>{meal.emoji || '🍽️'}</Text>
                        <Text style={styles.mealName}>
                            {isRTL ? (meal.nameAr || meal.name) : meal.name}
                            {meal.nameAr && !isRTL && ` (${meal.nameAr})`}
                        </Text>
                    </View>
                    {isExpanded ? (
                        <ChevronDown size={horizontalScale(22)} color={colors.primaryDark} />
                    ) : (
                        <ChevronRight size={horizontalScale(22)} color={colors.textSecondary} />
                    )}
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.mealContent}>
                        {meal.categories.map((cat, idx) => renderCategory(cat, idx))}
                    </View>
                )}
            </View>
        );
    };

    const renderDaySelector = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.daySelectorRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
        >
            {WEEKDAYS.map((day) => {
                const isSelected = selectedDay === day;
                const label = isRTL ? DAY_LABELS[day].ar : DAY_LABELS[day].en;

                return (
                    <TouchableOpacity
                        key={day}
                        style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
    );

    const renderEmptyMeals = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>{t.noMeals}</Text>
        </View>
    );

    // ============ LOADING STATE ============
    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                        <BackArrow />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t.loading}</Text>
                    <View style={styles.headerActions} />
                </View>
                {renderLoadingState()}
            </View>
        );
    }

    // ============ NOT FOUND STATE ============
    if (!plan) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                        <BackArrow />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t.notFound}</Text>
                    <View style={styles.headerActions} />
                </View>
            </View>
        );
    }

    // ============ MAIN RENDER ============
    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                    <BackArrow />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {plan.name}
                </Text>
                <View style={{ marginHorizontal: horizontalScale(16) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={[styles.summaryHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={styles.emojiCircle}>
                            <Text style={styles.summaryEmoji}>{plan.emoji || '🥗'}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                            <Text style={styles.summaryTitle}>{plan.name}</Text>
                            {plan.targetCalories && (
                                <Text style={styles.summaryCalories}>
                                    🔥 {plan.targetCalories} {t.caloriesDay}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Tags */}
                    {plan.tags && plan.tags.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.tagsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        >
                            {plan.tags.map(renderTag)}
                        </ScrollView>
                    )}

                    {/* Description */}
                    {plan.description && (
                        <Text style={[styles.summaryDescription, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {plan.description}
                        </Text>
                    )}

                    {/* Meta Info */}
                    <View style={[styles.metaRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.metaItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Users size={horizontalScale(14)} color={colors.textSecondary} />
                            <Text style={styles.metaText}>
                                {t.assignedTo} {plan.usageCount} {t.clients}
                            </Text>
                        </View>
                        <View style={[styles.metaItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Calendar size={horizontalScale(14)} color={colors.textSecondary} />
                            <Text style={styles.metaText}>
                                {t.created}: {formatDate(plan.createdAt)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Day Selector (only for daily format) */}
                {plan.format === 'daily' && renderDaySelector()}

                {/* Daily Meals Section */}
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.sectionTitle}>
                        {plan.format === 'daily' ? t.weeklyMeals : t.dailyMeals}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {mealsForUI.length} {t.mealsIncluded}
                    </Text>
                </View>

                {/* Meal Accordions */}
                <View style={styles.mealsContainer}>
                    {mealsForUI.length > 0 ? mealsForUI.map(renderMealAccordion) : renderEmptyMeals()}
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.footerGradient} />
                <TouchableOpacity onPress={handleOpenAssignModal} activeOpacity={0.9} style={styles.assignButtonWrapper}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.assignButton}
                    >
                        <Text style={styles.assignButtonText}>{t.assignToClient}</Text>
                        <UserPlus size={horizontalScale(20)} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Assign Client Modal */}
            <AssignClientModal
                visible={showAssignModal}
                diet={{
                    name: plan?.name,
                    range: plan?.targetCalories ? `${plan.targetCalories} cal` : undefined,
                }}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssignToClients}
                isAssigning={isAssigning}
            />
        </SafeAreaView>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        overflow: 'visible',
    },
    // Header
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(16),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgPrimary,
    },
    headerButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
        paddingHorizontal: horizontalScale(8),
    },
    headerActions: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    // Scroll Content
    scrollContent: {
        paddingBottom: verticalScale(120),
    },
    // Summary Card
    summaryCard: {
        backgroundColor: colors.bgSecondary,
        margin: horizontalScale(16),
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryHeader: {
        alignItems: 'center',
        gap: horizontalScale(12),
        marginBottom: verticalScale(12),
    },
    emojiCircle: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.bgPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    summaryEmoji: {
        fontSize: ScaleFontSize(22),
    },
    summaryTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    summaryCalories: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Tags
    tagsRow: {
        gap: horizontalScale(8),
        marginBottom: verticalScale(12),
    },
    tag: {
        borderRadius: horizontalScale(8),
        overflow: 'hidden',
    },
    tagGradientBorder: {
        padding: 1,
        borderRadius: horizontalScale(8),
    },
    tagInner: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(7),
    },
    tagText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    summaryDescription: {
        fontSize: ScaleFontSize(14),
        lineHeight: ScaleFontSize(22),
        color: colors.textSecondary,
        marginBottom: verticalScale(12),
    },
    // Meta Info
    metaRow: {
        flexWrap: 'wrap',
        gap: horizontalScale(16),
        paddingTop: verticalScale(12),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    metaItem: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    metaText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    // Day Selector
    daySelectorRow: {
        paddingHorizontal: horizontalScale(16),
        gap: horizontalScale(8),
        marginBottom: verticalScale(16),
    },
    dayButton: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayButtonSelected: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    dayButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    dayButtonTextSelected: {
        color: '#FFFFFF',
    },
    // Section Header
    sectionHeader: {
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: horizontalScale(16),
        marginBottom: verticalScale(12),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    sectionSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    // Meals Container
    mealsContainer: {
        paddingHorizontal: horizontalScale(16),
        gap: verticalScale(12),
    },
    // Meal Card
    mealCard: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    mealCardExpanded: {
        backgroundColor: colors.bgPrimary,
    },
    mealHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: horizontalScale(16),
        minHeight: verticalScale(56),
    },
    mealHeaderLeft: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    mealEmoji: {
        fontSize: ScaleFontSize(20),
    },
    mealName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    // Meal Content (Expanded)
    mealContent: {
        padding: horizontalScale(16),
        paddingTop: verticalScale(8),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: verticalScale(12),
    },
    // Category Block
    categoryBlock: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(12),
    },
    categoryHeader: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(8),
    },
    categoryEmoji: {
        fontSize: ScaleFontSize(18),
    },
    categoryTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    itemsList: {
        gap: verticalScale(6),
    },
    itemRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    bulletPoint: {
        width: horizontalScale(5),
        height: horizontalScale(5),
        borderRadius: horizontalScale(2.5),
        backgroundColor: colors.primaryDark,
    },
    itemText: {
        flex: 1,
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        lineHeight: ScaleFontSize(20),
    },
    // Loading State
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Empty State
    emptyContainer: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(32),
        marginBottom: verticalScale(8),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(24),
        paddingTop: verticalScale(16),
        zIndex: 999,
        backgroundColor: colors.bgPrimary,
    },
    footerGradient: {
        display: 'none',
    },
    assignButtonWrapper: {
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    assignButton: {
        height: verticalScale(48),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
    },
    assignButtonText: {
        fontSize: ScaleFontSize(16),
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
