import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t, translateName, attentionTranslations as at } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// ============ TYPES ============
export interface Client {
    id: string;
    name: string;
    avatar: string;
    status: string;
    statusType: 'critical' | 'warning' | 'info';
    lastActive?: string;
    feeling?: string;
    // Attention metadata
    attentionType: 'late_message' | 'weight_gain' | 'missing_checkin';
    weightChange?: number;
    lastMessageTime?: number;
    daysSinceCheckin?: number | null;
}

export interface ClientsAttentionSectionProps {
    clients: Client[];
    isLoading?: boolean;
    isEmpty?: boolean;
    error?: Error;
    onViewAll: () => void;
    onClientPress: (clientId: string) => void;
    onMessagePress: (clientId: string) => void;
    onRetry?: () => void;
}

// ============ HELPER FUNCTIONS ============
function getStatusColor(statusType: string) {
    switch (statusType) {
        case 'critical':
            return { bg: '#FEE2E2', text: '#B91C1C', border: '#EF4444' };
        case 'warning':
            return { bg: '#FFEDD5', text: '#C2410C', border: '#F97316' };
        case 'info':
            return { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' };
        default:
            return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
    }
}

// ============ SUB-COMPONENTS ============

/**
 * Skeleton loader for client cards
 */
function SkeletonLoader() {
    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonViewAll} />
            </View>
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonContent}>
                        <View style={styles.skeletonName} />
                        <View style={styles.skeletonStatus} />
                    </View>
                    <View style={styles.skeletonButton} />
                </View>
            ))}
        </View>
    );
}

/**
 * Empty state when all clients are on track
 */
function EmptyState() {
    return (
        <View style={[styles.sectionCard, styles.emptyCard]}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>{at.allClientsOnTrack}</Text>
            <Text style={styles.emptySubtitle}>{at.noClientsNeedAttention}</Text>
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
            <Text style={styles.errorTitle}>{at.errorLoadingClients}</Text>
            <Text style={styles.errorSubtitle}>{at.tapToRetry}</Text>
        </TouchableOpacity>
    );
}

// ============ MAIN COMPONENT ============
export function ClientsAttentionSection({
    clients,
    isLoading = false,
    isEmpty = false,
    error,
    onViewAll,
    onClientPress,
    onMessagePress,
    onRetry
}: ClientsAttentionSectionProps) {
    // Loading state
    if (isLoading) {
        return <SkeletonLoader />;
    }

    // Error state
    if (error) {
        return <ErrorState onRetry={onRetry} />;
    }

    // Empty state
    if (isEmpty || clients.length === 0) {
        return <EmptyState />;
    }

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
                        style={[
                            styles.clientRow,
                            { flexDirection: isRTL ? 'row' : 'row-reverse' },
                            { borderLeftColor: statusColors.border, borderLeftWidth: isRTL ? 0 : 3 },
                            { borderRightColor: statusColors.border, borderRightWidth: isRTL ? 3 : 0 },
                        ]}
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
                                        {client.status}
                                    </Text>
                                </View>
                                {client.feeling && (
                                    <Text style={styles.feelingEmoji}>{client.feeling}</Text>
                                )}
                            </View>
                            <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse', paddingHorizontal: horizontalScale(10) }}>
                                {client.lastActive && (
                                    <Text style={[styles.lastActiveText, { textAlign: isRTL ? 'right' : 'left' }]}>
                                        {t.lastActive} {client.lastActive}
                                    </Text>
                                )}

                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.messageButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onMessagePress(client.id);
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
        padding: horizontalScale(12),
        borderRadius: horizontalScale(12),
        backgroundColor: colors.bgSecondary,
        marginBottom: verticalScale(8),
    },
    skeletonAvatar: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
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
        marginBottom: verticalScale(8),
        alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    skeletonStatus: {
        width: horizontalScale(150),
        height: verticalScale(12),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    skeletonButton: {
        width: horizontalScale(60),
        height: verticalScale(28),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(8),
    },
    // Empty state styles
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(32),
        backgroundColor: '#DCFCE7',
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(32),
        marginBottom: verticalScale(8),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#166534',
        marginBottom: verticalScale(4),
    },
    emptySubtitle: {
        fontSize: ScaleFontSize(14),
        color: '#15803D',
    },
    // Error state styles
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
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: verticalScale(4),
    },
    errorSubtitle: {
        fontSize: ScaleFontSize(14),
        color: '#B91C1C',
    },
});
