import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Search, Users, Utensils, Trash2, Plus } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useDietsByType, type DietPlan, type DietType } from '../hooks/useDietsByType';
import { usePlanMutations } from '../hooks/usePlanMutations';

// ============ TRANSLATIONS ============
const t = {
    diets: isRTL ? 'الأنظمة الغذائية' : 'Diets',
    chooseDiet: isRTL ? 'اختر نظامًا غذائيًا لعميلك' : 'Choose a diet plan for your client',
    kcal: isRTL ? 'سعرة' : 'kcal',
    meals: isRTL ? 'وجبات' : 'meals',
    usedWith: isRTL ? 'مستخدم مع' : 'Used with',
    clients: isRTL ? 'عملاء' : 'clients',
    assignToClient: isRTL ? 'تعيين للعميل' : 'Assign to Client',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    edit: isRTL ? 'تعديل' : 'Edit',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noPlans: isRTL ? 'لا توجد خطط' : 'No plans available',
    noPlansDesc: isRTL ? 'أنشئ خطة غذائية للبدء' : 'Create a diet plan to get started',
    delete: isRTL ? 'حذف' : 'Delete',
    deleteConfirm: isRTL ? 'هل أنت متأكد من حذف هذه الخطة؟' : 'Are you sure you want to delete this diet plan?',
    deleteSuccess: isRTL ? 'تم حذف الخطة بنجاح' : 'Diet plan deleted successfully',
    deleteError: isRTL ? 'فشل في حذف الخطة' : 'Failed to delete diet plan',
};

// ============ PROPS TYPE ============
interface Props {
    category: {
        id: string;         // Diet type
        name: string;
        nameAr: string;
        emoji?: string;
        description?: string;
    };
    onBack: () => void;
    onAssign: (diet: DietPlan) => void;
    onView: (diet: DietPlan) => void;
    onEdit: (diet: DietPlan) => void;
    onCreateNew?: (categoryId: string, categoryType: string) => void;
}

