import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, Phone } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t, appointmentTranslations as at } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// ============ TYPES ============
export interface Appointment {
    id: string;
    time: string;
    type: 'video' | 'phone';
    clientName: string;
    clientId: string;
    avatar: string;
    duration: string;
    status: 'upcoming' | 'starting_soon' | 'in_progress';
    reason?: string;
    clientPhone?: string; // For phone calls
}

export interface AppointmentsSectionProps {
    appointments: Appointment[];
    isLoading?: boolean;
    isEmpty?: boolean;
    error?: Error;
    onAddPress?: () => void;
    onSchedulePress?: () => void;
    onAppointmentPress?: (appointmentId: string) => void;
    onStartCall?: (appointment: Appointment) => void;
    onStartPhoneCall?: (appointment: Appointment) => void; // Phone call handler
    onRetry?: () => void;
}

// ============ HELPER FUNCTIONS ============
function getStatusStyle(status: Appointment['status']) {
    switch (status) {
        case 'in_progress':
            return { borderColor: '#16A34A', badgeBg: '#DCFCE7', badgeText: '#166534' };
        case 'starting_soon':
            return { borderColor: '#F97316', badgeBg: '#FFEDD5', badgeText: '#C2410C' };
        default:
            return { borderColor: colors.border, badgeBg: '', badgeText: '' };
    }
}

function getStatusLabel(status: Appointment['status']): string {
    switch (status) {
        case 'in_progress':
            return at.inProgress;
        case 'starting_soon':
            return at.startingSoon;
        default:
            return '';
    }
}

// ============ SUB-COMPONENTS ============

/**
 * Skeleton loader for appointment cards
 */
function SkeletonLoader() {
    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonViewAll} />
            </View>
            {[1, 2].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonContent}>
                        <View style={styles.skeletonName} />
                        <View style={styles.skeletonDuration} />
                    </View>
                    <View style={styles.skeletonTime} />
                    <View style={styles.skeletonIcon} />
                </View>
            ))}
        </View>
    );
}

/**
 * Empty state when no appointments
 */
function EmptyState({ onSchedulePress }: { onSchedulePress?: () => void }) {
    return (
        <View style={[styles.sectionCard, styles.emptyCard]}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>{t.noAppointmentsToday}</Text>
            <Text style={styles.emptySubtitle}>{at.enjoyYourDay}</Text>
            <TouchableOpacity onPress={onSchedulePress}>
                <Text style={styles.scheduleLink}>{t.scheduleOne}</Text>
            </TouchableOpacity>
        </View>
    );
}

/**
 * Error state with retry button
 */
function ErrorState({ onRetry }: { onRetry?: () => void }) {
    return (
        <TouchableOpacity
            style={[styles.sectionCard, styles.errorCard]}
            onPress={onRetry}
            activeOpacity={0.7}
        >
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>{at.errorLoadingAppointments}</Text>
        </TouchableOpacity>
    );
}

