import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Utensils, Calendar, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// ============ TYPES ============

interface DietPlan {
    id: Id<"dietPlans">;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    emoji?: string;
    type: string;
    targetGoal?: string;
    targetCalories?: number;
    format: string;
}

interface DateOption {
    value: string;
    label: string;
    labelAr: string;
}

interface DietPlanSelectorProps {
    visible: boolean;
    clientId: Id<"users">;
    clientName?: string;
    onClose: () => void;
    onSuccess?: () => void;
    // Edit mode props
    editMode?: boolean;
    editPlanId?: Id<"weeklyMealPlans">;
}

// ============ TRANSLATIONS ============

const t = {
    title: isRTL ? 'اختر خطة غذائية' : 'Select Diet Plan',
    titleEdit: isRTL ? 'تعديل الخطة الغذائية' : 'Edit Diet Plan',
    subtitle: isRTL ? 'اختر خطة لتعيينها للعميل' : 'Choose a plan to assign to client',
    subtitleEdit: isRTL ? 'اختر خطة جديدة للعميل' : 'Choose a new plan for client',
    noPlans: isRTL ? 'لا توجد خطط غذائية متاحة' : 'No diet plans available',
    assign: isRTL ? 'تعيين الخطة' : 'Assign Plan',
    update: isRTL ? 'تحديث الخطة' : 'Update Plan',
    assigning: isRTL ? 'جاري التعيين...' : 'Assigning...',
    updating: isRTL ? 'جاري التحديث...' : 'Updating...',
    success: isRTL ? 'تم تعيين الخطة بنجاح' : 'Plan assigned successfully',
    successUpdate: isRTL ? 'تم تحديث الخطة بنجاح' : 'Plan updated successfully',
    error: isRTL ? 'حدث خطأ' : 'An error occurred',
    selectFirst: isRTL ? 'اختر خطة أولاً' : 'Select a plan first',
    calories: isRTL ? 'سعرة' : 'cal',
    startDate: isRTL ? 'تاريخ البداية' : 'Start Date',
    selectDate: isRTL ? 'اختر التاريخ' : 'Select Date',
};

// ============ GOAL LABELS ============

const goalLabels: Record<string, { en: string; ar: string }> = {
    weight_loss: { en: 'Weight Loss', ar: 'إنقاص الوزن' },
    maintain: { en: 'Maintain', ar: 'الحفاظ' },
    gain_muscle: { en: 'Build Muscle', ar: 'بناء العضلات' },
};

// ============ DATE HELPERS ============

const generateDateOptions = (): DateOption[] => {
    const options: DateOption[] = [];
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate next 8 weeks of dates
    for (let i = 0; i < 56; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);

        const dayOfWeek = date.getDay();
        const dayNum = date.getDate();
        const month = date.getMonth();

        const value = date.toISOString().split('T')[0];
        const label = `${daysEn[dayOfWeek]}, ${months[month]} ${dayNum}`;
        const labelAr = `${daysAr[dayOfWeek]}، ${dayNum} ${monthsAr[month]}`;

        options.push({ value, label, labelAr });
    }

    return options;
};

// ============ COMPONENT ============

