import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import {
    horizontalScale,
    ScaleFontSize,
    verticalScale,
} from '@/src/core/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAppSelector } from '@/src/store/hooks';
import { RootState } from '@/src/store/types';
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
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = {
    title: isRTL ? 'احجز مكالمتك الأولى' : 'Book Your First Call',
    subtitle: isRTL ? 'اختر الطبيب والوقت المناسب لك' : 'Choose your doctor and preferred time',
    selectDoctor: isRTL ? 'اختر الطبيب' : 'Select Doctor',
    selectDate: isRTL ? 'اختر التاريخ' : 'Select Date',
    selectTime: isRTL ? 'اختر الوقت' : 'Select Time',
    from: isRTL ? 'من' : 'From',
    to: isRTL ? 'الى' : 'To',
    notes: isRTL ? 'ملاحظات (اختياري)' : 'Notes (Optional)',
    notesPlaceholder: isRTL ? 'أخبرنا عن أهدافك...' : 'Tell us about your goals...',
    bookCall: isRTL ? 'احجز المكالمة' : 'Book Call',
    skip: isRTL ? 'تخطي' : 'Skip for now',
    errorSelectDoctor: isRTL ? 'الرجاء اختيار طبيب' : 'Please select a doctor',
    today: isRTL ? '(اليوم)' : '(Today)',
};

// =============================================================================
// DESIGN COLORS
// =============================================================================

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

// =============================================================================
// DOCTORS - Fetched from Convex
// =============================================================================

