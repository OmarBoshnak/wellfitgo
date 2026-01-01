/**
 * ClientProgressView Component
 * Doctor's view to see a specific client's meal plan progress
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import { colors, gradients, shadows } from '@/src/core/constants/Themes';
import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';
import { ProgressChart } from '@/src/features/meal-plans/components/ProgressChart';
import { DayScroller } from '@/src/features/meal-plans/components/DayScroller';

// Translations
const t = {
    clientProgress: isRTL ? 'تقدم العميل' : 'Client Progress',
    active: isRTL ? 'نشط' : 'Active',
    thisWeek: isRTL ? 'هذا الأسبوع' : 'This Week',
    weekLabel: isRTL ? 'الأسبوع' : 'Week',
    ofTotal: isRTL ? 'من' : 'of',
    assigned: isRTL ? 'تم التعيين' : 'Assigned',
    planProgress: isRTL ? 'تقدم الخطة' : 'Plan Progress',
    ongoing: isRTL ? 'مستمر' : 'Ongoing',
    noActivePlan: isRTL ? 'لا توجد خطة نشطة' : 'No Active Plan',
    noActivePlanDesc: isRTL ? 'لم يتم تعيين خطة غذائية لهذا العميل' : "This client doesn't have an assigned meal plan",
    completed: isRTL ? 'مكتمل' : 'Completed',
    scheduled: isRTL ? 'مجدول' : 'Scheduled',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    reminderSent: isRTL ? 'تم إرسال التذكير بنجاح!' : 'Reminder sent successfully!',
    reminderFailed: isRTL ? 'فشل إرسال التذكير' : 'Failed to send reminder',
    modifyPlan: isRTL ? 'تعديل الخطة' : 'Modify Plan',
    messageClient: isRTL ? 'مراسلة العميل' : 'Message Client',
};

// Helper functions
const formatStartDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', options);
};

const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const formatCompletedAt = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

interface MealItem {
    id: string;
    name: string;
    nameAr: string;
    time: string;
    isCompleted: boolean;
    completedAt?: number;
    imageUrl?: string;
}

interface ClientProgressViewProps {
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    onBack: () => void;
}

// Meal Checklist Item
const MealChecklistItem: React.FC<{ meal: MealItem }> = ({ meal }) => {
    const displayName = isRTL ? meal.nameAr : meal.name;

    return (
        <View style={[styles.mealItem, isRTL && styles.mealItemRTL]}>
            <View
                style={[
                    styles.checkbox,
                    meal.isCompleted && styles.checkboxCompleted,
                ]}
            >
                {meal.isCompleted && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
            </View>

            <View style={styles.mealContent}>
                <View style={[styles.mealHeader, isRTL && styles.mealHeaderRTL]}>
                    <Text
                        style={[
                            styles.mealName,
                            meal.isCompleted && styles.mealNameCompleted,
                        ]}
                    >
                        {displayName}
                    </Text>
                    {meal.isCompleted && meal.completedAt ? (
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>
                                {t.completed} {formatCompletedAt(meal.completedAt)}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.scheduledBadge}>
                            <Text style={styles.scheduledBadgeText}>
                                {t.scheduled} {formatTime(meal.time)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {meal.imageUrl && (
                <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
            )}
        </View>
    );
};

// Main Component
export const ClientProgressView: React.FC<ClientProgressViewProps> = ({
    clientId,
    clientName,
    clientAvatar,
    onBack,
}) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Fetch client's progress using doctor query
    const planProgress = useQuery(api.plans.getClientPlanProgress, {
        clientId: clientId as Id<"users">,
        selectedDate,
    });

    const handleDaySelect = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    // Navigate to messages with this client
    const handleMessageClient = useCallback(() => {
        onBack(); // Close the progress view first
        router.push({
            pathname: '/(app)/doctor/(tabs)/messages',
            params: { openChatWithClient: clientId },
        });
    }, [clientId, onBack, router]);

    // Send reminder notification to client
    const sendClientReminder = useMutation(api.clients.sendClientReminder);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    const handleSendReminder = useCallback(async () => {
        if (isSendingReminder) return;

        setIsSendingReminder(true);
        try {
            await sendClientReminder({
                clientId: clientId as Id<"users">,
                reminderType: 'general',
            });
            // Show success feedback
            Alert.alert(
                isRTL ? 'تم الإرسال' : 'Sent!',
                t.reminderSent
            );
        } catch (error) {
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                t.reminderFailed
            );
        } finally {
            setIsSendingReminder(false);
        }
    }, [clientId, isSendingReminder, sendClientReminder]);

    // Get selected day label
    const selectedDayLabel = useMemo(() => {
        if (!planProgress?.days) return isRTL ? 'اليوم' : 'Today';
        const day = planProgress.days.find((d) => d.date === selectedDate);
        if (!day) return isRTL ? 'اليوم' : 'Today';
        if (day.isToday) return isRTL ? 'اليوم' : 'Today';
        return isRTL ? day.labelAr : day.label;
    }, [planProgress?.days, selectedDate]);

    // Loading state
    if (planProgress === undefined) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
                <Text style={styles.loadingText}>{t.loading}</Text>
            </SafeAreaView>
        );
    }

    // Empty state
    if (planProgress === null) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <View style={[styles.header, isRTL && styles.headerRTL]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons
                            name={isRTL ? 'arrow-back' : 'arrow-forward'}
                            size={24}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{clientName}</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyContent}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>{t.noActivePlan}</Text>
                    <Text style={styles.emptyDesc}>{t.noActivePlanDesc}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { plan, weeklyStats, days, meals } = planProgress;

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* Header */}
            <View style={[styles.header, isRTL && styles.headerRTL, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons
                        name={isRTL ? 'arrow-back' : 'arrow-forward'}
                        size={24}
                        color={colors.textPrimary}
                    />
                </TouchableOpacity>
                <View style={[styles.headerClient, isRTL && styles.headerClientRTL]}>
                    {clientAvatar ? (
                        <Image source={{ uri: clientAvatar }} style={styles.clientAvatar} />
                    ) : (
                        <View style={[styles.clientAvatar, styles.clientAvatarFallback]}>
                            <Text style={styles.clientAvatarText}>
                                {clientName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.headerTitle}>{clientName}</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <FlatList
                data={meals}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <>
                        {/* Plan Summary Card */}
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.summaryCard, shadows.medium]}
                        >
                            <View style={styles.decorBlob1} />
                            <View style={styles.decorBlob2} />

                            <View style={[styles.summaryContent, isRTL && styles.summaryContentRTL]}>
                                <View style={styles.summaryInfo}>
                                    <View style={styles.activeBadge}>
                                        <View style={styles.activeDot} />
                                        <Text style={styles.activeBadgeText}>{t.active}</Text>
                                    </View>

                                    <Text style={styles.planName}>
                                        {plan.emoji} {isRTL ? plan.nameAr : plan.name}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.metaText}>
                                            {t.assigned} {formatStartDate(plan.assignedDate || plan.startDate)}
                                        </Text>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.metaText}>
                                            {t.weekLabel} {plan.currentWeek} {t.ofTotal} {plan.totalWeeks} {isRTL ? 'أسابيع' : 'weeks'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.summaryIcon}>
                                    <Ionicons name="restaurant-outline" size={24} color={colors.white} />
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Plan Progress Card */}
                        <View style={[styles.card, shadows.light]}>
                            <View style={[styles.cardHeader, isRTL && styles.cardHeaderRTL]}>
                                <Text style={styles.cardTitle}>{t.planProgress}</Text>
                            </View>

                            <View style={styles.chartContainer}>
                                <ProgressChart
                                    completed={weeklyStats.completedMeals}
                                    total={weeklyStats.totalMeals}
                                />
                            </View>

                            <DayScroller
                                days={days.map((d) => ({
                                    ...d,
                                    dayNum: new Date(d.date).getDate(),
                                }))}
                                selectedDate={selectedDate}
                                onDaySelect={handleDaySelect}
                            />
                        </View>

                        {/* Daily Meals Header */}
                        <View style={[styles.checklistHeader, isRTL && styles.checklistHeaderRTL]}>
                            <Text style={styles.checklistTitle}>{selectedDayLabel}</Text>
                        </View>
                    </>
                )}
                renderItem={({ item }) => <MealChecklistItem meal={item} />}
                ListEmptyComponent={() => (
                    <View style={styles.emptyMeals}>
                        <Text style={styles.emptyMealsText}>
                            {isRTL ? 'لا توجد وجبات لهذا اليوم' : 'No meals for this day'}
                        </Text>
                    </View>
                )}
                ListFooterComponent={() => <View style={{ height: verticalScale(100) }} />}
            />

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleMessageClient}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.actionButtonText}>{t.messageClient}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButtonPrimary, isSendingReminder && { opacity: 0.6 }]}
                    onPress={handleSendReminder}
                    disabled={isSendingReminder}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionButtonGradient}
                    >
                        <Ionicons name="notifications" size={16} color={colors.white} />
                        <Text style={styles.actionButtonTextPrimary}>
                            {isSendingReminder ? (isRTL ? 'جاري...' : 'Sending...') : t.sendReminder}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(16),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    emptyContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: horizontalScale(32),
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    emptyDesc: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgSecondary,
    },
    headerRTL: {
        flexDirection: 'row-reverse',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerClient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(10),
    },
    headerClientRTL: {
        flexDirection: 'row',
    },
    clientAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    clientAvatarFallback: {
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clientAvatarText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.white,
    },
    headerTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        gap: verticalScale(16),
    },
    summaryCard: {
        borderRadius: 20,
        padding: horizontalScale(20),
        overflow: 'hidden',
        position: 'relative',
    },
    decorBlob1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorBlob2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(2,195,205,0.2)',
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryContentRTL: {
        flexDirection: 'row',
    },
    summaryInfo: {
        flex: 1,
        gap: verticalScale(8),
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    activeBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.white,
    },
    planName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.white,
        marginVertical: verticalScale(8),
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: ScaleFontSize(13),
        color: 'rgba(255,255,255,0.9)',
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: horizontalScale(16),
        marginVertical: verticalScale(16),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(16),
    },
    cardHeaderRTL: {
        flexDirection: 'row',
    },
    cardTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textSecondary,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(24),
    },
    checklistHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    checklistHeaderRTL: {
        flexDirection: 'row',
    },
    checklistTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: 12,
        padding: horizontalScale(16),
        gap: horizontalScale(12),
        marginBottom: verticalScale(8),
    },
    mealItemRTL: {
        flexDirection: 'row',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxCompleted: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    mealContent: {
        flex: 1,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: horizontalScale(8),
    },
    mealHeaderRTL: {
        flexDirection: 'row',
    },
    mealName: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    mealNameCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    completedBadge: {
        backgroundColor: `${colors.success}15`,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    completedBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.success,
    },
    scheduledBadge: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    scheduledBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    mealImage: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: colors.bgSecondary,
    },
    emptyMeals: {
        padding: verticalScale(32),
        alignItems: 'center',
    },
    emptyMealsText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: `${colors.bgPrimary}F5`,
        paddingTop: verticalScale(16),
        paddingHorizontal: horizontalScale(16),
        gap: horizontalScale(8),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: horizontalScale(6),
    },
    actionButtonText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    actionButtonPrimary: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(6),
    },
    actionButtonTextPrimary: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: colors.white,
    },
});

export default ClientProgressView;
