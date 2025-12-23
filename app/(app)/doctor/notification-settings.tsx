import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    Switch,
    useColorScheme,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = {
    title: isRTL ? 'إعدادات الإشعارات' : 'Notification Settings',
    emailNotifications: isRTL ? 'إشعارات البريد الإلكتروني' : 'Email Notifications',
    clientActivity: isRTL ? 'نشاط العميل' : 'Client Activity',
    newClientSignup: isRTL ? 'تسجيل عميل جديد' : 'New client signup',
    clientSentMessage: isRTL ? 'العميل أرسل رسالة' : 'Client sent message',
    clientCompletedCheckin: isRTL ? 'العميل أكمل المتابعة' : 'Client completed check-in',
    clientMissedCheckin: isRTL ? 'العميل فاته المتابعة' : 'Client missed check-in',
    clientViewedMealPlan: isRTL ? 'العميل شاهد خطة الوجبات' : 'Client viewed meal plan',
    clientLoggedWeight: isRTL ? 'العميل سجل الوزن' : 'Client logged weight',
    mealPlans: isRTL ? 'خطط الوجبات' : 'Meal Plans',
    planExpiringIn3Days: isRTL ? 'الخطة تنتهي خلال 3 أيام' : 'Plan expiring in 3 days',
    clientRequestedPlanChange: isRTL ? 'العميل طلب تغيير الخطة' : 'Client requested plan change',
    clientCompletedAllMeals: isRTL ? 'العميل أكمل جميع الوجبات' : 'Client completed all meals',
    pushNotifications: isRTL ? 'الإشعارات الفورية' : 'Push Notifications',
    enablePushNotifications: isRTL ? 'تفعيل الإشعارات الفورية' : 'Enable push notifications',
    quietHours: isRTL ? 'ساعات الهدوء' : 'Quiet Hours',
    enableQuietHours: isRTL ? 'تفعيل ساعات الهدوء' : 'Enable quiet hours',
    from: isRTL ? 'من' : 'From',
    to: isRTL ? 'إلى' : 'To',
    quietHoursInfo: isRTL
        ? 'لن تتلقى إشعارات خلال هذه الساعات. ستظل التنبيهات الهامة من العملاء المصنفين كـ "عالي الخطورة" تصل إليك.'
        : "You won't receive notifications during these hours. Critical alerts from clients marked as 'High Risk' will still come through.",
    savePreferences: isRTL ? 'حفظ التفضيلات' : 'Save Preferences',
};

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
    primary: '#ea5757',
    primaryGradientEnd: '#ff7b7b',
    backgroundLight: '#f8f6f6',
    backgroundDark: '#211111',
    cardLight: '#ffffff',
    cardDark: '#2c1e1e',
    textPrimaryLight: '#1b0e0e',
    textPrimaryDark: '#f1f1f1',
    textSecondaryLight: '#526477',
    textSecondaryDark: '#d1d5db',
    sectionTitleColor: '#AAB8C5',
    labelColor: '#8093A5',
    borderLight: '#e5e5e5',
    borderDark: 'rgba(128, 128, 128, 0.3)',
    white: '#ffffff',
};

const TIME_OPTIONS = [
    '8:00 PM',
    '9:00 PM',
    '10:00 PM',
    '11:00 PM',
    '12:00 AM',
];

const END_TIME_OPTIONS = [
    '6:00 AM',
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
];

// =============================================================================
// CUSTOM CHECKBOX COMPONENT
// =============================================================================

interface CustomCheckboxProps {
    checked: boolean;
    onToggle: () => void;
    label: string;
    isDark: boolean;
}

