import { colors } from '@/src/core/constants/Themes';
import { healthTranslations, isRTL } from '@/src/core/constants/translations';
import { useAppDispatch } from '@/src/store/hooks';
import { setHealthData } from '@/src/store/userSlice';
import {
    horizontalScale,
    ScaleFontSize,
    verticalScale,
} from '@/src/core/utils/scaling';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
    medicalConditions: string;
}

const HealthHistoryScreen = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        gender: '',
        age: '',
        height: '',
        heightUnit: 'cm',
        currentWeight: '',
        targetWeight: '',
        goal: '',
        medicalConditions: '',
    });

    const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
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
        // Save form data to Redux store
        dispatch(setHealthData(formData));

        // Sync with Convex database
        try {
            // Map form goal to Convex goal format
            const goalMap = {
                loss: 'weight_loss',
                maintain: 'maintain',
                gain: 'gain_muscle',
            } as const;

            await completeOnboarding({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phoneNumber,
                gender: formData.gender as 'male' | 'female',
                age: parseInt(formData.age, 10),
                height: parseInt(formData.height, 10),
                heightUnit: formData.heightUnit,
                currentWeight: parseInt(formData.currentWeight, 10),
                targetWeight: parseInt(formData.targetWeight, 10),
                goal: goalMap[formData.goal as keyof typeof goalMap],
                medicalConditions: formData.medicalConditions || undefined,
            });
            console.log('[HealthHistory] Data synced with Convex');
        } catch (error) {
            console.error('[HealthHistory] Failed to sync with Convex:', error);
            // Continue to main app even if Convex sync fails
        }

        router.replace('/(app)/(tabs)');
    };

    const goals = [
        { key: 'loss', label: healthTranslations.weightLoss },
        { key: 'maintain', label: healthTranslations.maintainWeight },
        { key: 'gain', label: healthTranslations.gainMuscle },
    ] as const;

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
                    {/* Title */}
                    <View style={{ flex: 1, alignItems: 'center', marginBottom: verticalScale(20) }}>
                        <Image source={require('@/assets/Wellfitgo.png')} style={{ height: 80, width: 80, borderRadius: 10 }} />

                    </View>

                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.firstName}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.firstName}
                            onChangeText={(text) => updateFormData('firstName', text)}
                            placeholder={healthTranslations.firstName}
                            placeholderTextColor={colors.gray}
                        />
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.lastName}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.lastName}
                            onChangeText={(text) => updateFormData('lastName', text)}
                            placeholder={healthTranslations.lastName}
                            placeholderTextColor={colors.gray}
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.phoneNumber || 'Phone Number'}</Text>
                        <TextInput
                            keyboardType='number-pad'
                            style={styles.textInput}
                            value={formData.phoneNumber}
                            onChangeText={(text) => updateFormData('phoneNumber', text.replace(/\D/g, ''))}
                            placeholder="123456789"
                            placeholderTextColor={colors.gray}
                        />
                    </View>


                    {/* Gender Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.gender}</Text>
                        <View style={styles.genderRow}>
                            {(['male', 'female'] as const).map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    style={[
                                        styles.genderButton,
                                        formData.gender === gender && styles.genderButtonSelected,
                                    ]}
                                    onPress={() => updateFormData('gender', gender)}
                                >
                                    <Text
                                        style={[
                                            styles.genderButtonText,
                                            formData.gender === gender && styles.genderButtonTextSelected,
                                        ]}
                                    >
                                        {gender === 'male' ? healthTranslations.male : healthTranslations.female}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Age */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.yourAge}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.age}

                            onChangeText={(text) => updateFormData('age', text.replace(/\D/g, ''))}
                            placeholder="25"
                            placeholderTextColor={colors.gray}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    {/* Height */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.whatHeight}</Text>
                        <View style={styles.inputWithUnit}>
                            <TouchableOpacity
                                style={styles.unitButton}
                                onPress={() => updateFormData('heightUnit', formData.heightUnit === 'cm' ? 'ft' : 'cm')}
                            >
                                <Text style={styles.unitButtonText}>{formData.heightUnit}</Text>
                            </TouchableOpacity>

                            <TextInput
                                style={[styles.textInput, styles.inputFlex]}
                                value={formData.height}
                                onChangeText={(text) => updateFormData('height', text.replace(/\D/g, ''))}
                                placeholder="175"
                                placeholderTextColor={colors.gray}
                                keyboardType="number-pad"
                                maxLength={3}
                            />
                        </View>
                    </View>

                    {/* Current Weight */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.currentWeight}</Text>
                        <View style={styles.inputWithUnit}>
                            <View style={styles.unitButton}>
                                <Text style={styles.unitButtonText}>kg</Text>
                            </View>

                            <TextInput
                                style={[styles.textInput, styles.inputFlex]}
                                value={formData.currentWeight}
                                onChangeText={(text) => updateFormData('currentWeight', text.replace(/\D/g, ''))}
                                placeholder="70"
                                placeholderTextColor={colors.gray}
                                keyboardType="number-pad"
                                maxLength={3}
                            />
                        </View>
                    </View>

                    {/* Target Weight */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.targetWeight}</Text>
                        <View style={styles.inputWithUnit}>
                            <View style={styles.unitButton}>
                                <Text style={styles.unitButtonText}>kg</Text>
                            </View>

                            <TextInput
                                style={[styles.textInput, styles.inputFlex]}
                                value={formData.targetWeight}
                                onChangeText={(text) => updateFormData('targetWeight', text.replace(/\D/g, ''))}
                                placeholder="65"
                                placeholderTextColor={colors.gray}
                                keyboardType="number-pad"
                                maxLength={3}
                            />
                        </View>
                    </View>

                    {/* Goal Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.goal}</Text>
                        <View style={styles.goalsContainer}>
                            {goals.map((goalItem) => (
                                <TouchableOpacity
                                    key={goalItem.key}
                                    style={[
                                        styles.goalButton,
                                        formData.goal === goalItem.key && styles.goalButtonSelected,
                                    ]}
                                    onPress={() => updateFormData('goal', goalItem.key)}
                                >
                                    <Text
                                        style={[
                                            styles.goalButtonText,
                                            formData.goal === goalItem.key && styles.goalButtonTextSelected,
                                        ]}
                                    >
                                        {goalItem.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Medical Conditions */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isRTL && styles.alignText]}>{healthTranslations.medicalConditions}</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={formData.medicalConditions}
                            onChangeText={(text) => updateFormData('medicalConditions', text)}
                            placeholder={healthTranslations.medicalPlaceholder}
                            placeholderTextColor={colors.gray}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !isFormValid() && styles.submitButtonDisabled,
                        ]}
                        onPress={handleComplete}
                        disabled={!isFormValid()}
                    >
                        <Feather
                            name={isRTL ? 'chevron-left' : 'chevron-right'}
                            size={20}
                            color={colors.white}
                        />

                        <Text style={styles.submitButtonText}>{healthTranslations.startJourney}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        direction: 'rtl',
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
        paddingBottom: verticalScale(16),
        direction: 'rtl',
    },
    alignText: {
        textAlign: 'left'
    },
    title: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.dark,
        textAlign: 'center',
        marginBottom: verticalScale(24),
    },
    inputGroup: {
        marginBottom: verticalScale(16),
    },
    label: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.dark,
        marginBottom: verticalScale(8),
        textAlign: isRTL ? 'right' : 'left',
    },
    textInput: {
        height: verticalScale(48),
        paddingHorizontal: horizontalScale(12),
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.gray,
        backgroundColor: colors.white,
        fontSize: ScaleFontSize(16),
        color: colors.dark,
        textAlign: isRTL ? 'right' : 'left',
    },
    textArea: {
        height: verticalScale(96),
        paddingTop: verticalScale(12),
    },
    genderRow: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        gap: horizontalScale(12),
    },
    genderButton: {
        flex: 1,
        height: verticalScale(48),
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.gray,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderButtonSelected: {
        borderColor: colors.primaryDark,
        backgroundColor: 'rgba(80, 115, 254, 0.08)',
    },
    genderButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.dark,
    },
    genderButtonTextSelected: {
        color: colors.primaryDark,
    },
    inputWithUnit: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        gap: horizontalScale(8),
    },
    inputFlex: {
        flex: 1,
    },
    unitButton: {
        width: horizontalScale(64),
        height: verticalScale(48),
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.gray,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.dark,
    },
    goalsContainer: {
        gap: verticalScale(8),
    },
    goalButton: {
        height: verticalScale(48),
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.gray,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalButtonSelected: {
        borderColor: colors.primaryDark,
        backgroundColor: 'rgba(80, 115, 254, 0.08)',
    },
    goalButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.dark,
    },
    goalButtonTextSelected: {
        color: colors.primaryDark,
    },
    bottomSection: {
        paddingHorizontal: horizontalScale(20),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.gray,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(16),
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.gray,
    },
    dotActive: {
        backgroundColor: colors.primaryDark,
    },
    submitButton: {
        height: verticalScale(56),
        borderRadius: 12,
        backgroundColor: colors.primaryDark,
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: colors.gray,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.white,
    },
});

export default HealthHistoryScreen;
