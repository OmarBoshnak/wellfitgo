import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    TextInput,
    Switch,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, ImagePlus, Settings2 } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { usePlanMutations } from '../hooks/usePlanMutations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const t = {
    createCategory: isRTL ? 'إنشاء فئة جديدة' : 'Create New Category',
    chooseIcon: isRTL ? 'اختر الأيقونة' : 'Choose Icon',
    categoryNameEn: isRTL ? 'اسم الفئة (بالإنجليزية)' : 'Category Name (English)',
    categoryNameAr: isRTL ? 'اسم الفئة (بالعربية)' : 'Category Name (Arabic)',
    description: isRTL ? 'الوصف' : 'Description',
    enterCategoryName: isRTL ? 'أدخل اسم الفئة...' : 'Enter category name...',
    enterCategoryNameAr: 'أدخل اسم الفئة...',
    descriptionPlaceholder: isRTL ? 'وصف هذه الفئة الغذائية...' : 'Describe this diet category...',
    baseCalorieRanges: isRTL ? 'نطاقات السعرات الأساسية' : 'Base Calorie Ranges',
    autoGenerate: isRTL ? 'توليد 14 نطاق تلقائيًا (1000-2500 كيلو كالوري)' : 'Auto-generate 14 ranges (1000-2500 kcal)',
    configureCustom: isRTL ? 'تكوين نطاقات مخصصة بدلاً من ذلك' : 'Configure custom ranges instead',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    createCategoryBtn: isRTL ? 'إنشاء الفئة' : 'Create Category',
    creating: isRTL ? 'جاري الإنشاء...' : 'Creating...',
    error: isRTL ? 'حدث خطأ' : 'Error occurred',
};

const ICON_OPTIONS = ['🥗', '🥩', '🥑', '🧈', '🥬', '🏥', '⏰', '🩺', '🍳', '🥜', '🍎', '🥛'];

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void; // Called after successful creation
}

