import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ArrowDown, ArrowUp, Check, AlertCircle } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { styles } from '../styles';
import { t } from '../translations';

// ============ TYPES ============

export interface WeeklyStats {
    mealsCompleted: number;
    mealsTotal: number;
    hasWeightLog: boolean;
    lastWeightLogDate?: string | null;
    lastWeightLogFeeling?: string | null;
}

interface WeekSummaryProps {
    currentWeight: number;
    weeklyChange: number;
    remainingWeight: number;
    weeklyStats?: WeeklyStats | null;
    isLoading?: boolean;
}

// ============ FEELING EMOJIS ============

const feelingEmojis: Record<string, string> = {
    excellent: "🤩",
    great: "😃",
    good: "😊",
    ok: "😐",
    challenging: "😓",
    very_hard: "😢",
};

// ============ COMPONENT ============

export function WeekSummary({
    currentWeight,
    weeklyChange,
    remainingWeight,
    weeklyStats,
    isLoading = false,
}: WeekSummaryProps) {
    // Calculate meal completion percentage
    const mealsCompleted = weeklyStats?.mealsCompleted ?? 0;
    const mealsTotal = weeklyStats?.mealsTotal ?? 21; // 3 meals * 7 days
    const mealProgress = mealsTotal > 0 ? (mealsCompleted / mealsTotal) : 0;
    const strokeDasharray = `${Math.round(mealProgress * 264)} 264`;

    // Format check-in day
    const getCheckInDay = (): string => {
        if (!weeklyStats?.lastWeightLogDate) {
            return isRTL ? "لم يسجل" : "Not yet";
        }
        const date = new Date(weeklyStats.lastWeightLogDate);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayIndex = date.getDay();
        return isRTL ? daysAr[dayIndex] : days[dayIndex];
    };

    const feeling = weeklyStats?.lastWeightLogFeeling;
    const feelingEmoji = feeling ? feelingEmojis[feeling] ?? "😊" : "🎯";
    const feelingText = feeling ? feeling.replace("_", " ") : (isRTL ? "في انتظار" : "Waiting");

    // ============ CALCULATE WEEK DATE RANGE ============
    const getWeekDateRange = (): string => {
        const now = new Date();
        const dayOfWeek = now.getDay();

        // Calculate Monday (start of week)
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        // Calculate Sunday (end of week)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        // Format dates
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const startDay = monday.getDate();
        const endDay = sunday.getDate();
        const startMonth = monday.getMonth();
        const endMonth = sunday.getMonth();

        if (isRTL) {
            // Arabic format: "23 ديسمبر - 29 ديسمبر"
            if (startMonth === endMonth) {
                return `${startDay} - ${endDay} ${monthsAr[startMonth]}`;
            }
            return `${startDay} ${monthsAr[startMonth]} - ${endDay} ${monthsAr[endMonth]}`;
        } else {
            // English format: "Dec 23 - Dec 29"
            if (startMonth === endMonth) {
                return `${months[startMonth]} ${startDay} - ${endDay}`;
            }
            return `${months[startMonth]} ${startDay} - ${months[endMonth]} ${endDay}`;
        }
    };

    const renderWeekHeader = () => (
        <View style={[styles.weekHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Text style={styles.weekHeaderTitle}>{t.thisWeek}</Text>
            <Text style={styles.weekHeaderDate}>{getWeekDateRange()}</Text>
        </View>
    );

    const renderWeekCards = () => {
        if (isLoading) {
            return (
                <View style={[styles.weekCardsContainer, { justifyContent: 'center', alignItems: 'center', height: verticalScale(140) }]}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                </View>
            );
        }

        return (
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
                                        strokeDasharray={strokeDasharray}
                                        strokeLinecap="round"
                                        transform="rotate(-90 50 50)"
                                    />
                                </Svg>
                                <View style={styles.ringContent}>
                                    <Text style={styles.ringValue}>{mealsCompleted}/{mealsTotal}</Text>
                                    <Text style={styles.ringLabel}>{t.mealsDone}</Text>
                                </View>
                            </View>
                        );
                    }
                    if (item.type === 'checkin') {
                        const hasCheckedIn = weeklyStats?.hasWeightLog;
                        return (
                            <View style={styles.weekCard}>
                                <View style={[
                                    styles.checkIconContainer,
                                    !hasCheckedIn && { backgroundColor: colors.warning }
                                ]}>
                                    {hasCheckedIn ? (
                                        <Check size={horizontalScale(24)} color="#FFFFFF" />
                                    ) : (
                                        <AlertCircle size={horizontalScale(24)} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={styles.weekCardTitle}>
                                    {hasCheckedIn ? t.completed : (isRTL ? "في الانتظار" : "Pending")}
                                </Text>
                                <Text style={styles.weekCardSubtitle}>{getCheckInDay()}</Text>
                                <Text style={styles.weekCardEmoji}>{feelingEmoji} {feelingText}</Text>
                            </View>
                        );
                    }
                    // Weight card
                    const isGain = weeklyChange > 0;
                    return (
                        <View style={styles.weekCard}>
                            <Text style={styles.weekCardLabel}>{t.weightThisWeek}</Text>
                            <Text style={styles.weekCardWeightValue}>{currentWeight.toFixed(1)} kg</Text>
                            <View style={[styles.weightChangeRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                {isGain ? (
                                    <ArrowUp size={horizontalScale(14)} color={colors.error} />
                                ) : (
                                    <ArrowDown size={horizontalScale(14)} color={colors.success} />
                                )}
                                <Text style={[
                                    styles.weightChangeText,
                                    isGain && { color: colors.error }
                                ]}>
                                    {Math.abs(weeklyChange).toFixed(1)} kg
                                </Text>
                            </View>
                            <Text style={styles.weekCardToTarget}>{remainingWeight.toFixed(1)} kg {t.toTarget}</Text>
                        </View>
                    );
                }}
            />
        );
    };

    return (
        <>
            <View style={styles.tabContent}>{renderWeekHeader()}</View>
            <View style={styles.tabContentHorizontal}>{renderWeekCards()}</View>
        </>
    );
}
