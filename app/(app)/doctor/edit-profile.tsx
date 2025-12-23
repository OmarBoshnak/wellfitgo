/**
 * EditProfileScreen - Edit doctor/coach profile
 * Features: Photo upload, personal info editing, availability settings
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft,
    Camera,
    User,
    Clock,
    Lock,
    ChevronDown,
    Mail,
} from 'lucide-react-native';
import { colors } from '@/src/theme';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = {
    title: isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile',
    save: isRTL ? 'حفظ' : 'Save',
    saveChanges: isRTL ? 'حفظ التغييرات' : 'Save Changes',
    changePhoto: isRTL ? 'تغيير الصورة' : 'Change Photo',
    photoHint: isRTL ? 'JPG أو PNG، بحد أقصى 2MB' : 'JPG or PNG, max 2MB',

    // Personal Information
    personalInfo: isRTL ? 'المعلومات الشخصية' : 'Personal Information',
    fullName: isRTL ? 'الاسم الكامل' : 'Full Name',
    fullNamePlaceholder: isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name',
    professionalTitle: isRTL ? 'المسمى المهني' : 'Professional Title',
    professionalTitlePlaceholder: isRTL ? 'مثال: أخصائي تغذية' : 'e.g. Nutritionist',
    bio: isRTL ? 'نبذة عني' : 'Bio',
    bioPlaceholder: isRTL ? 'أخبر العملاء عن خبراتك...' : 'Tell clients about your expertise...',
    email: isRTL ? 'البريد الإلكتروني' : 'Email Address',
    phone: isRTL ? 'رقم الهاتف' : 'Phone Number',

    // Availability
    availability: isRTL ? 'أوقات العمل' : 'Availability',
    resetDefault: isRTL ? 'إعادة تعيين' : 'Reset Default',
    notAvailable: isRTL ? 'غير متاح' : 'Not Available',

    // Days
    days: {
        sunday: isRTL ? 'الأحد' : 'Sunday',
        monday: isRTL ? 'الإثنين' : 'Monday',
        tuesday: isRTL ? 'الثلاثاء' : 'Tuesday',
        wednesday: isRTL ? 'الأربعاء' : 'Wednesday',
        thursday: isRTL ? 'الخميس' : 'Thursday',
        friday: isRTL ? 'الجمعة' : 'Friday',
        saturday: isRTL ? 'السبت' : 'Saturday',
    },

    // Alerts
    success: isRTL ? 'تم بنجاح' : 'Success',
    profileUpdated: isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
    error: isRTL ? 'خطأ' : 'Error',
    failedToUpdate: isRTL ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile',
    permissionNeeded: isRTL ? 'تحتاج إذن' : 'Permission needed',
    photoPermission: isRTL ? 'نحتاج إذن للوصول للصور' : 'We need permission to access your photos',
};

// =============================================================================
// TYPES
// =============================================================================

type DayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

interface DayAvailability {
    enabled: boolean;
    from: number;  // Minutes since midnight (0-1440)
    to: number;    // Minutes since midnight (0-1440)
}

type AvailabilityState = Record<DayKey, DayAvailability>;

// Convex storage format for working hours
interface ConvexWorkingHours {
    timezone: string;
    days: Record<DayKey, { enabled: boolean; from: number; to: number }>;
}

// =============================================================================
// TIME UTILITIES
// =============================================================================

/**
 * Generate time options from 9:00 AM to 12:00 AM (midnight) in 30-minute intervals
 * Returns array of { label: "09:00 AM", minutes: 540 }
 */
function generateTimeOptions(): Array<{ label: string; minutes: number }> {
    const options: Array<{ label: string; minutes: number }> = [];

    // Start at 9:00 AM (540 minutes) and go until 12:00 AM (1440 minutes / 0 next day)
    // We use 1440 to represent midnight (end of day)
    for (let minutes = 540; minutes <= 1440; minutes += 30) {
        options.push({
            label: minutesToLabel(minutes === 1440 ? 0 : minutes, minutes === 1440),
            minutes: minutes,
        });
    }

    return options;
}

