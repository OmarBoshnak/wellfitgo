import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Share2, MoreVertical, ChevronRight, ChevronDown, Users, Calendar, UserPlus } from 'lucide-react-native';
import { colors, gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

const t = {
    classic: isRTL ? 'كلاسيك' : 'Classic',
    caloriesDay: isRTL ? 'سعرات/يوم' : 'Calories/day',
    assignedTo: isRTL ? 'مخصص لـ' : 'Assigned to',
    clients: isRTL ? 'عملاء' : 'clients',
    created: isRTL ? 'تم الإنشاء' : 'Created',
    dailyMeals: isRTL ? 'الوجبات اليومية' : 'Daily Meals',
    mealsIncluded: isRTL ? 'وجبات مشمولة' : 'meals included',
    breakfast: isRTL ? 'الافطار' : 'Breakfast',
    morningSnack: isRTL ? 'سناك الصباح' : 'Morning Snack',
    lunch: isRTL ? 'الغداء' : 'Lunch',
    afternoonSnack: isRTL ? 'سناك العصر' : 'Afternoon Snack',
    dinner: isRTL ? 'العشاء' : 'Dinner',
    carbs: isRTL ? 'النشويات' : 'Carbs',
    protein: isRTL ? 'البروتين' : 'Protein',
    dairy: isRTL ? 'الألبان' : 'Dairy',
    vegetables: isRTL ? 'الخضار' : 'Vegetables',
    assignToClient: isRTL ? 'تعيين للعميل' : 'Assign to Client',
};

const DIET_DETAILS = {
    breakfast: {
        carbs: ['نص رغيف خبز اسمر', 'شريحتين توست اسمر', '4 بقسماط سن', '1 بيتي بان اسمر'],
        protein: ['بيضة مسلوقة', '2 ملعقة فول', 'قطعة جبنة قريش', '2 ملعقة جبنة لايت'],
        dairy: ['كوب لبن خالي الدسم', 'علبة زبادي لايت'],
    },
    morningSnack: { fruit: ['ثمرة فاكهة', 'طبق سلطة صغير'] },
    lunch: {
        carbs: ['3 معالق مكرونة', 'أرز مطبوخ بملعقة زيت', 'نص رغيف بلدي'],
        protein: ['شريحة صدر فراخ', 'سمكة مشوية', 'قطعة لحم مشوي'],
        vegetables: ['طبق خضار مطبوخ', 'خضار سوتيه', 'طبق سلطة كبير'],
    },
    afternoonSnack: { snack: ['مكسرات 5 حبات', 'كوب زبادي'] },
    dinner: {
        protein: ['قطعة جبن قريش', 'جبنة لايت', 'بيضة', 'نص علبة تونة'],
        carbs: ['شريحة توست اسمر', 'ربع رغيف بلدي'],
    },
};

interface MealData {
    id: string;
    emoji: string;
    nameAr: string;
    nameEn: string;
    categories: {
        emoji: string;
        label: string;
        items: string[];
    }[];
}

const MEALS: MealData[] = [
    {
        id: 'breakfast',
        emoji: '☀️',
        nameAr: 'الافطار',
        nameEn: 'Breakfast',
        categories: [
            { emoji: '🍞', label: t.carbs, items: DIET_DETAILS.breakfast.carbs },
            { emoji: '🥚', label: t.protein, items: DIET_DETAILS.breakfast.protein },
            { emoji: '🥛', label: t.dairy, items: DIET_DETAILS.breakfast.dairy },
        ],
    },
    {
        id: 'morningSnack',
        emoji: '🍎',
        nameAr: 'سناك الصباح',
        nameEn: 'Morning Snack',
        categories: [
            { emoji: '🍎', label: isRTL ? 'فاكهة' : 'Fruit', items: DIET_DETAILS.morningSnack.fruit },
        ],
    },
    {
        id: 'lunch',
        emoji: '🍽️',
        nameAr: 'الغداء',
        nameEn: 'Lunch',
        categories: [
            { emoji: '🍞', label: t.carbs, items: DIET_DETAILS.lunch.carbs },
            { emoji: '🥚', label: t.protein, items: DIET_DETAILS.lunch.protein },
            { emoji: '🥬', label: t.vegetables, items: DIET_DETAILS.lunch.vegetables },
        ],
    },
    {
        id: 'afternoonSnack',
        emoji: '🥜',
        nameAr: 'سناك العصر',
        nameEn: 'Afternoon Snack',
        categories: [
            { emoji: '🥜', label: isRTL ? 'سناك' : 'Snack', items: DIET_DETAILS.afternoonSnack.snack },
        ],
    },
    {
        id: 'dinner',
        emoji: '🌙',
        nameAr: 'العشاء',
        nameEn: 'Dinner',
        categories: [
            { emoji: '🥚', label: t.protein, items: DIET_DETAILS.dinner.protein },
            { emoji: '🍞', label: t.carbs, items: DIET_DETAILS.dinner.carbs },
        ],
    },
];

interface Props {
    diet: {
        range?: string;
        clients?: number;
        description?: string;
    };
    onBack: () => void;
    onAssign: () => void;
}

export default function DietDetailsView({ diet, onBack, onAssign }: Props) {
    const [expandedMeal, setExpandedMeal] = useState<string | null>('breakfast');

    const BackArrow = () => isRTL
        ? <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />;

    const toggleMeal = (mealId: string) => {
        setExpandedMeal(expandedMeal === mealId ? null : mealId);
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

    const renderCategory = (category: { emoji: string; label: string; items: string[] }) => (
        <View style={styles.categoryBlock} key={category.label}>
            <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryTitle}>{category.label}</Text>
            </View>
            <View style={styles.itemsList}>
                {category.items.map((item, index) => (
                    <View key={index} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.bulletPoint} />
                        <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>{item}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderMealAccordion = (meal: MealData) => {
        const isExpanded = expandedMeal === meal.id;

        return (
            <View key={meal.id} style={[styles.mealCard, isExpanded && styles.mealCardExpanded]}>
                <TouchableOpacity
                    style={[styles.mealHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => toggleMeal(meal.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.mealHeaderLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                        <Text style={styles.mealName}>
                            {meal.nameAr} ({meal.nameEn})
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
                        {meal.categories.map(renderCategory)}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                    <BackArrow />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {t.classic} {diet?.range || '1200-1300'}
                </Text>
                <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Share2 size={horizontalScale(22)} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <MoreVertical size={horizontalScale(22)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={[styles.summaryHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.emojiCircle}>
                            <Text style={styles.summaryEmoji}>🥗</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                            <Text style={styles.summaryTitle}>{t.classic} Diet</Text>
                            <Text style={styles.summaryCalories}>
                                🔥 {diet?.range || '1200-1300'} {t.caloriesDay}
                            </Text>
                        </View>
                    </View>

                    {/* Tags */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.tagsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    >
                        {renderTag('Classic')}
                        {renderTag('Egyptian')}
                        {renderTag('Balanced')}
                        {renderTag('Low Carb')}
                    </ScrollView>

                    {/* Description */}
                    <Text style={[styles.summaryDescription, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {diet?.description || 'Moderate weight loss with balanced nutrition. Suitable for most clients seeking gradual progress with familiar Egyptian food options.'}
                    </Text>

                    {/* Meta Info */}
                    <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Users size={horizontalScale(14)} color={colors.textSecondary} />
                            <Text style={styles.metaText}>
                                {t.assignedTo} {diet?.clients || 23} {t.clients}
                            </Text>
                        </View>
                        <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Calendar size={horizontalScale(14)} color={colors.textSecondary} />
                            <Text style={styles.metaText}>
                                {t.created}: Dec 1, 2024
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Daily Meals Section */}
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.sectionTitle}>{t.dailyMeals}</Text>
                    <Text style={styles.sectionSubtitle}>5 {t.mealsIncluded}</Text>
                </View>

                {/* Meal Accordions */}
                <View style={styles.mealsContainer}>
                    {MEALS.map(renderMealAccordion)}
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <View style={styles.footerGradient} />
                <TouchableOpacity onPress={onAssign} activeOpacity={0.9} style={styles.assignButtonWrapper}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        marginHorizontal: horizontalScale(-16),
        marginTop: verticalScale(-16),
        overflow: 'visible',
    },
    // Header
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(8),
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
        alignItems: 'flex-start',
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
