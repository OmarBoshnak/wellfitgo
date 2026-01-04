import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, BarChart3, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import {
    DietCategoriesGrid,
    AssignClientModal,
    CreateCategoryModal,
    useDoctorPlans,
    useDoctorPlansMutations,
} from '@/src/features/meals';
import type { DoctorPlanItem, DraftPlanItem } from '@/src/features/meals';
import ClientProgressView from '@/src/features/doctor/components/plans/ClientProgressView';

const t = {
    plans: isRTL ? 'الخطط' : 'Plans',
    activePlans: isRTL ? 'الخطط النشطة' : 'Active Plans',
    drafts: isRTL ? 'المسودات' : 'Drafts',
    dietPrograms: isRTL ? 'برامج التغذية' : 'Diet Programs',
    activeClientPlans: isRTL ? 'خطط العملاء النشطة' : 'ACTIVE CLIENT PLANS',
    allCategories: isRTL ? 'جميع الفئات' : 'All Categories',
    daysLeft: isRTL ? 'أيام متبقية' : 'days left',
    paused: isRTL ? 'متوقف' : 'Paused',
    week: isRTL ? 'الأسبوع' : 'Week',
    of: isRTL ? 'من' : 'of',
    ongoing: isRTL ? 'مستمر' : 'ongoing',
    finishing: isRTL ? 'قريب الانتهاء' : 'finishing',
    started: isRTL ? 'بدأ' : 'Started',
    assigned: isRTL ? 'تم التعيين' : 'Assigned',
    meals: isRTL ? 'وجبات' : 'meals',
    missedMeals: isRTL ? 'فاتت وجبات' : 'Missed',
    noActivity: isRTL ? 'لا يوجد نشاط حتى الآن' : 'No activity yet',
    almostDone: isRTL ? 'قارب الانتهاء' : 'Almost done',
    viewProgress: isRTL ? 'عرض التقدم' : 'View Progress',
    extendPlan: isRTL ? 'تمديد الخطة' : 'Extend Plan',
    remindClient: isRTL ? 'تذكير العميل' : 'Remind Client',
    noActivePlans: isRTL ? 'لا توجد خطط نشطة' : 'No Active Plans',
    noDrafts: isRTL ? 'لا توجد مسودات' : 'No Drafts',
    assignDietPrograms: isRTL ? 'قم بتعيين برامج غذائية لعملائك للبدء' : 'Assign diet programs to your clients to get started',
    browsePrograms: isRTL ? 'تصفح برامج التغذية' : 'Browse Diet Programs',
    // Drafts translations
    draftPlans: isRTL ? 'خطط مسودة' : 'DRAFT PLANS',
    draftDescription: isRTL ? 'المسودات هي خطط لم يتم تعيينها للعملاء بعد' : 'Drafts are plans not yet assigned to clients',
    basedOn: isRTL ? 'مبني على' : 'Based on',
    lastEdited: isRTL ? 'آخر تعديل' : 'Last edited',
    complete: isRTL ? 'مكتمل' : 'complete',
    progress: isRTL ? 'التقدم' : 'Progress',
    delete: isRTL ? 'حذف' : 'Delete',
    continueEditing: isRTL ? 'متابعة التحرير' : 'Continue Editing',
    hoursAgo: isRTL ? 'ساعات مضت' : 'hours ago',
};

// Translations for loading/empty states
const loadingText = isRTL ? 'جاري التحميل...' : 'Loading...';

type TabType = 'active' | 'drafts' | 'programs';
type ProgramsViewType = 'categories' | 'ranges' | 'details' | 'edit' | 'editMeal';

