import React from 'react';
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
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ChatMessage } from './types';

// Lazy imports for optional dependencies
let Clipboard: any = null;
let Speech: any = null;
try {
    Clipboard = require('expo-clipboard');
} catch (e) {
    console.log('expo-clipboard not available');
}
try {
    Speech = require('expo-speech');
} catch (e) {
    console.log('expo-speech not available');
}

// Arabic translations
const t = {
    reply: 'رد',
    undoSend: 'التراجع عن الإرسال',
    edit: 'تعديل',
    copy: 'نسخ',
    translate: 'ترجمة',
    speak: 'نطق',
    more: 'المزيد...',
    cancel: 'إلغاء',
    deleteConfirmTitle: 'حذف الرسالة',
    deleteConfirmMessage: 'هل أنت متأكد من حذف هذه الرسالة؟',
    delete: 'حذف',
    copied: 'تم النسخ',
};

interface Props {
    visible: boolean;
    message: ChatMessage | null;
    isOwner: boolean;
    onClose: () => void;
    onReply: (message: ChatMessage) => void;
    onEdit: (message: ChatMessage) => void;
    onDelete: (message: ChatMessage) => void;
}

interface ActionOption {
    id: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    iconColor: string;
    bgColor: string;
    title: string;
    onPress: () => void;
    disabled?: boolean;
    hidden?: boolean;
}

export default function MessageActionsSheet({
    visible,
    message,
    isOwner,
    onClose,
    onReply,
    onEdit,
    onDelete,
}: Props) {
    const insets = useSafeAreaInsets();

    if (!message) return null;

    const handleCopy = async () => {
        if (Clipboard) {
            await Clipboard.setStringAsync(message.content);
        }
        onClose();
    };

    const handleSpeak = () => {
        if (Speech) {
            Speech.speak(message.content, {
                language: 'ar-SA',
            });
        }
        onClose();
    };

    const handleTranslate = () => {
        // TODO: Implement translation - could use Google Translate API
        console.log('Translate:', message.content);
        onClose();
    };

    const handleReply = () => {
        onReply(message);
        onClose();
    };

    const handleEdit = () => {
        onEdit(message);
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            t.deleteConfirmTitle,
            t.deleteConfirmMessage,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: () => {
                        onDelete(message);
                        onClose();
                    },
                },
            ]
        );
    };

    const handleMore = () => {
        // TODO: Implement more options
        console.log('More options');
        onClose();
    };


    // Build options based on ownership and message state
    const options: ActionOption[] = [
        {
            id: 'reply',
            icon: 'reply',
            iconColor: '#5073FE',
            bgColor: 'rgba(80, 115, 254, 0.1)',
            title: t.reply,
            onPress: handleReply,
        },
        {
            id: 'undoSend',
            icon: 'undo',
            iconColor: '#EF4444',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            title: t.undoSend,
            onPress: handleDelete,
            hidden: !isOwner || message.isDeleted,
        },
        {
            id: 'edit',
            icon: 'edit',
            iconColor: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            title: t.edit,
            onPress: handleEdit,
            hidden: !isOwner || message.isDeleted || message.type !== 'text',
        },
        {
            id: 'copy',
            icon: 'content-copy',
            iconColor: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.1)',
            title: t.copy,
            onPress: handleCopy,
            hidden: message.isDeleted,
        },
    ];

    const visibleOptions = options.filter(opt => !opt.hidden);

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

                {/* Message Preview */}
                <View style={styles.previewContainer}>
                    <Text style={styles.previewText} numberOfLines={2}>
                        {message.content}
                    </Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {visibleOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.option}
                            onPress={option.onPress}
                            activeOpacity={0.7}
                            disabled={option.disabled}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: option.bgColor }]}>
                                <MaterialIcons name={option.icon} size={22} color={option.iconColor} />
                            </View>
                            <Text style={styles.optionTitle}>{option.title}</Text>
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
        borderTopLeftRadius: horizontalScale(24),
        borderTopRightRadius: horizontalScale(24),
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
        width: horizontalScale(40),
        height: verticalScale(4),
        borderRadius: horizontalScale(2),
        backgroundColor: colors.border,
    },
    previewContainer: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    previewText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(16),
        gap: horizontalScale(12),
    },
    option: {
        alignItems: 'center',
        width: horizontalScale(70),
        gap: verticalScale(8),
    },
    iconContainer: {
        width: horizontalScale(50),
        height: horizontalScale(50),
        borderRadius: horizontalScale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTitle: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: verticalScale(8),
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
