import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
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
import { colors, gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

const t = {
    edit: isRTL ? 'تعديل' : 'Edit',
    save: isRTL ? 'حفظ' : 'Save',
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
};

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

// Mock data matching HTML design
const MOCK_MEALS: Meal[] = [
    {
        id: '1',
        emoji: '☀️',
        nameAr: 'الافطار',
        nameEn: 'Breakfast',
        optionsCount: 12,
        categories: [
            {
                id: '1-1',
                emoji: '🍞',
                nameAr: 'النشويات',
                nameEn: 'Carbs',
                items: [
                    { id: '1-1-1', nameAr: 'نص رغيف خبز اسمر', nameEn: 'Half brown loaf' },
                    { id: '1-1-2', nameAr: '٢ شريحة توست', nameEn: '2 Toast slices' },
                ],
            },
            {
                id: '1-2',
                emoji: '🥚',
                nameAr: 'البروتين',
                nameEn: 'Protein',
                items: [
                    { id: '1-2-1', nameAr: '٢ بيضة مسلوقة', nameEn: '2 Boiled Eggs' },
                ],
            },
        ],
    },
    {
        id: '2',
        emoji: '🥗',
        nameAr: 'الغداء',
        nameEn: 'Lunch',
        optionsCount: 8,
        categories: [],
    },
    {
        id: '3',
        emoji: '🌙',
        nameAr: 'العشاء',
        nameEn: 'Dinner',
        optionsCount: 5,
        categories: [],
    },
];

interface Props {
    diet: {
        id: string;
        range: string;
        description: string;
        meals: number;
        options: number;
    };
    onBack: () => void;
    onSave?: () => void;
}

// --- Sub-components ---

const FoodItem = ({ item }: { item: { id: string; nameAr: string; nameEn: string } }) => (
    <View style={[styles.foodItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.foodItemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.foodItemDot} />
            <Text style={[styles.foodItemText, { textAlign: isRTL ? 'right' : 'left' }]}>
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
        <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
        <TouchableOpacity style={[styles.addItemButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
            style={[styles.mealHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.mealTitle}>
                    {meal.emoji} {meal.nameAr} ({meal.nameEn})
                </Text>
                <Text style={styles.mealSubtitle}>
                    • {meal.optionsCount} {t.optionsAvailable}
                </Text>
            </View>
            <View style={[styles.mealActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
                <TouchableOpacity style={[styles.addCategoryButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <LibraryBig size={horizontalScale(20)} color={colors.textSecondary} />
                    <Text style={styles.addCategoryText}>{t.addFoodCategory}</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

export default function EditDietScreen({ diet, onBack, onSave }: Props) {
    const [calorieRange, setCalorieRange] = useState(diet?.range ? `${diet.range} kcal` : '1200 - 1300 kcal');
    const [goalDescription, setGoalDescription] = useState(diet?.description || 'Stable weight loss');
    const [mealsPerDay, setMealsPerDay] = useState(diet?.meals || 3);
    const [basicInfoOpen, setBasicInfoOpen] = useState(true);
    const [expandedMeals, setExpandedMeals] = useState<string[]>(['1']);

    const BackArrow = () => isRTL
        ? <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />;

    const toggleMealExpansion = (mealId: string) => {
        setExpandedMeals(prev =>
            prev.includes(mealId)
                ? prev.filter(id => id !== mealId)
                : [...prev, mealId]
        );
    };

    const handleExpandAll = () => {
        if (expandedMeals.length === MOCK_MEALS.length) {
            setExpandedMeals([]);
        } else {
            setExpandedMeals(MOCK_MEALS.map(m => m.id));
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackArrow />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {t.edit} {diet?.range || 'Classic 1200-1300'}
                </Text>
                <TouchableOpacity onPress={onSave} activeOpacity={0.9}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                    >
                        <Text style={styles.saveButtonText}>{t.save}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Basic Info Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setBasicInfoOpen(!basicInfoOpen)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.sectionHeaderLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
                            {/* Calorie Range Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {t.calorieRange}
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Flame size={horizontalScale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                        value={calorieRange}
                                        onChangeText={setCalorieRange}
                                        placeholder={t.enterCalorieRange}
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                            </View>

                            {/* Goal Description Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {t.goalDescription}
                                </Text>
                                <TextInput
                                    style={[styles.inputSimple, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={goalDescription}
                                    onChangeText={setGoalDescription}
                                    placeholder={t.enterGoal}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Meals Per Day Stepper */}
                            <View style={[styles.stepperRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={[styles.stepperLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
                    <View style={[styles.mealEditorHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.mealEditorTitle}>{t.mealPlanEditor}</Text>
                        <TouchableOpacity onPress={handleExpandAll}>
                            <Text style={styles.expandAllText}>{t.expandAll}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Meals */}
                    <View style={styles.mealsList}>
                        {MOCK_MEALS.map(meal => (
                            <MealCard
                                key={meal.id}
                                meal={meal}
                                isExpanded={expandedMeals.includes(meal.id)}
                                onToggle={() => toggleMealExpansion(meal.id)}
                            />
                        ))}
                    </View>
                </View>

                {/* Bottom padding */}
                <View style={{ height: verticalScale(24) }} />
            </ScrollView>
        </View>
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
    },
    saveButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Content
    content: {
        flex: 1,
        padding: horizontalScale(16),
    },
    // Section
    section: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: verticalScale(20),
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
        padding: horizontalScale(16),
        paddingTop: 0,
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
        padding: horizontalScale(12),
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
        paddingVertical: verticalScale(8),
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
});
