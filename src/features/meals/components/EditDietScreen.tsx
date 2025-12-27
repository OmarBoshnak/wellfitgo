import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Info,
    Flame,
    UtensilsCrossed,
    Minus,
    Plus,
    Pencil,
    Trash2,
    X,
    LibraryBig,
} from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDietDetails } from '../hooks/useDietDetails';
import { usePlanMutations } from '../hooks/usePlanMutations';
import { Id } from '@/convex/_generated/dataModel';

const t = {
    edit: isRTL ? 'تعديل' : 'Edit',
    save: isRTL ? 'حفظ' : 'Save',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
    basicInfo: isRTL ? 'المعلومات الأساسية' : 'Basic Info',
    calorieRange: isRTL ? 'نطاق السعرات' : 'Calorie Range',
    goalDescription: isRTL ? 'وصف الهدف' : 'Goal Description',
    mealsPerDay: isRTL ? 'عدد الوجبات يوميًا' : 'Meals per day',
    mealPlanEditor: isRTL ? 'محرر خطة الوجبات' : 'MEAL PLAN EDITOR',
    expandAll: isRTL ? 'توسيع الكل' : 'Expand All',
    optionsAvailable: isRTL ? 'خيارات متاحة' : 'options available',
    addFoodItem: isRTL ? 'إضافة عنصر غذائي' : 'Add Food Item',
    addFoodCategory: isRTL ? 'إضافة فئة غذائية' : 'Add Food Category',
    enterGoal: isRTL ? 'أدخل وصف الهدف' : 'Enter goal description',
    enterCalorieRange: isRTL ? 'مثال: 1500-1800' : 'e.g. 1500-1800',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    notFound: isRTL ? 'الخطة غير موجودة' : 'Plan not found',
    planName: isRTL ? 'اسم الخطة' : 'Plan Name',
    enterPlanName: isRTL ? 'أدخل اسم الخطة' : 'Enter plan name',
};

// ============ LOCAL INTERFACES FOR UI ============
interface MealCategory {
    id: string;
    emoji: string;
    nameAr: string;
    nameEn: string;
    items: { id: string; nameAr: string; nameEn: string }[];
}

interface Meal {
    id: string;
    emoji: string;
    nameAr: string;
    nameEn: string;
    optionsCount: number;
    categories: MealCategory[];
}

interface Props {
    dietId: Id<"dietPlans">;
    onBack: () => void;
    onSave?: () => void;
}

// --- Sub-components ---

