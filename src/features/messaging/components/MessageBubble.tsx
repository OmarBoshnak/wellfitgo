import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ChatMessage } from './types';
import VoiceMessageBubble from './VoiceMessageBubble';
import { isRTL } from '@/src/core/i18n';

// Arabic translations
const t = {
    voiceMessage: 'رسالة صوتية',
    edited: 'تم التعديل',
    deleted: 'تم حذف هذه الرسالة',
};

interface Props {
    message: ChatMessage;
    showAvatar: boolean;
    avatarUri?: string;
    onLongPress?: (message: ChatMessage) => void;
}

const MessageBubble = React.memo(function MessageBubble({ message, showAvatar, avatarUri, onLongPress }: Props) {
    const isMe = message.sender === 'me';
    const isSystem = message.type === 'system';
    const isAudio = message.type === 'audio';
    const isDeleted = message.isDeleted;
    const isEdited = message.isEdited && !isDeleted;

    const handleLongPress = () => {
        if (onLongPress && !isSystem) {
            onLongPress(message);
        }
    };

    // System message (centered pill)
    if (isSystem) {
        return (
            <View style={styles.systemContainer}>
                <View style={styles.systemBubble}>
                    <Text style={styles.systemText}>{message.content}</Text>
                </View>
            </View>
        );
    }

    // Audio message - use VoiceMessageBubble
    if (isAudio && message.audioUri && !isDeleted) {
        return (
            <Pressable
                onLongPress={handleLongPress}
                delayLongPress={300}
                onPress={() => { }}
                android_ripple={{ color: 'transparent' }}
            >
                <VoiceMessageBubble
                    id={message.id}
                    audioUri={message.audioUri}
                    duration={message.audioDuration}
                    isMine={isMe}
                    timestamp={message.timestamp}
                />
            </Pressable>
        );
    }

    // Deleted message placeholder
    if (isDeleted) {
        return (
            <View style={[styles.container, isMe ? styles.containerMe : styles.containerClient]}>
                {!isMe && (
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder} />
                    </View>
                )}
                <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperClient]}>
                    <View style={[styles.bubble, styles.bubbleDeleted]}>
                        <MaterialIcons name="block" size={16} color="#9CA3AF" style={styles.deletedIcon} />
                        <Text style={styles.textDeleted}>{t.deleted}</Text>
                    </View>
                    <View style={[styles.metaRow, isMe ? styles.metaRowMe : styles.metaRowClient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                    </View>
                </View>
            </View>
        );
    }

    // Regular text message bubble
    return (
        <Pressable
            onLongPress={handleLongPress}
            delayLongPress={300}
            onPress={() => { }}
            android_ripple={{ color: 'transparent' }}
        >
            <View style={[styles.container, isMe ? styles.containerMe : styles.containerClient]}>
                {/* Avatar placeholder for alignment (client messages) */}
                {!isMe && (
                    <View style={styles.avatarContainer}>
                        {showAvatar && avatarUri ? (
                            <View style={[styles.avatar, { backgroundImage: `url(${avatarUri})` }]} />
                        ) : (
                            <View style={styles.avatarPlaceholder} />
                        )}
                    </View>
                )}

                <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperClient]}>
                    {/* Bubble */}
                    {isMe ? (
                        <LinearGradient
                            colors={['#5073FE', '#02C3CD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.bubble, styles.bubbleMe]}
                        >
                            <Text style={styles.textMe}>{message.content}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[styles.bubble, styles.bubbleClient]}>
                            <Text style={styles.textClient}>{message.content}</Text>
                        </View>
                    )}

                    {/* Timestamp, read status, and edited label */}
                    <View style={[styles.metaRow, isMe ? styles.metaRowMe : styles.metaRowClient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {isEdited && (
                            <Text style={styles.editedLabel}>{t.edited}</Text>
                        )}
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                        {isMe && message.status === 'read' && (
                            <MaterialIcons name="done-all" size={16} color={colors.primaryDark} />
                        )}
                        {isMe && message.status === 'sent' && (
                            <MaterialIcons name="done" size={16} color="#AAB8C5" />
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

export default MessageBubble;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: horizontalScale(16),
        marginVertical: verticalScale(2),
    },
    containerMe: {
        flexDirection: 'row-reverse', // RTL for my messages
        justifyContent: 'flex-end',
    },
    containerClient: {
        flexDirection: 'row-reverse', // RTL for client messages too
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: horizontalScale(4),
    },
    avatar: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(14),
        backgroundColor: colors.bgSecondary,
    },
    avatarPlaceholder: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        opacity: 0,
    },
    bubbleWrapper: {
        maxWidth: '75%',
    },
    bubbleWrapperMe: {
        alignItems: 'flex-start', // RTL: my messages align right
    },
    bubbleWrapperClient: {
        alignItems: 'flex-end', // RTL: client messages align left
    },
    bubble: {
        padding: horizontalScale(12),
        borderRadius: horizontalScale(16),
    },
    bubbleMe: {
        borderBottomRightRadius: horizontalScale(4), // RTL: tail on left
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bubbleClient: {
        backgroundColor: colors.bgPrimary,
        borderBottomRightRadius: horizontalScale(4), // RTL: tail on right
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    textMe: {
        fontSize: ScaleFontSize(14),
        lineHeight: ScaleFontSize(20),
        color: '#FFFFFF',
        textAlign: 'right',
    },
    textClient: {
        fontSize: ScaleFontSize(14),
        lineHeight: ScaleFontSize(20),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    metaRow: {
        alignItems: 'center',
        gap: horizontalScale(4),
        marginTop: verticalScale(4),
    },
    metaRowMe: {
        justifyContent: 'flex-end', // RTL
        marginLeft: horizontalScale(4),
    },
    metaRowClient: {
        justifyContent: 'flex-start', // RTL
        marginRight: horizontalScale(4),
    },
    timestamp: {
        fontSize: ScaleFontSize(11),
        color: '#AAB8C5',
    },
    // System message
    systemContainer: {
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    systemBubble: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(6),
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: colors.border,
    },
    systemText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#8093A5',
        textAlign: 'center',
    },
    // Deleted message styles
    bubbleDeleted: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    textDeleted: {
        fontSize: ScaleFontSize(13),
        fontStyle: 'italic',
        color: '#9CA3AF',
        textAlign: 'right',
    },
    deletedIcon: {
        marginLeft: horizontalScale(4),
    },
    // Edited label
    editedLabel: {
        fontSize: ScaleFontSize(10),
        fontStyle: 'italic',
        color: '#9CA3AF',
        marginRight: horizontalScale(4),
    },
});