export default function CreateCategoryModal({ visible, onClose, onSuccess }: Props) {
    const [selectedEmoji, setSelectedEmoji] = useState('🥗');
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [description, setDescription] = useState('');
    const [autoGenerateRanges, setAutoGenerateRanges] = useState(true);

    const { createDietPlan, isLoading, error } = usePlanMutations();

    const resetForm = () => {
        setSelectedEmoji('🥗');
        setNameEn('');
        setNameAr('');
        setDescription('');
        setAutoGenerateRanges(true);
    };

    const handleCreate = async () => {
        try {
            await createDietPlan({
                name: nameEn.trim(),
                nameAr: nameAr.trim() || undefined,
                emoji: selectedEmoji,
                description: description.trim() || undefined,
                type: 'custom', // New categories default to custom type
            });

            resetForm();
            onSuccess?.();
            onClose();
        } catch (err) {
            // Error is already captured by usePlanMutations hook
            console.error('Failed to create category:', err);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isFormValid = nameEn.trim().length > 0 && !isLoading;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Drag Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.headerTitle}>{t.createCategory}</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <X size={horizontalScale(24)} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{t.error}: {error.message}</Text>
                        </View>
                    )}

                    {/* Scrollable Content */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.contentContainer}
                    >
                        {/* Icon Selection */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.chooseIcon}
                            </Text>
                            <View style={styles.iconGrid}>
                                {/* Custom Upload Button */}
                                <TouchableOpacity style={styles.uploadButton}>
                                    <ImagePlus size={horizontalScale(20)} color={colors.primaryDark} />
                                </TouchableOpacity>

                                {/* Icon Options */}
                                {ICON_OPTIONS.map((emoji, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.iconButton,
                                            selectedEmoji === emoji && styles.iconButtonActive,
                                        ]}
                                        onPress={() => setSelectedEmoji(emoji)}
                                    >
                                        <Text style={styles.iconEmoji}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            {/* English Name */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {t.categoryNameEn}
                                </Text>
                                <TextInput
                                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                    placeholder={t.enterCategoryName}
                                    placeholderTextColor={colors.textSecondary}
                                    value={nameEn}
                                    onChangeText={setNameEn}
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Arabic Name */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {t.categoryNameAr}
                                </Text>
                                <TextInput
                                    style={[styles.input, { textAlign: 'right' }]}
                                    placeholder={t.enterCategoryNameAr}
                                    placeholderTextColor={colors.textSecondary}
                                    value={nameAr}
                                    onChangeText={setNameAr}
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Description */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {t.description}
                                </Text>
                                <TextInput
                                    style={[styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                                    placeholder={t.descriptionPlaceholder}
                                    placeholderTextColor={colors.textSecondary}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Toggle Switch Section */}
                        <View style={styles.toggleSection}>
                            <View style={[styles.toggleCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={styles.toggleInfo}>
                                    <Text style={[styles.toggleTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                                        {t.baseCalorieRanges}
                                    </Text>
                                    <Text style={[styles.toggleSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                                        {t.autoGenerate}
                                    </Text>
                                </View>
                                <Switch
                                    value={autoGenerateRanges}
                                    onValueChange={setAutoGenerateRanges}
                                    trackColor={{ false: '#E2E8F0', true: colors.primaryDark }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor="#E2E8F0"
                                    disabled={isLoading}
                                />
                            </View>

                            {/* Configure Custom Link */}
                            <TouchableOpacity style={[styles.configureLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Settings2 size={horizontalScale(16)} color={colors.primaryDark} />
                                <Text style={styles.configureLinkText}>{t.configureCustom}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Spacer for scroll clearance */}
                        <View style={{ height: verticalScale(24) }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isLoading}>
                            <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.createButtonWrapper}
                            onPress={handleCreate}
                            disabled={!isFormValid}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={isFormValid ? gradients.primary : ['#E1E8EF', '#E1E8EF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.createButton}
                            >
                                {isLoading ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                        <Text style={styles.createButtonText}>{t.creating}</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={[
                                            styles.createButtonText,
                                            !isFormValid && styles.createButtonTextDisabled
                                        ]}>
                                            {t.createCategoryBtn}
                                        </Text>
                                        <Check size={horizontalScale(20)} color={isFormValid ? '#FFFFFF' : colors.textSecondary} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: horizontalScale(24),
        borderTopRightRadius: horizontalScale(24),
        height: SCREEN_HEIGHT * 0.85,
        flexDirection: 'column',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(8),
    },
    handle: {
        width: horizontalScale(40),
        height: verticalScale(6),
        backgroundColor: '#E2E8F0',
        borderRadius: horizontalScale(3),
    },
    // Header
    header: {
        paddingHorizontal: horizontalScale(20),
        paddingBottom: verticalScale(16),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: horizontalScale(8),
        marginRight: horizontalScale(-8),
        borderRadius: horizontalScale(20),
    },
    // Error Banner
    errorBanner: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(12),
    },
    errorText: {
        fontSize: ScaleFontSize(14),
        color: '#DC2626',
        textAlign: 'center',
    },
    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: horizontalScale(20),
        paddingTop: verticalScale(20),
    },
    section: {
        marginBottom: verticalScale(24),
    },
    label: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: verticalScale(12),
    },
    // Icon Grid
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: horizontalScale(12),
    },
    uploadButton: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.primaryDark,
        backgroundColor: 'rgba(80, 115, 254, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButton: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    iconButtonActive: {
        backgroundColor: colors.bgPrimary,
        borderWidth: 2,
        borderColor: colors.primaryDark,
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    iconEmoji: {
        fontSize: ScaleFontSize(20),
    },
    // Form
    formSection: {
        gap: verticalScale(16),
    },
    inputGroup: {
        marginBottom: verticalScale(4),
    },
    input: {
        height: verticalScale(44),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    textArea: {
        minHeight: verticalScale(88),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    // Toggle Section
    toggleSection: {
        marginTop: verticalScale(24),
    },
    toggleCard: {
        padding: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flex: 1,
        paddingRight: horizontalScale(16),
    },
    toggleTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    toggleSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    configureLink: {
        marginTop: verticalScale(12),
        marginLeft: horizontalScale(4),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    configureLinkText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    // Footer
    footer: {
        paddingHorizontal: horizontalScale(20),
        paddingTop: verticalScale(16),
        paddingBottom: verticalScale(32),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: horizontalScale(16),
        backgroundColor: colors.bgPrimary,
    },
    cancelButton: {
        flex: 1,
        height: verticalScale(48),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: horizontalScale(12),
    },
    cancelButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    createButtonWrapper: {
        flex: 2,
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    createButton: {
        height: verticalScale(48),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
    },
    createButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    createButtonTextDisabled: {
        color: colors.textSecondary,
    },
});
