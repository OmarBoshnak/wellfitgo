import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { Crown, Bell, User, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { t } from '../translations';

// ============ TYPES ============

interface SettingsTabProps {
    clientId: Id<"users">;
}

// ============ COMPONENT ============

export function SettingsTab({ clientId }: SettingsTabProps) {
    const router = useRouter();
    const settings = useQuery(api.clientProfile.getClientSettings, { clientId });
    const updateNotifications = useMutation(api.clientProfile.updateClientNotifications);
    const archiveClientMutation = useMutation(api.clientProfile.archiveClient);

    const [isSaving, setIsSaving] = useState(false);

    const getSubscriptionLabel = (status: string): { label: string; color: string; bg: string } => {
        const configs: Record<string, { label: string; color: string; bg: string }> = {
            active: { label: t.subscriptionActive, color: '#16A34A', bg: '#DCFCE7' },
            trial: { label: t.subscriptionTrial, color: '#2563EB', bg: '#DBEAFE' },
            paused: { label: t.subscriptionPaused, color: '#F59E0B', bg: '#FEF3C7' },
            cancelled: { label: t.subscriptionCancelled, color: '#DC2626', bg: '#FEE2E2' },
        };
        return configs[status] ?? configs.active;
    };

    const handleToggle = async (key: 'mealReminders' | 'weeklyCheckin' | 'coachMessages', value: boolean) => {
        setIsSaving(true);
        try {
            await updateNotifications({ clientId, [key]: value });
        } catch (error) {
            console.error('Toggle error:', error);
        }
        setIsSaving(false);
    };

    const handleArchive = () => {
        Alert.alert(
            t.confirmArchive,
            t.archiveClientDesc,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.confirm,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await archiveClientMutation({ clientId });
                            router.back();
                        } catch (error) {
                            console.error('Archive error:', error);
                        }
                    },
                },
            ]
        );
    };

    // Loading
    if (settings === undefined) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
        );
    }

    if (settings === null) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Unable to load settings</Text>
            </View>
        );
    }

    const subBadge = getSubscriptionLabel(settings.subscriptionStatus);

    return (
        <View style={styles.container}>
            {/* Subscription Section */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Crown size={20} color={colors.primaryDark} />
                    <Text style={styles.sectionTitle}>{t.subscription}</Text>
                </View>
                <View style={styles.card}>
                    <View style={[styles.row, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.label}>{t.subscription}</Text>
                        <View style={[styles.badge, { backgroundColor: subBadge.bg }]}>
                            <Text style={[styles.badgeText, { color: subBadge.color }]}>
                                {subBadge.label}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Bell size={20} color={colors.primaryDark} />
                    <Text style={styles.sectionTitle}>{t.notifications}</Text>
                </View>
                <View style={styles.card}>
                    {/* Meal Reminders */}
                    <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.toggleLabel}>{t.mealReminders}</Text>
                        <Switch
                            value={settings.notificationSettings.mealReminders}
                            onValueChange={(value) => handleToggle('mealReminders', value)}
                            trackColor={{ false: '#E5E7EB', true: colors.primaryDark }}
                            thumbColor="#FFFFFF"
                            disabled={isSaving}
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Weekly Check-in */}
                    <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.toggleLabel}>{t.weeklyCheckin}</Text>
                        <Switch
                            value={settings.notificationSettings.weeklyCheckin}
                            onValueChange={(value) => handleToggle('weeklyCheckin', value)}
                            trackColor={{ false: '#E5E7EB', true: colors.primaryDark }}
                            thumbColor="#FFFFFF"
                            disabled={isSaving}
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Coach Messages */}
                    <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.toggleLabel}>{t.coachMessages}</Text>
                        <Switch
                            value={settings.notificationSettings.coachMessages}
                            onValueChange={(value) => handleToggle('coachMessages', value)}
                            trackColor={{ false: '#E5E7EB', true: colors.primaryDark }}
                            thumbColor="#FFFFFF"
                            disabled={isSaving}
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                    </View>
                </View>
            </View>

            {/* Coach Section */}
            {settings.coach && (
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <User size={20} color={colors.primaryDark} />
                        <Text style={styles.sectionTitle}>Coach</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={[styles.row, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.label}>Assigned Coach</Text>
                            <Text style={styles.value}>{settings.coach.name}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Danger Zone */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <AlertTriangle size={20} color="#DC2626" />
                    <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>{t.dangerZone}</Text>
                </View>
                <View style={[styles.card, styles.dangerCard]}>
                    <View style={[styles.dangerRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.dangerLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{t.archiveClient}</Text>
                            <Text style={[styles.dangerDesc, { textAlign: isRTL ? 'left' : 'right' }]}>{t.archiveClientDesc}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.dangerButton}
                            onPress={handleArchive}
                        >
                            <Text style={styles.dangerButtonText}>{t.archiveClient}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: horizontalScale(16),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    errorText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    section: {
        marginBottom: verticalScale(24),
    },
    sectionHeader: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(12),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: ScaleFontSize(15),
        color: colors.textSecondary,
    },
    value: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    badge: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(12),
    },
    badgeText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
    },
    toggleRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: verticalScale(4),
    },
    toggleLabel: {
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: verticalScale(12),
    },
    dangerCard: {
        borderWidth: 1,
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
    },
    dangerRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    dangerLabel: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: '#DC2626',
    },
    dangerDesc: {
        fontSize: ScaleFontSize(13),
        color: '#6B7280',
        marginTop: verticalScale(2),
    },
    dangerButton: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(10),
        backgroundColor: '#DC2626',
        borderRadius: horizontalScale(8),
    },
    dangerButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
