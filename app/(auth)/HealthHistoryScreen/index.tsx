import { colors, gradients } from '@/src/core/constants/Themes';
import { healthTranslations, isRTL } from '@/src/core/constants/translations';
import { useAppDispatch } from '@/src/store/hooks';
import { setHealthData } from '@/src/store/userSlice';
import {
    horizontalScale,
    ScaleFontSize,
    verticalScale,
} from '@/src/core/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Design colors matching HTML/Tailwind design
const designColors = {
    brandBlue: '#5073FE',
    brandCyan: '#02C3CD',
    textPrimary: '#526477',
    textSecondary: '#8093A5',
    textTertiary: '#AAB8C5',
    borderLight: '#E1E8EF',
    bgScreen: '#F8F9FA',
    bgCard: '#FFFFFF',
};

interface FormData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: 'male' | 'female' | '';
    age: string;
    height: string;
    heightUnit: 'cm' | 'ft';
    currentWeight: string;
    targetWeight: string;
    goal: 'loss' | 'maintain' | 'gain' | '';
    medicalConditions: string[];
}

const medicalConditionOptions = [
    { key: 'none', label: healthTranslations.conditionNone },
    { key: 'diabetes', label: healthTranslations.conditionDiabetes },
    { key: 'hypertension', label: healthTranslations.conditionHypertension },
    { key: 'pcos', label: healthTranslations.conditionPCOS },
    { key: 'other', label: healthTranslations.conditionOther },
];

