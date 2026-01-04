import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Eye, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { t } from '../translations';
import { DietPlanSelector } from './DietPlanSelector';
import DietDetailsView from '@/src/features/meals/components/DietDetailsView';

// ============ TYPES ============

interface MealPlan {
    id: Id<"weeklyMealPlans">;
    dietPlanId?: Id<"dietPlans">; // Reference to the assigned diet plan
    weekStartDate: string;
    weekEndDate: string;
    status: "draft" | "published" | "active" | "completed" | "archived";
    notes?: string;
    mealsCompleted: number;
    mealsTotal: number;
    createdAt: number;
}

interface MealPlanTabProps {
    clientId: Id<"users">;
    clientName?: string;
}

// ============ HELPERS ============

const formatWeekRange = (start: string, end: string): { en: string; ar: string } => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();

    if (startMonth === endMonth) {
        return {
            en: `${months[startMonth]} ${startDay} - ${endDay}`,
            ar: `${startDay} - ${endDay} ${monthsAr[startMonth]}`,
        };
    }
    return {
        en: `${months[startMonth]} ${startDay} - ${months[endMonth]} ${endDay}`,
        ar: `${startDay} ${monthsAr[startMonth]} - ${endDay} ${monthsAr[endMonth]}`,
    };
};

const getStatusBadge = (status: MealPlan['status']) => {
    const configs: Record<MealPlan['status'], { label: string; color: string; bg: string }> = {
        active: { label: t.active, color: '#16A34A', bg: '#DCFCE7' },
        published: { label: t.published, color: '#2563EB', bg: '#DBEAFE' },
        completed: { label: t.completed, color: '#7C3AED', bg: '#EDE9FE' },
        draft: { label: t.draft, color: '#6B7280', bg: '#F3F4F6' },
        archived: { label: t.archived, color: '#9CA3AF', bg: '#F9FAFB' },
    };
    return configs[status];
};

// ============ COMPONENT ============

