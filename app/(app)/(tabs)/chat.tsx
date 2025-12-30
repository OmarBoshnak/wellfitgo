import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Alert,
    Animated,
    Pressable,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, shadows } from '@/src/core/constants/Themes';
import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import VoiceMessageBubble from '@/src/features/messaging/components/VoiceMessageBubble';

// Lazy import expo-av
let Audio: any = null;
try {
    Audio = require('expo-av').Audio;
} catch (e) {
    console.log('expo-av not available for client chat');
}

const ChatScreen = () => {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Voice recording state
    type RecordingState = 'idle' | 'recording' | 'paused';
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingRef = useRef<any>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';
    const isActiveRecording = recordingState !== 'idle';

    // Message actions state
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editText, setEditText] = useState('');
    const [replyingTo, setReplyingTo] = useState<any>(null);

    // Convex queries and mutations
    const conversation = useQuery(api.chat.getMyConversation);
    const conversationId = conversation && !Array.isArray(conversation) ? conversation._id : undefined;
    const messages = useQuery(api.chat.getMessages, conversationId ? { conversationId } : "skip");

    // Get assigned chat doctor info for header display
    const chatDoctor = useQuery(api.chat.getMyChatDoctor);

    // Get current user for subscription status check
    const currentUser = useQuery(api.users.getMe);
    const currentUserId = currentUser?._id;

    // Check if subscription allows chatting
    const isSubscriptionActive = currentUser?.subscriptionStatus === 'active' || currentUser?.subscriptionStatus === 'trial';
    const canSendMessages = isSubscriptionActive && !!chatDoctor && !!conversationId;

    const sendMessageMutation = useMutation(api.chat.sendMessage);
    const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
    const markAsRead = useMutation(api.chat.markAsRead);
    const editMessageMutation = useMutation(api.chat.editMessage);
    const deleteMessageMutation = useMutation(api.chat.deleteMessage);

    // Message action handlers
    const handleMessageLongPress = useCallback((msg: any) => {
        setSelectedMessage(msg);
        setShowActionSheet(true);
    }, []);

    const handleReply = useCallback((msg: any) => {
        setReplyingTo(msg);
        setShowActionSheet(false);
        setSelectedMessage(null);
    }, []);

    const handleEdit = useCallback((msg: any) => {
        setSelectedMessage(msg);
        setEditText(msg.content);
        setShowEditModal(true);
        setShowActionSheet(false);
    }, []);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedMessage || !editText.trim()) return;

        try {
            await editMessageMutation({
                messageId: selectedMessage._id,
                newContent: editText.trim(),
            });
            setShowEditModal(false);
            setSelectedMessage(null);
            setEditText('');
        } catch (error) {
            console.error('Edit error:', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل تعديل الرسالة' : 'Failed to edit message'
            );
        }
    }, [selectedMessage, editText, editMessageMutation]);

    const handleDelete = useCallback(async (msg: any) => {
        Alert.alert(
            isRTL ? 'حذف الرسالة' : 'Delete Message',
            isRTL ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?',
            [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                {
                    text: isRTL ? 'حذف' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMessageMutation({
                                messageId: msg._id,
                            });
                            setShowActionSheet(false);
                            setSelectedMessage(null);
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert(
                                isRTL ? 'خطأ' : 'Error',
                                isRTL ? 'فشل حذف الرسالة' : 'Failed to delete message'
                            );
                        }
                    },
                },
            ]
        );
    }, [deleteMessageMutation]);

    const handleCopy = useCallback(async (msg: any) => {
        try {
            const Clipboard = require('expo-clipboard');
            await Clipboard.setStringAsync(msg.content);
            setShowActionSheet(false);
            setSelectedMessage(null);
        } catch (e) {
            console.log('Copy failed:', e);
        }
    }, []);

    // Track previous message count to detect new messages
    const prevMessageCountRef = useRef<number>(0);
    const soundRef = useRef<any>(null);

    // Helper function to play a sound
    const playSound = useCallback(async (soundFile: any) => {
        if (!Audio) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
                soundFile,
                { shouldPlay: true, volume: 0.5 }
            );
            soundRef.current = sound;

            // Unload after playing
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (error) {
            console.log('Could not play sound:', error);
        }
    }, []);

    // Play sent sound
    const playSentSound = useCallback(() => {
        playSound(require('@/assets/sounds/message-sent.mp3'));
    }, [playSound]);

    // Play receive sound
    const playReceiveSound = useCallback(() => {
        playSound(require('@/assets/sounds/message-receive.mp3'));
    }, [playSound]);

    // Play notification sound when new message from doctor arrives
    useEffect(() => {
        if (messages && messages.length > 0) {
            const currentCount = messages.length;
            const prevCount = prevMessageCountRef.current;

            // Check if there's a new message
            if (currentCount > prevCount && prevCount > 0) {
                // Get the latest message
                const latestMessage = messages[messages.length - 1];

                // Only play receive sound if the message is from coach (not from current user)
                if (latestMessage.senderId !== currentUserId) {
                    playReceiveSound();
                }
            }

            prevMessageCountRef.current = currentCount;
        }
    }, [messages?.length, currentUserId, playReceiveSound]);

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
                playSentSound(); // Play sent sound
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
                playSentSound(); // Play sent sound
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

    // Timer functions for recording
    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Format duration as mm:ss
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Start voice recording
    const startRecording = async () => {
        if (!Audio) {
            Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'التسجيل الصوتي غير متاح' : 'Voice recording not available');
            return;
        }

        try {
            console.log('Requesting audio permissions...');
            const { status } = await Audio.requestPermissionsAsync();
            console.log('Permission status:', status);

            if (status !== 'granted') {
                Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى منح إذن الميكروفون' : 'Please grant microphone permission');
                return;
            }

            console.log('Setting audio mode for recording...');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            console.log('Creating recording...');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            console.log('Recording started successfully');
            recordingRef.current = recording;
            setRecordingState('recording');
            setRecordingDuration(0);
            startTimer();
        } catch (err) {
            console.log('Failed to start recording:', err);
            Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل بدء التسجيل' : 'Failed to start recording');
        }
    };

    // Pause recording
    const pauseRecording = async () => {
        if (!recordingRef.current) return;
        try {
            await recordingRef.current.pauseAsync();
            setRecordingState('paused');
            stopTimer();
        } catch (err) {
            console.log('Failed to pause recording:', err);
        }
    };

    // Resume recording
    const resumeRecording = async () => {
        if (!recordingRef.current) return;
        try {
            await recordingRef.current.startAsync();
            setRecordingState('recording');
            startTimer();
        } catch (err) {
            console.log('Failed to resume recording:', err);
        }
    };

    // Delete recording
    const deleteRecording = async () => {
        if (recordingRef.current) {
            try {
                await recordingRef.current.stopAndUnloadAsync();
            } catch (err) {
                console.log('Failed to stop recording:', err);
            }
        }
        recordingRef.current = null;
        setRecordingState('idle');
        setRecordingDuration(0);
        stopTimer();
    };

    // Send recording
    const sendRecording = async () => {
        if (!recordingRef.current || !conversationId) return;

        try {
            stopTimer();
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            const duration = recordingDuration * 1000;

            recordingRef.current = null;
            setRecordingState('idle');
            setRecordingDuration(0);

            if (uri) {
                setIsUploading(true);
                try {
                    // Upload to Convex
                    const uploadUrl = await generateUploadUrl();
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'audio/m4a' },
                        body: blob,
                    });
                    const { storageId } = await uploadResponse.json();

                    // Send message
                    await sendMessageMutation({
                        conversationId,
                        content: isRTL ? 'رسالة صوتية' : 'Voice message',
                        messageType: 'voice',
                        mediaUrl: storageId,
                        mediaDuration: duration,
                    });
                    playSentSound(); // Play sent sound
                } catch (err) {
                    console.log('Failed to upload voice:', err);
                    Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل إرسال الرسالة الصوتية' : 'Failed to send voice message');
                } finally {
                    setIsUploading(false);
                }
            }
        } catch (err) {
            console.log('Failed to send recording:', err);
        }
    };

    // Handle mic button press (toggles recording)
    const handleVoiceNote = () => {
        if (recordingState === 'idle') {
            startRecording();
        }
    };

    // Handle pause/resume toggle
    const handlePauseToggle = () => {
        if (recordingState === 'recording') {
            pauseRecording();
        } else if (recordingState === 'paused') {
            resumeRecording();
        }
    };

    // Doctor display info - use real data or fallback

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
                        {chatDoctor?.avatarUrl ? (
                            <Image source={{ uri: chatDoctor.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {chatDoctor?.firstName?.charAt(0) || (isRTL ? 'د' : 'D')}
                                </Text>
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerName, isRTL && styles.textRTL]}>
                            {chatDoctor
                                ? `${'Dr.'} ${chatDoctor.firstName} ${chatDoctor.lastName || ''}`.trim()
                                : (isRTL ? 'فريق الدعم' : 'Support Team')
                            }
                        </Text>
                        <Text style={[styles.headerStatus, isRTL && styles.textRTL]}>
                            {!chatDoctor
                                ? (isRTL ? 'في انتظار تعيين طبيب' : 'Waiting for doctor assignment')
                                : (isRTL ? 'عادة يرد خلال ساعتين' : 'Usually replies within 2 hours')
                            }
                        </Text>
                    </View>
                </View>
            </View>

            {/* Subscription Gating Banner */}
            {!isSubscriptionActive && (
                <View style={styles.subscriptionBanner}>
                    <Ionicons name="warning" size={20} color={colors.warning} />
                    <Text style={styles.subscriptionBannerText}>
                        {isRTL
                            ? 'اشتراكك غير نشط. جدد اشتراكك للمتابعة'
                            : 'Your subscription is not active. Renew to continue chatting'
                        }
                    </Text>
                </View>
            )}

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
                    const isDeleted = msg.isDeleted;

                    // Voice Message - show deleted text if deleted, otherwise show player
                    if (msg.messageType === 'voice') {
                        if (isDeleted) {
                            // Show deleted placeholder instead of voice bubble
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
                                            styles.deletedBubble,
                                            isUser
                                                ? (isRTL ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 })
                                                : (isRTL ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
                                        ]}
                                    >
                                        <Text style={styles.deletedText}>
                                            {isRTL ? 'تم حذف هذه الرسالة' : 'This message was deleted'}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.messageMeta,
                                        isUser ? (isRTL ? styles.metaLeft : styles.metaRight) : (isRTL ? styles.metaRight : styles.metaLeft)
                                    ]}>
                                        <Text style={styles.timeText}>{formatTime(msg.createdAt)}</Text>
                                    </View>
                                </View>
                            );
                        }
                        return (
                            <View
                                key={msg._id}
                                style={[
                                    styles.messageRow,
                                    isUser ? (isRTL ? styles.rowLeft : styles.rowRight) : (isRTL ? styles.rowRight : styles.rowLeft)
                                ]}
                            >
                                <VoiceMessageBubble
                                    id={msg._id}
                                    audioUri={msg.mediaUrl || msg.content}
                                    duration={msg.mediaDuration || 0}
                                    isMine={isUser}
                                    timestamp={formatTime(msg.createdAt)}
                                />
                            </View>
                        );
                    }

                    return (
                        <Pressable
                            key={msg._id}
                            onLongPress={() => {
                                if (!isDeleted) {
                                    handleMessageLongPress(msg);
                                }
                            }}
                            delayLongPress={300}
                            style={[
                                styles.messageRow,
                                isUser ? (isRTL ? styles.rowLeft : styles.rowRight) : (isRTL ? styles.rowRight : styles.rowLeft)
                            ]}
                        >
                            <View
                                style={[
                                    styles.messageBubble,
                                    isDeleted ? styles.deletedBubble : (isUser ? styles.bubbleUser : styles.bubbleCoach),
                                    isUser
                                        ? (isRTL ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 })
                                        : (isRTL ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
                                ]}
                            >
                                {!isDeleted && msg.messageType === 'image' && msg.mediaUrl && (
                                    <Image
                                        source={{ uri: msg.mediaUrl }}
                                        style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }}
                                        resizeMode="cover"
                                    />
                                )}
                                <Text style={[
                                    isDeleted ? styles.deletedText : styles.messageText,
                                    !isDeleted && (isUser ? styles.textUser : styles.textCoach),
                                    isRTL && { textAlign: 'right' }
                                ]}>
                                    {isDeleted ? (isRTL ? 'تم حذف هذه الرسالة' : 'This message was deleted') : msg.content}
                                </Text>
                            </View>
                            <View style={[
                                styles.messageMeta,
                                isUser ? (isRTL ? styles.metaLeft : styles.metaRight) : (isRTL ? styles.metaRight : styles.metaLeft)
                            ]}>
                                {isUser && (
                                    <MaterialIcons
                                        name={isRead ? "done-all" : "done"}
                                        size={16}
                                        color={isRead ? colors.primaryDark : colors.textSecondary}
                                    />
                                )}
                                <Text style={styles.timeText}>{formatTime(msg.createdAt)}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Input Area */}
            <View style={[styles.inputContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }, !canSendMessages && styles.inputContainerDisabled]}>
                {isActiveRecording ? (
                    // Recording UI
                    <>
                        {/* Delete Button */}
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                            onPress={deleteRecording}
                        >
                            <Ionicons name="trash" size={24} color="#EF4444" />
                        </TouchableOpacity>

                        {/* Timer */}
                        <View style={styles.recordingTimerContainer}>
                            <View style={styles.recordingIndicator} />
                            <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                        </View>

                        {isRecording ? (
                            // Pause button while recording
                            <TouchableOpacity
                                style={[styles.sendButton, styles.sendButtonActive]}
                                onPress={pauseRecording}
                            >
                                <Ionicons name="pause" size={20} color={colors.white} />
                            </TouchableOpacity>
                        ) : (
                            // Send button when paused
                            <TouchableOpacity
                                style={[styles.sendButton, styles.sendButtonActive]}
                                onPress={sendRecording}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Ionicons name="send" size={20} color={colors.white} style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
                                )}
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    // Normal Input UI
                    <>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handlePickImage}
                            disabled={isUploading || !canSendMessages}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color={colors.textSecondary} />
                            ) : (
                                <Ionicons name="attach" size={24} color={!canSendMessages ? colors.border : colors.textSecondary} />
                            )}
                        </TouchableOpacity>

                        <View style={[styles.inputWrapper, !canSendMessages && styles.inputWrapperDisabled]}>
                            <TextInput
                                value={message}
                                onChangeText={setMessage}
                                placeholder={!canSendMessages
                                    ? (isRTL ? 'الدردشة غير متاحة حالياً' : 'Chat is currently unavailable')
                                    : (isRTL ? 'اكتب رسالتك...' : 'Type your message...')
                                }
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.textInput, isRTL && styles.textInputRTL]}
                                multiline
                                onFocus={() => setShowEmojiPicker(false)}
                                editable={canSendMessages}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={toggleEmojiPicker}
                            disabled={!canSendMessages}
                        >
                            <Ionicons
                                name={showEmojiPicker ? "keypad-outline" : "happy-outline"}
                                size={24}
                                color={showEmojiPicker ? colors.primaryDark : (!canSendMessages ? colors.border : colors.textSecondary)}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={isTyping ? handleSend : handleVoiceNote}
                            style={[
                                styles.sendButton,
                                canSendMessages ? styles.sendButtonActive : styles.sendButtonDisabled
                            ]}
                            disabled={!canSendMessages || (isTyping && !message.trim())}
                        >
                            <Ionicons
                                name={isTyping ? "send" : "mic"}
                                size={20}
                                color={colors.white}
                                style={isTyping && isRTL ? { transform: [{ rotate: '180deg' }] } : undefined}
                            />
                        </TouchableOpacity>
                    </>
                )}
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

            {/* Message Actions Sheet */}
            <Modal
                visible={showActionSheet}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowActionSheet(false);
                    setSelectedMessage(null);
                }}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => {
                        setShowActionSheet(false);
                        setSelectedMessage(null);
                    }}
                >
                    <View />
                </Pressable>
                <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Handle */}
                    <View style={styles.sheetHandle} />

                    {/* Message Preview */}
                    {selectedMessage && (
                        <View style={styles.messagePreview}>
                            <Text style={styles.previewText} numberOfLines={2}>
                                {selectedMessage.content}
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                        {/* Reply */}
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => selectedMessage && handleReply(selectedMessage)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(80, 115, 254, 0.1)' }]}>
                                <Ionicons name="arrow-undo" size={22} color="#5073FE" />
                            </View>
                            <Text style={styles.actionLabel}>{isRTL ? 'رد' : 'Reply'}</Text>
                        </TouchableOpacity>

                        {/* Copy */}
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => selectedMessage && handleCopy(selectedMessage)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="copy" size={22} color="#10B981" />
                            </View>
                            <Text style={styles.actionLabel}>{isRTL ? 'نسخ' : 'Copy'}</Text>
                        </TouchableOpacity>

                        {/* Edit - only for own text messages */}
                        {selectedMessage?.senderId === currentUserId && selectedMessage?.messageType === 'text' && (
                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => selectedMessage && handleEdit(selectedMessage)}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <Ionicons name="pencil" size={22} color="#F59E0B" />
                                </View>
                                <Text style={styles.actionLabel}>{isRTL ? 'تعديل' : 'Edit'}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Delete - only for own messages */}
                        {selectedMessage?.senderId === currentUserId && (
                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => selectedMessage && handleDelete(selectedMessage)}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Ionicons name="trash" size={22} color="#EF4444" />
                                </View>
                                <Text style={styles.actionLabel}>{isRTL ? 'حذف' : 'Delete'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                            setShowActionSheet(false);
                            setSelectedMessage(null);
                        }}
                    >
                        <Text style={styles.cancelButtonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Edit Message Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.editModalBackdrop}>
                    <View style={styles.editModalContent}>
                        <Text style={styles.editModalTitle}>
                            {isRTL ? 'تعديل الرسالة' : 'Edit Message'}
                        </Text>
                        <TextInput
                            style={styles.editModalInput}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            autoFocus
                            textAlign={isRTL ? 'right' : 'left'}
                        />
                        <View style={styles.editModalButtons}>
                            <TouchableOpacity
                                style={styles.editModalButton}
                                onPress={() => {
                                    setShowEditModal(false);
                                    setEditText('');
                                }}
                            >
                                <Text style={styles.editModalButtonText}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.editModalButton, styles.editModalButtonPrimary]}
                                onPress={handleEditSubmit}
                            >
                                <Text style={[styles.editModalButtonText, styles.editModalButtonTextPrimary]}>
                                    {isRTL ? 'حفظ' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    deletedBubble: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    deletedText: {
        fontSize: ScaleFontSize(14),
        fontStyle: 'italic',
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
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    subscriptionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.warning + '20',
        paddingVertical: verticalScale(10),
        paddingHorizontal: horizontalScale(16),
        gap: 8,
    },
    subscriptionBannerText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    inputContainerDisabled: {
        opacity: 0.6,
    },
    inputWrapperDisabled: {
        backgroundColor: colors.border,
    },
    // Recording styles
    recordingTimerContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
    },
    recordingTimer: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: '#EF4444',
    },
    // Action Sheet Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    actionSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    messagePreview: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    previewText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    actionItem: {
        alignItems: 'center',
        width: 70,
        gap: 8,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: 8,
        marginHorizontal: 16,
        backgroundColor: colors.bgSecondary,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    // Edit Modal Styles
    editModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    editModalContent: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    editModalTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'right',
        marginBottom: 16,
    },
    editModalInput: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 12,
        padding: 12,
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: colors.border,
    },
    editModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 16,
    },
    editModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
    },
    editModalButtonPrimary: {
        backgroundColor: colors.primaryDark,
    },
    editModalButtonText: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    editModalButtonTextPrimary: {
        color: '#FFFFFF',
    },
});

export default ChatScreen;