// ============ MAIN COMPONENT ============
export function AppointmentsSection({
    appointments,
    isLoading = false,
    isEmpty = false,
    error,
    onAddPress,
    onSchedulePress,
    onAppointmentPress,
    onStartCall,
    onStartPhoneCall,
    onRetry
}: AppointmentsSectionProps) {
    // Loading state
    if (isLoading) {
        return <SkeletonLoader />;
    }

    // Error state
    if (error) {
        return <ErrorState onRetry={onRetry} />;
    }

    // Empty state
    if (isEmpty || appointments.length === 0) {
        return <EmptyState onSchedulePress={onSchedulePress} />;
    }

    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.todaysAppointments}</Text>
                <TouchableOpacity onPress={onAddPress}>
                    <Text style={styles.viewAllText}>{t.viewAll}</Text>
                </TouchableOpacity>
            </View>

            {appointments.map((apt) => {
                const statusStyle = getStatusStyle(apt.status);
                const statusLabel = getStatusLabel(apt.status);
                const showJoinButton = apt.status === 'starting_soon' || apt.status === 'in_progress';

                return (

                    <TouchableOpacity
                        key={apt.id}
                        style={[
                            styles.appointmentRow,
                            { flexDirection: isRTL ? 'row' : 'row-reverse' },
                            { borderLeftColor: statusStyle.borderColor },
                            { borderRightColor: statusStyle.borderColor },
                        ]}
                        onPress={() => onAppointmentPress?.(apt.id)}
                        activeOpacity={0.7}
                    >
                        {apt.avatar && !apt.avatar.includes('placeholder') ? (
                            <Image
                                source={{ uri: apt.avatar }}
                                style={[styles.appointmentAvatar, isRTL ? { marginLeft: horizontalScale(10) } : { marginRight: horizontalScale(10) }]}
                            />
                        ) : (
                            <View style={[styles.initialsAvatar, isRTL ? { marginLeft: horizontalScale(10) } : { marginRight: horizontalScale(10) }]}>
                                <Text style={styles.initialsText}>
                                    {apt.clientName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.clientInfo}>
                            <Text style={[styles.appointmentClientName, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {apt.clientName}
                            </Text>
                            <View style={[styles.detailsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.appointmentDuration}>{apt.duration}</Text>
                                {statusLabel && (
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.badgeBg }]}>
                                        <Text style={[styles.statusBadgeText, { color: statusStyle.badgeText }]}>
                                            {statusLabel}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.appointmentTime}>
                            <Text style={styles.appointmentTimeText}>{apt.time}</Text>
                        </View>
                        {showJoinButton ? (
                            <TouchableOpacity
                                style={[styles.joinButton, apt.status === 'in_progress' && styles.joinButtonActive]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    // Use phone call for phone type, regular call for video
                                    if (apt.type === 'phone') {
                                        onStartPhoneCall?.(apt);
                                    } else {
                                        onStartCall?.(apt);
                                    }
                                }}
                            >
                                <Text style={[styles.joinButtonText, apt.status === 'in_progress' && styles.joinButtonTextActive]}>
                                    {at.joinCall}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.appointmentTypeIcon, isRTL ? { marginLeft: horizontalScale(8) } : { marginRight: horizontalScale(8) }]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    if (apt.type === 'phone') {
                                        onStartPhoneCall?.(apt);
                                    } else {
                                        onStartCall?.(apt);
                                    }
                                }}
                            >
                                {apt.type === 'video' ? (
                                    <Video size={horizontalScale(18)} color="#2563EB" />
                                ) : (
                                    <Phone size={horizontalScale(18)} color="#16A34A" />
                                )}
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    sectionHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    viewAllText: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        fontWeight: '500',
    },
    appointmentRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: horizontalScale(10),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: verticalScale(8),
    },
    clientInfo: {
        flex: 1,
        marginHorizontal: horizontalScale(8),
        alignItems: 'center',
    },
    detailsRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginTop: verticalScale(2),
    },
    appointmentTime: {
        minWidth: horizontalScale(70),
    },
    appointmentTimeText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        textAlign: isRTL ? 'left' : 'right',
    },
    appointmentTypeIcon: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appointmentAvatar: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
    },
    initialsAvatar: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    appointmentClientName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    appointmentDuration: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(4),
    },
    statusBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '600',
    },
    joinButton: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.success,
    },
    joinButtonActive: {
        backgroundColor: colors.success,
    },
    joinButtonText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.success,
    },
    joinButtonTextActive: {
        color: '#FFFFFF',
    },
    // Skeleton styles
    skeletonTitle: {
        width: horizontalScale(140),
        height: verticalScale(20),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    skeletonViewAll: {
        width: horizontalScale(60),
        height: verticalScale(16),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    skeletonRow: {
        flexDirection: isRTL ? 'row' : 'row-reverse',
        alignItems: 'center',
        padding: horizontalScale(10),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: verticalScale(8),
    },
    skeletonAvatar: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        backgroundColor: '#E5E7EB',
        marginHorizontal: horizontalScale(12),
    },
    skeletonContent: {
        flex: 1,
    },
    skeletonName: {
        width: horizontalScale(100),
        height: verticalScale(14),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        marginBottom: verticalScale(6),
        alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    skeletonDuration: {
        width: horizontalScale(50),
        height: verticalScale(12),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    skeletonTime: {
        width: horizontalScale(60),
        height: verticalScale(14),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        marginHorizontal: horizontalScale(8),
    },
    skeletonIcon: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(8),
        backgroundColor: '#E5E7EB',
    },
    // Empty state
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(32),
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(32),
        marginBottom: verticalScale(8),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptySubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    scheduleLink: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        marginTop: verticalScale(12),
    },
    // Error state
    errorCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(32),
        backgroundColor: '#FEF2F2',
    },
    errorEmoji: {
        fontSize: ScaleFontSize(32),
        marginBottom: verticalScale(8),
    },
    errorTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#991B1B',
    },
});
