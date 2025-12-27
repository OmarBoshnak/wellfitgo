import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, Building2, Phone, Clock, ArrowRight, MoreVertical } from 'lucide-react-native';
import { colors } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { dayViewTranslations as t, formatHour } from '../translations';
import { DayEvent } from '../types';

interface DayEventCardProps {
    event: DayEvent;
    hour: number;
    onPress?: () => void;
    onActionPress?: () => void;
    onPhoneCallPress?: () => void; // Phone call handler
    onEditPress?: () => void; // 3-dot menu press
    onAvatarPress?: () => void; // Avatar tap for profile modal
}

const colorSchemes = {
    blue: {
        gradient: ['#4d6efe', '#6b85ff'] as [string, string],
        badgeBg: 'rgba(77, 110, 254, 0.1)',
        badgeText: '#4d6efe',
        borderColor: 'rgba(77, 110, 254, 0.2)',
        actionBg: '#4d6efe',
        actionText: '#FFFFFF',
    },
    purple: {
        gradient: ['#8b5cf6', '#ec4899'] as [string, string],
        badgeBg: 'rgba(139, 92, 246, 0.1)',
        badgeText: '#8b5cf6',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        actionBg: colors.bgSecondary,
        actionText: colors.textPrimary,
    },
    green: {
        gradient: ['#22c55e', '#14b8a6'] as [string, string],
        badgeBg: 'rgba(34, 197, 94, 0.1)',
        badgeText: '#22c55e',
        borderColor: 'rgba(34, 197, 94, 0.2)',
        actionBg: '#22c55e',
        actionText: '#FFFFFF',
    },
};

const icons = {
    phone: Phone,
};

export const DayEventCard: React.FC<DayEventCardProps> = ({
    event,
    hour,
    onPress,
    onActionPress,
    onPhoneCallPress,
    onEditPress,
    onAvatarPress,
}) => {
    const scheme = colorSchemes[event.colorScheme];
    const IconComponent = icons.phone;
    const hourLabel = formatHour(hour);

    return (
        <View style={[styles.container, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            {/* Time Label */}
            <View style={styles.timeColumn}>
                <Text style={[
                    styles.timeText,
                    styles.timeTextBold,
                    { textAlign: 'center' }
                ]}>
                    {hourLabel}
                </Text>
            </View>

            {/* Event Card */}
            <View style={[
                styles.cardWrapper,
                isRTL ? styles.cardWrapperRTL : styles.cardWrapperLTR,
                { borderColor: scheme.borderColor }
            ]}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={onPress}
                    activeOpacity={0.9}
                >
                    {/* Header: Time Badge, Duration & More Menu */}
                    <View style={[
                        styles.cardHeader,
                        { flexDirection: isRTL ? 'row' : 'row-reverse' }
                    ]}>
                        <View style={[styles.timeBadge, { backgroundColor: scheme.badgeBg }]}>
                            <Text style={[styles.timeBadgeText, { color: scheme.badgeText }]}>
                                {event.startTime}
                            </Text>
                        </View>
                        <View style={[
                            styles.headerRight,
                            { flexDirection: isRTL ? 'row' : 'row-reverse' }
                        ]}>
                            <View style={[
                                styles.duration,
                                { flexDirection: isRTL ? 'row' : 'row-reverse' }
                            ]}>
                                <Clock size={horizontalScale(14)} color={colors.textSecondary} />
                                <Text style={styles.durationText}>{event.duration}</Text>
                            </View>
                            {onEditPress && (
                                <TouchableOpacity
                                    style={styles.moreButton}
                                    onPress={onEditPress}
                                >
                                    <MoreVertical size={horizontalScale(18)} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Body: Icon & Title */}
                    <View style={[
                        styles.cardBody,
                        { flexDirection: isRTL ? 'row' : 'row-reverse' }
                    ]}>
                        <LinearGradient
                            colors={scheme.gradient}
                            style={styles.iconCircle}
                        >
                            <IconComponent size={horizontalScale(20)} color="#FFFFFF" />
                        </LinearGradient>
                        <View style={[
                            styles.textContainer,
                            { alignItems: isRTL ? 'flex-start' : 'flex-end' }
                        ]}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                        </View>
                    </View>

                    {/* Footer: Client & Action */}
                    <View style={[
                        styles.cardFooter,
                        { flexDirection: isRTL ? 'row' : 'row-reverse' }
                    ]}>
                        <View style={[
                            styles.clientInfo,
                            { flexDirection: isRTL ? 'row' : 'row-reverse' }
                        ]}>
                            <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
                                {event.clientAvatar ? (
                                    <Image
                                        source={{ uri: event.clientAvatar }}
                                        style={styles.clientAvatar}
                                    />
                                ) : (
                                    <View style={styles.clientInitialsContainer}>
                                        <Text style={styles.clientInitials}>
                                            {event.clientInitials}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.clientName}>{event.clientName}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: scheme.actionBg,
                                    flexDirection: isRTL ? 'row' : 'row-reverse'
                                }
                            ]}
                            onPress={event.type === 'phone' ? onPhoneCallPress : onActionPress}
                        >
                            <Text style={[
                                styles.actionButtonText,
                                { color: scheme.actionText }
                            ]}>
                                {event.actionLabel}
                            </Text>
                            {event.type === 'phone' && (
                                <Phone size={horizontalScale(14)} color={scheme.actionText} />
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: verticalScale(12),
    },
    timeColumn: {
        width: horizontalScale(60),
        paddingTop: verticalScale(8),
    },
    timeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    timeTextBold: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    cardWrapper: {
        flex: 1,
        paddingHorizontal: horizontalScale(8),
    },
    cardWrapperLTR: {
        borderLeftWidth: 2,
    },
    cardWrapperRTL: {
        borderRightWidth: 2,
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    timeBadge: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(6),
    },
    timeBadgeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
    },
    duration: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    durationText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    headerRight: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    moreButton: {
        padding: horizontalScale(4),
    },
    cardBody: {
        alignItems: 'center',
        gap: horizontalScale(12),
        marginBottom: verticalScale(16),
    },
    iconCircle: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4d6efe',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    textContainer: {
        flex: 1,
    },
    eventTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    eventSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    cardFooter: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: verticalScale(12),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    clientInfo: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    clientAvatar: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: colors.border,
    },
    clientInitialsContainer: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(16),
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FDBA74',
    },
    clientInitials: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: '#EA580C',
    },
    clientName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    actionButton: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        gap: horizontalScale(6),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
    },
});

export default DayEventCard;
