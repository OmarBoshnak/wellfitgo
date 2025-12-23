/**
 * MealSection Component
 * Expandable/collapsible meal card with animated content and chevron
 */
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, borderRadius, shadows } from '../constants';
import { t } from '../translations';
import type { MealSection as MealSectionType } from '../types';

interface MealSectionProps {
    meal: MealSectionType;
    onToggle: () => void;
    onAddCategory: () => void;
    onEditCategory: (categoryId: string) => void;
}

export function MealSection({
    meal,
    onToggle,
    onAddCategory,
    onEditCategory,
}: MealSectionProps) {
    const mealName = isRTL ? meal.nameAr : meal.name;
    const categoryCount = meal.categories.length;
    const isEmpty = categoryCount === 0;

    // Animation values
    const isExpanded = useSharedValue(meal.isExpanded ? 1 : 0);

    useEffect(() => {
        isExpanded.value = withTiming(meal.isExpanded ? 1 : 0, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [meal.isExpanded]);

    // Chevron rotation animation
    const chevronStyle = useAnimatedStyle(() => {
        const rotation = interpolate(isExpanded.value, [0, 1], [0, 180]);
        return {
            transform: [{ rotate: `${rotation}deg` }],
        };
    });

    // Content opacity and scale animation
    const contentStyle = useAnimatedStyle(() => {
        return {
            opacity: isExpanded.value,
            transform: [
                { scaleY: interpolate(isExpanded.value, [0, 1], [0.95, 1]) },
            ],
        };
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <TouchableOpacity
                style={styles.header}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={[styles.headerContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.titleRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.emoji}>{meal.emoji}</Text>
                        <Text style={[styles.title, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {mealName}
                            {' '}
                            <Text style={styles.titleArabic}>
                                ({isRTL ? meal.name : meal.nameAr})
                            </Text>
                        </Text>
                    </View>
                    <View style={[styles.headerRight, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[
                            styles.badge,
                            isEmpty ? styles.badgeEmpty : styles.badgeFilled
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                isEmpty ? styles.badgeTextEmpty : styles.badgeTextFilled
                            ]}>
                                {isEmpty ? t.empty : `${categoryCount} ${t.categories}`}
                            </Text>
                        </View>
                        <Animated.View style={chevronStyle}>
                            <Ionicons
                                name="chevron-down"
                                size={horizontalScale(20)}
                                color={mealPlanColors.textDesc}
                            />
                        </Animated.View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Expanded Content with Animation */}
            {meal.isExpanded && (
                <Animated.View style={[styles.content, contentStyle]}>
                    {isEmpty ? (
                        <TouchableOpacity
                            style={styles.startAddingButton}
                            onPress={onAddCategory}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="add"
                                size={horizontalScale(18)}
                                color={mealPlanColors.actionBlue}
                            />
                            <Text style={styles.startAddingText}>{t.startAddingItems}</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {meal.categories.map((category) => (
                                <View key={category.id} style={styles.categoryItem}>
                                    <View style={[styles.categoryContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                        <Ionicons
                                            name="menu"
                                            size={horizontalScale(20)}
                                            color={mealPlanColors.textDesc}
                                        />
                                        <View style={styles.categoryInfo}>
                                            <Text style={[styles.categoryName, { textAlign: isRTL ? 'left' : 'right' }]}>
                                                {isRTL ? category.nameAr : category.name}
                                            </Text>
                                            {category.description && (
                                                <Text style={[styles.categoryDesc, { textAlign: isRTL ? 'left' : 'right' }]}>
                                                    {isRTL ? category.descriptionAr : category.description}
                                                </Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => onEditCategory(category.id)}
                                            style={styles.editButton}
                                        >
                                            <Ionicons
                                                name="create-outline"
                                                size={horizontalScale(20)}
                                                color={mealPlanColors.primary}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={styles.addCategoryButton}
                                onPress={onAddCategory}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="add-circle"
                                    size={horizontalScale(18)}
                                    color={mealPlanColors.actionBlue}
                                />
                                <Text style={styles.addCategoryText}>{t.addCategory}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: `${mealPlanColors.border}50`,
        overflow: 'hidden',
        ...shadows.card,
    },
    header: {
        padding: horizontalScale(16),
        backgroundColor: mealPlanColors.cardLight,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    emoji: {
        fontSize: ScaleFontSize(16),
    },
    title: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
    },
    titleArabic: {
        fontSize: ScaleFontSize(14),
        fontWeight: '400',
        color: mealPlanColors.textDesc,
    },
    headerRight: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    badge: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: borderRadius.full,
    },
    badgeFilled: {
        backgroundColor: `${mealPlanColors.statusGreen}15`,
    },
    badgeEmpty: {
        backgroundColor: `${mealPlanColors.statusRed}15`,
    },
    badgeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
    },
    badgeTextFilled: {
        color: mealPlanColors.statusGreen,
    },
    badgeTextEmpty: {
        color: mealPlanColors.statusRed,
    },
    content: {
        backgroundColor: mealPlanColors.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: `${mealPlanColors.border}50`,
        padding: horizontalScale(16),
        gap: verticalScale(12),
    },
    categoryItem: {
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: `${mealPlanColors.border}80`,
        padding: horizontalScale(12),
    },
    categoryContent: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textMain,
    },
    categoryDesc: {
        fontSize: ScaleFontSize(12),
        color: mealPlanColors.textSubtext,
        marginTop: verticalScale(2),
    },
    editButton: {
        padding: horizontalScale(4),
    },
    startAddingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        backgroundColor: mealPlanColors.cardLight,
        borderWidth: 1,
        borderColor: mealPlanColors.actionBlue,
        borderRadius: borderRadius.md,
        paddingVertical: verticalScale(12),
    },
    startAddingText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: mealPlanColors.actionBlue,
    },
    addCategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        backgroundColor: mealPlanColors.cardLight,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: `${mealPlanColors.actionBlue}60`,
        borderRadius: borderRadius.md,
        paddingVertical: verticalScale(10),
        marginTop: verticalScale(4),
    },
    addCategoryText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: mealPlanColors.actionBlue,
    },
});
