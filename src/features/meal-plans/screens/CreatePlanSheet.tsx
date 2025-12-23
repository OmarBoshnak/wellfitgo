/**
 * CreatePlanSheet Component
 * Bottom sheet modal for meal plan creation options
 */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, borderRadius, shadows, planOptions } from '../constants';
import { t } from '../translations';
import type { ClientInfo, CurrentPlan, PlanOption } from '../types';

interface CreatePlanSheetProps {
    visible: boolean;
    onClose: () => void;
    client: ClientInfo;
    currentPlan?: CurrentPlan;
    onSelectOption: (optionId: PlanOption['id']) => void;
    onModifyCurrentPlan?: () => void;
    onRemoveCurrentPlan?: () => void;
}

export function CreatePlanSheet({
    visible,
    onClose,
    client,
    currentPlan,
    onSelectOption,
    onModifyCurrentPlan,
    onRemoveCurrentPlan,
}: CreatePlanSheetProps) {
    const insets = useSafeAreaInsets();
    const clientName = isRTL ? client.nameAr : client.name;

    const getIconName = (optionId: string): keyof typeof Ionicons.glyphMap => {
        switch (optionId) {
            case 'library':
                return 'library-outline';
            case 'custom':
                return 'create-outline';
            case 'copy':
                return 'copy-outline';
            default:
                return 'document-outline';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop */}
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <BlurView intensity={10} style={StyleSheet.absoluteFill} tint="dark" />
                </Pressable>

                {/* Bottom Sheet */}
                <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, verticalScale(24)) }]}>
                    {/* Drag Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, isRTL && styles.textRTL]}>
                                {t.mealPlanFor} {clientName}
                            </Text>
                            <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
                                {t.selectOption}
                            </Text>
                        </View>

                        {/* Current Plan Card (Conditional) */}
                        {currentPlan && (
                            <View style={styles.currentPlanCard}>
                                <View style={styles.currentPlanAccent} />
                                <View style={[styles.currentPlanHeader, isRTL && styles.currentPlanHeaderRTL]}>
                                    <View>
                                        <Text style={styles.currentPlanBadge}>{t.currentlyAssigned}</Text>
                                        <Text style={[styles.currentPlanName, isRTL && styles.textRTL]}>
                                            {currentPlan.name}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={horizontalScale(20)}
                                        color={mealPlanColors.warningBorder}
                                    />
                                </View>
                                <View style={[styles.currentPlanDate, isRTL && styles.currentPlanDateRTL]}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={horizontalScale(14)}
                                        color={mealPlanColors.textSlate}
                                    />
                                    <Text style={styles.currentPlanDateText}>
                                        {t.since} {currentPlan.assignedDate}
                                    </Text>
                                </View>
                                <View style={styles.currentPlanActions}>
                                    <TouchableOpacity
                                        style={styles.modifyButton}
                                        onPress={onModifyCurrentPlan}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modifyButtonText}>{t.modify}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={onRemoveCurrentPlan}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.removeButtonText}>{t.remove}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Options List */}
                        <View style={styles.optionsList}>
                            {planOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={styles.optionButton}
                                    onPress={() => onSelectOption(option.id as PlanOption['id'])}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                        <View style={styles.optionIcon}>
                                            <Ionicons
                                                name={getIconName(option.id)}
                                                size={horizontalScale(28)}
                                                color={mealPlanColors.primary}
                                            />
                                        </View>
                                        <View style={[styles.optionText]}>
                                            <Text style={[styles.optionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                                {isRTL ? option.titleAr : option.title}
                                            </Text>
                                            <Text style={[styles.optionDesc, { textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={2}>
                                                {isRTL ? option.descriptionAr : option.description}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={isRTL ? 'chevron-back' : 'chevron-forward'}
                                            size={horizontalScale(24)}
                                            color={mealPlanColors.textMain}
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: mealPlanColors.backdrop,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: mealPlanColors.cardLight,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '75%',
        ...shadows.bottomSheet,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(4),
    },
    handle: {
        width: horizontalScale(40),
        height: verticalScale(4),
        borderRadius: verticalScale(2),
        backgroundColor: mealPlanColors.dragHandle,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(20),
        paddingBottom: verticalScale(16),
    },
    header: {
        alignItems: 'center',
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(8),
    },
    title: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: mealPlanColors.textSlate,
        marginBottom: verticalScale(4),
    },
    subtitle: {
        fontSize: ScaleFontSize(13),
        color: mealPlanColors.textDesc,
    },
    textRTL: {
        textAlign: 'right',
    },
    // Current Plan Card
    currentPlanCard: {
        borderWidth: 1,
        borderColor: mealPlanColors.warningBorder,
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.sm,
        padding: horizontalScale(16),
        marginTop: verticalScale(24),
        marginBottom: verticalScale(32),
        overflow: 'hidden',
        position: 'relative',
    },
    currentPlanAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: mealPlanColors.warningBorder,
        opacity: 0.5,
    },
    currentPlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: verticalScale(8),
        paddingTop: verticalScale(4),
    },
    currentPlanHeaderRTL: {
        flexDirection: 'row-reverse',
    },
    currentPlanBadge: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: mealPlanColors.warningBorder,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: verticalScale(4),
    },
    currentPlanName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: mealPlanColors.textMain,
    },
    currentPlanDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        marginBottom: verticalScale(16),
        opacity: 0.8,
    },
    currentPlanDateRTL: {
        flexDirection: 'row-reverse',
    },
    currentPlanDateText: {
        fontSize: ScaleFontSize(12),
        color: mealPlanColors.textSlate,
    },
    currentPlanActions: {
        flexDirection: 'row',
        gap: horizontalScale(12),
    },
    modifyButton: {
        flex: 1,
        backgroundColor: `${mealPlanColors.primary}15`,
        paddingVertical: verticalScale(10),
        borderRadius: borderRadius.sm,
        alignItems: 'center',
    },
    modifyButtonText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: mealPlanColors.primary,
    },
    removeButton: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: verticalScale(10),
        borderRadius: borderRadius.sm,
        alignItems: 'center',
    },
    removeButtonText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: mealPlanColors.statusRed,
    },
    // Options List
    optionsList: {
        gap: verticalScale(16),
    },
    optionButton: {
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: horizontalScale(16),
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    optionContentRTL: {
        flexDirection: 'row-reverse',
    },
    optionIcon: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: borderRadius.sm,
        backgroundColor: mealPlanColors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        flex: 1,
        gap: verticalScale(2),
    },
    optionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: mealPlanColors.textMain,
    },
    optionDesc: {
        fontSize: ScaleFontSize(13),
        color: mealPlanColors.textDesc,
        lineHeight: ScaleFontSize(18),
    },
});
