/**
 * AddMealsScreen
 * Step 2: Configure meal sections and categories
 */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, borderRadius } from '../constants';
import { t } from '../translations';
import { ProgressSteps } from '../components/ProgressSteps';
import { MealSection } from '../components/MealSection';
import { BottomCTA } from '../components/BottomCTA';
import type { ClientInfo, MealSection as MealSectionType } from '../types';

interface AddMealsScreenProps {
    client: ClientInfo;
    meals: MealSectionType[];
    onBack: () => void;
    onNext: () => void;
    onToggleMeal: (mealId: string) => void;
    onAddCategory: (mealId: string) => void;
    onEditCategory: (mealId: string, categoryId: string) => void;
}

export function AddMealsScreen({
    client,
    meals,
    onBack,
    onNext,
    onToggleMeal,
    onAddCategory,
    onEditCategory,
}: AddMealsScreenProps) {
    const insets = useSafeAreaInsets();
    const clientName = isRTL ? client.nameAr : client.name;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[styles.headerTop, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={styles.progressRow}>
                        <ProgressSteps currentStep={2} />
                    </View>
                    <Text style={styles.headerTitle}>{t.addMeals}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isRTL ? 'arrow-back' : 'arrow-forward'}
                            size={horizontalScale(24)}
                            color={mealPlanColors.textMain}
                        />
                    </TouchableOpacity>

                </View>
            </View>

            {/* Context Bar */}
            <View style={[styles.contextBar, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.contextText,]}>
                    {t.customizeMealsFor}{' '}
                    <Text style={styles.contextHighlight}>{clientName}</Text>
                    {t.plan}
                </Text>
            </View>

            {/* Meal Sections */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {meals.map((meal) => (
                    <MealSection
                        key={meal.id}
                        meal={meal}
                        onToggle={() => onToggleMeal(meal.id)}
                        onAddCategory={() => onAddCategory(meal.id)}
                        onEditCategory={(categoryId) => onEditCategory(meal.id, categoryId)}
                    />
                ))}

                {/* Bottom spacing for CTA */}
                <View style={{ height: verticalScale(100) }} />
            </ScrollView>

            {/* Bottom CTA */}
            <BottomCTA
                primaryLabel={t.nextReview}
                onPrimaryPress={onNext}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: mealPlanColors.backgroundLight,
    },
    header: {
        backgroundColor: mealPlanColors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: `${mealPlanColors.border}50`,
    },
    headerTop: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(10),
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: horizontalScale(20),
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: mealPlanColors.textMain,
    },
    spacer: {
        width: horizontalScale(40),
    },
    progressRow: {
        alignItems: 'center',
    },
    contextBar: {
        marginHorizontal: horizontalScale(24),
        marginVertical: verticalScale(16),
        backgroundColor: mealPlanColors.cardLight,
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(16),
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: `${mealPlanColors.border}50`,
    },
    contextText: {
        fontSize: ScaleFontSize(14),
        color: mealPlanColors.textSubtext,
        textAlign: 'center',
    },
    contextHighlight: {
        color: mealPlanColors.primary,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        gap: verticalScale(16),
    },
    textRTL: {
        textAlign: 'right',
    },
});