/**
 * Convert minutes since midnight to display label (e.g., 540 → "09:00 AM")
 * isMidnight flag handles the special case of 12:00 AM at end of day
 */
function minutesToLabel(minutes: number, isMidnight = false): string {
    if (isMidnight) return '12:00 AM';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse time label back to minutes since midnight
 * "09:00 AM" → 540, "12:00 AM" → 1440 (midnight end of day)
 */
function labelToMinutes(label: string): number {
    const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 540; // Default to 9:00 AM

    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    // Handle 12:00 AM as end of day (1440 minutes)
    if (period === 'AM' && hours === 12 && mins === 0) {
        return 1440; // Midnight at end of day
    }

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return hours * 60 + mins;
}

/**
 * Check if a doctor is currently online based on their availability
 * Uses Africa/Cairo timezone
 */
export function isDoctorOnline(
    availability: AvailabilityState | ConvexWorkingHours['days'] | undefined,
    timezone: string = 'Africa/Cairo'
): boolean {
    if (!availability) return false;

    // Get current time in the specified timezone
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const weekdayPart = parts.find(p => p.type === 'weekday');
    const hourPart = parts.find(p => p.type === 'hour');
    const minutePart = parts.find(p => p.type === 'minute');

    if (!weekdayPart || !hourPart || !minutePart) return false;

    // Map weekday name to our DayKey
    const dayMap: Record<string, DayKey> = {
        'Sunday': 'sunday',
        'Monday': 'monday',
        'Tuesday': 'tuesday',
        'Wednesday': 'wednesday',
        'Thursday': 'thursday',
        'Friday': 'friday',
        'Saturday': 'saturday',
    };

    const today = dayMap[weekdayPart.value];
    if (!today) return false;

    const dayAvailability = availability[today];
    if (!dayAvailability || !dayAvailability.enabled) return false;

    // Calculate current minutes since midnight
    const currentMinutes = parseInt(hourPart.value, 10) * 60 + parseInt(minutePart.value, 10);

    // Check if current time is within working hours
    // Handle midnight (1440) as end of day
    const toMinutes = dayAvailability.to === 1440 ? 1440 : dayAvailability.to;

    return currentMinutes >= dayAvailability.from && currentMinutes < toMinutes;
}

/**
 * Get valid "To" options based on selected "From" time
 * "To" must be at least 30 minutes after "From"
 */
function getValidToOptions(fromMinutes: number): Array<{ label: string; minutes: number }> {
    const allOptions = generateTimeOptions();
    // Filter to only show times after the selected "from" time
    return allOptions.filter(opt => opt.minutes > fromMinutes);
}

/**
 * Validate and auto-correct "To" time if it's not after "From"
 * Returns the corrected "to" value in minutes
 */
function validateToTime(fromMinutes: number, toMinutes: number): number {
    if (toMinutes <= fromMinutes) {
        // Snap to next valid time (30 minutes after from)
        return Math.min(fromMinutes + 30, 1440);
    }
    return toMinutes;
}

// Pre-generate time options for performance
const TIME_OPTIONS = generateTimeOptions();

const DEFAULT_AVAILABILITY: AvailabilityState = {
    sunday: { enabled: true, from: 540, to: 1080 },    // 9:00 AM - 6:00 PM
    monday: { enabled: true, from: 540, to: 1080 },
    tuesday: { enabled: true, from: 540, to: 1080 },
    wednesday: { enabled: true, from: 540, to: 1080 },
    thursday: { enabled: true, from: 540, to: 1080 },
    friday: { enabled: false, from: 540, to: 1080 },
    saturday: { enabled: false, from: 540, to: 1080 },
};

const DAY_KEYS: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// =============================================================================
// COMPONENTS
// =============================================================================

interface DayRowProps {
    day: DayKey;
    dayLabel: string;
    availability: DayAvailability;
    onToggle: (day: DayKey) => void;
    onFromChange: (day: DayKey, value: number) => void;
    onToChange: (day: DayKey, value: number) => void;
}

function DayRow({ day, dayLabel, availability, onToggle, onFromChange, onToChange }: DayRowProps) {
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Get valid "To" options (must be after the selected "From" time)
    const validToOptions = getValidToOptions(availability.from);

    // When a dropdown is open, this row needs higher zIndex to appear above siblings
    const isDropdownOpen = showFromPicker || showToPicker;

    return (
        <View style={[
            styles.dayRow,
            !availability.enabled && styles.dayRowDisabled,
            isDropdownOpen && styles.dayRowActive
        ]}>
            <View style={[styles.dayHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[
                    styles.dayLabel,
                    !availability.enabled && styles.dayLabelDisabled,
                    { textAlign: isRTL ? 'right' : 'left' }
                ]}>
                    {dayLabel}
                </Text>
                <Switch
                    value={availability.enabled}
                    onValueChange={() => onToggle(day)}
                    trackColor={{ true: '#ea5757', false: '#E5E7EB' }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                />
            </View>

            {availability.enabled ? (
                <View style={[styles.timePickerRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {/* From Time */}
                    <View style={styles.timePickerGroup}>
                        <Text style={styles.timeLabel}>{isRTL ? 'من' : 'From'}</Text>
                        <TouchableOpacity
                            style={styles.timePicker}
                            onPress={() => {
                                setShowFromPicker(!showFromPicker);
                                setShowToPicker(false); // Close other picker
                            }}
                        >
                            <Text style={styles.timeText}>
                                {minutesToLabel(availability.from)}
                            </Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Dropdown positioned inside this group */}
                        {showFromPicker && (
                            <View style={styles.timeDropdown}>
                                <ScrollView style={styles.timeDropdownScroll} nestedScrollEnabled>
                                    {TIME_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.minutes}
                                            style={[
                                                styles.timeOption,
                                                availability.from === option.minutes && styles.timeOptionSelected
                                            ]}
                                            onPress={() => {
                                                onFromChange(day, option.minutes);
                                                setShowFromPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,
                                                availability.from === option.minutes && styles.timeOptionTextSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <Text style={styles.timeSeparator}>-</Text>

                    {/* To Time */}
                    <View style={styles.timePickerGroup}>
                        <Text style={styles.timeLabel}>{isRTL ? 'إلى' : 'To'}</Text>
                        <TouchableOpacity
                            style={styles.timePicker}
                            onPress={() => {
                                setShowToPicker(!showToPicker);
                                setShowFromPicker(false); // Close other picker
                            }}
                        >
                            <Text style={styles.timeText}>
                                {minutesToLabel(availability.to === 1440 ? 0 : availability.to, availability.to === 1440)}
                            </Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Dropdown positioned inside this group */}
                        {showToPicker && (
                            <View style={styles.timeDropdown}>
                                <ScrollView style={styles.timeDropdownScroll} nestedScrollEnabled>
                                    {validToOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.minutes}
                                            style={[
                                                styles.timeOption,
                                                availability.to === option.minutes && styles.timeOptionSelected
                                            ]}
                                            onPress={() => {
                                                onToChange(day, option.minutes);
                                                setShowToPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,
                                                availability.to === option.minutes && styles.timeOptionTextSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.notAvailableContainer}>
                    <Text style={styles.notAvailableText}>{t.notAvailable}</Text>
                </View>
            )}
        </View>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Convex queries and mutations
    const user = useQuery(api.users.currentUser);
    const coachProfile = useQuery(api.coachProfiles.getMyCoachProfile);
    const updateProfile = useMutation(api.users.updateProfile);
    const updateCoachProfile = useMutation(api.coachProfiles.updateCoachProfile);
    const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
    const updateAvatar = useMutation(api.users.updateAvatar);

    // Form state
    const [fullName, setFullName] = useState('');
    const [professionalTitle, setProfessionalTitle] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [availability, setAvailability] = useState<AvailabilityState>(DEFAULT_AVAILABILITY);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            const name = `${user.firstName} ${user.lastName || ''}`.trim();
            setFullName(name);
            setPhone(user.phone || '');
        }
    }, [user]);

    // Initialize coach profile data
    useEffect(() => {
        if (coachProfile) {
            setProfessionalTitle(coachProfile.specialization || '');
            setBio(coachProfile.bio || '');

            // Parse working hours if available (new format with days object)
            if (coachProfile.workingHours) {
                const wh = coachProfile.workingHours;

                // Check if using new format (days object) or old format (workingDays array)
                if ('days' in wh && wh.days) {
                    // New format: per-day availability
                    const newAvailability = { ...DEFAULT_AVAILABILITY };
                    DAY_KEYS.forEach((day) => {
                        const dayData = (wh.days as Record<DayKey, { enabled: boolean; from: number; to: number }>)[day];
                        if (dayData) {
                            newAvailability[day] = {
                                enabled: dayData.enabled,
                                from: dayData.from,
                                to: dayData.to,
                            };
                        }
                    });
                    setAvailability(newAvailability);
                } else if ('workingDays' in wh) {
                    // Legacy format: workingDays array with start/end strings
                    const legacy = wh as unknown as { workingDays: number[]; start: string; end: string };
                    const newAvailability = { ...DEFAULT_AVAILABILITY };

                    // Convert legacy string times to minutes
                    const fromMinutes = typeof legacy.start === 'string' ? labelToMinutes(legacy.start) : 540;
                    const toMinutes = typeof legacy.end === 'string' ? labelToMinutes(legacy.end) : 1080;

                    DAY_KEYS.forEach((day, index) => {
                        newAvailability[day] = {
                            enabled: legacy.workingDays.includes(index),
                            from: fromMinutes,
                            to: toMinutes,
                        };
                    });

                    setAvailability(newAvailability);
                }
            }
        }
    }, [coachProfile]);

    // Handlers
    const handleToggleDay = (day: DayKey) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    // Handler for From time change - also validates and adjusts To if needed
    const handleFromChange = (day: DayKey, value: number) => {
        setAvailability(prev => {
            const currentTo = prev[day].to;
            // Auto-correct To if it's not after the new From
            const validatedTo = validateToTime(value, currentTo);

            return {
                ...prev,
                [day]: { ...prev[day], from: value, to: validatedTo }
            };
        });
    };

    const handleToChange = (day: DayKey, value: number) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], to: value }
        }));
    };

    const handleResetAvailability = () => {
        setAvailability(DEFAULT_AVAILABILITY);
    };

    const handleChangePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t.permissionNeeded, t.photoPermission);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingPhoto(true);
                const imageUri = result.assets[0].uri;

                try {
                    const uploadUrl = await generateUploadUrl();
                    const response = await fetch(imageUri);
                    const blob = await response.blob();

                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': blob.type || 'image/jpeg' },
                        body: blob,
                    });

                    if (!uploadResponse.ok) throw new Error('Upload failed');

                    const { storageId } = await uploadResponse.json();
                    await updateAvatar({ storageId });
                } catch (error) {
                    console.error('[EditProfile] Failed to upload photo:', error);
                    Alert.alert(t.error, t.failedToUpdate);
                } finally {
                    setIsUploadingPhoto(false);
                }
            }
        } catch (error) {
            console.error('[EditProfile] Photo picker error:', error);
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert(t.error, isRTL ? 'الاسم مطلوب' : 'Name is required');
            return;
        }

        setIsSaving(true);

        try {
            // Parse name into first and last
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || undefined;

            // Update user profile
            await updateProfile({
                firstName,
                lastName,
                phone: phone || undefined,
            });

            // Build per-day availability object for Convex
            // Format: days: { sunday: { enabled: true, from: 540, to: 1080 }, ... }
            const days: Record<DayKey, { enabled: boolean; from: number; to: number }> = {} as Record<DayKey, { enabled: boolean; from: number; to: number }>;
            DAY_KEYS.forEach((day) => {
                days[day] = {
                    enabled: availability[day].enabled,
                    from: availability[day].from,
                    to: availability[day].to,
                };
            });

            // Update coach profile with new format
            await updateCoachProfile({
                specialization: professionalTitle || undefined,
                bio: bio || undefined,
                workingHours: {
                    timezone: 'Africa/Cairo',
                    days,
                },
            });

            Alert.alert(t.success, t.profileUpdated, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('[EditProfile] Save error:', error);
            Alert.alert(t.error, t.failedToUpdate);
        } finally {
            setIsSaving(false);
        }
    };

    const avatarUrl = user?.avatarUrl;
    const email = user?.email || '';

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#ea5757" />
                        ) : (
                            <Text style={styles.saveButtonText}>{t.save}</Text>
                        )}
                    </TouchableOpacity>


                    <Text style={styles.headerTitle}>{t.title}</Text>


                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>

                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Photo Section */}
                    <View style={styles.photoSection}>
                        <TouchableOpacity
                            style={styles.avatarWrapper}
                            onPress={handleChangePhoto}
                            disabled={isUploadingPhoto}
                        >
                            <LinearGradient
                                colors={['#ea5757', 'rgba(234, 87, 87, 0.4)']}
                                style={styles.avatarGradient}
                            >
                                <View style={styles.avatarInner}>
                                    {avatarUrl ? (
                                        <Image
                                            source={{ uri: avatarUrl }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarInitials}>
                                                {fullName.charAt(0).toUpperCase() || 'D'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </LinearGradient>

                            {isUploadingPhoto && (
                                <View style={styles.photoLoadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}

                            <View style={styles.cameraButton}>
                                <Camera size={16} color="#ea5757" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.changePhotoButton}
                            onPress={handleChangePhoto}
                            disabled={isUploadingPhoto}
                        >
                            <Text style={styles.changePhotoText}>{t.changePhoto}</Text>
                        </TouchableOpacity>

                        <Text style={styles.photoHint}>{t.photoHint}</Text>
                    </View>

                    {/* Personal Information Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <User size={14} color="#ea5757" />
                            <Text style={styles.cardTitle}>{t.personalInfo}</Text>
                        </View>

                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.fullName}
                            </Text>
                            <TextInput
                                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder={t.fullNamePlaceholder}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Professional Title */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.professionalTitle}
                            </Text>
                            <TextInput
                                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={professionalTitle}
                                onChangeText={setProfessionalTitle}
                                placeholder={t.professionalTitlePlaceholder}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Bio */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.bio}
                            </Text>
                            <TextInput
                                style={[styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder={t.bioPlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Email (Read Only) */}
                        <View style={[styles.inputGroup, styles.inputGroupDisabled]}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.email}
                            </Text>
                            <View style={[styles.emailContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <TextInput
                                    style={[styles.inputDisabled, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={email}
                                    editable={false}
                                />
                                <Mail size={16} color={colors.textSecondary} />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.phone}
                            </Text>
                            <View style={[styles.phoneContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={styles.countryCode}>
                                    <Text style={styles.countryCodeText}>+20</Text>
                                </View>
                                <TextInput
                                    style={[styles.phoneInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Availability Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Clock size={14} color="#ea5757" />
                                <Text style={styles.cardTitle}>{t.availability}</Text>
                            </View>
                            <TouchableOpacity onPress={handleResetAvailability}>
                                <Text style={styles.resetText}>{t.resetDefault}</Text>
                            </TouchableOpacity>
                        </View>

                        {DAY_KEYS.map((day) => (
                            <DayRow
                                key={day}
                                day={day}
                                dayLabel={t.days[day]}
                                availability={availability[day]}
                                onToggle={handleToggleDay}
                                onFromChange={handleFromChange}
                                onToChange={handleToChange}
                            />
                        ))}
                    </View>

                    {/* Bottom spacing for the save button */}
                    <View style={{ height: verticalScale(100) }} />
                </ScrollView>

                {/* Sticky Save Button */}
                <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={styles.saveChangesButton}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#ea5757', '#ff8a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveChangesGradient}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveChangesText}>{t.saveChanges}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f6f6',
    },
    // Header
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(12),
        backgroundColor: '#f8f6f6',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        paddingHorizontal: horizontalScale(8),
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#ea5757',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(140)
    },
    // Photo Section
    photoSection: {
        alignItems: 'center',
        paddingVertical: verticalScale(32),
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarGradient: {
        padding: 4,
        borderRadius: 70,
    },
    avatarInner: {
        backgroundColor: '#fff',
        borderRadius: 66,
        padding: 4,
    },
    avatar: {
        width: horizontalScale(112),
        height: horizontalScale(112),
        borderRadius: horizontalScale(56),
    },
    avatarPlaceholder: {
        backgroundColor: '#E8F4FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: ScaleFontSize(40),
        fontWeight: '700',
        color: '#ea5757',
    },
    photoLoadingOverlay: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        borderRadius: 66,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        left: 0,
        backgroundColor: '#fff',
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    changePhotoButton: {
        marginTop: verticalScale(16),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        backgroundColor: 'rgba(234, 87, 87, 0.1)',
        borderRadius: 100,
    },
    changePhotoText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#ea5757',
    },
    photoHint: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(8),
    },
    // Cards
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: horizontalScale(20),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(16),
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(8),
    },
    cardTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    resetText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#ea5757',
    },
    // Input Groups
    inputGroup: {
        marginBottom: verticalScale(20),
    },
    inputGroupDisabled: {
        opacity: 0.7,
    },
    inputLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: verticalScale(8),
        marginLeft: horizontalScale(4),
    },
    input: {
        height: verticalScale(44),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        backgroundColor: '#f8f6f6',
    },
    textArea: {
        height: verticalScale(100),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(10),
        fontSize: ScaleFontSize(14),
        fontWeight: '400',
        color: colors.textPrimary,
        backgroundColor: '#f8f6f6',
        lineHeight: 22,
    },
    emailContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: '#e6d0d0',
        height: verticalScale(44),
        borderRadius: 10,
        paddingHorizontal: horizontalScale(16),
        backgroundColor: '#f0f0f0',
    },
    inputDisabled: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
        backgroundColor: '#f0f0f0',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: horizontalScale(8),
    },
    countryCode: {
        width: horizontalScale(80),
        height: verticalScale(44),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f6f6',
    },
    countryCodeText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    phoneInput: {
        flex: 1,
        height: verticalScale(44),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        backgroundColor: '#f8f6f6',
    },
    // Day Row
    dayRow: {
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
        position: 'relative',
    },
    dayRowDisabled: {
        opacity: 0.6,
    },
    dayRowActive: {
        zIndex: 100,
        overflow: 'visible',
    },
    dayHeader: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(12),
    },
    dayLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    dayLabelDisabled: {
        color: colors.textSecondary,
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
        paddingLeft: horizontalScale(4),
    },
    timePicker: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: verticalScale(40),
        paddingHorizontal: horizontalScale(12),
        backgroundColor: '#f8f6f6',
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
    },
    timeText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    timeSeparator: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    timePickerGroup: {
        flex: 1,
        position: 'relative',
        zIndex: 10,
    },
    timeLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: '#ea5757',
        marginBottom: verticalScale(4),
        textAlign: 'center',
    },
    notAvailableContainer: {
        flex: 1,
        height: verticalScale(36),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderStyle: 'dashed',
    },
    notAvailableText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    timeDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#e6d0d0',
        maxHeight: verticalScale(150),
    },
    timeDropdownScroll: {
        maxHeight: verticalScale(150),
    },
    timeOption: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    timeOptionSelected: {
        backgroundColor: 'rgba(234, 87, 87, 0.1)',
    },
    timeOptionText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    timeOptionTextSelected: {
        color: '#ea5757',
        fontWeight: '600',
    },
    // Sticky Bottom
    stickyBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        backgroundColor: 'rgba(248, 246, 246, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    saveChangesButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#ea5757',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    saveChangesGradient: {
        height: verticalScale(52),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveChangesText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#fff',
    },
});
