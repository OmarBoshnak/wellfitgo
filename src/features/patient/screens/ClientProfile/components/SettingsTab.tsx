import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { Crown, Bell, User, AlertTriangle, MessageCircle, Check } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { t } from '../translations';

// ============ TYPES ============

interface SettingsTabProps {
    clientId: Id<"users">;
}

// Doctor options
const DOCTORS = [
    { id: 'gehad', name: isRTL ? 'د. جيهاد' : 'Dr. Gehad', nameEn: 'Gehad' },
    { id: 'mostafa', name: isRTL ? 'د. مصطفى' : 'Dr. Mostafa', nameEn: 'Mostafa' },
];

// ============ COMPONENT ============

export function SettingsTab({ clientId }: SettingsTabProps) {
    const router = useRouter();
    const settings = useQuery(api.clientProfile.getClientSettings, { clientId });
    const currentUser = useQuery(api.users.getMe);
    const updateNotifications = useMutation(api.clientProfile.updateClientNotifications);
    const archiveClientMutation = useMutation(api.clientProfile.archiveClient);
    const assignChatDoctorMutation = useMutation(api.users.assignChatDoctor);

    // Get doctors list for assignment
    const doctors = useQuery(api.users.getUsersByRole, { role: 'coach' });

    const [isSaving, setIsSaving] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

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

    const handleAssignDoctor = async (doctorId: Id<"users">) => {
        setIsAssigning(true);
        try {
            const result = await assignChatDoctorMutation({ clientId, doctorId });
            setShowDoctorModal(false);
            Alert.alert(
                isRTL ? 'تم التعيين' : 'Assigned',
                result.message
            );
        } catch (error: any) {
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                error.message || (isRTL ? 'فشل التعيين' : 'Failed to assign doctor')
            );
        }
        setIsAssigning(false);
    };

    // Get currently assigned doctor name
    const getAssignedDoctorName = (): string => {
        if (!settings?.assignedChatDoctor) return isRTL ? 'غير معين' : 'Not Assigned';
        const foundDoctor = doctors?.find(d => d._id === settings.assignedChatDoctor);
        if (foundDoctor) return `${'Dr.'} ${foundDoctor.firstName}`;
        return isRTL ? 'غير معين' : 'Not Assigned';
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

            {/* Assign Chat Doctor Section - Admin Only */}
            {isAdmin && (
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <MessageCircle size={20} color={colors.primaryDark} />
                        <Text style={styles.sectionTitle}>{isRTL ? 'طبيب الدردشة' : 'Chat Doctor'}</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={[styles.row, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.label}>{isRTL ? 'الطبيب المعين' : 'Assigned Doctor'}</Text>
                            <View style={[
                                styles.badge,
                                { backgroundColor: settings.assignedChatDoctor ? '#DCFCE7' : '#FEF3C7' }
                            ]}>
                                <Text style={[
                                    styles.badgeText,
                                    { color: settings.assignedChatDoctor ? '#16A34A' : '#F59E0B' }
                                ]}>
                                    {getAssignedDoctorName()}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => setShowDoctorModal(true)}
                        >
                            <Text style={styles.assignButtonText}>
                                {settings.assignedChatDoctor
                                    ? (isRTL ? 'تغيير الطبيب' : 'Change Doctor')
                                    : (isRTL ? 'تعيين طبيب' : 'Assign Doctor')
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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

            {/* Doctor Section - Show assigned doctor */}
            {settings.assignedChatDoctor && (
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <User size={20} color={colors.primaryDark} />
                        <Text style={styles.sectionTitle}>{isRTL ? 'الطبيب' : 'Doctor'}</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={[styles.row, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.label}>{isRTL ? 'الطبيب المعين' : 'Assigned Doctor'}</Text>
                            <Text style={styles.value}>{getAssignedDoctorName()}</Text>
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

            {/* Doctor Selection Modal */}
            <Modal
                visible={showDoctorModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDoctorModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {isRTL ? 'اختر الطبيب' : 'Select Doctor'}
                        </Text>

                        {isAssigning ? (
                            <ActivityIndicator size="large" color={colors.primaryDark} style={{ marginVertical: 20 }} />
                        ) : (
                            <>
                                {/* Show all available coaches */}
                                {doctors?.map((doctor) => (
                                    <TouchableOpacity
                                        key={doctor._id}
                                        style={[
                                            styles.doctorOption,
                                            settings.assignedChatDoctor === doctor._id && styles.doctorOptionSelected
                                        ]}
                                        onPress={() => handleAssignDoctor(doctor._id)}
                                    >
                                        <Text style={[
                                            styles.doctorOptionText,
                                            settings.assignedChatDoctor === doctor._id && styles.doctorOptionTextSelected
                                        ]}>
                                            {isRTL ? 'د.' : 'Dr.'} {doctor.firstName} {doctor.lastName || ''}
                                        </Text>
                                        {settings.assignedChatDoctor === doctor._id && (
                                            <Check size={20} color={colors.primaryDark} />
                                        )}
                                    </TouchableOpacity>
                                ))}

                                {/* Fallback if no doctors found */}
                                {(!doctors || doctors.length === 0) && (
                                    <Text style={styles.noDataText}>
                                        {isRTL ? 'لا يوجد أطباء متاحين' : 'No doctors available'}
                                    </Text>
                                )}
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowDoctorModal(false)}
                        >
                            <Text style={styles.modalCancelText}>
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    assignButton: {
        backgroundColor: colors.primaryDark,
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        marginTop: verticalScale(4),
    },
    assignButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: horizontalScale(24),
    },
    modalContent: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(20),
        width: '100%',
        maxWidth: 320,
    },
    modalTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: verticalScale(20),
    },
    doctorOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: verticalScale(14),
        paddingHorizontal: horizontalScale(16),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: verticalScale(10),
    },
    doctorOptionSelected: {
        borderColor: colors.primaryDark,
        backgroundColor: colors.primaryDark + '10',
    },
    doctorOptionText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    doctorOptionTextSelected: {
        color: colors.primaryDark,
        fontWeight: '600',
    },
    modalCancelButton: {
        paddingVertical: verticalScale(12),
        alignItems: 'center',
        marginTop: verticalScale(8),
    },
    modalCancelText: {
        fontSize: ScaleFontSize(15),
        color: colors.textSecondary,
    },
    noDataText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: verticalScale(16),
    },
});
