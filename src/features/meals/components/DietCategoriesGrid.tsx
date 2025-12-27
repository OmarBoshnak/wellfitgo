import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Stethoscope, Clock, Activity, Trash2, Utensils } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useDietCategories, type DietCategory } from '../hooks/useDietCategories';

const t = {
    categories: isRTL ? 'الفئات' : 'CATEGORIES',
    chooseCategory: isRTL ? 'اختر فئة النظام الغذائي' : 'Choose a diet category',
    programs: isRTL ? 'برامج' : 'programs',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noCategories: isRTL ? 'لا توجد فئات' : 'No categories found',
    createFirst: isRTL ? 'أنشئ نظامًا غذائيًا للبدء' : 'Create a diet plan to get started',
};

// Icon mapping for special categories that use icons instead of emoji
const ICON_CATEGORIES: Record<string, 'medical' | 'clock' | 'glucose'> = {
    medical: 'medical',
    intermittent_fasting: 'clock',
};

interface Props {
    onCreateCustom: () => void;
    onDeleteCategory?: (categoryId: string) => void;
    customCategories?: {
        id: string;
        emoji: string;
        name: string;
        nameAr: string;
        count: number;
    }[];
}

export default function DietCategoriesGrid({ onCreateCustom, onDeleteCategory, customCategories = [] }: Props) {
    // ============ NAVIGATION ============
    const router = useRouter();

    // ============ CONVEX DATA ============
    const { categories, isLoading } = useDietCategories();

    // ============ NAVIGATION HANDLER ============
    const handleCategoryPress = (category: DietCategory) => {
        router.push({
            pathname: '/doctor/diet-plans',
            params: {
                categoryId: category.id,
                categoryName: category.name,
                categoryNameAr: category.nameAr,
                categoryEmoji: category.emoji ?? '',
            },
        });
    };

    const renderIcon = (category: DietCategory) => {
        // Check if this category should use an icon instead of emoji
        const iconType = ICON_CATEGORIES[category.id];

        if (iconType) {
            const iconProps = {
                size: horizontalScale(32),
                color: colors.textPrimary,
                strokeWidth: 1.5,
            };

            switch (iconType) {
                case 'medical':
                    return <Stethoscope {...iconProps} />;
                case 'clock':
                    return <Clock {...iconProps} />;
                case 'glucose':
                    return <Activity {...iconProps} />;
                default:
                    return null;
            }
        }

        // Use emoji if available
        if (category.emoji) {
            return <Text style={styles.categoryEmoji}>{category.emoji}</Text>;
        }

        // Fallback icon
        return <Utensils size={horizontalScale(32)} color={colors.textPrimary} strokeWidth={1.5} />;
    };

    const renderHeader = () => (
        <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                <Text style={styles.headerLabel}>{t.categories}</Text>
                <Text style={styles.headerText}>{t.chooseCategory}</Text>
            </View>
            <TouchableOpacity onPress={onCreateCustom} activeOpacity={0.9}>
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButton}
                >
                    <Plus size={horizontalScale(22)} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>
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
            <Text style={styles.emptyTitle}>{t.noCategories}</Text>
            <Text style={styles.emptyText}>{t.createFirst}</Text>
        </View>
    );

    const renderCategoryCard = (category: DietCategory, isCustom: boolean = false) => (
        <View key={category.id} style={isCustom ? styles.customCategoryWrapper : undefined}>
            <TouchableOpacity
                style={[styles.categoryCard, isCustom && styles.customCategoryCard]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    {renderIcon(category)}
                </View>
                <View style={styles.categoryInfo}>
                    {isCustom ? (
                        <View style={[styles.categoryNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={styles.categoryName}>{category.name}</Text>
                            <View style={styles.customBadge}>
                                <Text style={styles.customBadgeText}>{isRTL ? 'مخصص' : 'Custom'}</Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.categoryName}>{category.name}</Text>
                    )}
                    <View style={[styles.categoryMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.categoryNameAr}>{category.nameAr}</Text>
                        <View style={styles.dotSeparator} />
                        <Text style={styles.categoryCount}>{category.count} {t.programs}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Delete Button for Custom Categories */}
            {isCustom && onDeleteCategory && (
                <TouchableOpacity
                    style={[styles.deleteButton, { [isRTL ? 'left' : 'right']: horizontalScale(8) }]}
                    onPress={() => {
                        Alert.alert(
                            isRTL ? 'حذف الفئة' : 'Delete Category',
                            isRTL ? `هل تريد حذف "${category.name}"؟` : `Delete "${category.name}"?`,
                            [
                                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                                {
                                    text: isRTL ? 'حذف' : 'Delete',
                                    style: 'destructive',
                                    onPress: () => onDeleteCategory(category.id)
                                },
                            ]
                        );
                    }}
                >
                    <Trash2 size={horizontalScale(16)} color="#EB5757" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}

            {isLoading ? (
                renderLoadingState()
            ) : (
                <View style={styles.listContent}>
                    {/* Custom Categories (passed as props) */}
                    {customCategories.map((category) =>
                        renderCategoryCard(category as DietCategory, true)
                    )}

                    {/* Dynamic Categories from Convex */}
                    {categories && categories.length > 0 ? (
                        categories.map((category) =>
                            renderCategoryCard(category, false)
                        )
                    ) : customCategories.length === 0 ? (
                        renderEmptyState()
                    ) : null}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        gap: verticalScale(12),
    },
    // Header
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    headerLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: '#AAB8C5',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: verticalScale(4),
    },
    headerText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
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
    // Category Card
    categoryCard: {
        height: verticalScale(120),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: verticalScale(8),
    },
    categoryEmoji: {
        fontSize: ScaleFontSize(32),
    },
    categoryInfo: {
        alignItems: 'center',
    },
    categoryName: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    categoryMeta: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    categoryNameAr: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    dotSeparator: {
        width: horizontalScale(4),
        height: horizontalScale(4),
        borderRadius: horizontalScale(2),
        backgroundColor: colors.textSecondary,
    },
    categoryCount: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Custom Category Styles
    customCategoryCard: {
        borderWidth: 2,
        borderColor: colors.primaryDark,
        borderStyle: 'dashed',
    },
    categoryNameRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(4),
    },
    customBadge: {
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(4),
    },
    customBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    customCategoryWrapper: {
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: verticalScale(8),
        backgroundColor: 'rgba(235, 87, 87, 0.1)',
        padding: horizontalScale(8),
        borderRadius: horizontalScale(20),
        zIndex: 10,
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