export default function PlansScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [programsView, setProgramsView] = useState<ProgramsViewType>('categories');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [selectedDiet, setSelectedDiet] = useState<any>(null);
    const [selectedMeal, setSelectedMeal] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<DoctorPlanItem | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showClientProgress, setShowClientProgress] = useState(false);
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

    // ============ CONVEX DATA HOOKS ============
    const {
        activePlans,
        draftPlans,
        isLoading,
        activePlansCount,
        draftPlansCount,
    } = useDoctorPlans();
    const { deleteDraft } = useDoctorPlansMutations();

    const handleCategorySelect = (category: any) => {
        setSelectedCategory(category);
        setProgramsView('ranges');
    };

    const handleDietView = (diet: any) => {
        setSelectedDiet(diet);
        setProgramsView('details');
    };

    const handleAssign = (diet?: any) => {
        if (diet) setSelectedDiet(diet);
        setShowAssignModal(true);
    };

    const handleDietEdit = (diet: any) => {
        setSelectedDiet(diet);
        setProgramsView('edit');
    };

    const handleMealEdit = (meal: any) => {
        setSelectedMeal(meal);
        setProgramsView('editMeal');
    };

    const handleAssignComplete = (selectedClients: string[]) => {
        console.log('Assigned diet to clients:', selectedClients);
        setShowAssignModal(false);
        setProgramsView('categories');
    };

    const handleViewPlanDetails = (plan: any) => {
        setSelectedPlan(plan);
        setShowClientProgress(true);
    };

    const handleCreateCategory = (category: {
        emoji: string;
        nameEn: string;
        nameAr: string;
        description: string;
        autoGenerateRanges: boolean;
    }) => {
        // Category is now created via Convex mutation in CreateCategoryModal
        // This callback is just for closing the modal
        setShowCreateCategoryModal(false);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        // Custom categories have IDs prefixed with 'custom_'
        // Extract the actual Convex ID and delete via mutation
        if (categoryId.startsWith('custom_')) {
            const convexId = categoryId.replace('custom_', '');
            try {
                // Note: The actual mutation call would need to be added here
                // For now, the DietCategoriesGrid should handle the deletion via its own mutation
                console.log('Delete category requested:', convexId);
            } catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return '#27AE61';
            case 'warning': return '#F2994A';
            case 'paused': return '#EB5757';
            default: return '#27AE61';
        }
    };

    const renderActivePlanCard = (plan: DoctorPlanItem) => {
        const progressPercent = (plan.mealsCompleted / plan.totalMeals) * 100;
        const statusColor = getStatusColor(plan.status);

        return (
            <View key={plan.id} style={styles.planCard}>
                {/* Left status border */}
                <View style={[styles.statusBorder, { backgroundColor: statusColor }]} />

                <View style={styles.planContent}>
                    {/* Header */}
                    <View style={[styles.planHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.clientRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            {plan.avatar ? (
                                <Image source={{ uri: plan.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ fontSize: ScaleFontSize(16), color: colors.textSecondary }}>
                                        {plan.clientName.charAt(0)}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.clientName}>{plan.clientName}</Text>
                        </View>
                        {plan.status === 'paused' ? (
                            <View style={styles.pausedBadge}>
                                <Text style={styles.pausedBadgeText}>{t.paused}</Text>
                            </View>
                        ) : (
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.daysLeftBadge}
                            >
                                <Text style={styles.daysLeftText}>{plan.daysLeft} {t.daysLeft}</Text>
                            </LinearGradient>
                        )}
                    </View>

                    {/* Diet Program */}
                    <Text style={[styles.dietProgram, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {plan.dietProgram}
                    </Text>

                    {/* Week Info */}
                    <View style={[styles.weekRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.weekText}>
                            {t.week} {plan.weekNumber} {plan.statusMessage === 'finishing' ? t.finishing : t.of + ' ' + t.ongoing}
                        </Text>
                        <Text style={styles.weekText}>
                            {plan.status === 'paused' ? t.assigned : t.started}: {plan.startDate}
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressBar}>
                            {progressPercent > 0 ? (
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressFill, { width: `${progressPercent}%` }]}
                                />
                            ) : (
                                <View style={[styles.progressFillEmpty, { width: '0%' }]} />
                            )}
                        </View>
                        <Text style={[styles.progressText, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {plan.mealsCompleted}/{plan.totalMeals} {t.meals}
                        </Text>
                    </View>

                    {/* Stats Row */}
                    <View style={[styles.statsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        {plan.status === 'good' && plan.mealsCompleted > 0 && (
                            <>
                                <View style={[styles.statItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <CheckCircle size={horizontalScale(14)} color="#27AE61" />
                                    <Text style={[styles.statText, { color: '#27AE61' }]}>
                                        {plan.statusMessage === 'finishing' ? t.almostDone : `${plan.mealsCompleted}/${plan.totalMeals} ${t.meals}`}
                                    </Text>
                                </View>
                                {plan.weightChange !== 0 && (
                                    <View style={[styles.statItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                        <BarChart3 size={horizontalScale(14)} color="#27AE61" />
                                        <Text style={[styles.statText, { color: '#27AE61' }]}>
                                            {plan.weightChange > 0 ? '+' : ''}{plan.weightChange} kg
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                        {plan.status === 'warning' && (
                            <>
                                <View style={[styles.statItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <AlertTriangle size={horizontalScale(14)} color="#F2994A" />
                                    <Text style={[styles.statText, { color: '#F2994A' }]}>
                                        {t.missedMeals} {plan.missedMeals} {t.meals}
                                    </Text>
                                </View>
                                {plan.weightChange !== 0 && (
                                    <View style={[styles.statItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        <BarChart3 size={horizontalScale(14)} color="#27AE61" />
                                        <Text style={[styles.statText, { color: '#27AE61' }]}>
                                            {plan.weightChange > 0 ? '+' : ''}{plan.weightChange} kg
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                        {plan.status === 'paused' && (
                            <View style={[styles.statItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <AlertCircle size={horizontalScale(14)} color="#EB5757" />
                                <Text style={[styles.statText, { color: '#EB5757' }]}>{t.noActivity}</Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.actionButtons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => handleViewPlanDetails(plan)}
                        >
                            <Text style={styles.primaryButtonText}>
                                {plan.status === 'paused' ? t.remindClient : t.viewProgress}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{activeTab === 'active' ? '📋' : '📝'}</Text>
            <Text style={styles.emptyTitle}>{activeTab === 'active' ? t.noActivePlans : t.noDrafts}</Text>
            <Text style={styles.emptyText}>{t.assignDietPrograms}</Text>
            {activeTab === 'active' && (
                <TouchableOpacity style={styles.browseButton} onPress={() => { setActiveTab('programs'); setProgramsView('categories'); }}>
                    <Text style={styles.browseButtonText}>{t.browsePrograms}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderDraftCard = (draft: DraftPlanItem) => (
        <View key={draft.id} style={styles.draftCard}>
            {/* Title */}
            <Text style={[styles.draftTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                {draft.title}
            </Text>

            {/* Details */}
            <View style={styles.draftDetails}>
                <Text style={[styles.draftBasedOn, { textAlign: isRTL ? 'left' : 'right' }]}>
                    {t.basedOn}: {draft.basedOn}
                </Text>
                <Text style={[styles.draftLastEdited, { textAlign: isRTL ? 'left' : 'right' }]}>
                    {t.lastEdited}: {draft.lastEditedHours} {t.hoursAgo}
                </Text>
            </View>

            {/* Progress */}
            <View style={styles.draftProgressSection}>
                <View style={[styles.draftProgressHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.draftProgressLabel}>{t.progress}</Text>
                    <Text style={styles.draftProgressPercent}>{draft.progressPercent}% {t.complete}</Text>
                </View>
                <View style={styles.draftProgressBar}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.draftProgressFill, { width: `${draft.progressPercent}%` }]}
                    />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.draftActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteDraft(draft.id)}
                >
                    <Text style={styles.deleteButtonText}>{t.delete}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.continueButtonWrapper} activeOpacity={0.9}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.continueButton}
                    >
                        <Text style={styles.continueButtonText}>{t.continueEditing}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTab = (tab: TabType, label: string, count?: number) => {
        const isActive = activeTab === tab;
        return (
            <TouchableOpacity
                style={styles.tab}
                onPress={() => {
                    setActiveTab(tab);
                    if (tab === 'programs') setProgramsView('categories');
                }}
            >
                {isActive ? (
                    <View
                    >
                        <Text style={styles.tabTextActive}>
                            {label}{count !== undefined ? ` (${count})` : ''}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.tabText}>
                        {label}{count !== undefined ? ` (${count})` : ''}
                    </Text>
                )}
                {isActive && (
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tabIndicator}
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                <Text style={styles.title}>{t.plans}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <View style={[styles.tabsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {renderTab('active', t.activePlans, activePlansCount)}
                    {renderTab('drafts', t.drafts, draftPlansCount)}
                    {renderTab('programs', t.dietPrograms)}
                </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
                {activeTab === 'active' && (
                    <>
                        {/* Section Header */}
                        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.sectionTitle}>{t.activeClientPlans}</Text>
                            <TouchableOpacity style={[styles.categoryButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.categoryButtonText}>{t.allCategories}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Loading / Plans List */}
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primaryDark} />
                                <Text style={styles.loadingText}>{loadingText}</Text>
                            </View>
                        ) : (activePlans && activePlans.length > 0) ? (
                            <View style={styles.plansList}>
                                {activePlans.map(renderActivePlanCard)}
                            </View>
                        ) : renderEmptyState()}
                    </>
                )}

                {activeTab === 'drafts' && (
                    <>
                        {/* Section Header */}
                        <View style={styles.draftSectionHeader}>
                            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.draftPlans}
                            </Text>
                            <Text style={[styles.draftSectionDescription, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.draftDescription}
                            </Text>
                        </View>

                        {/* Draft Plans List */}
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primaryDark} />
                                <Text style={styles.loadingText}>{loadingText}</Text>
                            </View>
                        ) : (draftPlans && draftPlans.length > 0) ? (
                            <View style={styles.plansList}>
                                {draftPlans.map(renderDraftCard)}
                            </View>
                        ) : renderEmptyState()}
                    </>
                )}

                {activeTab === 'programs' && (
                    <DietCategoriesGrid
                        onCreateCustom={() => setShowCreateCategoryModal(true)}
                        onDeleteCategory={handleDeleteCategory}
                    />
                )}
            </ScrollView>

            {/* Assign Modal */}
            <AssignClientModal
                visible={showAssignModal}
                diet={selectedDiet}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssignComplete}
            />

            {/* Create Category Modal */}
            <CreateCategoryModal
                visible={showCreateCategoryModal}
                onClose={() => setShowCreateCategoryModal(false)}
                onSuccess={() => {
                    // Refresh categories on success
                    setShowCreateCategoryModal(false);
                }}
            />

            {/* Client Progress View Full Screen */}
            {showClientProgress && selectedPlan && (
                <View style={styles.fullScreenOverlay}>
                    <ClientProgressView
                        clientId={selectedPlan.clientId}
                        clientName={selectedPlan.clientName}
                        clientAvatar={selectedPlan.avatar ?? undefined}
                        onBack={() => setShowClientProgress(false)}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Header
    header: {
        backgroundColor: `${colors.bgSecondary}F2`,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerActions: {
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    headerButton: {
        padding: horizontalScale(4),
    },
    // Tabs
    tabsContainer: {
        backgroundColor: colors.bgSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: horizontalScale(16),
    },
    tabsRow: {
        width: '100%',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: verticalScale(13),
        position: 'relative',
    },
    tabGradientText: {
        paddingHorizontal: horizontalScale(8),
    },
    tabText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    tabTextActive: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.primaryDark,
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: verticalScale(3),
        borderTopLeftRadius: horizontalScale(3),
        borderTopRightRadius: horizontalScale(3),
    },
    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(100),
    },
    // Section Header
    sectionHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: '#AAB8C5',
        letterSpacing: 0.8,
    },
    categoryButton: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    categoryButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    // Plans List
    plansList: {
        gap: verticalScale(12),
    },
    // Plan Card
    planCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    statusBorder: {
        width: horizontalScale(4),
    },
    planContent: {
        flex: 1,
        padding: horizontalScale(16),
        paddingLeft: horizontalScale(12),
    },
    planHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    clientRow: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    avatar: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
    },
    clientName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    daysLeftBadge: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(8),
    },
    daysLeftText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    pausedBadge: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(8),
        backgroundColor: '#9CA3AF',
    },
    pausedBadgeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    dietProgram: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    weekRow: {
        gap: horizontalScale(16),
        marginBottom: verticalScale(12),
    },
    weekText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    progressSection: {
        marginBottom: verticalScale(8),
    },
    progressBar: {
        height: verticalScale(6),
        backgroundColor: '#F0F3F6',
        borderRadius: horizontalScale(3),
        overflow: 'hidden',
        marginBottom: verticalScale(4),
    },
    progressFill: {
        height: '100%',
        borderRadius: horizontalScale(3),
    },
    progressFillEmpty: {
        height: '100%',
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(3),
    },
    progressText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    statsRow: {
        gap: horizontalScale(16),
        marginBottom: verticalScale(16),
    },
    statItem: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    statText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
    },
    actionButtons: {
        gap: horizontalScale(12),
    },
    primaryButton: {
        flex: 1,
        height: verticalScale(36),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    secondaryButton: {
        flex: 1,
        height: verticalScale(36),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    // Empty State
    emptyState: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(32),
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: verticalScale(20),
    },
    browseButton: {
        backgroundColor: colors.success,
        paddingHorizontal: horizontalScale(24),
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(8),
    },
    browseButtonText: {
        fontSize: ScaleFontSize(14),
        color: '#FFFFFF',
        fontWeight: '500',
    },
    fullScreenOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bgSecondary,
        zIndex: 100,
    },
    // Draft Card Styles
    draftSectionHeader: {
        marginBottom: verticalScale(16),
    },
    draftSectionDescription: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    draftCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#AAB8C5',
    },
    draftTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    draftDetails: {
        marginBottom: verticalScale(20),
    },
    draftBasedOn: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    draftLastEdited: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    draftProgressSection: {
        marginBottom: verticalScale(20),
    },
    draftProgressHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(6),
    },
    draftProgressLabel: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    draftProgressPercent: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    draftProgressBar: {
        height: verticalScale(8),
        backgroundColor: '#E1E6EF',
        borderRadius: horizontalScale(4),
        overflow: 'hidden',
    },
    draftProgressFill: {
        height: '100%',
        borderRadius: horizontalScale(4),
    },
    draftActions: {
        gap: horizontalScale(12),
    },
    deleteButton: {
        flex: 1,
        height: verticalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: horizontalScale(8),
    },
    deleteButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#EB5757',
    },
    continueButtonWrapper: {
        flex: 2,
        borderRadius: horizontalScale(8),
        overflow: 'hidden',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    continueButton: {
        height: verticalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Loading state
    loadingContainer: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: verticalScale(200),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(12),
    },
});
