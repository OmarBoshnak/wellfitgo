/**
 * ClientCard Component
 * Gradient card displaying client info for meal plan screens
 */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanGradients, borderRadius } from '../constants';
import { t } from '../translations';
import type { ClientInfo } from '../types';

interface ClientCardProps {
    client: ClientInfo;
}

export function ClientCard({ client }: ClientCardProps) {
    const name = isRTL ? client.nameAr : client.name;
    const goalText = client.goal === 'weight_loss'
        ? t.weightLoss
        : client.goal === 'maintain'
            ? (isRTL ? 'الحفاظ على الوزن' : 'Maintain Weight')
            : (isRTL ? 'زيادة العضلات' : 'Gain Muscle');

    return (
        <LinearGradient
            colors={[...mealPlanGradients.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={[styles.content, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.avatarContainer}>
                    {client.avatarUrl ? (
                        <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={[styles.name, { textAlign: isRTL ? 'left' : 'right' }]}>{name}</Text>
                    <Text style={[styles.weight, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {client.currentWeight}kg → {t.target} {client.targetWeight}kg
                    </Text>
                    <Text style={[styles.goal, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {t.goal} {goalText}
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        padding: horizontalScale(16),
        shadowColor: mealPlanGradients.card[0],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    contentRTL: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    info: {
        flex: 1,
        gap: verticalScale(2),
    },
    name: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    weight: {
        fontSize: ScaleFontSize(12),
        color: 'rgba(255, 255, 255, 0.8)',
        marginVertical: 4
    },
    goal: {
        fontSize: ScaleFontSize(12),
        color: 'rgba(255, 255, 255, 0.8)',
    },
    textRTL: {
        textAlign: 'right',
    },
});
