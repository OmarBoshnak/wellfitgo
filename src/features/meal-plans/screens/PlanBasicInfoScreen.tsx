/**
 * PlanBasicInfoScreen
 * Step 1: Basic plan configuration (name, calories, duration)
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, borderRadius, mealCountOptions, durationOptions, templatePlans, calorieConfig } from '../constants';
import { t } from '../translations';
import { ProgressSteps } from '../components/ProgressSteps';
import { ClientCard } from '../components/ClientCard';
import { CaloriesSlider } from '../components/CaloriesSlider';
import { BottomCTA } from '../components/BottomCTA';
import type { ClientInfo, NumberOfMeals, PlanDuration } from '../types';

interface PlanBasicInfoScreenProps {
    client: ClientInfo;
    onBack: () => void;
    onNext: (data: {
        planName: string;
        basedOn: string | null;
        calories: number;
        numberOfMeals: NumberOfMeals;
        duration: PlanDuration;
    }) => void;
}

export function PlanBasicInfoScreen({ client, onBack, onNext }: PlanBasicInfoScreenProps) {
    const insets = useSafeAreaInsets();
    const clientName = isRTL ? client.nameAr : client.name;

    // Form state
    const [planName, setPlanName] = useState(`${clientName}'s Custom Plan`);
    const [basedOn, setBasedOn] = useState<string>('fresh');
    const [calories, setCalories] = useState(calorieConfig.default);
    const [numberOfMeals, setNumberOfMeals] = useState<NumberOfMeals>(5);
    const [duration, setDuration] = useState<PlanDuration>('ongoing');
    const [showBasedOnPicker, setShowBasedOnPicker] = useState(false);

    const handleNext = () => {
        onNext({
            planName,
            basedOn: basedOn === 'fresh' ? null : basedOn,
            calories,
            numberOfMeals,
            duration,
        });
    };

    const selectedTemplate = templatePlans.find(p => p.id === basedOn);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.progressContainer}>
                    <ProgressSteps currentStep={1} />
                </View>
                <Text style={styles.headerTitle}>{t.customPlan}</Text>
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

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Client Card */}
                <View style={styles.clientCardContainer}>
                    <ClientCard client={client} />
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Plan Name */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{t.planName}</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={planName}
                                onChangeText={setPlanName}
                                placeholder={t.planName}
                                placeholderTextColor={mealPlanColors.textDesc}
                            />
                            <Ionicons
                                name="create-outline"
                                size={horizontalScale(20)}
                                color={mealPlanColors.textDesc}
                                style={styles.inputIcon}
                            />
                        </View>
                    </View>

                    {/* Daily Calories */}
                    <View style={styles.field}>
                        <CaloriesSlider value={calories} onValueChange={setCalories} />
                    </View>

                    {/* Number of Meals */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{t.numberOfMeals}</Text>
                        <View style={styles.segmentedControl}>
                            {mealCountOptions.map((count) => (
                                <TouchableOpacity
                                    key={count}
                                    style={[
                                        styles.segment,
                                        numberOfMeals === count && styles.segmentSelected,
                                    ]}
                                    onPress={() => setNumberOfMeals(count)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        numberOfMeals === count && styles.segmentTextSelected,
                                    ]}>
                                        {count}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Duration */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{t.duration}</Text>
                        <View style={styles.radioGroup}>
                            {durationOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.radioOption,
                                        duration === option.id && styles.radioOptionSelected,
                                    ]}
                                    onPress={() => setDuration(option.id as PlanDuration)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.radioOuter, duration === option.id && styles.radioOuterSelected]}>
                                        {duration === option.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[
                                        styles.radioLabel,
                                        duration === option.id && styles.radioLabelSelected,
                                        isRTL && styles.textRTL,
                                    ]}>
                                        {isRTL ? option.labelAr : option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Bottom spacing for CTA */}
                <View style={{ height: verticalScale(100) }} />
            </ScrollView>

            {/* Bottom CTA */}
            <BottomCTA
                primaryLabel={t.nextAddMeals}
                onPrimaryPress={handleNext}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: mealPlanColors.cardLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(10),
        paddingBottom: verticalScale(8),
        backgroundColor: mealPlanColors.cardLight,
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
        fontWeight: '600',
        color: mealPlanColors.textMain,
    },
    progressContainer: {
        alignItems: 'flex-end',


    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: verticalScale(24),
    },
    clientCardContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
    },
    form: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(8),
        gap: verticalScale(24),
    },
    field: {
        gap: verticalScale(8),
    },
    label: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    labelOptional: {
        fontWeight: '400',
        color: mealPlanColors.textDesc,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        height: verticalScale(48),
        backgroundColor: mealPlanColors.cardLight,
        borderWidth: 1,
        borderColor: mealPlanColors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: horizontalScale(16),
        paddingRight: horizontalScale(44),
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
    },
    inputRTL: {
        textAlign: 'right',
        paddingRight: horizontalScale(16),
        paddingLeft: horizontalScale(44),
    },
    inputIcon: {
        position: 'absolute',
        right: horizontalScale(12),
        top: verticalScale(14),
    },
    selectContainer: {
        height: verticalScale(48),
        backgroundColor: mealPlanColors.cardLight,
        borderWidth: 1,
        borderColor: mealPlanColors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: horizontalScale(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
    },
    dropdown: {
        backgroundColor: mealPlanColors.cardLight,
        borderWidth: 1,
        borderColor: mealPlanColors.border,
        borderRadius: borderRadius.md,
        marginTop: verticalScale(4),
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        borderBottomWidth: 1,
        borderBottomColor: mealPlanColors.border,
    },
    dropdownItemSelected: {
        backgroundColor: `${mealPlanColors.primary}08`,
    },
    dropdownText: {
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
    },
    dropdownTextSelected: {
        fontWeight: '500',
        color: mealPlanColors.primary,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: horizontalScale(4),
    },
    segment: {
        flex: 1,
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    segmentSelected: {
        backgroundColor: mealPlanColors.primary,
    },
    segmentText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    segmentTextSelected: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    radioGroup: {
        backgroundColor: mealPlanColors.cardLight,
        borderWidth: 1,
        borderColor: mealPlanColors.border,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(14),
        borderBottomWidth: 1,
        borderBottomColor: mealPlanColors.border,
    },
    radioOptionSelected: {
        backgroundColor: `${mealPlanColors.primary}08`,
    },
    radioOuter: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        borderWidth: 1,
        borderColor: mealPlanColors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderWidth: 2,
        borderColor: mealPlanColors.primary,
    },
    radioInner: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: mealPlanColors.primary,
    },
    radioLabel: {
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
    },
    radioLabelSelected: {
        fontWeight: '500',
    },
    textRTL: {
        textAlign: 'right',
    },
});