export function MealPlanTab({ clientId, clientName }: MealPlanTabProps) {
    const router = useRouter();
    const plans = useQuery(api.clientProfile.getClientMealPlans, { clientId });
    const deletePlanMutation = useMutation(api.clientProfile.deleteMealPlan);

    // ============ STATE ============
    const [showDietSelector, setShowDietSelector] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<Id<"weeklyMealPlans"> | null>(null);
    const [viewingDietId, setViewingDietId] = useState<Id<"dietPlans"> | null>(null);

    // ============ HANDLERS ============

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        // Convex queries are reactive, so we just need a brief timeout
        // to show the refresh indicator before it auto-updates
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleDelete = (planId: Id<"weeklyMealPlans">) => {
        const deleteTitle = isRTL ? 'حذف الخطة' : 'Delete Plan';
        const deleteMessage = isRTL ? 'هل أنت متأكد من حذف هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this plan? This action cannot be undone.';
        const deleteBtn = isRTL ? 'حذف' : 'Delete';

        Alert.alert(
            deleteTitle,
            deleteMessage,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: deleteBtn,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePlanMutation({ planId });
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert(isRTL ? 'خطأ' : 'Error', String(error));
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = (planId: Id<"weeklyMealPlans">) => {
        setEditingPlanId(planId);
        setShowDietSelector(true);
    };

    const handleViewPlan = (dietPlanId: Id<"dietPlans"> | undefined) => {
        if (dietPlanId) {
            setViewingDietId(dietPlanId);
        } else {
            Alert.alert(
                isRTL ? 'لا توجد خطة' : 'No Diet Plan',
                isRTL ? 'لم يتم تعيين خطة غذائية لهذه الفترة' : 'No diet plan assigned to this period'
            );
        }
    };

    const handleCreatePlan = () => {
        // Open diet plan selector modal for new plan
        setEditingPlanId(null);
        setShowDietSelector(true);
    };

    const handleDietSelectorClose = () => {
        setShowDietSelector(false);
        setEditingPlanId(null);
    };

    const handleDietSelectorSuccess = () => {
        // Convex reactivity will auto-refresh the plans list
        // Modal closes automatically in DietPlanSelector
        setEditingPlanId(null);
    };

    const renderPlanCard = ({ item }: { item: MealPlan }) => {
        const weekRange = formatWeekRange(item.weekStartDate, item.weekEndDate);
        const badge = getStatusBadge(item.status);
        const progress = item.mealsTotal > 0 ? (item.mealsCompleted / item.mealsTotal) * 100 : 0;

        return (
            <View style={styles.planCard}>
                {/* Header */}
                <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.dateRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Calendar size={16} color={colors.primaryDark} />
                        <Text style={styles.weekRange}>
                            {isRTL ? weekRange.ar : weekRange.en}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusText, { color: badge.color }]}>
                            {badge.label}
                        </Text>
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                    <View style={[styles.progressRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.progressLabel}>{t.mealsProgress}</Text>
                        <Text style={styles.progressValue}>
                            {item.mealsCompleted}/{item.mealsTotal}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${progress}%` }]}
                        />
                    </View>
                </View>

                {/* Actions */}
                <View style={[styles.cardActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewPlan(item.dietPlanId)}
                    >
                        <Eye size={16} color={colors.primaryDark} />
                        <Text style={styles.actionText}>{t.viewPlan}</Text>
                    </TouchableOpacity>
                    {item.status !== 'archived' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEdit(item.id)}
                        >
                            <Pencil size={16} color="#F59E0B" />
                            <Text style={[styles.actionText, { color: '#F59E0B' }]}>
                                {isRTL ? 'تعديل' : 'Edit'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Trash2 size={16} color="#EF4444" />
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>
                            {isRTL ? 'حذف' : 'Delete'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Loading
    if (plans === undefined) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
        );
    }

    // Empty state
    if (plans.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>{t.noMealPlans}</Text>
                <TouchableOpacity onPress={handleCreatePlan}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.createButton}
                    >
                        <Plus size={20} color="#FFFFFF" />
                        <Text style={styles.createButtonText}>{t.createFirstPlan}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Diet Plan Selector Modal */}
                <DietPlanSelector
                    visible={showDietSelector}
                    clientId={clientId}
                    clientName={clientName}
                    onClose={handleDietSelectorClose}
                    onSuccess={handleDietSelectorSuccess}
                    editMode={!!editingPlanId}
                    editPlanId={editingPlanId ?? undefined}
                />
            </View>
        );
    }

    // Header component with "Add New Plan" button
    const ListHeader = () => (
        <TouchableOpacity onPress={handleCreatePlan} style={styles.addPlanButton}>
            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addPlanGradient}
            >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addPlanText}>
                    {isRTL ? 'إضافة خطة جديدة' : 'Add New Plan'}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={plans as MealPlan[]}
                keyExtractor={(item) => item.id}
                renderItem={renderPlanCard}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primaryDark]}
                        tintColor={colors.primaryDark}
                    />
                }
            />
            {/* Diet Plan Selector Modal */}
            <DietPlanSelector
                visible={showDietSelector}
                clientId={clientId}
                clientName={clientName}
                onClose={handleDietSelectorClose}
                onSuccess={handleDietSelectorSuccess}
                editMode={!!editingPlanId}
                editPlanId={editingPlanId ?? undefined}
            />

            {/* Diet Details View Modal */}
            <Modal
                visible={!!viewingDietId}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setViewingDietId(null)}
            >
                {viewingDietId && (
                    <DietDetailsView
                        dietId={viewingDietId}
                        onBack={() => setViewingDietId(null)}
                        onAssign={() => setViewingDietId(null)}
                    />
                )}
            </Modal>
        </View>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(80),
    },
    addPlanButton: {
        marginBottom: verticalScale(16),
        borderRadius: horizontalScale(12),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addPlanGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(12),
    },
    addPlanText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
        paddingHorizontal: horizontalScale(32),
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: verticalScale(24),
        textAlign: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
        paddingHorizontal: horizontalScale(24),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(12),
    },
    createButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    planCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    dateRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    weekRange: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(12),
    },
    statusText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: verticalScale(16),
    },
    progressRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    progressLabel: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    progressValue: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    progressBar: {
        height: verticalScale(8),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(4),
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: horizontalScale(4),
    },
    cardActions: {
        gap: horizontalScale(12),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: verticalScale(12),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        paddingVertical: verticalScale(8),
        paddingHorizontal: horizontalScale(12),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.bgSecondary,
    },
    archiveButton: {
        backgroundColor: 'transparent',
    },
    deleteButton: {
        backgroundColor: '#FEE2E2',
    },
    actionText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    fab: {
        position: 'absolute',
        bottom: verticalScale(16),
        right: horizontalScale(16),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabGradient: {
        width: horizontalScale(56),
        height: horizontalScale(56),
        borderRadius: horizontalScale(28),
        justifyContent: 'center',
        alignItems: 'center',
    },
});
