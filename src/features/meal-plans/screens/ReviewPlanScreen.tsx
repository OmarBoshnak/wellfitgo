/**
 * ReviewPlanScreen
 * Step 3: Review plan summary, macros, and meal preview
 */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, mealPlanGradients, borderRadius, shadows, defaultMacros } from '../constants';
import { t } from '../translations';
import { ProgressSteps } from '../components/ProgressSteps';
import { MacroDonutChart } from '../components/MacroDonutChart';
import { BottomCTA } from '../components/BottomCTA';
import type { ClientInfo, MealPreview, PlanWarning, PlanDuration, NumberOfMeals } from '../types';

interface ReviewPlanScreenProps {
    client: ClientInfo;
    planName: string;
    calories: number;
    numberOfMeals: NumberOfMeals;
    duration: PlanDuration;
    mealPreviews: MealPreview[];
    warnings?: PlanWarning[];
    onBack: () => void;
    onNext: () => void;
    onMealPress?: (mealId: string) => void;
    onWarningAction?: (warningId: string) => void;
}

export function ReviewPlanScreen({
    client,
    planName,
    calories,
    numberOfMeals,
    duration,
    mealPreviews,
    warnings = [],
    onBack,
    onNext,
    onMealPress,
    onWarningAction,
}: ReviewPlanScreenProps) {
    const insets = useSafeAreaInsets();
    const clientName = isRTL ? client.nameAr : client.name;

    const durationLabel = {
        week: isRTL ? 'أسبوع' : '1 week',
        '2weeks': isRTL ? 'أسبوعين' : '2 weeks',
        month: isRTL ? 'شهر' : '1 month',
        ongoing: isRTL ? 'مستمر' : 'Ongoing',
    }[duration];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[styles.headerTop, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={styles.progressRow}>
                        <ProgressSteps currentStep={3} />
                    </View>
                    <Text style={styles.headerTitle}>{t.reviewPlan}</Text>
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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Hero Card */}
                <LinearGradient
                    colors={[...mealPlanGradients.heroCard]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    {/* Decorative blurs */}
                    <View style={styles.heroBlur1} />
                    <View style={styles.heroBlur2} />

                    <View style={[styles.heroContent, isRTL && styles.heroContentRTL]}>
                        <View style={styles.heroInfo}>
                            <Text style={[styles.heroTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{planName}</Text>
                            <Text style={[styles.heroSubtitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.custom} • {t.highProtein}
                            </Text>
                        </View>
                        <View style={styles.heroAvatar}>
                            {client.avatarUrl ? (
                                <Image source={{ uri: client.avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{clientName.charAt(0)}</Text>
                                </View>
                            )}
                            <Text style={styles.avatarLabel}>{clientName.split(' ')[0]}</Text>
                        </View>
                    </View>

                    <View style={styles.heroDivider} />

                    <View style={[styles.heroStats, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.heroStat, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Ionicons name="flame-outline" size={horizontalScale(18)} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.heroStatText}>{calories}-{calories + 100} {t.kcal}</Text>
                        </View>
                        <View style={[styles.heroStat, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Ionicons name="restaurant-outline" size={horizontalScale(18)} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.heroStatText}>{numberOfMeals} {t.meals}</Text>
                        </View>
                        <View style={[styles.heroStat, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Ionicons name="calendar-outline" size={horizontalScale(18)} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.heroStatText}>{durationLabel}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Warnings Card */}
                {warnings.map((warning) => (
                    <View key={warning.id} style={styles.warningCard}>
                        <View style={[styles.warningContent, isRTL && styles.warningContentRTL]}>
                            <Ionicons name="warning-outline" size={horizontalScale(20)} color="#F59E0B" />
                            <View style={styles.warningText}>
                                <Text style={[styles.warningMessage, isRTL && styles.textRTL]}>
                                    {isRTL ? warning.messageAr : warning.message}
                                </Text>
                                {warning.action && (
                                    <TouchableOpacity onPress={() => onWarningAction?.(warning.id)}>
                                        <Text style={[styles.warningAction, isRTL && styles.textRTL]}>
                                            {isRTL ? warning.actionAr : warning.action}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                ))}

                {/* Macro Split Card */}
                <View style={styles.macroCard}>
                    <View style={[styles.macroHeader, isRTL && styles.macroHeaderRTL]}>
                        <Text style={styles.macroTitle}>{t.macroSplit}</Text>
                        <View style={styles.macroBadge}>
                            <Text style={styles.macroBadgeText}>{t.dailyAvg}</Text>
                        </View>
                    </View>
                    <MacroDonutChart macros={defaultMacros} />
                </View>

                {/* Meals Preview */}
                <View style={styles.mealsPreview}>
                    <Text style={[styles.mealsPreviewTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{t.mealsPreview}</Text>
                    {mealPreviews.map((meal) => (
                        <TouchableOpacity
                            key={meal.id}
                            style={styles.mealPreviewCard}
                            onPress={() => onMealPress?.(meal.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.mealPreviewContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.mealPreviewIcon, { backgroundColor: meal.iconBgColor }]}>
                                    <Ionicons name={meal.icon as any} size={horizontalScale(24)} color={meal.iconColor} />
                                </View>
                                <View style={styles.mealPreviewInfo}>
                                    <Text style={[styles.mealPreviewName, { textAlign: isRTL ? 'left' : 'right' }]}>
                                        {isRTL ? meal.nameAr : meal.name}
                                    </Text>
                                    <Text style={[styles.mealPreviewMeta, { textAlign: isRTL ? 'left' : 'right' }]}>
                                        {meal.categoryCount} {t.categories} • {meal.optionCount} {t.options}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                                    size={horizontalScale(20)}
                                    color={mealPlanColors.textDesc}
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bottom spacing */}
                <View style={{ height: verticalScale(100) }} />
            </ScrollView>

            {/* Bottom CTA */}
            <BottomCTA
                primaryLabel={t.nextAssignPlan}
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
    },
    headerTop: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(8),
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: mealPlanColors.textMain,
    },
    spacer: {
        width: horizontalScale(40),
    },
    progressRow: {
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(8),
        gap: verticalScale(16),
    },
    // Hero Card
    heroCard: {
        borderRadius: borderRadius.lg,
        padding: horizontalScale(20),
        overflow: 'hidden',
        ...shadows.primaryButton,
    },
    heroBlur1: {
        position: 'absolute',
        right: -20,
        top: -20,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    heroBlur2: {
        position: 'absolute',
        left: -10,
        bottom: -10,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroContentRTL: {
        flexDirection: 'row-reverse',
    },
    heroInfo: {
        flex: 1,
        marginHorizontal: 15
    },
    heroTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    heroSubtitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
        marginTop: verticalScale(4),
    },
    heroAvatar: {
        alignItems: 'center',
        gap: verticalScale(4),
    },
    avatarImage: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarPlaceholder: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatarLabel: {
        fontSize: ScaleFontSize(10),
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
    },
    heroDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: verticalScale(16),
    },
    heroStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: verticalScale(12),
    },
    heroStatsRTL: {
        flexDirection: 'row-reverse',
    },
    heroStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    heroStatRTL: {
        flexDirection: 'row-reverse',
    },
    heroStatText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    // Warning Card
    warningCard: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: borderRadius.md,
        padding: horizontalScale(16),
    },
    warningContent: {
        flexDirection: 'row',
        gap: horizontalScale(12),
    },
    warningContentRTL: {
        flexDirection: 'row-reverse',
    },
    warningText: {
        flex: 1,
        gap: verticalScale(4),
    },
    warningMessage: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    warningAction: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: mealPlanColors.primary,
    },
    // Macro Card
    macroCard: {
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.lg,
        padding: horizontalScale(20),
        ...shadows.card,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    macroHeaderRTL: {
        flexDirection: 'row-reverse',
    },
    macroTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
    },
    macroBadge: {
        backgroundColor: mealPlanColors.backgroundLight,
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: borderRadius.sm,
    },
    macroBadgeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: mealPlanColors.textDesc,
    },
    // Meals Preview
    mealsPreview: {
        gap: verticalScale(12),
    },
    mealsPreviewTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
        paddingHorizontal: horizontalScale(4),
    },
    mealPreviewCard: {
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.md,
        padding: horizontalScale(16),
        ...shadows.card,
    },
    mealPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    mealPreviewContentRTL: {
        flexDirection: 'row-reverse',
    },
    mealPreviewIcon: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealPreviewInfo: {
        flex: 1,
    },
    mealPreviewName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: mealPlanColors.textMain,
    },
    mealPreviewMeta: {
        fontSize: ScaleFontSize(12),
        color: mealPlanColors.textDesc,
        marginTop: verticalScale(2),
    },
    textRTL: {
        textAlign: 'right',
    },
});
