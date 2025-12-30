import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    I18nManager,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, gradients, shadows } from '@/src/core/constants/Themes';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/core/utils/scaling';
import { useAppSelector } from '@/src/store/hooks';
import {
    selectCurrentWeight,
    selectPreviousWeight,
    selectWeightChange,
    selectWeeklyData,
    selectProgress,
} from '@/src/store/userSlice';
import { selectMeals } from '@/src/store/mealsSlice';
import { selectWaterIntake, selectWaterGoal } from '@/src/store/waterSlice';
import { homeTranslations, isRTL } from '@/src/core/constants/translations';
import { WeightCheckin } from '@/src/features/tracking/components/WeightCheckin';
import { WaterTracker } from '@/src/features/tracking/components/WaterTracker';
import { useState } from 'react';

const { width } = Dimensions.get('window');

// Force RTL layout for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const HomeScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [showCheckin, setShowCheckin] = useState(false);
    const [showWaterTracker, setShowWaterTracker] = useState(false);

    // Get user data from Convex (for avatar)
    const convexUser = useQuery(api.users.currentUser);

    // Get user data from Redux store
    const user = useAppSelector((state) => state.user);
    const userName = convexUser?.firstName || user.firstName || homeTranslations.defaultName;
    const userAvatar = convexUser?.avatarUrl;

    // Water tracking data
    const waterIntake = useAppSelector(selectWaterIntake);
    const waterGoal = useAppSelector(selectWaterGoal);

    // Use selectors for dynamic data
    const currentWeight = useAppSelector(selectCurrentWeight);
    const previousWeight = useAppSelector(selectPreviousWeight);
    const weightChange = useAppSelector(selectWeightChange);
    const weeklyData = useAppSelector(selectWeeklyData);
    const progressPercent = useAppSelector(selectProgress);

    const targetWeight = user.targetWeight ? parseFloat(user.targetWeight) : 65;

    // Get greeting based on time
    const currentHour = new Date().getHours();
    const greeting =
        currentHour < 12
            ? homeTranslations.goodMorning
            : currentHour < 18
                ? homeTranslations.goodAfternoon
                : homeTranslations.goodEvening;

    // Get meals from Redux store (synced with meals screen)
    const mealsData = useAppSelector(selectMeals);
    const meals = mealsData.map(meal => ({
        emoji: meal.emoji,
        name: isRTL ? meal.nameAr : meal.name,
        time: meal.time,
        completed: meal.completed,
    }));

    const onStartCheckin = () => {
        setShowCheckin(true);
    };

    const onNavigate = (screen: string) => {
        if (screen === 'chat') {
            router.push('/(app)/(tabs)/chat');
        } else if (screen === 'meals') {
            router.push('/(app)/(tabs)/meals');
        }
    };

    // Progress Ring Component
    const ProgressRing = ({ progress, size = 80 }: { progress: number; size?: number }) => {
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={colors.border}
                        strokeWidth={strokeWidth}
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={colors.primaryDark}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={styles.progressTextContainer}>
                    <Text style={styles.progressText}>{progress}%</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>

            <View style={[styles.container]}>
                {/* Header */}
                <View style={[styles.header, isRTL && styles.headerRTL, { paddingTop: insets.top }]}>
                    {userAvatar ? (
                        <Image
                            source={{ uri: userAvatar }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarButton}
                        >
                            <Text style={styles.avatarText}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                    )}
                    <View>
                        <Text style={styles.greeting}>
                            {greeting} , {userName} 👋
                        </Text>
                    </View>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Card 1: Weekly Weight Progress */}
                    <View style={[styles.card, shadows.light]}>
                        <Text style={[styles.cardTitle, isRTL && styles.textRTL]}>
                            {homeTranslations.thisWeeksProgress}
                        </Text>

                        <View style={[styles.weightContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View>
                                <Text style={[styles.weightValue, isRTL && styles.textRTL]}>
                                    {currentWeight.toFixed(1)} <Text style={styles.weightUnit}>kg</Text>
                                </Text>
                                <View style={styles.weightChangeRow}>
                                    <Text style={[styles.weightChange, { color: user.goal === 'gain' ? (weightChange < 0 ? colors.success : colors.error) : (weightChange >= 0 ? colors.success : colors.error) }]}>
                                        {`${weightChange >= 0 ? '↓' : '↑'} ${Math.abs(weightChange).toFixed(1)} ${homeTranslations.kgFromLastWeek}`}
                                    </Text>
                                    <Ionicons
                                        name={weightChange >= 0 ? "trending-down" : "trending-up"}
                                        size={16}
                                        color={user.goal === 'gain' ? (weightChange < 0 ? colors.success : colors.error) : (weightChange >= 0 ? colors.success : colors.error)}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity onPress={onStartCheckin} activeOpacity={0.8}>
                                <ProgressRing progress={progressPercent > 0 ? progressPercent : 0} />
                            </TouchableOpacity>
                        </View>

                        {/* Mini Chart - Dynamic based on weightHistory length */}
                        <View style={[styles.chartContainer, { flexDirection: isRTL === I18nManager.isRTL ? 'row' : 'row-reverse' }]}>
                            {weeklyData.map((weight, i) => {
                                // Calculate progressive height: W1 (smallest) -> W6 (tallest) for RTL visual
                                const dataLength = weeklyData.length;
                                const progressiveHeight = dataLength === 1
                                    ? 100 // Single bar at full height
                                    : isRTL
                                        ? 20 + ((i / (dataLength - 1)) * 80) // 20% to 100%
                                        : 20 + (((dataLength - 1 - i) / (dataLength - 1)) * 80);

                                return (
                                    <View key={i} style={styles.chartColumn}>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                {
                                                    height: `${progressiveHeight}%`,
                                                    backgroundColor:
                                                        isRTL
                                                            ? (i === 0 ? colors.primaryDark : colors.secondary)
                                                            : (i === dataLength - 1 ? colors.primaryDark : colors.secondary),
                                                },
                                            ]}
                                        />
                                        <Text style={styles.chartLabel}>W{i + 1}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* CTA Button */}
                        <TouchableOpacity onPress={onStartCheckin} activeOpacity={0.9}>
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.ctaButton, shadows.medium]}
                            >
                                <Text style={styles.ctaButtonText}>
                                    {homeTranslations.logWeeklyWeight}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Card 4: Quick Actions */}
                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity
                            style={[styles.quickActionCard, shadows.light]}
                            onPress={() => setShowWaterTracker(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="water" size={24} color={colors.info} />
                            <Text style={styles.quickActionText}>
                                {homeTranslations.waterTracker}
                            </Text>
                            <Text style={styles.waterProgress}>
                                {waterIntake}/{waterGoal} {isRTL ? 'كوب' : 'cups'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Card 3: Today's Meals */}
                    <TouchableOpacity
                        style={[styles.card, shadows.light]}
                        onPress={() => onNavigate('meals')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.cardTitle}>
                                {homeTranslations.todaysPlan}
                            </Text>
                            <Text style={styles.viewAllText}>
                                {homeTranslations.viewAll}
                            </Text>
                        </View>

                        <View style={styles.mealsList}>
                            {meals.map((meal, i) => (
                                <View key={i} style={[styles.mealItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>

                                    <Text style={[styles.mealName, isRTL && styles.textRTL]}>{meal.name}
                                        {'  '}<Text style={styles.mealEmoji}>{meal.emoji}</Text>
                                    </Text>

                                    {meal.completed ? (
                                        <View style={styles.checkmarkCompleted}>
                                            <Ionicons name="checkmark" size={14} color={colors.white} />
                                        </View>
                                    ) : (
                                        <View style={styles.checkmarkEmpty} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </TouchableOpacity>

                    <WeightCheckin
                        visible={showCheckin}
                        onClose={() => setShowCheckin(false)}
                        onComplete={() => setShowCheckin(false)}
                        isRTL={isRTL}
                    />
                    <WaterTracker
                        visible={showWaterTracker}
                        onClose={() => setShowWaterTracker(false)}
                        isRTL={isRTL}
                    />
                </ScrollView>
            </View >
        </SafeAreaView >

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        ...shadows.light,
    },
    headerRTL: {
        flexDirection: 'row-reverse',
    },
    greeting: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    avatarButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.medium,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        ...shadows.medium,
    },
    textRTL: {
        textAlign: 'left',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(24),
        gap: 12,
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: 16,
    },
    cardTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    viewAllText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    weightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    weightValue: {
        fontSize: ScaleFontSize(48),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    weightUnit: {
        fontSize: ScaleFontSize(20),
        color: colors.textSecondary,
    },
    weightChangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    weightChange: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
    },
    progressTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 50,
        gap: 8,
        marginVertical: 16,
    },
    chartColumn: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    chartBar: {
        width: '100%',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    chartLabel: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    ctaButton: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.white,
    },
    focusCard: {
        alignItems: 'center',
        gap: 12,
    },
    focusEmoji: {
        fontSize: 24,
    },
    focusContent: {
        flex: 1,
    },
    focusTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    focusSubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    mealsList: {
        gap: 10,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    mealEmoji: {
        fontSize: 15,
    },
    mealName: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    checkmarkCompleted: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkEmpty: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 88,
        gap: 8,
    },
    quickActionText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        textAlign: 'center',
    },
    waterProgress: {
        fontSize: ScaleFontSize(12),
        color: colors.info,
        fontWeight: '600',
        marginTop: 2,
    },
    messageBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLightBg,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    messageBannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBannerContent: {
        flex: 1,
    },
    messageBannerText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    messageBannerAction: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
});

export default HomeScreen;