function CustomCheckbox({ checked, onToggle, label, isDark }: CustomCheckboxProps) {
    return (
        <Pressable
            style={[
                styles.checkboxRow,
                { flexDirection: isRTL ? 'row' : 'row-reverse' },
            ]}
            onPress={onToggle}
        >
            <View
                style={[
                    styles.checkbox,
                    checked && styles.checkboxChecked,
                ]}
            >
                {checked && (
                    <MaterialIcons name="check" size={18} color={COLORS.white} />
                )}
            </View>
            <Text
                style={[
                    styles.checkboxLabel,
                    { color: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight },
                    { textAlign: isRTL ? 'left' : 'right' },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Email Notifications - Client Activity
    const [newClientSignup, setNewClientSignup] = useState(true);
    const [clientSentMessage, setClientSentMessage] = useState(true);
    const [clientCompletedCheckin, setClientCompletedCheckin] = useState(true);
    const [clientMissedCheckin, setClientMissedCheckin] = useState(true);
    const [clientViewedMealPlan, setClientViewedMealPlan] = useState(false);
    const [clientLoggedWeight, setClientLoggedWeight] = useState(false);

    // Email Notifications - Meal Plans
    const [planExpiringIn3Days, setPlanExpiringIn3Days] = useState(true);
    const [clientRequestedPlanChange, setClientRequestedPlanChange] = useState(true);
    const [clientCompletedAllMeals, setClientCompletedAllMeals] = useState(false);

    // Push Notifications
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);

    // Quiet Hours
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
    const [quietHoursFrom, setQuietHoursFrom] = useState('10:00 PM');
    const [quietHoursTo, setQuietHoursTo] = useState('7:00 AM');

    const handleSavePreferences = () => {
        const preferences = {
            emailNotifications: {
                clientActivity: {
                    newClientSignup,
                    clientSentMessage,
                    clientCompletedCheckin,
                    clientMissedCheckin,
                    clientViewedMealPlan,
                    clientLoggedWeight,
                },
                mealPlans: {
                    planExpiringIn3Days,
                    clientRequestedPlanChange,
                    clientCompletedAllMeals,
                },
            },
            pushNotificationsEnabled,
            quietHours: {
                enabled: quietHoursEnabled,
                from: quietHoursFrom,
                to: quietHoursTo,
            },
        };
        console.log('Saving preferences:', JSON.stringify(preferences, null, 2));
    };

    const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.backgroundLight;
    const cardBackgroundColor = isDark ? COLORS.cardDark : COLORS.cardLight;
    const borderColor = isDark ? COLORS.borderDark : COLORS.borderLight;
    const textColor = isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight;
    const pickerBackgroundColor = isDark ? COLORS.backgroundDark : COLORS.backgroundLight;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <MaterialIcons
                        name={isRTL ? 'arrow-forward' : 'arrow-back'}
                        size={24}
                        color={textColor}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>
                    {t.title}
                </Text>
                {/* Empty view for centering title */}
                <View style={styles.headerSpacer} />
            </View>

            {/* Main Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Email Notifications Card */}
                <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
                    <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <MaterialIcons name="mail" size={16} color={COLORS.sectionTitleColor} />
                        <Text style={styles.cardHeaderTitle}>{t.emailNotifications}</Text>
                    </View>

                    {/* Client Activity Section */}
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
                                { textAlign: isRTL ? 'left' : 'right' },
                            ]}
                        >
                            {t.clientActivity}
                        </Text>
                        <CustomCheckbox
                            checked={newClientSignup}
                            onToggle={() => setNewClientSignup(!newClientSignup)}
                            label={t.newClientSignup}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientSentMessage}
                            onToggle={() => setClientSentMessage(!clientSentMessage)}
                            label={t.clientSentMessage}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientCompletedCheckin}
                            onToggle={() => setClientCompletedCheckin(!clientCompletedCheckin)}
                            label={t.clientCompletedCheckin}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientMissedCheckin}
                            onToggle={() => setClientMissedCheckin(!clientMissedCheckin)}
                            label={t.clientMissedCheckin}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientViewedMealPlan}
                            onToggle={() => setClientViewedMealPlan(!clientViewedMealPlan)}
                            label={t.clientViewedMealPlan}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientLoggedWeight}
                            onToggle={() => setClientLoggedWeight(!clientLoggedWeight)}
                            label={t.clientLoggedWeight}
                            isDark={isDark}
                        />
                    </View>

                    {/* Meal Plans Section */}
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight },
                                { textAlign: isRTL ? 'left' : 'right' },
                            ]}
                        >
                            {t.mealPlans}
                        </Text>
                        <CustomCheckbox
                            checked={planExpiringIn3Days}
                            onToggle={() => setPlanExpiringIn3Days(!planExpiringIn3Days)}
                            label={t.planExpiringIn3Days}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientRequestedPlanChange}
                            onToggle={() => setClientRequestedPlanChange(!clientRequestedPlanChange)}
                            label={t.clientRequestedPlanChange}
                            isDark={isDark}
                        />
                        <CustomCheckbox
                            checked={clientCompletedAllMeals}
                            onToggle={() => setClientCompletedAllMeals(!clientCompletedAllMeals)}
                            label={t.clientCompletedAllMeals}
                            isDark={isDark}
                        />
                    </View>
                </View>

                {/* Push Notifications Card */}
                <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
                    <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <MaterialIcons name="notifications" size={16} color={COLORS.sectionTitleColor} />
                        <Text style={styles.cardHeaderTitle}>{t.pushNotifications}</Text>
                    </View>
                    <View style={[styles.switchRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={[styles.switchLabel, { color: textColor, textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.enablePushNotifications}
                        </Text>
                        <Switch
                            value={pushNotificationsEnabled}
                            onValueChange={setPushNotificationsEnabled}
                            trackColor={{ false: '#e5e5e5', true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            ios_backgroundColor="#e5e5e5"
                        />
                    </View>
                </View>

                {/* Quiet Hours Card */}
                <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
                    <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <MaterialIcons name="bedtime" size={16} color={COLORS.sectionTitleColor} />
                        <Text style={styles.cardHeaderTitle}>{t.quietHours}</Text>
                    </View>

                    <CustomCheckbox
                        checked={quietHoursEnabled}
                        onToggle={() => setQuietHoursEnabled(!quietHoursEnabled)}
                        label={t.enableQuietHours}
                        isDark={isDark}
                    />

                    <View style={[styles.pickersContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        {/* From Picker */}
                        <View style={styles.pickerWrapper}>
                            <Text style={styles.pickerLabel}>{t.from}</Text>
                            <View
                                style={[
                                    styles.pickerContainer,
                                    { backgroundColor: pickerBackgroundColor },
                                    !quietHoursEnabled && styles.pickerDisabled,
                                ]}
                            >
                                <Picker
                                    selectedValue={quietHoursFrom}
                                    onValueChange={setQuietHoursFrom}
                                    enabled={quietHoursEnabled}
                                    style={[styles.picker, { color: textColor }]}
                                    dropdownIconColor={COLORS.labelColor}
                                >
                                    {TIME_OPTIONS.map((time) => (
                                        <Picker.Item key={time} label={time} value={time} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* To Picker */}
                        <View style={styles.pickerWrapper}>
                            <Text style={styles.pickerLabel}>{t.to}</Text>
                            <View
                                style={[
                                    styles.pickerContainer,
                                    { backgroundColor: pickerBackgroundColor },
                                    !quietHoursEnabled && styles.pickerDisabled,
                                ]}
                            >
                                <Picker
                                    selectedValue={quietHoursTo}
                                    onValueChange={setQuietHoursTo}
                                    enabled={quietHoursEnabled}
                                    style={[styles.picker, { color: textColor }]}
                                    dropdownIconColor={COLORS.labelColor}
                                >
                                    {END_TIME_OPTIONS.map((time) => (
                                        <Picker.Item key={time} label={time} value={time} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </View>

                    {/* Info text */}
                    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <MaterialIcons name="info" size={18} color={COLORS.labelColor} />
                        <Text style={[styles.infoText, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.quietHoursInfo}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { backgroundColor, borderColor }]}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSavePreferences}
                    activeOpacity={0.9}
                >
                    <Text style={styles.saveButtonText}>{t.savePreferences}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    headerSpacer: {
        width: horizontalScale(40),
    },
    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(12),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(120),
    },
    // Card
    card: {
        borderRadius: 12,
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(16),
    },
    cardHeaderTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: COLORS.sectionTitleColor,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Section
    section: {
        marginBottom: verticalScale(24),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        marginBottom: verticalScale(12),
        paddingHorizontal: horizontalScale(4),
    },
    // Checkbox
    checkboxRow: {
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(4),
        gap: horizontalScale(12),
    },
    checkbox: {
        width: horizontalScale(24),
        height: horizontalScale(24),
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        fontSize: ScaleFontSize(16),
        fontWeight: '400',
        flex: 1,
    },
    // Switch row
    switchRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: verticalScale(8),
        paddingHorizontal: horizontalScale(4),
    },
    switchLabel: {
        fontSize: ScaleFontSize(16),
        fontWeight: '400',
    },
    // Pickers
    pickersContainer: {
        gap: horizontalScale(16),
        paddingHorizontal: horizontalScale(4),
        marginTop: verticalScale(16),
    },
    pickerWrapper: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: COLORS.labelColor,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: verticalScale(6),
    },
    pickerContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: verticalScale(50),
    },
    pickerDisabled: {
        opacity: 0.5,
    },
    // Info row
    infoRow: {
        alignItems: 'flex-start',
        gap: horizontalScale(8),
        paddingHorizontal: horizontalScale(4),
        marginTop: verticalScale(16),
    },
    infoText: {
        fontSize: ScaleFontSize(12),
        color: COLORS.labelColor,
        flex: 1,
        lineHeight: ScaleFontSize(18),
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(32),
        borderTopWidth: 1,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: verticalScale(16),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: COLORS.white,
    },
});
