import React, { useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// Lazy imports to avoid crash if native modules not available
let ImagePicker: any = null;
let DocumentPicker: any = null;
try {
    ImagePicker = require('expo-image-picker');
} catch (e) {
    console.log('expo-image-picker not available');
}
try {
    DocumentPicker = require('expo-document-picker');
} catch (e) {
    console.log('expo-document-picker not available');
}

// Arabic translations (app is RTL by default)
const t = {
    shareContent: 'مشاركة محتوى',
    photoLibrary: 'الصور',
    photoLibraryDesc: 'اختر من المعرض',
    document: 'مستند',
    documentDesc: 'رفع ملف PDF أو تقرير',
    mealPlan: 'الخطة الغذائية',
    mealPlanDesc: 'إرفاق خطة أسبوعية',
    cancel: 'إلغاء',
    notAvailable: 'غير متاح',
    rebuildRequired: 'يرجى إعادة بناء التطبيق لتفعيل هذه الميزة',
};

export interface AttachmentResult {
    type: 'image' | 'document' | 'mealPlan';
    uri?: string;
    name?: string;
    mimeType?: string;
    mealPlanId?: string;
    mealPlanName?: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onAttachmentSelected: (result: AttachmentResult) => void;
    onMealPlanPress: () => void;
}

interface AttachmentOption {
    id: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
    onPress: () => void;
}

export default function AttachmentSheet({ visible, onClose, onAttachmentSelected, onMealPlanPress }: Props) {
    const insets = useSafeAreaInsets();

    const handlePhotoLibrary = useCallback(async () => {
        if (!ImagePicker) {
            Alert.alert(t.notAvailable, t.rebuildRequired);
            return;
        }

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                console.log('Gallery permission denied');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                onAttachmentSelected({
                    type: 'image',
                    uri: result.assets[0].uri,
                    name: result.assets[0].fileName || 'image.jpg',
                    mimeType: result.assets[0].mimeType,
                });
                onClose();
            }
        } catch (error) {
            console.log('Error picking image:', error);
        }
    }, [onAttachmentSelected, onClose]);

    const handleDocument = useCallback(async () => {
        if (!DocumentPicker) {
            Alert.alert(t.notAvailable, t.rebuildRequired);
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                onAttachmentSelected({
                    type: 'document',
                    uri: result.assets[0].uri,
                    name: result.assets[0].name,
                    mimeType: result.assets[0].mimeType,
                });
                onClose();
            }
        } catch (error) {
            console.log('Error picking document:', error);
        }
    }, [onAttachmentSelected, onClose]);

    const handleMealPlan = useCallback(() => {
        onClose();
        setTimeout(() => onMealPlanPress(), 300);
    }, [onClose, onMealPlanPress]);

    const options: AttachmentOption[] = [
        {
            id: 'photo',
            icon: 'photo-library',
            iconColor: '#A855F7',
            bgColor: 'rgba(168, 85, 247, 0.1)',
            title: t.photoLibrary,
            description: t.photoLibraryDesc,
            onPress: handlePhotoLibrary,
        },
        {
            id: 'document',
            icon: 'description',
            iconColor: '#F97316',
            bgColor: 'rgba(249, 115, 22, 0.1)',
            title: t.document,
            description: t.documentDesc,
            onPress: handleDocument,
        },
        {
            id: 'mealPlan',
            icon: 'restaurant-menu',
            iconColor: '#EA5757',
            bgColor: 'rgba(234, 87, 87, 0.1)',
            title: t.mealPlan,
            description: t.mealPlanDesc,
            onPress: handleMealPlan,
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View />
            </Pressable>

            {/* Sheet */}
            <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
                {/* Drag Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Title */}
                <Text style={styles.title}>{t.shareContent}</Text>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.option}
                            onPress={option.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: option.bgColor }]}>
                                <MaterialIcons name={option.icon} size={24} color={option.iconColor} />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionDescription}>{option.description}</Text>
                            </View>
                            <MaterialIcons name="chevron-left" size={24} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Cancel Button */}
                <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
                    <Text style={styles.cancelText}>{t.cancel}</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: horizontalScale(32),
        borderTopRightRadius: horizontalScale(32),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(8),
    },
    handle: {
        width: horizontalScale(48),
        height: verticalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: colors.border,
    },
    title: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: verticalScale(16),
    },
    optionsContainer: {
        paddingHorizontal: horizontalScale(16),
        gap: verticalScale(8),
    },
    option: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingVertical: verticalScale(14),
        paddingHorizontal: horizontalScale(16),
        borderRadius: horizontalScale(16),
        gap: horizontalScale(16),
    },
    iconContainer: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        flex: 1,
        alignItems: 'flex-end', // RTL
    },
    optionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: colors.textPrimary,
        textAlign: 'right',
    },
    optionDescription: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
        textAlign: 'right',
    },
    cancelButton: {
        marginTop: verticalScale(16),
        marginHorizontal: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
    },
    cancelText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
});
