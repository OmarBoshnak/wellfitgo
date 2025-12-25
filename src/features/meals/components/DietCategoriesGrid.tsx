import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Stethoscope, Clock, Activity, Trash2 } from 'lucide-react-native';
import { colors, gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

const t = {
    categories: isRTL ? 'الفئات' : 'CATEGORIES',
    chooseCategory: isRTL ? 'اختر فئة النظام الغذائي' : 'Choose a diet category',
    programs: isRTL ? 'برامج' : 'programs',
};

interface DietCategory {
    id: string;
    emoji?: string;
    icon?: 'medical' | 'clock' | 'glucose';
    name: string;
    nameAr: string;
    count: number;
}

const DIET_CATEGORIES: DietCategory[] = [
    { id: 'classic', emoji: '🥗', name: 'Classic', nameAr: 'كلاسيكي', count: 14 },
    { id: 'high_protein', emoji: '🥩', name: 'High Protein', nameAr: 'عالي البروتين', count: 14 },
    { id: 'low_carb', emoji: '🥑', name: 'Low Carb', nameAr: 'قليل النشويات', count: 14 },
    { id: 'keto', emoji: '�', name: 'Keto', nameAr: 'كيتو', count: 14 },
    { id: 'vegetarian', emoji: '🥬', name: 'Vegetarian', nameAr: 'نباتي', count: 10 },
    { id: 'post_surgery', icon: 'medical', name: 'Post-Surgery', nameAr: 'بعد العمليات', count: 8 },
    { id: 'intermittent_fasting', icon: 'clock', name: 'Intermittent Fasting', nameAr: 'الصيام المتقطع', count: 6 },
    { id: 'diabetic_friendly', icon: 'glucose', name: 'Diabetic Friendly', nameAr: 'لمرضى السكر', count: 8 },
];

interface Props {
    onCategorySelect: (category: DietCategory) => void;
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

export default function DietCategoriesGrid({ onCategorySelect, onCreateCustom, onDeleteCategory, customCategories = [] }: Props) {
    const renderIcon = (category: DietCategory) => {
        if (category.emoji) {
            return <Text style={styles.categoryEmoji}>{category.emoji}</Text>;
        }

        const iconProps = {
            size: horizontalScale(32),
            color: colors.textPrimary,
            strokeWidth: 1.5,
        };

        switch (category.icon) {
            case 'medical':
                return <Stethoscope {...iconProps} />;
            case 'clock':
                return <Clock {...iconProps} />;
            case 'glucose':
                return <Activity {...iconProps} />;
            default:
                return null;
        }
    };

    const renderCategoryCard = ({ item: category }: { item: DietCategory }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => onCategorySelect(category)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                {renderIcon(category)}
            </View>
            <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={[styles.categoryMeta, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.categoryNameAr}>{category.nameAr}</Text>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.categoryCount}>{category.count} {t.programs}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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

    return (
        <View style={styles.container}>
            {renderHeader()}
            <View style={styles.listContent}>
                {/* Custom Categories */}
                {customCategories.map((category) => (
                    <View key={category.id} style={styles.customCategoryWrapper}>
                        <TouchableOpacity
                            style={[styles.categoryCard, styles.customCategoryCard]}
                            onPress={() => onCategorySelect(category as any)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                            </View>
                            <View style={styles.categoryInfo}>
                                <View style={[styles.categoryNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Text style={styles.categoryName}>{category.name}</Text>
                                    <View style={styles.customBadge}>
                                        <Text style={styles.customBadgeText}>{isRTL ? 'مخصص' : 'Custom'}</Text>
                                    </View>
                                </View>
                                <View style={[styles.categoryMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Text style={styles.categoryNameAr}>{category.nameAr}</Text>
                                    <View style={styles.dotSeparator} />
                                    <Text style={styles.categoryCount}>{category.count} {t.programs}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        {/* Delete Button */}
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
                                            onPress: () => onDeleteCategory?.(category.id)
                                        },
                                    ]
                                );
                            }}
                        >
                            <Trash2 size={horizontalScale(16)} color="#EB5757" />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Default Categories */}
                {DIET_CATEGORIES.map((category, index) => (
                    <View key={category.id}>
                        <TouchableOpacity
                            style={styles.categoryCard}
                            onPress={() => onCategorySelect(category)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                {renderIcon(category)}
                            </View>
                            <View style={styles.categoryInfo}>
                                <Text style={styles.categoryName}>{category.name}</Text>
                                <View style={[styles.categoryMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <Text style={styles.categoryNameAr}>{category.nameAr}</Text>
                                    <View style={styles.dotSeparator} />
                                    <Text style={styles.categoryCount}>{category.count} {t.programs}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
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
});