interface Doctor {
    id: Id<"users">;
    name: string;
    nameAr: string;
    avatarUrl?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets day name from index (0 = Sunday)
 */
function getDayNameFromIndex(index: number): string {
    const days = isRTL
        ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[index];
}

/**
 * Gets month name from index (0 = January)
 */
function getMonthName(index: number): string {
    const months = isRTL
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[index];
}

interface TimeSlot {
    value: string;  // "12:00", "12:30", etc.
    label: string;  // "12:00 م" or "12:00 PM"
}

/**
 * Generates time slots between 12 PM and 10:30 PM
 */
function generateTimeSlots(startHour = 12, endHour = 22, stepMinutes = 30): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let hour = startHour; hour <= endHour; hour++) {
        for (let min = 0; min < 60; min += stepMinutes) {
            if (hour === endHour && min > 30) break;

            const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

            const displayHour = hour === 12 ? 12 : hour - 12;
            const period = isRTL ? 'م' : 'PM';
            const label = `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;

            slots.push({ value, label });
        }
    }

    return slots;
}

/**
 * Gets next 14 days starting from today
 */
function getNext14Days(): { date: Date; label: string; isToday: boolean }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayName = getDayNameFromIndex(date.getDay());
        const monthName = getMonthName(date.getMonth());
        const dayNum = date.getDate();
        const label = `${dayName}, ${monthName} ${dayNum}`;

        days.push({
            date,
            label,
            isToday: i === 0
        });
    }
    return days;
}

/**
 * Gets the next valid end time after a start time
 */
function getNextEndTime(startValue: string, slots: TimeSlot[]): string {
    const startIndex = slots.findIndex(s => s.value === startValue);
    if (startIndex === -1 || startIndex >= slots.length - 1) {
        return slots[slots.length - 1].value;
    }
    return slots[startIndex + 1].value;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TIME_SLOTS = generateTimeSlots();

// =============================================================================
// COMPONENT
// =============================================================================

const BookCallScreen = () => {
    const router = useRouter();
    const bookCall = useMutation(api.calendar.bookConsultationCall);
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const assignDoctor = useMutation(api.calendar.assignDoctor);

    // Fetch doctors from Convex
    const doctorsData = useQuery(api.calendar.getAvailableDoctors);
    const doctors: Doctor[] = useMemo(() => {
        if (!doctorsData) return [];
        return doctorsData.map((d) => ({
            id: d.id,
            name: d.name,
            nameAr: d.nameAr,
            avatarUrl: d.avatarUrl,
        }));
    }, [doctorsData]);

    // Get health data from Redux (saved in HealthHistoryScreen)
    const userData = useAppSelector((state: RootState) => state.user);

    // State
    const [selectedDoctorId, setSelectedDoctorId] = useState<Id<"users"> | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startTime, setStartTime] = useState(TIME_SLOTS[0].value);
    const [endTime, setEndTime] = useState(TIME_SLOTS[1].value);
    const [notes, setNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    // Dropdown visibility
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // Derived values
    const next14Days = useMemo(() => getNext14Days(), []);
    const startTimeLabel = TIME_SLOTS.find(s => s.value === startTime)?.label || TIME_SLOTS[0].label;
    const endTimeLabel = TIME_SLOTS.find(s => s.value === endTime)?.label || TIME_SLOTS[1].label;
    const formattedDate = `${getDayNameFromIndex(selectedDate.getDay())}, ${getMonthName(selectedDate.getMonth())} ${selectedDate.getDate()}`;

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

    const isFormValid = selectedDoctorId !== null;
    const isLoadingDoctors = doctorsData === undefined;

    // Handlers
    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setShowDatePicker(false);
    };

    const handleSelectStartTime = (value: string) => {
        setStartTime(value);
        // Auto-adjust end time if needed
        const startIndex = TIME_SLOTS.findIndex(s => s.value === value);
        const endIndex = TIME_SLOTS.findIndex(s => s.value === endTime);
        if (endIndex <= startIndex) {
            setEndTime(getNextEndTime(value, TIME_SLOTS));
        }
        setShowStartTimePicker(false);
    };

    const handleSelectEndTime = (value: string) => {
        setEndTime(value);
        setShowEndTimePicker(false);
    };

    // Helper to complete onboarding in Convex
    const syncOnboardingData = useCallback(async () => {
        const goalMap = {
            loss: 'weight_loss',
            maintain: 'maintain',
            gain: 'gain_muscle',
        } as const;

        await completeOnboarding({
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phoneNumber,
            gender: userData.gender as 'male' | 'female',
            age: parseInt(userData.age, 10) || 25,
            height: parseInt(userData.height, 10) || 170,
            heightUnit: userData.heightUnit as 'cm' | 'ft',
            currentWeight: parseInt(userData.currentWeight, 10) || 70,
            targetWeight: parseInt(userData.targetWeight, 10) || 70,
            goal: goalMap[userData.goal as keyof typeof goalMap] || 'weight_loss',
            medicalConditions: userData.medicalConditions || undefined,
        });
    }, [completeOnboarding, userData]);

    const handleBookCall = useCallback(async () => {
        if (!selectedDoctorId) {
            Alert.alert('', t.errorSelectDoctor);
            return;
        }

        setIsBooking(true);
        try {
            const isoDate = selectedDate.toISOString().split('T')[0];

            // First, sync onboarding data to Convex
            await syncOnboardingData();

            // Then book the call (doctor assignment happens in the mutation)
            await bookCall({
                doctorId: selectedDoctorId,
                date: isoDate,
                startTime,
                endTime,
                notes: notes.trim() || undefined,
            });

            // Navigate to main app
            router.replace('/(app)/(tabs)');
        } catch (error: any) {
            console.error('[BookCall] Error:', error);
            Alert.alert('Error', error.message || 'Failed to book call. Please try again.');
        } finally {
            setIsBooking(false);
        }
    }, [selectedDoctorId, selectedDate, startTime, endTime, notes, bookCall, router, syncOnboardingData]);

    const handleSkip = useCallback(async () => {
        setIsBooking(true);
        try {
            // Complete onboarding before navigating
            await syncOnboardingData();

            // If user selected a doctor but skipped booking, still assign them
            // Otherwise assign the first available doctor
            const doctorToAssign = selectedDoctorId || (doctors.length > 0 ? doctors[0].id : null);
            if (doctorToAssign) {
                await assignDoctor({ doctorId: doctorToAssign });
            }

            router.replace('/(app)/(tabs)');
        } catch (error: any) {
            console.error('[BookCall] Skip error:', error);
            // Still navigate even if sync fails (data is in Redux)
            router.replace('/(app)/(tabs)');
        } finally {
            setIsBooking(false);
        }
    }, [syncOnboardingData, router, selectedDoctorId, doctors, assignDoctor]);

    // Close all dropdowns when opening a new one
    const openDatePicker = () => {
        setShowStartTimePicker(false);
        setShowEndTimePicker(false);
        setShowDatePicker(!showDatePicker);
    };

    const openStartTimePicker = () => {
        setShowDatePicker(false);
        setShowEndTimePicker(false);
        setShowStartTimePicker(!showStartTimePicker);
    };

    const openEndTimePicker = () => {
        setShowDatePicker(false);
        setShowStartTimePicker(false);
        setShowEndTimePicker(!showEndTimePicker);
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
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image source={require('@/assets/Wellfitgo.png')} style={styles.logo} />
                    </View>

                    {/* Title Section */}
                    <View style={[styles.titleSection, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
                        <Text style={styles.mainTitle}>
                            {t.title}
                        </Text>
                        <Text style={styles.subtitle}>
                            {t.subtitle}
                        </Text>
                    </View>

                    {/* Doctor Selection */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.selectDoctor}
                        </Text>
                        {isLoadingDoctors ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={designColors.brandBlue} />
                            </View>
                        ) : (
                            <View style={[styles.doctorContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                {doctors.map((doctor) => (
                                    <TouchableOpacity
                                        key={doctor.id}
                                        style={[
                                            styles.doctorCard,
                                            selectedDoctorId === doctor.id && styles.doctorCardSelected,
                                        ]}
                                        onPress={() => setSelectedDoctorId(doctor.id)}
                                    >
                                        <View style={styles.doctorAvatar}>
                                            <MaterialIcons
                                                name="person"
                                                size={32}
                                                color={selectedDoctorId === doctor.id ? designColors.brandBlue : designColors.textTertiary}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.doctorName,
                                            selectedDoctorId === doctor.id && styles.doctorNameSelected,
                                        ]}>
                                            {isRTL ? doctor.nameAr : doctor.name}
                                        </Text>
                                        {selectedDoctorId === doctor.id && (
                                            <View style={styles.checkmark}>
                                                <MaterialIcons name="check" size={16} color={colors.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Date Selection */}
                    <View style={[styles.section, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
                        <Text style={styles.label}>
                            {t.selectDate}
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectInput, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                            onPress={openDatePicker}
                        >
                            <MaterialIcons name="event" size={20} color={designColors.brandBlue} />
                            <Text style={[styles.selectText, { flex: 1, textAlign: isRTL ? 'left' : 'right', marginHorizontal: horizontalScale(8) }]}>
                                {formattedDate}
                            </Text>
                            <MaterialIcons name="keyboard-arrow-down" size={20} color={designColors.textTertiary} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <ScrollView style={styles.dropdown} nestedScrollEnabled>
                                {next14Days.map((item, index) => {
                                    const isSelected = item.date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dropdownItem,
                                                isSelected && styles.dropdownItemSelected,
                                            ]}
                                            onPress={() => handleSelectDate(item.date)}
                                        >
                                            <Text style={[
                                                styles.dropdownText,
                                                isSelected && styles.dropdownTextSelected,
                                            ]}>
                                                {item.label}
                                                {item.isToday && ` ${t.today}`}
                                            </Text>
                                            {isSelected && <MaterialIcons name="check" size={18} color={designColors.brandBlue} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>

                    {/* Time Selection */}
                    <View style={[styles.section, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
                        <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {t.selectTime}
                        </Text>
                        <View style={[styles.timeRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            {/* From Label */}
                            <Text style={styles.timeLabel}>{t.from}</Text>

                            {/* Start Time Picker */}
                            <TouchableOpacity
                                style={[styles.timePicker, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={openStartTimePicker}
                            >
                                <MaterialIcons name="access-time" size={16} color={designColors.textSecondary} />
                                <Text style={[styles.timeText, { flex: 1, textAlign: isRTL ? 'left' : 'right', marginHorizontal: 4 }]}>
                                    {startTimeLabel}
                                </Text>
                                <MaterialIcons name="keyboard-arrow-down" size={16} color={designColors.textTertiary} />
                            </TouchableOpacity>

                            {/* To Label */}
                            <Text style={styles.timeLabel}>{t.to}</Text>

                            {/* End Time Picker */}
                            <TouchableOpacity
                                style={[styles.timePicker, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={openEndTimePicker}
                            >
                                <MaterialIcons name="access-time" size={16} color={designColors.textSecondary} />
                                <Text style={[styles.timeText, { flex: 1, textAlign: isRTL ? 'left' : 'right', marginHorizontal: 4 }]}>
                                    {endTimeLabel}
                                </Text>
                                <MaterialIcons name="keyboard-arrow-down" size={16} color={designColors.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Start Time Dropdown */}
                        {showStartTimePicker && (
                            <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                                {TIME_SLOTS.map((slot) => (
                                    <TouchableOpacity
                                        key={slot.value}
                                        style={styles.timeOption}
                                        onPress={() => handleSelectStartTime(slot.value)}
                                    >
                                        <Text style={[
                                            styles.timeOptionText,
                                            startTime === slot.value && styles.timeOptionSelected,
                                            { textAlign: isRTL ? 'left' : 'right' }
                                        ]}>
                                            {slot.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* End Time Dropdown */}
                        {showEndTimePicker && (
                            <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                                {TIME_SLOTS
                                    .filter(slot => slot.value > startTime)
                                    .map((slot) => (
                                        <TouchableOpacity
                                            key={slot.value}
                                            style={styles.timeOption}
                                            onPress={() => handleSelectEndTime(slot.value)}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,
                                                endTime === slot.value && styles.timeOptionSelected,
                                                { textAlign: isRTL ? 'left' : 'right' }
                                            ]}>
                                                {slot.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Notes (Optional) */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {t.notes}
                        </Text>
                        <TextInput
                            style={[styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                            placeholder={t.notesPlaceholder}
                            placeholderTextColor={designColors.textTertiary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Spacer for bottom buttons */}
                    <View style={{ height: verticalScale(120) }} />
                </ScrollView>

                {/* Bottom Buttons */}
                <View style={styles.bottomSection}>
                    {/* Skip Button */}
                    <TouchableOpacity
                        onPress={handleSkip}
                        style={styles.skipButton}
                        disabled={isBooking}
                    >
                        <Text style={styles.skipButtonText}>{t.skip}</Text>
                    </TouchableOpacity>

                    {/* Book Call Button */}
                    <TouchableOpacity
                        onPress={handleBookCall}
                        disabled={!isFormValid || isBooking}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={isFormValid ? gradients.primary : ['#CCC', '#AAA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.submitButton,
                                !isFormValid && styles.submitButtonDisabled,
                            ]}
                        >
                            {isBooking ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <>
                                    <MaterialIcons name="phone" size={20} color={colors.white} />
                                    <Text style={styles.submitButtonText}>{t.bookCall}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// =============================================================================
// STYLES
// =============================================================================

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
        marginBottom: verticalScale(20),
    },
    mainTitle: {
        fontSize: ScaleFontSize(22),
        fontWeight: '700',
        color: designColors.textPrimary,
        lineHeight: verticalScale(28),
    },
    subtitle: {
        fontSize: ScaleFontSize(14),
        color: designColors.textSecondary,
        marginTop: verticalScale(4),
    },
    section: {
        marginBottom: verticalScale(20),
    },
    label: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: designColors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: verticalScale(10),
    },
    // Doctor Selection
    loadingContainer: {
        height: verticalScale(110),
        alignItems: 'center',
        justifyContent: 'center',
    },
    doctorContainer: {
        gap: horizontalScale(12),
    },
    doctorCard: {
        flex: 1,
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(16),
        borderWidth: 2,
        borderColor: designColors.borderLight,
        padding: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: verticalScale(110),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    doctorCardSelected: {
        borderColor: designColors.brandBlue,
        backgroundColor: 'rgba(80, 115, 254, 0.05)',
    },
    doctorAvatar: {
        width: horizontalScale(50),
        height: horizontalScale(50),
        borderRadius: horizontalScale(25),
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(8),
    },
    doctorName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: designColors.textSecondary,
        textAlign: 'center',
    },
    doctorNameSelected: {
        color: designColors.textPrimary,
    },
    checkmark: {
        position: 'absolute',
        top: horizontalScale(8),
        right: horizontalScale(8),
        width: horizontalScale(24),
        height: horizontalScale(24),
        borderRadius: horizontalScale(12),
        backgroundColor: designColors.brandBlue,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Select Input
    selectInput: {
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    selectText: {
        fontSize: ScaleFontSize(15),
        color: designColors.textPrimary,
    },
    // Dropdown
    dropdown: {
        marginTop: verticalScale(8),
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        maxHeight: verticalScale(200),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(81, 115, 251, 0.05)',
    },
    dropdownText: {
        fontSize: ScaleFontSize(15),
        color: designColors.textPrimary,
    },
    dropdownTextSelected: {
        color: designColors.brandBlue,
        fontWeight: '600',
    },
    // Time Selection
    timeRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    timeLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: designColors.textSecondary,
    },
    timePicker: {
        flex: 1,
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    timeText: {
        fontSize: ScaleFontSize(14),
        color: designColors.textPrimary,
    },
    timeDropdown: {
        marginTop: verticalScale(8),
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        maxHeight: verticalScale(180),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    timeOption: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    timeOptionText: {
        fontSize: ScaleFontSize(14),
        color: designColors.textPrimary,
    },
    timeOptionSelected: {
        color: designColors.brandBlue,
        fontWeight: '600',
    },
    // Notes
    textArea: {
        backgroundColor: designColors.bgCard,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: designColors.borderLight,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        fontSize: ScaleFontSize(14),
        color: designColors.textPrimary,
        minHeight: verticalScale(80),
        textAlignVertical: 'top',
    },
    // Bottom Section
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: designColors.bgScreen,
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(16),
        paddingBottom: verticalScale(24),
        borderTopWidth: 1,
        borderTopColor: designColors.borderLight,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: verticalScale(10),
        marginBottom: verticalScale(8),
    },
    skipButtonText: {
        fontSize: ScaleFontSize(14),
        color: designColors.textSecondary,
        fontWeight: '500',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(12),
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.white,
    },
});

export default BookCallScreen;
