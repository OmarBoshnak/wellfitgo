import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, UtensilsCrossed, CheckCircle, UserPlus, Phone } from 'lucide-react-native';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { PositionedEvent } from '../types';

interface EventCardProps {
    event: PositionedEvent;
    onPress?: (event: PositionedEvent) => void;
}

const iconMap = {
    videocam: Video,
    restaurant: UtensilsCrossed,
    check_circle: CheckCircle,
    person_add: UserPlus,
    call: Phone,
};

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const IconComponent = event.icon ? iconMap[event.icon] : null;
    const isSmallEvent = event.height < 35;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    top: event.top,
                    height: event.height,
                    left: isRTL ? undefined : `${event.left}%`,
                    right: isRTL ? `${event.left}%` : undefined,
                    width: `${event.width}%`,
                }
            ]}
            onPress={() => onPress?.(event)}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={event.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Left accent bar */}
                <View style={[
                    styles.accentBar,
                    isRTL && styles.accentBarRTL
                ]} />

                {/* Content */}
                <View style={[
                    styles.content,
                    { flexDirection: isRTL ? 'row' : 'row-reverse' }
                ]}>
                    {IconComponent && !isSmallEvent && (
                        <IconComponent
                            size={horizontalScale(12)}
                            color="#FFFFFF"
                        />
                    )}
                    <View style={styles.textContainer}>
                        <Text
                            style={[
                                styles.title,
                                isSmallEvent && styles.titleSmall
                            ]}
                            numberOfLines={1}
                        >
                            {event.title}
                        </Text>
                        {!isSmallEvent && event.clientName && (
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {event.clientName} • {event.duration}
                            </Text>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        borderRadius: horizontalScale(8),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    accentBar: {
        width: horizontalScale(3),
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderTopLeftRadius: horizontalScale(8),
        borderBottomLeftRadius: horizontalScale(8),
    },
    accentBarRTL: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: horizontalScale(8),
        borderBottomRightRadius: horizontalScale(8),
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: horizontalScale(4),
        gap: horizontalScale(4),
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    titleSmall: {
        fontSize: ScaleFontSize(9),
    },
    subtitle: {
        fontSize: ScaleFontSize(9),
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: verticalScale(2),
    },
});

export default EventCard;
