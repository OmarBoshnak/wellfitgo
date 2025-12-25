import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, CheckCircle, BarChart3, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { colors, gradients } from '@/src/theme';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import {
    DietCategoriesGrid,
    CalorieRangesList,
    DietDetailsView,
    AssignClientModal,
    CreateCategoryModal,
    EditDietScreen,
} from '@/src/features/meals';
// TODO: These components need implementation - temporarily import from old location
import EditMealCategories from '@/src/component/doctor/plans/EditMealCategories';
import MealPlanCreator from '@/src/component/doctor/plans/MealPlanCreator';

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
    modifyPlan: isRTL ? 'تعديل الخطة' : 'Modify Plan',
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

// Enhanced mock data matching HTML design
const mockActivePlans = [
    {
        id: '1',
        clientId: '1',
        clientName: isRTL ? 'أحمد حسن' : 'Ahmed Hassan',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpe5FJh5O1wuDWobRDKx3o9cD8bQZ0Jk2DYWjbP9nb0fJF558UKBHC1w9RnWwPaje15JLDBWU5hMnipEUxIt-vGHeCQxeW0-2dfTz3I-GVuX2Y0IL8seWAiv_lgKvemUFzgbrIS2VXwtEor7Dd5r_zzia7uM1NsvGE8873fDgkA__ofW7naAJDt7VWPTF333UMeuA5dTKESf09alf0BD8cSo8BgC1F3wIhJUbAD6SlDT6U8HFQydeA8JLWjNZDld4Rze8cWSG7jW8',
        dietProgram: '🥗 Classic 1200-1300',
        daysLeft: 21,
        weekNumber: 3,
        startDate: 'Nov 25',
        mealsCompleted: 18,
        totalMeals: 21,
        weightChange: -2.1,
        status: 'good', // good | warning | paused
        statusMessage: null,
        missedMeals: 0,
    },
    {
        id: '2',
        clientId: '2',
        clientName: isRTL ? 'ليلى محمود' : 'Layla Mahmoud',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeSAyjgpaPjDL_6ESbVQTaViWk6ffoDb9qF7TepjXAwRbm5dDcgFoWScOdAiY1KBAsW2XXBYZxIgfg-5-D_SslMwQ0DUCw_7FqgauGUdF_3Rg2fXTCrLWjQnHq8y6f0qJrG--PEEqgXpmgfVb_-l0RbsD3yO5W7w9sySxyaj2gw173jouU-45nZYr7Ro2u1OlEorJebI-ET4Ut5ghb1iUeT3bIpwezDeHxVYvXCcUYQgT4ofEJt2hSP-7pesqu32jvvHfl8Pm6_3k',
        dietProgram: '🥑 Keto Strict Phase',
        daysLeft: 12,
        weekNumber: 2,
        startDate: 'Dec 01',
        mealsCompleted: 8,
        totalMeals: 21,
        weightChange: -0.5,
        status: 'warning',
        statusMessage: null,
        missedMeals: 2,
    },
    {
        id: '3',
        clientId: '3',
        clientName: isRTL ? 'سارة جونز' : 'Sarah Jones',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL6u921sOziigkcyhgD-DkpPLec8Km58D8FvTogz8x41tT9ZKbuhqrDCOTF1tlgjGW8yS8Xi6eVNodMZmGXiY96IxTtdxNexALdU1VwL3CTgaj5u0-ZTYN67EmLI9zqBJ9eO_Vr-AHNFTE0GDzeEFT7iylD-9wuKTr7TKPa72DYwEQ_CW9uoN6PHFBiFDQQpr6bjnVHirA52kDf8-cXX3ll54SaFl58uqlnFwyuRO7moHe_EBQzG9p8EvH_8KB_Y-QmJDEIemH83A',
        dietProgram: '🥩 High Protein Plus',
        daysLeft: 0,
        weekNumber: 1,
        startDate: 'Dec 05',
        mealsCompleted: 0,
        totalMeals: 21,
        weightChange: 0,
        status: 'paused',
        statusMessage: 'not started',
        missedMeals: 0,
    },
    {
        id: '4',
        clientId: '4',
        clientName: isRTL ? 'عمر خالد' : 'Omar Khaled',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQt-4eKXpf2xCVSgrdZ-M1cVK6ek9C_ORdr3qT-6BEz8Tn5cqjlZpFDcIDNO0lUR9cx1wsvUELwsTuXrQe9lv885qPxNvn4SNdCQk4lb14DwtAa-sjhiNNHK_x05HGjxUniwzkqzK9L_3_509JQq4Ot0n2kSlddFJD7oJH7QYtresMHQqPl31QzCe-JVgczMdwmSOH5sLEsJ7qWio2AfyBIG7jiaYdQrKT4Gjg-z_EVMuq0NOM5efcwm0aX0Uhig0GgDHAfhxn24s',
        dietProgram: '⏰ Intermittent Fasting',
        daysLeft: 5,
        weekNumber: 4,
        startDate: 'Nov 15',
        mealsCompleted: 20,
        totalMeals: 21,
        weightChange: -4.5,
        status: 'good',
        statusMessage: 'finishing',
        missedMeals: 0,
    },
];