const FoodItem = ({ item }: { item: { id: string; nameAr: string; nameEn: string } }) => (
    <View style={[styles.foodItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
        <View style={[styles.foodItemContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <View style={styles.foodItemDot} />
            <Text style={[styles.foodItemText, { textAlign: isRTL ? 'left' : 'right' }]}>
                {item.nameAr} ({item.nameEn})
            </Text>
        </View>
        <TouchableOpacity style={styles.removeItemButton}>
            <X size={horizontalScale(18)} color="#CBD5E1" />
        </TouchableOpacity>
    </View>
);

const CategoryCard = ({ category }: { category: MealCategory }) => (
    <View style={styles.categoryCard}>
        {/* Category Header */}
        <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Text style={styles.categoryTitle}>
                {category.emoji} {category.nameAr} ({category.nameEn})
            </Text>
            <TouchableOpacity>
                <Pencil size={horizontalScale(18)} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>

        {/* Food Items */}
        <View style={styles.foodItemsList}>
            {category.items.map(item => <FoodItem key={item.id} item={item} />)}
        </View>

        {/* Add Food Item Button */}
        <TouchableOpacity style={[styles.addItemButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Plus size={horizontalScale(18)} color={colors.primaryDark} />
            <Text style={styles.addItemText}>{t.addFoodItem}</Text>
        </TouchableOpacity>
    </View>
);

const MealCard = ({
    meal,
    isExpanded,
    onToggle
}: {
    meal: Meal;
    isExpanded: boolean;
    onToggle: () => void;
}) => (
    <View style={styles.mealCard}>
        {/* Meal Summary Header */}
        <TouchableOpacity
            style={[styles.mealHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                <Text style={styles.mealTitle}>
                    {meal.emoji} {meal.nameAr} ({meal.nameEn})
                </Text>
                <Text style={styles.mealSubtitle}>
                    • {meal.optionsCount} {t.optionsAvailable}
                </Text>
            </View>
            <View style={[styles.mealActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <TouchableOpacity style={styles.mealActionButton}>
                    <Pencil size={horizontalScale(20)} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mealActionButton}>
                    <Trash2 size={horizontalScale(20)} color={colors.textSecondary} />
                </TouchableOpacity>
                {isExpanded ? (
                    <ChevronUp size={horizontalScale(20)} color={colors.textSecondary} />
                ) : (
                    <ChevronDown size={horizontalScale(20)} color={colors.textSecondary} />
                )}
            </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
            <View style={styles.mealContent}>
                {/* Categories */}
                {meal.categories.map(category => <CategoryCard key={category.id} category={category} />)}

                {/* Add Category Button */}
                <TouchableOpacity style={[styles.addCategoryButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <LibraryBig size={horizontalScale(20)} color={colors.textSecondary} />
                    <Text style={styles.addCategoryText}>{t.addFoodCategory}</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

// ============ MAIN COMPONENT ============
export default function EditDietScreen({ dietId, onBack, onSave }: Props) {
    const { plan, isLoading } = useDietDetails(dietId);
    const { updateDietPlan, isLoading: isSaving } = usePlanMutations();
    const insets = useSafeAreaInsets();

    // Form state - initialized from plan data
    const [name, setName] = useState('');
    const [targetCalories, setTargetCalories] = useState('');
    const [description, setDescription] = useState('');
    const [mealsPerDay, setMealsPerDay] = useState(3);
    const [basicInfoOpen, setBasicInfoOpen] = useState(true);
    const [expandedMeals, setExpandedMeals] = useState<string[]>([]);

    // Initialize form state when plan data loads
    useEffect(() => {
        if (plan) {
            setName(plan.name || '');
            setTargetCalories(plan.targetCalories?.toString() || '');
            setDescription(plan.description || '');
            // Count meals from plan data
            if (plan.format === 'general' && plan.meals) {
                setMealsPerDay(plan.meals.length);
                setExpandedMeals(plan.meals.length > 0 ? [plan.meals[0].id] : []);
            } else if (plan.format === 'daily' && plan.dailyMeals) {
                // Get meals from first day
                const firstDay = Object.keys(plan.dailyMeals)[0];
                const dayMeals = firstDay ? plan.dailyMeals[firstDay as keyof typeof plan.dailyMeals]?.meals : [];
                setMealsPerDay(dayMeals?.length || 3);
            }
        }
    }, [plan]);

    // Convert plan meals to UI format
    const mealsForUI: Meal[] = React.useMemo(() => {
        if (!plan) return [];

        let rawMeals;
        if (plan.format === 'general') {
            rawMeals = plan.meals;
        } else if (plan.format === 'daily') {
            // Use first day's meals for editing
            const firstDay = Object.keys(plan.dailyMeals || {})[0];
            rawMeals = firstDay ? plan.dailyMeals?.[firstDay as keyof typeof plan.dailyMeals]?.meals : [];
        }

        if (!rawMeals || rawMeals.length === 0) return [];

        return rawMeals.map((meal) => ({
            id: meal.id,
            emoji: meal.emoji || '🍽️',
            nameAr: meal.nameAr || meal.name,
            nameEn: meal.name,
            optionsCount: meal.categories.reduce((sum, cat) => sum + cat.options.length, 0),
            categories: meal.categories.map((cat) => ({
                id: `${meal.id}-${cat.name}`,
                emoji: cat.emoji || '📋',
                nameAr: cat.nameAr || cat.name,
                nameEn: cat.name,
                items: cat.options.map((opt, idx) => ({
                    id: `${meal.id}-${cat.name}-${idx}`,
                    nameAr: opt.text,
                    nameEn: opt.text,
                })),
            })),
        }));
    }, [plan]);

    const BackArrow = () => isRTL
        ? <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />;

    const toggleMealExpansion = (mealId: string) => {
        setExpandedMeals(prev =>
            prev.includes(mealId)
                ? prev.filter(id => id !== mealId)
                : [...prev, mealId]
        );
    };

    const handleExpandAll = () => {
        if (expandedMeals.length === mealsForUI.length) {
            setExpandedMeals([]);
        } else {
            setExpandedMeals(mealsForUI.map(m => m.id));
        }
    };

    const handleSave = async () => {
        try {
            await updateDietPlan({
                id: dietId,
                name: name.trim(),
                description: description.trim() || undefined,
                targetCalories: targetCalories ? parseInt(targetCalories, 10) : undefined,
            });
            onSave?.();
        } catch (error) {
            console.error('Failed to save diet:', error);
        }
    };

    // ============ LOADING STATE ============
    if (isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                    <View style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>{t.save}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t.loading}</Text>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackArrow />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============ NOT FOUND STATE ============
    if (!plan) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                    <View style={{ width: horizontalScale(60) }} />
                    <Text style={styles.headerTitle}>{t.notFound}</Text>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackArrow />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ============ MAIN RENDER ============
    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                <TouchableOpacity onPress={handleSave} activeOpacity={0.9} disabled={isSaving}>
                    <LinearGradient
                        colors={isSaving ? ['#E1E8EF', '#E1E8EF'] : gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                        ) : (
                            <Text style={styles.saveButtonText}>{t.save}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {t.edit} {plan.name}
                </Text>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackArrow />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: horizontalScale(10) }} showsVerticalScrollIndicator={false}>
                {/* Basic Info Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setBasicInfoOpen(!basicInfoOpen)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.sectionHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={styles.sectionIcon}>
                                <Info size={horizontalScale(20)} color={colors.primaryDark} />
                            </View>
                            <Text style={styles.sectionTitle}>{t.basicInfo}</Text>
                        </View>
                        {basicInfoOpen ? (
                            <ChevronUp size={horizontalScale(20)} color={colors.textSecondary} />
                        ) : (
                            <ChevronDown size={horizontalScale(20)} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>

                    {basicInfoOpen && (
                        <View style={styles.sectionContent}>
                            {/* Plan Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {t.planName}
                                </Text>
                                <TextInput
                                    style={[styles.inputSimple, { textAlign: isRTL ? 'left' : 'right' }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t.enterPlanName}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Calorie Range Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {t.calorieRange}
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Flame size={horizontalScale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                        value={targetCalories}
                                        onChangeText={setTargetCalories}
                                        placeholder={t.enterCalorieRange}
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Goal Description Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {t.goalDescription}
                                </Text>
                                <TextInput
                                    style={[styles.inputSimple, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={t.enterGoal}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Meals Per Day Stepper */}
                            <View style={[styles.stepperRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.stepperLabel, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <UtensilsCrossed size={horizontalScale(20)} color={colors.textSecondary} />
                                    <Text style={styles.stepperText}>{t.mealsPerDay}</Text>
                                </View>
                                <View style={styles.stepperControls}>
                                    <TouchableOpacity
                                        style={styles.stepperButton}
                                        onPress={() => setMealsPerDay(Math.max(1, mealsPerDay - 1))}
                                    >
                                        <Minus size={horizontalScale(18)} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={styles.stepperValue}>{mealsPerDay}</Text>
                                    <TouchableOpacity
                                        style={styles.stepperButtonActive}
                                        onPress={() => setMealsPerDay(mealsPerDay + 1)}
                                    >
                                        <Plus size={horizontalScale(18)} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Meal Plan Editor */}
                <View style={styles.mealEditorSection}>
                    <View style={[styles.mealEditorHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.mealEditorTitle}>{t.mealPlanEditor}</Text>
                        <TouchableOpacity onPress={handleExpandAll}>
                            <Text style={styles.expandAllText}>{t.expandAll}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Meals */}
                    <View style={styles.mealsList}>
                        {mealsForUI.length > 0 ? (
                            mealsForUI.map(meal => (
                                <MealCard
                                    key={meal.id}
                                    meal={meal}
                                    isExpanded={expandedMeals.includes(meal.id)}
                                    onToggle={() => toggleMealExpansion(meal.id)}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyMeals}>
                                <Text style={styles.emptyMealsText}>No meals configured</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom padding */}
                <View style={{ height: verticalScale(24) }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Header
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginHorizontal: horizontalScale(8),
    },
    saveButton: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        minWidth: horizontalScale(60),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Loading
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
    // Content
    content: {
        flex: 1,
    },
    // Section
    section: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: verticalScale(20),
        marginTop: verticalScale(16),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: horizontalScale(16),
    },
    sectionHeaderLeft: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    sectionIcon: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(16),
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    sectionContent: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: horizontalScale(20),
        paddingTop: horizontalScale(4),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: verticalScale(16),
    },
    // Input
    inputGroup: {
        gap: verticalScale(8),
    },
    inputLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
    },
    inputIcon: {
        marginRight: horizontalScale(8),
    },
    input: {
        flex: 1,
        height: verticalScale(48),
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    inputSimple: {
        height: verticalScale(48),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    // Stepper
    stepperRow: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        padding: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepperLabel: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    stepperText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(6),
        padding: horizontalScale(4),
        borderWidth: 1,
        borderColor: colors.border,
        gap: horizontalScale(8),
    },
    stepperButton: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperButtonActive: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(4),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.textPrimary,
        minWidth: horizontalScale(16),
        textAlign: 'center',
    },
    // Meal Editor Section
    mealEditorSection: {
        gap: verticalScale(16),
    },
    mealEditorHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(4),
    },
    mealEditorTitle: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    expandAllText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    mealsList: {
        gap: verticalScale(12),
    },
    // Meal Card
    mealCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    mealHeader: {
        padding: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mealTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mealSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    mealActions: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    mealActionButton: {
        padding: horizontalScale(8),
    },
    mealContent: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(20),
        gap: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    // Category Card
    categoryCard: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(12),
        gap: verticalScale(12),
    },
    categoryHeader: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    foodItemsList: {
        gap: verticalScale(8),
    },
    foodItem: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(6),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    foodItemContent: {
        flex: 1,
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    foodItemDot: {
        width: horizontalScale(6),
        height: horizontalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: 'rgba(80, 115, 254, 0.4)',
    },
    foodItemText: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    removeItemButton: {
        padding: horizontalScale(4),
    },
    addItemButton: {
        alignItems: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(8),
    },
    addItemText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    // Add Category Button
    addCategoryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        padding: horizontalScale(12),
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.textSecondary,
        borderRadius: horizontalScale(8),
    },
    addCategoryText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    // Empty Meals
    emptyMeals: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMealsText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});