export function DietPlanSelector({
    visible,
    clientId,
    clientName,
    onClose,
    onSuccess,
    editMode = false,
    editPlanId
}: DietPlanSelectorProps) {
    const insets = useSafeAreaInsets();
    const [selectedPlan, setSelectedPlan] = useState<Id<"dietPlans"> | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    const dietPlans = useQuery(api.clientProfile.getDietPlans);
    const assignPlan = useMutation(api.clientProfile.assignDietPlan);
    const updatePlan = useMutation(api.clientProfile.updateMealPlanDiet);

    // Generate date options once
    const dateOptions = useMemo(() => generateDateOptions(), []);

    // Set default date to today when modal opens
    useEffect(() => {
        if (visible && !selectedDate) {
            setSelectedDate(dateOptions[0]?.value || '');
        }
    }, [visible, dateOptions]);

    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            setSelectedPlan(null);
            setSelectedDate('');
            setShowDatePicker(false);
        }
    }, [visible]);

    const selectedDateOption = dateOptions.find(d => d.value === selectedDate);

    const handleAssign = async () => {
        if (!selectedPlan) {
            Alert.alert('', t.selectFirst);
            return;
        }

        setIsAssigning(true);
        try {
            if (editMode && editPlanId) {
                // Update existing plan
                await updatePlan({
                    planId: editPlanId,
                    dietPlanId: selectedPlan,
                    weekStartDate: selectedDate || undefined
                });
                Alert.alert('✅', t.successUpdate);
            } else {
                // Create new plan
                await assignPlan({
                    clientId,
                    dietPlanId: selectedPlan,
                    weekStartDate: selectedDate || undefined
                });
                Alert.alert('✅', t.success);
            }
            setSelectedPlan(null);
            setSelectedDate('');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Assign error:', error);
            Alert.alert(t.error, String(error));
        }
        setIsAssigning(false);
    };

    const renderPlanCard = ({ item }: { item: DietPlan }) => {
        const isSelected = selectedPlan === item.id;
        const name = isRTL ? (item.nameAr || item.name) : item.name;
        const description = isRTL ? (item.descriptionAr || item.description) : item.description;
        const goalLabel = item.targetGoal ? (isRTL ? goalLabels[item.targetGoal]?.ar : goalLabels[item.targetGoal]?.en) : '';

        return (
            <TouchableOpacity
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.planRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {/* Icon */}
                    <View style={[styles.planIcon, isSelected && styles.planIconSelected]}>
                        <Text style={styles.planEmoji}>{item.emoji || '🍽️'}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.planContent}>
                        <Text style={[styles.planName, isSelected && styles.planNameSelected, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {name}
                        </Text>
                        {description && (
                            <Text style={[styles.planDescription, { textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={1}>
                                {description}
                            </Text>
                        )}
                        <View style={[styles.planMeta, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            {goalLabel && (
                                <View style={styles.metaBadge}>
                                    <Text style={styles.metaBadgeText}>{goalLabel}</Text>
                                </View>
                            )}
                            {item.targetCalories && (
                                <Text style={styles.caloriesText}>
                                    {item.targetCalories} {t.calories}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Checkmark */}
                    {isSelected && (
                        <View style={styles.checkmark}>
                            <Check size={16} color="#FFFFFF" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderDateOption = ({ item }: { item: DateOption }) => {
        const isSelected = selectedDate === item.value;
        return (
            <TouchableOpacity
                style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                onPress={() => {
                    setSelectedDate(item.value);
                    setShowDatePicker(false);
                }}
            >
                <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextSelected]}>
                    {isRTL ? item.labelAr : item.label}
                </Text>
                {isSelected && <Check size={16} color={colors.primaryDark} />}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View>
                        <Text style={[styles.title, { textAlign: isRTL ? 'left' : 'right' }]}>{editMode ? t.titleEdit : t.title}</Text>
                        <Text style={[styles.subtitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {clientName
                                ? `${editMode ? t.subtitleEdit : t.subtitle} ${clientName}`
                                : (editMode ? t.subtitleEdit : t.subtitle)}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Date Picker Section */}
                <View style={styles.dateSection}>
                    <Text style={[styles.dateSectionLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{t.startDate}</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowDatePicker(!showDatePicker)}
                    >
                        <Calendar size={18} color={colors.primaryDark} />
                        <Text style={[styles.dateSelectorText, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {selectedDateOption
                                ? (isRTL ? selectedDateOption.labelAr : selectedDateOption.label)
                                : t.selectDate}
                        </Text>
                        <ChevronDown size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                    <View style={styles.datePickerDropdown}>
                        <FlatList
                            data={dateOptions}
                            keyExtractor={(item) => item.value}
                            renderItem={renderDateOption}
                            style={styles.dateList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* Content */}
                {!showDatePicker && (
                    <>
                        {dietPlans === undefined ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primaryDark} />
                            </View>
                        ) : dietPlans.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Utensils size={48} color={colors.textSecondary} />
                                <Text style={styles.emptyText}>{t.noPlans}</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={dietPlans as DietPlan[]}
                                keyExtractor={(item) => item.id}
                                renderItem={renderPlanCard}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </>
                )}

                {/* Footer */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + verticalScale(16) }]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleAssign}
                        disabled={isAssigning || !selectedPlan}
                        style={styles.assignButtonWrapper}
                    >
                        <LinearGradient
                            colors={selectedPlan ? gradients.primary : ['#E5E7EB', '#D1D5DB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.assignButton}
                        >
                            {isAssigning ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Check size={20} color="#FFFFFF" />
                                    <Text style={styles.assignButtonText}>
                                        {editMode ? t.update : t.assign}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        paddingTop: verticalScale(10),
    },
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(16),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    closeButton: {
        padding: horizontalScale(8),
    },
    // Date Picker Styles
    dateSection: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dateSectionLabel: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: verticalScale(8),
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(10),
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(10),
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateSelectorText: {
        flex: 1,
        fontSize: ScaleFontSize(15),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    datePickerDropdown: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    dateList: {
        flex: 1,
    },
    dateOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(14),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dateOptionSelected: {
        backgroundColor: '#EFF6FF',
    },
    dateOptionText: {
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
    },
    dateOptionTextSelected: {
        fontWeight: '600',
        color: colors.primaryDark,
    },
    // Existing styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(32),
    },
    emptyText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
        marginTop: verticalScale(16),
        textAlign: 'center',
    },
    listContent: {
        padding: horizontalScale(16),
    },
    planCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    planCardSelected: {
        borderColor: colors.primaryDark,
        backgroundColor: '#EFF6FF',
    },
    planRow: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    planIcon: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(12),
        backgroundColor: colors.bgSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    planIconSelected: {
        backgroundColor: '#DBEAFE',
    },
    planEmoji: {
        fontSize: ScaleFontSize(24),
    },
    planContent: {
        flex: 1,
    },
    planName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    planNameSelected: {
        color: colors.primaryDark,
    },
    planDescription: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    planMeta: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginTop: verticalScale(8),
    },
    metaBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(6),
    },
    metaBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: '#4F46E5',
    },
    caloriesText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    checkmark: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(14),
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    assignButtonWrapper: {
        width: '100%',
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(16),
        borderRadius: horizontalScale(12),
    },
    assignButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