const mockDraftPlans = [
    {
        id: '5',
        title: isRTL ? 'خطة مخصصة لأحمد' : 'Custom Plan for Ahmed',
        basedOn: 'Classic 1200-1300',
        lastEdited: 2, // hours ago
        progressPercent: 70,
    },
];

type TabType = 'active' | 'drafts' | 'programs';
type ProgramsViewType = 'categories' | 'ranges' | 'details' | 'edit' | 'editMeal';

export default function PlansScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [programsView, setProgramsView] = useState<ProgramsViewType>('categories');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [selectedDiet, setSelectedDiet] = useState<any>(null);
    const [selectedMeal, setSelectedMeal] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showMealPlanCreator, setShowMealPlanCreator] = useState(false);
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [customCategories, setCustomCategories] = useState<{
        id: string;
        emoji: string;
        name: string;
        nameAr: string;
        count: number;
    }[]>([]);

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
        setShowMealPlanCreator(true);
    };

    const handleCreateCategory = (category: {
        emoji: string;
        nameEn: string;
        nameAr: string;
        description: string;
        autoGenerateRanges: boolean;
    }) => {
        // Create new category object
        const newCategory = {
            id: `custom_${Date.now()}`,
            emoji: category.emoji,
            name: category.nameEn,
            nameAr: category.nameAr,
            count: category.autoGenerateRanges ? 14 : 0,
        };

        // Add to state
        setCustomCategories(prev => [...prev, newCategory]);
        setShowCreateCategoryModal(false);
    };

    const handleDeleteCategory = (categoryId: string) => {
        setCustomCategories(prev => prev.filter(cat => cat.id !== categoryId));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return '#27AE61';
            case 'warning': return '#F2994A';
            case 'paused': return '#EB5757';
            default: return '#27AE61';
        }
    };

    const renderActivePlanCard = (plan: typeof mockActivePlans[0]) => {
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
                            <Image source={{ uri: plan.avatar }} style={styles.avatar} />
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
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>
                                {plan.statusMessage === 'finishing' ? t.extendPlan : t.modifyPlan}
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

    const renderDraftCard = (draft: typeof mockDraftPlans[0]) => (
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
                    {t.lastEdited}: {draft.lastEdited} {t.hoursAgo}
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
                <TouchableOpacity style={styles.deleteButton}>
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
        <SafeAreaView edges={['top']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Text style={styles.title}>{t.plans}</Text>
                <View style={[styles.headerActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Search size={horizontalScale(24)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <View style={[styles.tabsRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {renderTab('active', t.activePlans, mockActivePlans.length)}
                    {renderTab('drafts', t.drafts, mockDraftPlans.length)}
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

                        {/* Plans List */}
                        {mockActivePlans.length > 0 ? (
                            <View style={styles.plansList}>
                                {mockActivePlans.map(renderActivePlanCard)}
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
                        {mockDraftPlans.length > 0 ? (
                            <View style={styles.plansList}>
                                {mockDraftPlans.map(renderDraftCard)}
                            </View>
                        ) : renderEmptyState()}
                    </>
                )}

                {activeTab === 'programs' && (
                    <>
                        {programsView === 'categories' && (
                            <DietCategoriesGrid
                                onCategorySelect={handleCategorySelect}
                                onCreateCustom={() => setShowCreateCategoryModal(true)}
                                onDeleteCategory={handleDeleteCategory}
                                customCategories={customCategories}
                            />
                        )}
                        {programsView === 'ranges' && (
                            <CalorieRangesList
                                category={selectedCategory}
                                onBack={() => setProgramsView('categories')}
                                onAssign={handleAssign}
                                onView={handleDietView}
                                onEdit={handleDietEdit}
                            />
                        )}
                        {programsView === 'details' && (
                            <DietDetailsView
                                diet={selectedDiet}
                                onBack={() => setProgramsView('ranges')}
                                onAssign={() => handleAssign()}
                            />
                        )}
                        {programsView === 'edit' && (
                            <EditDietScreen
                                diet={selectedDiet}
                                onBack={() => setProgramsView('ranges')}
                                onSave={() => setProgramsView('ranges')}
                            />
                        )}
                        {programsView === 'editMeal' && (
                            <EditMealCategories
                                meal={selectedMeal}
                                onBack={() => setProgramsView('edit')}
                                onDone={() => setProgramsView('edit')}
                            />
                        )}
                    </>
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
                onCreate={handleCreateCategory}
            />

            {/* Meal Plan Creator Full Screen */}
            {showMealPlanCreator && selectedPlan && (
                <View style={styles.fullScreenOverlay}>
                    <MealPlanCreator
                        clientId={selectedPlan.clientId}
                        clientName={selectedPlan.clientName}
                        clientAvatar={selectedPlan.avatar}
                        onBack={() => setShowMealPlanCreator(false)}
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
        fontSize: ScaleFontSize(18),
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
});
