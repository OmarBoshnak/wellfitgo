import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Switch,
    useColorScheme,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = {
    title: isRTL ? 'إعدادات الإشعارات' : 'Notification Settings',
    pushNotifications: isRTL ? 'الإشعارات الفورية' : 'Push Notifications',
    enablePushNotifications: isRTL ? 'تفعيل الإشعارات الفورية' : 'Enable push notifications',
    newMessages: isRTL ? 'الرسائل الجديدة' : 'New messages',
    appointments: isRTL ? 'المواعيد' : 'Appointments',
    savePreferences: isRTL ? 'حفظ التفضيلات' : 'Save Preferences',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
};

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
    primary: '#ea5757',
    backgroundLight: '#f8f6f6',
    backgroundDark: '#211111',
    cardLight: '#ffffff',
    cardDark: '#2c1e1e',
    textPrimaryLight: '#1b0e0e',
    textPrimaryDark: '#f1f1f1',
    sectionTitleColor: '#AAB8C5',
    borderLight: '#e5e5e5',
    borderDark: 'rgba(128, 128, 128, 0.3)',
    white: '#ffffff',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ========== CONVEX: Load notification settings ==========
    const notificationSettings = useQuery(api.users.getNotificationSettings);
    const updateSettings = useMutation(api.users.updateNotificationSettings);

    // Local state for UI (initialized from Convex)
    const [pushEnabled, setPushEnabled] = useState(true);
    const [newMessages, setNewMessages] = useState(true);
    const [appointments, setAppointments] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // ========== SYNC: Populate switches from Convex on load ==========
    useEffect(() => {
        if (notificationSettings && !isInitialized) {
            setPushEnabled(notificationSettings.pushEnabled);
            setNewMessages(notificationSettings.newMessages);
            setAppointments(notificationSettings.appointments);
            setIsInitialized(true);
        }
    }, [notificationSettings, isInitialized]);

    // ========== SAVE: Persist to Convex and navigate back ==========
    const handleSavePreferences = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                pushEnabled,
                newMessages,
                appointments,
            });
            // Navigate back after successful save
            router.back();
        } catch (error) {
            console.error('Failed to save notification settings:', error);
            setIsSaving(false);
        }
    };

    const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.backgroundLight;
    const cardBackgroundColor = isDark ? COLORS.cardDark : COLORS.cardLight;
    const borderColor = isDark ? COLORS.borderDark : COLORS.borderLight;
    const textColor = isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight;

    // Show loading spinner while fetching settings
    if (notificationSettings === undefined) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor }]}>
                <View style={styles.headerSpacer} />

                <Text style={[styles.headerTitle, { color: textColor }]}>
                    {t.title}
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <MaterialIcons
                        name={'arrow-back'}
                        size={24}
                        color={textColor}
                    />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Push Notifications Card */}
                <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
                    <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <MaterialIcons name="notifications" size={16} color={COLORS.sectionTitleColor} />
                        <Text style={styles.cardHeaderTitle}>{t.pushNotifications}</Text>
                    </View>

                    {/* Enable Push Notifications */}
                    <View style={[styles.switchRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={[styles.switchLabel, { color: textColor }]}>
                            {t.enablePushNotifications}
                        </Text>
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: '#e5e5e5', true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            ios_backgroundColor="#e5e5e5"
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                    </View>

                    {/* New Messages */}
                    <View style={[styles.switchRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={[styles.switchLabel, { color: textColor, opacity: pushEnabled ? 1 : 0.5 }]}>
                            {t.newMessages}
                        </Text>
                        <Switch
                            value={newMessages}
                            onValueChange={setNewMessages}
                            disabled={!pushEnabled}
                            trackColor={{ false: '#e5e5e5', true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            ios_backgroundColor="#e5e5e5"
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                    </View>

                    {/* Appointments */}
                    <View style={[styles.switchRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={[styles.switchLabel, { color: textColor, opacity: pushEnabled ? 1 : 0.5 }]}>
                            {t.appointments}
                        </Text>
                        <Switch
                            value={appointments}
                            onValueChange={setAppointments}
                            disabled={!pushEnabled}
                            trackColor={{ false: '#e5e5e5', true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            ios_backgroundColor="#e5e5e5"
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { backgroundColor, borderColor }]}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSavePreferences}
                    activeOpacity={0.9}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>{t.savePreferences}</Text>
                    )}
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
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(12),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(120),
    },
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
    switchRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(4),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    switchLabel: {
        fontSize: ScaleFontSize(16),
        fontWeight: '400',
    },
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
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: COLORS.white,
    },
});
