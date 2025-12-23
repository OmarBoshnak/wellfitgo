import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ArrowDown, Check } from 'lucide-react-native';
import { colors } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale } from '@/src/utils/scaling';
import { styles } from '../styles';
import { t } from '../translations';

interface WeekSummaryProps {
    currentWeight: number;
    weeklyChange: number;
    remainingWeight: number;
}

export function WeekSummary({ currentWeight, weeklyChange, remainingWeight }: WeekSummaryProps) {
    const renderWeekHeader = () => (
        <View style={[styles.weekHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Text style={styles.weekHeaderTitle}>{t.thisWeek}</Text>
            <Text style={styles.weekHeaderDate}>{t.weekDateRange}</Text>
        </View>
    );

    const renderWeekCards = () => (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekCardsContainer}
            data={[
                { id: 'meals', type: 'meals' },
                { id: 'checkin', type: 'checkin' },
                { id: 'weight', type: 'weight' },
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
                if (item.type === 'meals') {
                    return (
                        <View style={styles.weekCard}>
                            <Svg width={100} height={100} style={styles.progressRing}>
                                <Defs>
                                    <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <Stop offset="0%" stopColor="#5073FE" />
                                        <Stop offset="100%" stopColor="#02C3CD" />
                                    </SvgLinearGradient>
                                </Defs>
                                <Circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="#E1E8EF"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <Circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="url(#ringGradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray="227 264"
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                />
                            </Svg>
                            <View style={styles.ringContent}>
                                <Text style={styles.ringValue}>18/21</Text>
                                <Text style={styles.ringLabel}>{t.mealsDone}</Text>
                            </View>
                        </View>
                    );
                }
                if (item.type === 'checkin') {
                    return (
                        <View style={styles.weekCard}>
                            <View style={styles.checkIconContainer}>
                                <Check size={horizontalScale(24)} color="#FFFFFF" />
                            </View>
                            <Text style={styles.weekCardTitle}>{t.completed}</Text>
                            <Text style={styles.weekCardSubtitle}>{t.friday}</Text>
                            <Text style={styles.weekCardEmoji}>😊 {t.good}</Text>
                        </View>
                    );
                }
                return (
                    <View style={styles.weekCard}>
                        <Text style={styles.weekCardLabel}>{t.weightThisWeek}</Text>
                        <Text style={styles.weekCardWeightValue}>{currentWeight}.0 kg</Text>
                        <View style={[styles.weightChangeRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <ArrowDown size={horizontalScale(14)} color={colors.success} />
                            <Text style={styles.weightChangeText}>{Math.abs(weeklyChange)} kg</Text>
                        </View>
                        <Text style={styles.weekCardToTarget}>{remainingWeight} kg {t.toTarget}</Text>
                    </View>
                );
            }}
        />
    );

    return (
        <>
            <View style={styles.tabContent}>{renderWeekHeader()}</View>
            <View style={styles.tabContentHorizontal}>{renderWeekCards()}</View>
        </>
    );
}