// ============ COMPONENT ============
export default function DietPlansList({ category, onBack, onAssign, onView, onEdit, onCreateNew }: Props) {
    // Fetch diet plans for this category type
    const { diets, isLoading } = useDietsByType(category.id as DietType);
    const { deleteDietPlan } = usePlanMutations();
    const insets = useSafeAreaInsets();

    // ============ DELETE HANDLER ============
    const handleDelete = (diet: DietPlan) => {
        Alert.alert(
            t.delete,
            `${t.deleteConfirm}\n\n"${diet.name}"`,
            [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDietPlan(diet.id);
                            Alert.alert(
                                isRTL ? 'تم الحذف' : 'Deleted',
                                t.deleteSuccess
                            );
                        } catch (error) {
                            console.error('Delete failed:', error);
                            Alert.alert(
                                isRTL ? 'خطأ' : 'Error',
                                t.deleteError
                            );
                        }
                    },
                },
            ]
        );
    };

    // ============ RENDER HELPERS ============
    const BackArrow = () => isRTL
        ? <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />;

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top }]}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={{ marginHorizontal: horizontalScale(16) }} />
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        {category.name} {t.diets}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {category.nameAr}
                    </Text>
                </View>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackArrow />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderBanner = () => (
        <View style={[styles.banner, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <View style={[styles.bannerContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={styles.bannerEmoji}>{category.emoji || '🥗'}</Text>
                <Text style={[styles.bannerText, { textAlign: isRTL ? 'left' : 'right' }]}>
                    {category.description || t.chooseDiet}
                </Text>
            </View>
            {onCreateNew && (
                <TouchableOpacity
                    onPress={() => {
                        // For custom categories (ID starts with 'custom_'), use 'custom' as the type
                        const dietType = category.id.startsWith('custom_') ? 'custom' : category.id;
                        onCreateNew(category.id, dietType);
                    }}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addButton}
                    >
                        <Plus size={horizontalScale(22)} color="#FFFFFF" strokeWidth={2.5} />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{t.noPlans}</Text>
            <Text style={styles.emptyText}>{t.noPlansDesc}</Text>
        </View>
    );

    const renderDietCard = (diet: DietPlan) => (
        <View key={diet.id} style={styles.dietCard}>
            {/* Header with Emoji and Name */}
            <View style={[styles.dietHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={styles.dietEmoji}>{diet.emoji}</Text>
                <View style={[styles.dietTitleContainer, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                    <Text style={styles.dietName}>{diet.name}</Text>
                    {diet.nameAr && (
                        <Text style={styles.dietNameAr}>{diet.nameAr}</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(diet)}
                    activeOpacity={0.7}
                >
                    <Trash2 size={horizontalScale(16)} color="#EF4444" />
                </TouchableOpacity>

            </View>

            {/* Calories Badge (if available) */}
            {diet.targetCalories && (
                <View style={[styles.caloriesBadge, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
                    <Text style={styles.caloriesText}>🔥 {diet.targetCalories} {t.kcal}</Text>
                </View>
            )}

            {/* Description */}
            {diet.description && (
                <Text style={[styles.dietDescription, { textAlign: isRTL ? 'left' : 'right' }]}>
                    {diet.description}
                </Text>
            )}

            {/* Meta: Meals count */}
            <View style={[styles.metaRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Utensils size={horizontalScale(14)} color={colors.textSecondary} />
                <Text style={styles.metaText}>{diet.mealsCount} {t.meals}</Text>
            </View>

            {/* Usage Stats */}
            <View style={[styles.usageRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Users size={horizontalScale(14)} color={colors.textSecondary} />
                <Text style={styles.usageText}>
                    {t.usedWith} {diet.usageCount} {t.clients}
                </Text>
            </View>

            {/* Action Buttons */}
            <View style={[styles.buttonRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <TouchableOpacity
                    style={styles.assignButtonWrapper}
                    onPress={() => onAssign(diet)}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.assignButton}
                    >
                        <Text style={styles.assignButtonText}>{t.assignToClient}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => onView(diet)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.viewButtonText}>{t.viewDetails}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEdit(diet)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.editButtonText}>{t.edit}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderBanner()}

            {/* Section Title */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                {t.chooseDiet}
            </Text>

            {/* Diet Cards */}
            {isLoading ? (
                renderLoadingState()
            ) : diets && diets.length > 0 ? (
                <View style={styles.cardsList}>
                    {diets.map(renderDietCard)}
                </View>
            ) : (
                renderEmptyState()
            )}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    header: {
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: verticalScale(12),
        marginBottom: verticalScale(16),
        marginHorizontal: horizontalScale(-16),
        paddingHorizontal: horizontalScale(10),
    },
    headerRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    searchButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Banner
    banner: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: horizontalScale(16),
        marginBottom: verticalScale(20),
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
    },
    bannerContent: {
        flex: 1,
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    addButton: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    bannerEmoji: {
        fontSize: ScaleFontSize(32),
    },
    bannerText: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        lineHeight: ScaleFontSize(20),
    },
    // Section Title
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
    // Cards List
    cardsList: {
        gap: verticalScale(12),
    },
    // Diet Card
    dietCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: colors.border,
        gap: verticalScale(10),
    },
    dietHeader: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    dietEmoji: {
        fontSize: ScaleFontSize(28),
    },
    dietTitleContainer: {
        flex: 1,
    },
    dietName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    dietNameAr: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    caloriesBadge: {
        backgroundColor: 'rgba(242, 153, 74, 0.1)',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(6),
    },
    caloriesText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
        color: '#F2994A',
    },
    dietDescription: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        lineHeight: ScaleFontSize(20),
    },
    metaRow: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    metaText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    usageRow: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    usageText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    // Buttons
    buttonRow: {
        gap: horizontalScale(8),
        marginTop: verticalScale(4),
    },
    assignButtonWrapper: {
        flex: 1,
        borderRadius: horizontalScale(8),
        overflow: 'hidden',
    },
    assignButton: {
        height: verticalScale(36),
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignButtonText: {
        fontSize: ScaleFontSize(14),
        color: '#FFFFFF',
        fontWeight: '500',
    },
    viewButton: {
        flex: 0.7,
        height: verticalScale(36),
        borderWidth: 1,
        borderColor: colors.primaryDark,
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewButtonText: {
        fontSize: ScaleFontSize(14),
        color: colors.primaryDark,
        fontWeight: '500',
    },
    editButton: {
        flex: 0.5,
        height: verticalScale(36),
        borderWidth: 1,
        borderColor: colors.textSecondary,
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        fontWeight: '500',
    },
    deleteButton: {
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Loading State
    loadingContainer: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: verticalScale(200),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(12),
    },
    // Empty State
    emptyContainer: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: verticalScale(200),
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
