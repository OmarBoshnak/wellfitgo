/**
 * AddCategorySheet Component
 * Bottom sheet modal for adding a new food category to a meal
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, borderRadius, shadows, categoryTypes } from '../constants';
import { t } from '../translations';
import type { FoodCategory, CategoryType } from '../types';

interface AddCategorySheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (category: FoodCategory) => void;
    mealName: string;
}

export function AddCategorySheet({
    visible,
    onClose,
    onSave,
    mealName,
}: AddCategorySheetProps) {
    const insets = useSafeAreaInsets();
    const [selectedType, setSelectedType] = useState<CategoryType | null>(null);
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (!selectedType) return;

        const categoryType = categoryTypes.find(c => c.id === selectedType);
        if (!categoryType) return;

        const newCategory: FoodCategory = {
            id: `cat-${Date.now()}`,
            name: categoryType.name,
            nameAr: categoryType.nameAr,
            description: description.trim() || undefined,
            descriptionAr: description.trim() || undefined,
        };

        onSave(newCategory);
        handleClose();
    };

    const handleClose = () => {
        setSelectedType(null);
        setDescription('');
        onClose();
    };

    const isValid = selectedType !== null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <Pressable style={styles.backdrop} onPress={handleClose}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                </Pressable>

                <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                        <Text style={[styles.title, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.addCategory}
                        </Text>
                        <Text style={[styles.subtitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {mealName}
                        </Text>
                    </View>

                    {/* Category Type Selection */}
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {t.selectCategoryType}
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.typeList, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                    >
                        {categoryTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeChip,
                                    selectedType === type.id && styles.typeChipSelected,
                                ]}
                                onPress={() => setSelectedType(type.id as CategoryType)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                                <Text style={[
                                    styles.typeLabel,
                                    selectedType === type.id && styles.typeLabelSelected,
                                ]}>
                                    {isRTL ? type.nameAr : type.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Description Input */}
                    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {t.itemDescription}
                    </Text>
                    <TextInput
                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                        placeholder={t.itemDescriptionPlaceholder}
                        placeholderTextColor={mealPlanColors.textDesc}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                    />

                    {/* Actions */}
                    <View style={[styles.actions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                !isValid && styles.saveButtonDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={!isValid}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.saveButtonText}>{t.save}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: mealPlanColors.backdrop,
    },
    sheet: {
        backgroundColor: mealPlanColors.cardLight,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingTop: verticalScale(8),
        paddingHorizontal: horizontalScale(20),
        ...shadows.bottomSheet,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    handle: {
        width: horizontalScale(36),
        height: verticalScale(4),
        backgroundColor: mealPlanColors.border,
        borderRadius: borderRadius.full,
    },
    header: {
        marginBottom: verticalScale(20),
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: mealPlanColors.textMain,
        marginBottom: verticalScale(4),
    },
    subtitle: {
        fontSize: ScaleFontSize(14),
        color: mealPlanColors.textDesc,
    },
    sectionTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
        marginBottom: verticalScale(12),
    },
    typeList: {
        gap: horizontalScale(8),
        paddingBottom: verticalScale(16),
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(10),
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeChipSelected: {
        backgroundColor: `${mealPlanColors.primary}15`,
        borderColor: mealPlanColors.primary,
    },
    typeEmoji: {
        fontSize: ScaleFontSize(16),
    },
    typeLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    typeLabelSelected: {
        color: mealPlanColors.primary,
    },
    input: {
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: `${mealPlanColors.border}80`,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        fontSize: ScaleFontSize(14),
        color: mealPlanColors.textMain,
        minHeight: verticalScale(60),
        marginBottom: verticalScale(20),
    },
    actions: {
        gap: horizontalScale(12),
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(14),
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
    },
    saveButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(14),
        backgroundColor: mealPlanColors.primary,
        borderRadius: borderRadius.md,
        ...shadows.primaryButton,
    },
    saveButtonDisabled: {
        backgroundColor: mealPlanColors.textDesc,
        ...shadows.card,
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: 'white',
    },
});
