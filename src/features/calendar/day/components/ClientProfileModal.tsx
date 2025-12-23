/**
 * ClientProfileModal - Display client profile snapshot
 * Shows avatar, name, vitals (height, weight), and medical alerts
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface ClientProfile {
    _id: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
    height?: number;
    currentWeight: number;
    targetWeight: number;
    subscriptionStatus: 'active' | 'paused' | 'cancelled' | 'trial';
    activityLevel?: string; // This stores medical conditions
}

interface ClientProfileModalProps {
    visible: boolean;
    onClose: () => void;
    client: ClientProfile | null;
    isLoading?: boolean;
}

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = {
    height: isRTL ? 'الطول' : 'Height',
    current: isRTL ? 'الحالي' : 'Current',
    target: isRTL ? 'الهدف' : 'Target',
    medicalAlerts: isRTL ? 'التنبيهات الطبية' : 'Medical Alerts',
    close: isRTL ? 'إغلاق' : 'Close',
    cm: isRTL ? 'سم' : 'cm',
    kg: isRTL ? 'كجم' : 'kg',
    premiumMember: isRTL ? 'عميل مميز' : 'Premium Member',
    activeMember: isRTL ? 'عميل نشط' : 'Active Member',
    trialMember: isRTL ? 'فترة تجريبية' : 'Trial Member',
    noAlerts: isRTL ? 'لا توجد تنبيهات' : 'No alerts',
};

// Medical condition icons map
const CONDITION_ICONS: Record<string, string> = {
    diabetes: '💉',
    hypertension: '❤️',
    'high blood pressure': '❤️',
    heart: '❤️',
    allergy: '🤧',
    asthma: '🫁',
};

// =============================================================================
// HELPERS
// =============================================================================

function getSubscriptionLabel(status: ClientProfile['subscriptionStatus']): string {
    switch (status) {
        case 'active':
            return t.premiumMember;
        case 'trial':
            return t.trialMember;
        default:
            return t.activeMember;
    }
}

function parseMedicalConditions(conditions?: string): string[] {
    if (!conditions || conditions.trim() === '') return [];
    // Split by comma, newline, or semicolon
    return conditions
        .split(/[,;\n]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
}

function getConditionIcon(condition: string): string {
    const lowerCondition = condition.toLowerCase();
    for (const [key, icon] of Object.entries(CONDITION_ICONS)) {
        if (lowerCondition.includes(key)) {
            return icon;
        }
    }
    return '⚠️';
}

function getInitials(firstName: string, lastName?: string): string {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName?.charAt(0).toUpperCase() || '';
    return `${first}${last}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
    visible,
    onClose,
    client,
    isLoading = false,
}) => {
    if (!client) return null;

    const fullName = `${client.firstName} ${client.lastName || ''}`.trim();
    const medicalConditions = parseMedicalConditions(client.activityLevel);
    const subscriptionLabel = getSubscriptionLabel(client.subscriptionStatus);
    const initials = getInitials(client.firstName, client.lastName);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                {/* Modal Card */}
                <View style={styles.card}>
                    {/* Avatar Section */}
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#5073FE', '#02C3CD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBorder}
                        >
                            <View >
                                {client.avatarUrl ? (
                                    <Image
                                        source={{ uri: client.avatarUrl }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarInitials}>{initials}</Text>
                                    </View>
                                )}
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Identity Section */}
                    <View style={styles.identitySection}>
                        <Text style={styles.clientName}>{fullName}</Text>
                        <Text style={styles.subscriptionBadge}>{subscriptionLabel}</Text>
                    </View>

                    {/* Vitals Row */}
                    <View style={[styles.vitalsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {/* Height */}
                        <View style={[styles.vitalItem, styles.vitalItemBorder]}>
                            <Text style={styles.vitalLabel}>{t.height}</Text>
                            <Text style={styles.vitalValue}>
                                {client.height || '—'} {client.height ? t.cm : ''}
                            </Text>
                        </View>

                        {/* Current Weight */}
                        <View style={[styles.vitalItem, styles.vitalItemBorder]}>
                            <Text style={styles.vitalLabel}>{t.current}</Text>
                            <Text style={styles.vitalValue}>
                                {client.currentWeight} {t.kg}
                            </Text>
                        </View>

                        {/* Target Weight */}
                        <View style={styles.vitalItem}>
                            <Text style={styles.vitalLabel}>{t.target}</Text>
                            <Text style={[styles.vitalValue, styles.vitalValueTarget]}>
                                {client.targetWeight} {t.kg}
                            </Text>
                        </View>
                    </View>

                    {/* Medical Alerts Section */}
                    <View style={styles.alertsSection}>
                        <Text style={styles.alertsTitle}>{t.medicalAlerts}</Text>
                        <View style={[styles.alertsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            {medicalConditions.length > 0 ? (
                                medicalConditions.map((condition, index) => (
                                    <View key={index} style={styles.alertChip}>
                                        <Text style={styles.alertIcon}>
                                            {getConditionIcon(condition)}
                                        </Text>
                                        <Text style={styles.alertText}>{condition}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noAlertsText}>{t.noAlerts}</Text>
                            )}
                        </View>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                        <Text style={styles.closeButtonText}>{t.close}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: horizontalScale(16),
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: horizontalScale(340),
        paddingHorizontal: horizontalScale(24),
        paddingTop: verticalScale(32),
        paddingBottom: verticalScale(24),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    // Avatar
    avatarContainer: {
        marginBottom: verticalScale(16),
    },
    gradientBorder: {
        padding: 1,
        borderRadius: 60,
    },
    avatarImage: {
        width: horizontalScale(94),
        height: horizontalScale(94),
        borderRadius: horizontalScale(47),
    },
    avatarPlaceholder: {
        width: horizontalScale(94),
        height: horizontalScale(94),
        borderRadius: horizontalScale(47),
        backgroundColor: '#E8F4FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: ScaleFontSize(32),
        fontWeight: '700',
        color: '#5073FE',
    },
    // Identity
    identitySection: {
        alignItems: 'center',
        marginBottom: verticalScale(32),
    },
    clientName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: '#526477',
        marginBottom: verticalScale(4),
    },
    subscriptionBadge: {
        fontSize: ScaleFontSize(14),
        fontWeight: '400',
        color: '#9CA3AF',
    },
    // Vitals
    vitalsRow: {
        width: '100%',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: verticalScale(24),
        marginBottom: verticalScale(24),
    },
    vitalItem: {
        flex: 1,
        alignItems: 'center',
        gap: verticalScale(4),
    },
    vitalItemBorder: {
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
    },
    vitalLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    vitalValue: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: '#0c101d',
    },
    vitalValueTarget: {
        color: '#27AE61',
    },
    // Alerts
    alertsSection: {
        width: '100%',
        alignItems: 'center',
        gap: verticalScale(12),
        marginBottom: verticalScale(32),
    },
    alertsTitle: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    alertsRow: {
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: horizontalScale(8),
    },
    alertChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        backgroundColor: '#FFF5F5',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: 100,
    },
    alertIcon: {
        fontSize: ScaleFontSize(14),
    },
    alertText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#EB5757',
    },
    noAlertsText: {
        fontSize: ScaleFontSize(14),
        color: '#9CA3AF',
    },
    // Close Button
    closeButton: {
        width: '100%',
        height: verticalScale(44),
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#526477',
    },
});

export default ClientProfileModal;