const HealthHistoryScreen = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        gender: '',
        age: '',
        height: '170',
        heightUnit: 'cm',
        currentWeight: '70',
        targetWeight: '',
        goal: '',
        medicalConditions: [],
    });

    const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleMedicalCondition = (condition: string) => {
        setFormData(prev => {
            const conditions = prev.medicalConditions;
            // If selecting "none", clear all others
            if (condition === 'none') {
                return { ...prev, medicalConditions: ['none'] };
            }
            // If selecting anything else, remove "none" if present
            let newConditions = conditions.filter(c => c !== 'none');
            if (newConditions.includes(condition)) {
                newConditions = newConditions.filter(c => c !== condition);
            } else {
                newConditions.push(condition);
            }
            return { ...prev, medicalConditions: newConditions };
        });
    };

    const isFormValid = () => {
        return (
            formData.firstName &&
            formData.lastName &&
            formData.phoneNumber &&
            formData.gender &&
            formData.age &&
            formData.height &&
            formData.currentWeight &&
            formData.targetWeight &&
            formData.goal
        );
    };

    const handleComplete = async () => {
        // Convert medicalConditions array to string for Redux/Convex
        const medicalConditionsString = formData.medicalConditions
            .filter(c => c !== 'none')
            .join(', ');

        const dataForStore = {
            ...formData,
            medicalConditions: medicalConditionsString,
        };

        // Save form data to Redux store (will be synced to Convex in BookCallScreen)
        dispatch(setHealthData(dataForStore));

        // Navigate to BookCallScreen - Convex sync happens there to prevent redirect
        router.push('/(auth)/BookCallScreen');
    };

    const goals = [
        { key: 'loss', label: healthTranslations.weightLoss, icon: 'monitor-weight' as const },
        { key: 'maintain', label: healthTranslations.maintainWeight, icon: 'accessibility-new' as const },
        { key: 'gain', label: healthTranslations.gainMuscle, icon: 'fitness-center' as const },
    ] as const;

    const incrementHeight = () => {
        const current = parseInt(formData.height) || 0;
        updateFormData('height', String(current + 1));
    };

    const decrementHeight = () => {
        const current = parseInt(formData.height) || 0;
        if (current > 0) updateFormData('height', String(current - 1));
    };

    const incrementWeight = () => {
        const current = parseFloat(formData.currentWeight) || 0;
        updateFormData('currentWeight', String((current + 0.5).toFixed(1)));
    };

    const decrementWeight = () => {
        const current = parseFloat(formData.currentWeight) || 0;
        if (current > 0) updateFormData('currentWeight', String((current - 0.5).toFixed(1)));
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo - UNCHANGED */}
                    <View style={styles.logoContainer}>
                        <Image source={require('@/assets/Wellfitgo.png')} style={styles.logo} />
                    </View>

                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={[styles.mainTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.personalizeTitle}</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        {/* First Name */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.firstName}</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.firstName}
                                onChangeText={(text) => updateFormData('firstName', text)}
                                placeholder={healthTranslations.enterName}
                                placeholderTextColor={designColors.textTertiary}
                            />
                        </View>

                        {/* Last Name */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.lastName}</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.lastName}
                                onChangeText={(text) => updateFormData('lastName', text)}
                                placeholder={healthTranslations.enterName}
                                placeholderTextColor={designColors.textTertiary}
                            />
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.phoneNumber}</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.phoneNumber}
                                onChangeText={(text) => updateFormData('phoneNumber', text.replace(/\D/g, ''))}
                                placeholder="123456789"
                                placeholderTextColor={designColors.textTertiary}
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Gender Selection */}
                        <View style={styles.genderContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.genderCard,
                                    formData.gender === 'male' && styles.genderCardSelected,
                                ]}
                                onPress={() => updateFormData('gender', 'male')}
                            >
                                <MaterialIcons
                                    name="male"
                                    size={40}
                                    color={formData.gender === 'male' ? designColors.brandBlue : designColors.textTertiary}
                                />
                                <Text style={[
                                    styles.genderText,
                                    formData.gender === 'male' && styles.genderTextSelected,
                                ]}>
                                    {healthTranslations.male}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.genderCard,
                                    formData.gender === 'female' && styles.genderCardSelected,
                                ]}
                                onPress={() => updateFormData('gender', 'female')}
                            >
                                <MaterialIcons
                                    name="female"
                                    size={40}
                                    color={formData.gender === 'female' ? designColors.brandBlue : designColors.textTertiary}
                                />
                                <Text style={[
                                    styles.genderText,
                                    formData.gender === 'female' && styles.genderTextSelected,
                                ]}>
                                    {healthTranslations.female}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Age */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.yourAge}</Text>
                            <View style={styles.inputWithSuffix}>
                                <TextInput
                                    style={[styles.textInput, styles.inputFlex]}
                                    value={formData.age}
                                    onChangeText={(text) => updateFormData('age', text.replace(/\D/g, ''))}
                                    placeholder="25"
                                    placeholderTextColor={designColors.textTertiary}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                                <Text style={styles.inputSuffix}>{healthTranslations.years}</Text>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Height */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.sectionTitle}>{healthTranslations.height}</Text>
                                <View style={[styles.unitToggle, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.unitOption,
                                            formData.heightUnit === 'cm' && styles.unitOptionSelected,
                                        ]}
                                        onPress={() => updateFormData('heightUnit', 'cm')}
                                    >
                                        {formData.heightUnit === 'cm' ? (
                                            <LinearGradient
                                                colors={gradients.primary}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.unitGradient}
                                            >
                                                <Text style={styles.unitTextSelected}>cm</Text>
                                            </LinearGradient>
                                        ) : (
                                            <Text style={styles.unitText}>cm</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.unitOption,
                                            formData.heightUnit === 'ft' && styles.unitOptionSelected,
                                        ]}
                                        onPress={() => updateFormData('heightUnit', 'ft')}
                                    >
                                        {formData.heightUnit === 'ft' ? (
                                            <LinearGradient
                                                colors={gradients.primary}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.unitGradient}
                                            >
                                                <Text style={styles.unitTextSelected}>ft</Text>
                                            </LinearGradient>
                                        ) : (
                                            <Text style={styles.unitText}>ft</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.pickerCard, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <TouchableOpacity style={styles.pickerButton} onPress={decrementHeight}>
                                    <MaterialIcons name="remove" size={24} color={designColors.brandBlue} />
                                </TouchableOpacity>
                                <View style={styles.pickerValue}>
                                    <Text style={styles.pickerUnitText}>{formData.heightUnit}</Text>
                                    <Text style={styles.pickerValueText}>{formData.height}</Text>
                                </View>
                                <TouchableOpacity style={styles.pickerButton} onPress={incrementHeight}>
                                    <MaterialIcons name="add" size={24} color={designColors.brandBlue} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Current Weight */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.sectionTitle}>{healthTranslations.currentWeight}</Text>
                            </View>
                            <View style={[styles.pickerCardLarge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                {/* Decorative scale lines */}
                                <View style={styles.scaleDecoration}>
                                    {[...Array(9)].map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.scaleLine,
                                                { height: i % 3 === 0 ? 12 : i % 2 === 0 ? 8 : 4 },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <TouchableOpacity style={styles.pickerButton} onPress={decrementWeight}>
                                    <MaterialIcons name="remove" size={24} color={designColors.brandBlue} />
                                </TouchableOpacity>
                                <View style={styles.pickerValue}>
                                    <Text style={styles.pickerUnitTextCyan}>kg</Text>
                                    <Text style={styles.pickerValueTextLarge}>{formData.currentWeight}</Text>
                                </View>
                                <TouchableOpacity style={styles.pickerButton} onPress={incrementWeight}>
                                    <MaterialIcons name="add" size={24} color={designColors.brandBlue} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Target Weight */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.targetWeight}</Text>
                            <View style={styles.inputWithSuffix}>
                                <TextInput
                                    style={[styles.textInput, styles.inputFlex]}
                                    value={formData.targetWeight}
                                    onChangeText={(text) => updateFormData('targetWeight', text.replace(/\D/g, ''))}
                                    placeholder="70"
                                    placeholderTextColor={designColors.textTertiary}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                                <Text style={styles.inputSuffixBlue}>kg</Text>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Goal Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.goal}</Text>
                            <View style={styles.goalsContainer}>
                                {goals.map((goalItem) => (
                                    <TouchableOpacity
                                        key={goalItem.key}
                                        style={[
                                            styles.goalCard,
                                            formData.goal === goalItem.key && styles.goalCardSelected,
                                            , { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                        onPress={() => updateFormData('goal', goalItem.key)}
                                    >
                                        <View style={styles.goalIconContainer}>
                                            <MaterialIcons
                                                name={goalItem.icon}
                                                size={24}
                                                color={designColors.brandBlue}
                                            />
                                        </View>
                                        <View style={styles.goalTextContainer}>
                                            <Text style={[
                                                styles.goalLabel,
                                                formData.goal === goalItem.key && styles.goalLabelSelected,
                                                , { textAlign: isRTL ? 'left' : 'right' }]}>
                                                {goalItem.label}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.radioOuter,
                                            formData.goal === goalItem.key && styles.radioOuterSelected,
                                        ]}>
                                            {formData.goal === goalItem.key && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Medical Conditions */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{healthTranslations.medicalConditions}</Text>
                            <View style={[styles.chipContainer, { flexDirection: isRTL ? 'row' : 'row-reverse', }]}>
                                {medicalConditionOptions.map((condition) => {
                                    const isSelected = formData.medicalConditions.includes(condition.key);
                                    return (
                                        <TouchableOpacity
                                            key={condition.key}
                                            onPress={() => toggleMedicalCondition(condition.key)}
                                        >
                                            {isSelected ? (
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.chipSelected}
                                                >
                                                    <Text style={styles.chipTextSelected}>{condition.label}</Text>
                                                </LinearGradient>
                                            ) : (
                                                <View style={styles.chip}>
                                                    <Text style={styles.chipText}>{condition.label}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Spacer for bottom button */}
                        <View style={{ height: verticalScale(80) }} />
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        onPress={handleComplete}
                        disabled={!isFormValid()}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={isFormValid() ? gradients.primary : ['#CCC', '#AAA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.submitButton,
                                !isFormValid() && styles.submitButtonDisabled,
                            ]}
                        >
                            <MaterialIcons
                                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                                size={20}
                                color={colors.white}
                            />

                            <Text style={styles.submitButtonText}>{healthTranslations.startJourney}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: designColors.bgScreen,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(20),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(24),
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    logo: {
        height: verticalScale(70),
        width: horizontalScale(70),
        borderRadius: horizontalScale(10),
    },
    titleSection: {
        marginBottom: verticalScale(16),
    },
    mainTitle: {
        fontSize: ScaleFontSize(22),
        fontWeight: '700',
        color: designColors.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
        lineHeight: verticalScale(28),
    },
    formSection: {
        gap: verticalScale(14),
    },
    inputGroup: {
        gap: verticalScale(6),
    },
    label: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: designColors.textSecondary,
        textAlign: isRTL ? 'right' : 'left',
    },
    sectionTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: designColors.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
    },
    textInput: {
        height: verticalScale(35),
        paddingHorizontal: horizontalScale(12),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        backgroundColor: designColors.bgCard,
        fontSize: ScaleFontSize(14),
        color: designColors.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
    },
    inputWithSuffix: {
        position: 'relative',
    },
    inputFlex: {
        paddingRight: horizontalScale(50),
    },
    inputSuffix: {
        position: 'absolute',
        right: horizontalScale(12),
        top: '50%',
        transform: [{ translateY: -8 }],
        fontSize: ScaleFontSize(12),
        color: designColors.textTertiary,
    },
    inputSuffixBlue: {
        position: 'absolute',
        right: horizontalScale(12),
        top: '50%',
        transform: [{ translateY: -8 }],
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: designColors.brandBlue,
    },
    genderContainer: {
        flexDirection: isRTL ? 'row' : 'row-reverse',
        gap: horizontalScale(15),
    },
    genderCard: {
        flex: 1,
        height: verticalScale(60),
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    genderCardSelected: {
        borderColor: designColors.brandBlue,
        backgroundColor: 'rgba(80, 115, 254, 0.05)',
    },
    genderText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: designColors.textSecondary,
    },
    genderTextSelected: {
        color: designColors.textPrimary,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: designColors.borderLight,
        marginVertical: verticalScale(8),
    },
    labelRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    unitToggle: {
        backgroundColor: designColors.bgCard,
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: designColors.borderLight,
    },
    unitOption: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    unitOptionSelected: {},
    unitGradient: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        borderRadius: 16,
    },
    unitText: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: designColors.textTertiary,
    },
    unitTextSelected: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: colors.white,
    },
    pickerCard: {
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    pickerCardLarge: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        paddingVertical: verticalScale(16),
        paddingHorizontal: horizontalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden',
    },
    scaleDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(12),
        opacity: 0.1,
    },
    scaleLine: {
        width: 2,
        backgroundColor: designColors.brandBlue,
        borderRadius: 1,
    },
    pickerButton: {
        padding: horizontalScale(6),
        borderRadius: horizontalScale(16),
    },
    pickerValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: horizontalScale(2),
    },
    pickerValueText: {
        fontSize: ScaleFontSize(32),
        fontWeight: '700',
        color: designColors.textPrimary,
        letterSpacing: -1,
    },
    pickerValueTextLarge: {
        fontSize: ScaleFontSize(38),
        fontWeight: '700',
        color: designColors.textPrimary,
        letterSpacing: -1,
    },
    pickerUnitText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: designColors.brandCyan,
    },
    pickerUnitTextCyan: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: designColors.brandCyan,
    },
    goalsContainer: {
        gap: verticalScale(8),
    },
    goalCard: {
        alignItems: 'center',
        gap: horizontalScale(12),
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        padding: horizontalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    goalCardSelected: {
        borderColor: designColors.brandBlue,
        backgroundColor: 'rgba(80, 115, 254, 0.05)',
    },
    goalIconContainer: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalTextContainer: {
        flex: 1,
    },
    goalLabel: {
        fontSize: ScaleFontSize(13),
        fontWeight: '700',
        color: designColors.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
    },
    goalLabelSelected: {
        color: designColors.textPrimary,
    },
    radioOuter: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        borderWidth: 2,
        borderColor: designColors.textTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: designColors.brandBlue,
        backgroundColor: designColors.brandBlue,
    },
    radioInner: {
        width: horizontalScale(6),
        height: horizontalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: colors.white,
    },
    chipContainer: {
        flexWrap: 'wrap',
        gap: horizontalScale(6),
    },
    chip: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(16),
        backgroundColor: designColors.bgCard,
        borderWidth: 1,
        borderColor: designColors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    chipSelected: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(16),
    },
    chipText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: designColors.textSecondary,
    },
    chipTextSelected: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.white,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(12),
        backgroundColor: designColors.bgScreen,
    },
    submitButton: {
        height: verticalScale(48),
        borderRadius: horizontalScale(24),
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(6),
        shadowColor: designColors.brandBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: ScaleFontSize(15),
        fontWeight: '700',
        color: colors.white,
    },
});

export default HealthHistoryScreen;
