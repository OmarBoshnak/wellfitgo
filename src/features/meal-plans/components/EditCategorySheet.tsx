/**
 * EditCategorySheet Component
 * Bottom sheet modal for editing or deleting an existing food category
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, borderRadius, shadows } from '../constants';
import { t } from '../translations';
import type { FoodCategory } from '../types';

interface EditCategorySheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (category: FoodCategory) => void;
    onDelete: () => void;
    category: FoodCategory | null;
}

export function EditCategorySheet({
    visible,
    onClose,
    onSave,
    onDelete,
    category,
}: EditCategorySheetProps) {
    const insets = useSafeAreaInsets();
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (category) {
            setDescription(isRTL ? (category.descriptionAr || '') : (category.description || ''));
        }
    }, [category]);

    const handleSave = () => {
        if (!category) return;

        const updatedCategory: FoodCategory = {
            ...category,
            description: description.trim() || undefined,
            descriptionAr: description.trim() || undefined,
        };

        onSave(updatedCategory);
        handleClose();
    };

    const handleDelete = () => {
        Alert.alert(
            t.deleteCategory,
            t.deleteCategoryConfirm,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: () => {
                        onDelete();
                        handleClose();
                    }
                },
            ]
        );
    };

    const handleClose = () => {
        setDescription('');
        onClose();
    };

    if (!category) return null;

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
                            {t.editCategory}
                        </Text>
                        <View style={[styles.categoryInfo, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryName}>
                                    {isRTL ? category.nameAr : category.name}
                                </Text>
                            </View>
                        </View>
                    </View>

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

                    {/* Delete Button */}
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={horizontalScale(18)}
                            color={mealPlanColors.statusRed}
                        />
                        <Text style={styles.deleteButtonText}>{t.deleteCategory}</Text>
                    </TouchableOpacity>

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
                            style={styles.saveButton}
                            onPress={handleSave}
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
        marginBottom: verticalScale(8),
    },
    categoryInfo: {
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: `${mealPlanColors.primary}15`,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: borderRadius.full,
    },
    categoryName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: mealPlanColors.primary,
    },
    sectionTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
        marginBottom: verticalScale(12),
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
        marginBottom: verticalScale(16),
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(12),
        marginBottom: verticalScale(16),
    },
    deleteButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: mealPlanColors.statusRed,
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
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: 'white',
    },
});
