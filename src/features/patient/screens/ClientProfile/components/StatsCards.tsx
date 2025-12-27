import React from 'react';
import { View, Text } from 'react-native';
import { isRTL } from '@/src/core/constants/translations';
import { styles } from '../styles';
import { t } from '../translations';

interface StatsCardsProps {
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    startDate: string;
    weightDiff: number;
    remainingWeight: number;
}

export function StatsCards({
    startWeight,
    currentWeight,
    targetWeight,
    startDate,
    weightDiff,
    remainingWeight,
}: StatsCardsProps) {
    return (
        <View style={styles.statsCardsContainer}>
            <View style={[styles.statsCards, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t.start}</Text>
                    <Text style={styles.statValue}>{startWeight}kg</Text>
                    <Text style={styles.statSubtext}>{startDate}</Text>
                </View>
                <View style={[styles.statCard, styles.statCardHighlight]}>
                    <Text style={styles.statLabel}>{t.current}</Text>
                    <Text style={styles.statValueGradient}>{currentWeight}kg</Text>
                    <Text style={styles.statChange}>↓ {weightDiff}kg</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t.target}</Text>
                    <Text style={styles.statValue}>{targetWeight}kg</Text>
                    <Text style={styles.statSubtext}>{remainingWeight}kg {t.toGo}</Text>
                </View>
            </View>
        </View>
    );
}
