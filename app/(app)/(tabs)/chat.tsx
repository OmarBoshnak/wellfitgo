import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '@/src/core/constants/Themes';
import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';

const ChatScreen = () => {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Convex queries and mutations
    const conversation = useQuery(api.chat.getMyConversation);
    const conversationId = conversation && !Array.isArray(conversation) ? conversation._id : undefined;
    const messages = useQuery(api.chat.getMessages, conversationId ? { conversationId } : "skip");

    const sendMessageMutation = useMutation(api.chat.sendMessage);
    const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
    const markAsRead = useMutation(api.chat.markAsRead);

    // Mark messages as read when viewing
    useEffect(() => {
        if (conversationId) {
            markAsRead({ conversationId }).catch(console.error);
        }
    }, [conversationId, messages?.length]);

    const handleSend = async () => {
        if (message.trim() && conversationId) {
            try {
                await sendMessageMutation({
                    conversationId,
                    content: message.trim(),
                    messageType: "text",
                });
                setMessage('');
            } catch (error) {
                console.error('[Chat] Failed to send message:', error);
                Alert.alert(
                    isRTL ? 'خطأ' : 'Error',
                    isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'
                );
            }
        }
    };

    const handlePickImage = async () => {
        if (!conversationId) return;

        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                isRTL ? 'تحتاج إذن' : 'Permission needed',
                isRTL ? 'نحتاج إذن للوصول للصور' : 'We need permission to access your photos'
            );
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setIsUploading(true);
            try {
                // Get upload URL
                const uploadUrl = await generateUploadUrl();

                // Upload image
                const response = await fetch(result.assets[0].uri);
                const blob = await response.blob();

                const uploadResponse = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': blob.type },
                    body: blob,
                });

                const { storageId } = await uploadResponse.json();

                // Send message with image
                await sendMessageMutation({
                    conversationId,
                    content: isRTL ? '📷 صورة' : '📷 Image',
                    messageType: "image",
                    mediaUrl: storageId,
                });
            } catch (error) {
                console.error('[Chat] Failed to upload image:', error);
                Alert.alert(
                    isRTL ? 'خطأ' : 'Error',
                    isRTL ? 'فشل رفع الصورة' : 'Failed to upload image'
                );
            } finally {
                setIsUploading(false);
            }
        }
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleVoiceNote = () => {
        console.log('Voice note started');
        // TODO: Implement actual voice recording
    };

    // Get current user ID for message alignment
    const currentUser = useQuery(api.users.getMe);
    const currentUserId = currentUser?._id;

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isTyping = message.trim().length > 0;
    const commonEmojis = [
        '😊', '😂', '🥰', '😍', '😒', '😭', '😩', '😤',
        '😡', '👍', '👎', '👌', '🙏', '💪', '🔥', '✨',
        '🎉', '💯', '👏', '👀', '🤣', '🤔', '😎', '😴'
    ];

    const toggleEmojiPicker = () => {
        if (showEmojiPicker) {
            setShowEmojiPicker(false);
            // Keyboard logic if creating a complex input experience, usually focus input
        } else {
            Keyboard.dismiss();
            setShowEmojiPicker(true);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setMessage(prev => prev + emoji);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={[styles.headerContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>S</Text>
                        </View>
                        <View style={styles.onlineIndicator} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerName, isRTL && styles.textRTL]}>
                            {isRTL ? 'سارة أحمد' : 'Sarah Ahmed'}
                        </Text>
                        <Text style={[styles.headerStatus, isRTL && styles.textRTL]}>
                            {isRTL ? 'عادة ترد خلال ساعتين' : 'Usually replies within 2 hours'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Messages Area */}
            <ScrollView
                keyboardShouldPersistTaps="handled"
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onTouchStart={() => {
                    // Tap on chat area dismisses everything
                    if (showEmojiPicker) setShowEmojiPicker(false);
                    Keyboard.dismiss();
                }}
            >
                {/* Loading state */}
                {messages === undefined && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primaryDark} />
                    </View>
                )}

                {/* Empty state */}
                {messages && messages.length === 0 && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                        <Text style={{ fontSize: 64, marginBottom: 16 }}>💬</Text>
                        <Text style={[{ fontSize: 16, color: colors.textSecondary, textAlign: 'center' }]}>
                            {isRTL ? 'ابدأ المحادثة مع مدربك!' : 'Start a conversation with your coach!'}
                        </Text>
                    </View>
                )}

                {/* Messages list */}
                {messages && messages.map((msg) => {
                    const isUser = msg.senderId === currentUserId;
                    const isRead = isUser ? msg.isReadByCoach : msg.isReadByClient;
                    return (
                        <View
                            key={msg._id}
                            style={[
                                styles.messageRow,
                                isUser ? (isRTL ? styles.rowLeft : styles.rowRight) : (isRTL ? styles.rowRight : styles.rowLeft)
                            ]}
                        >
                            <View
                                style={[
                                    styles.messageBubble,
                                    isUser ? styles.bubbleUser : styles.bubbleCoach,
                                    isUser
                                        ? (isRTL ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 })
                                        : (isRTL ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
                                ]}
                            >
                                {msg.messageType === 'image' && msg.mediaUrl && (
                                    <Image
                                        source={{ uri: msg.mediaUrl }}
                                        style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }}
                                        resizeMode="cover"
                                    />
                                )}
                                <Text style={[
                                    styles.messageText,
                                    isUser ? styles.textUser : styles.textCoach,
                                    isRTL && { textAlign: 'right' }
                                ]}>
                                    {msg.content}
                                </Text>
                            </View>
                            <View style={[
                                styles.messageMeta,
                                isUser ? (isRTL ? styles.metaLeft : styles.metaRight) : (isRTL ? styles.metaRight : styles.metaLeft)
                            ]}>
                                <Text style={styles.timeText}>{formatTime(msg.createdAt)}</Text>
                                {isUser && (
                                    <Text style={styles.readStatus}>
                                        {isRead ? '✓✓' : '✓'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Input Area */}
            <View style={[styles.inputContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handlePickImage}
                    disabled={isUploading || !conversationId}
                >
                    {isUploading ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                        <Ionicons name="attach" size={24} color={colors.textSecondary} />
                    )}
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.textInput, isRTL && styles.textInputRTL]}
                        multiline
                        onFocus={() => setShowEmojiPicker(false)}
                    />
                </View>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={toggleEmojiPicker}
                >
                    <Ionicons
                        name={showEmojiPicker ? "keypad-outline" : "happy-outline"}
                        size={24}
                        color={showEmojiPicker ? colors.primaryDark : colors.textSecondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={isTyping ? handleSend : handleVoiceNote}
                    style={[
                        styles.sendButton,
                        isTyping ? styles.sendButtonActive : styles.sendButtonActive // Use active style for mic too, or same color
                    ]}
                >
                    <Ionicons
                        name={isTyping ? "send" : "mic"}
                        size={20}
                        color={colors.white}
                        style={isTyping && isRTL ? { transform: [{ rotate: '180deg' }] } : undefined}
                    />
                </TouchableOpacity>
            </View>

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <View style={styles.emojiPicker}>
                    {commonEmojis.map((emoji, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleEmojiSelect(emoji)}
                            style={styles.emojiItem}
                        >
                            <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: colors.white,
        fontSize: ScaleFontSize(18),
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.bgPrimary,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    headerStatus: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    textRTL: {
        textAlign: 'right',
    },
    phoneButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: horizontalScale(16),
        paddingVertical: verticalScale(24),
        gap: 16,
    },
    messageRow: {
        width: '100%',
        flexDirection: 'column', // Prepare for bubble and meta stacking
        marginBottom: 8,
    },
    rowLeft: {
        alignItems: 'flex-start',
    },
    rowRight: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        maxWidth: '75%',
        ...shadows.light,
    },
    bubbleUser: {
        backgroundColor: colors.primaryDark,
    },
    bubbleCoach: {
        backgroundColor: colors.bgPrimary,
    },
    messageText: {
        fontSize: ScaleFontSize(14),
        lineHeight: 20,
    },
    textUser: {
        color: colors.white,
    },
    textCoach: {
        color: colors.textPrimary,
    },
    messageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    metaLeft: {

    },
    metaRight: {
        flexDirection: 'row-reverse', // If aligned right, we might want to mirror? Or just default flow
        // Actually for meta under bubble, usually text alignment matches bubble alignment
    },
    timeText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    readStatus: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    quickRepliesContainer: {
        paddingVertical: 8,
        backgroundColor: colors.bgSecondary,
    },
    quickRepliesContent: {
        paddingHorizontal: horizontalScale(16),
        gap: 8,
    },
    quickRepliesContentRTL: {
        flexDirection: 'row-reverse', // To scroll from right if needed, but horizontal ScrollView handles contentContainerStyle RTL tricky.
        // Usually better to just reverse the array if we want strict right-to-left order visually or rely on I18nManager
        // If I18nManager is active, horizontal ScrollView usually flips. Let's trust standard behavior first.
    },
    quickReplyChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickReplyText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 8,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 40,
        maxHeight: 120,
        justifyContent: 'center',
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    textInputRTL: {
        textAlign: 'right',
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    sendButtonActive: {
        backgroundColor: colors.primaryDark,
    },
    sendButtonDisabled: {
        backgroundColor: colors.border,
    },
    emojiPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: colors.bgSecondary,
        height: 250,
        borderTopWidth: 1,
        borderColor: colors.border,
    },
    emojiItem: {
        width: '12.5%', // 8 items per row
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiText: {
        fontSize: 28,
    },
});

export default ChatScreen;
