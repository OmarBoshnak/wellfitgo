import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, Phone } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t, translateTime, translateName } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// Types
export interface Appointment {
    id: string;
    time: string;
    type: 'video' | 'phone';
    clientName: string;
    avatar: string;
    duration: string;
}

export interface AppointmentsSectionProps {
    appointments: Appointment[];
    onAddPress?: () => void;
    onSchedulePress?: () => void;
}

export function AppointmentsSection({
    appointments,
    onAddPress,
    onSchedulePress
}: AppointmentsSectionProps) {
    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.todaysAppointments}</Text>
                <TouchableOpacity onPress={onAddPress}>
                    <Text style={styles.viewAllText}>{t.viewAll}</Text>
                </TouchableOpacity>
            </View>

            {appointments.map((apt) => (
                <View key={apt.id} style={[styles.appointmentRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Image source={{ uri: apt.avatar }} style={[styles.appointmentAvatar, isRTL ? { marginLeft: horizontalScale(12) } : { marginRight: horizontalScale(12) }]} />
                    <View style={{ alignItems: 'flex-start' }}>
                        <Text style={[styles.appointmentClientName, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {translateName(apt.clientName)}
                        </Text>
                        <Text style={[styles.appointmentDuration, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {translateTime(apt.duration)}
                        </Text>

                    </View>
                    <View style={styles.appointmentTime}>
                        <Text style={[styles.appointmentTimeText, { textAlign: isRTL ? 'right' : 'left' }]}>{apt.time}</Text>
                    </View>
                    <View style={[styles.appointmentTypeIcon, isRTL ? { marginLeft: horizontalScale(12) } : { marginRight: horizontalScale(12) }]}>
                        {apt.type === 'video' ? (
                            <TouchableOpacity>
                                <Video size={horizontalScale(18)} color="#2563EB" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity>
                                <Phone size={horizontalScale(18)} color="#16A34A" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ))}

            {appointments.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>{t.noAppointmentsToday}</Text>
                    <TouchableOpacity onPress={onSchedulePress}>
                        <Text style={styles.scheduleLink}>{t.scheduleOne}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

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
    appointmentTime: {
        minWidth: horizontalScale(70),
    },
    appointmentTimeText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
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
    appointmentClientName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    appointmentDuration: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: verticalScale(32),
    },
    emptyStateText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    scheduleLink: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        marginTop: verticalScale(8),
    },
});
