import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t, translateStatus, translateTime, translateName } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// Types
export interface Client {
    id: string;
    name: string;
    avatar: string;
    status: string;
    statusType: 'critical' | 'warning' | 'info';
    lastActive?: string;
    feeling?: string;
}

export interface ClientsAttentionSectionProps {
    clients: Client[];
    onViewAll: () => void;
    onClientPress: (clientId: string) => void;
    onMessagePress: () => void;
}

// Helper function
function getStatusColor(statusType: string) {
    switch (statusType) {
        case 'critical':
            return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'warning':
            return { bg: '#FFEDD5', text: '#C2410C' };
        case 'info':
            return { bg: '#DBEAFE', text: '#1D4ED8' };
        default:
            return { bg: '#F3F4F6', text: '#374151' };
    }
}

export function ClientsAttentionSection({
    clients,
    onViewAll,
    onClientPress,
    onMessagePress
}: ClientsAttentionSectionProps) {
    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.needsAttention}</Text>
                <TouchableOpacity onPress={onViewAll}>
                    <Text style={styles.viewAllText}>{t.viewAll}</Text>
                </TouchableOpacity>
            </View>

            {clients.map((client) => {
                const statusColors = getStatusColor(client.statusType);
                return (
                    <TouchableOpacity
                        key={client.id}
                        style={[styles.clientRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => onClientPress(client.id)}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{ uri: client.avatar }}
                            style={[styles.clientAvatar, isRTL ? { marginLeft: horizontalScale(12) } : { marginRight: horizontalScale(12) }]}
                        />
                        <View style={styles.clientInfo}>
                            <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse' }}>
                                <Text style={[styles.clientName, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {translateName(client.name)}
                                </Text>
                            </View>
                            <View style={[styles.statusRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                                        {translateStatus(client.status)}
                                    </Text>
                                </View>
                                {client.feeling && (
                                    <Text style={styles.feelingEmoji}>{client.feeling}</Text>
                                )}
                            </View>
                            <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse', paddingHorizontal: horizontalScale(10) }}>
                                {client.lastActive && (
                                    <Text style={[styles.lastActiveText, { textAlign: isRTL ? 'right' : 'left' }]}>
                                        {t.lastActive} {translateTime(client.lastActive)}
                                    </Text>
                                )}

                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.messageButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onMessagePress();
                            }}
                        >
                            <Text style={styles.messageButtonText}>{t.message}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                );
            })}
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
    clientRow: {
        alignItems: 'center',
        padding: horizontalScale(12),
        borderRadius: horizontalScale(12),
        backgroundColor: colors.bgSecondary,
        marginBottom: verticalScale(8),
    },
    clientAvatar: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
        marginHorizontal: horizontalScale(10),
        marginBottom: verticalScale(4)
    },
    statusRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
        flexWrap: 'wrap',
        marginHorizontal: horizontalScale(10),
        marginVertical: verticalScale(4)
    },
    statusBadge: {
        paddingHorizontal: horizontalScale(5),
        paddingVertical: verticalScale(3),
        borderRadius: horizontalScale(4),
    },
    statusText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
    },
    feelingEmoji: {
        fontSize: ScaleFontSize(14),
    },
    lastActiveText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    messageButton: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: horizontalScale(8),
    },
    messageButtonText: {
        fontSize: ScaleFontSize(12),
        color: colors.textPrimary,
    },
});
