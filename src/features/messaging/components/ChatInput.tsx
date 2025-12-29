import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import AttachmentSheet, { AttachmentResult } from './AttachmentSheet';
import MealPlanSelectorSheet, { MealPlan } from './MealPlanSelectorSheet';

// Lazy import expo-av to avoid crash if native module not available
let Audio: any = null;
try {
    Audio = require('expo-av').Audio;
} catch (e) {
    console.log('expo-av not available, voice recording disabled');
}

// Arabic translations
const t = {
    placeholder: 'اكتب رسالة...',
    recordingNotAvailable: 'التسجيل الصوتي غير متاح',
    micPermissionDenied: 'يرجى منح إذن الميكروفون',
    send: 'إرسال',
};

// Recording state machine
type RecordingState = 'idle' | 'recording' | 'paused';

interface Props {
    onSendText: (text: string) => void;
    onSendAudio: (uri: string, duration?: number) => void;
    onSendImage: (uri: string, name: string) => void;
    onSendDocument: (uri: string, name: string) => void;
    onSendMealPlan: (plan: MealPlan) => void;
    replyingTo?: { id: string; content: string; sender: string } | null;
    onCancelReply?: () => void;
}

export default function ChatInput({
    onSendText,
    onSendAudio,
    onSendImage,
    onSendDocument,
    onSendMealPlan,
    replyingTo,
    onCancelReply,
}: Props) {
    const [text, setText] = useState('');
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [showMealPlanSheet, setShowMealPlanSheet] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Refs for recording
    const recordingRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Waveform animation
    const waveformAnims = useRef([
        new Animated.Value(0.3),
        new Animated.Value(0.5),
        new Animated.Value(0.7),
        new Animated.Value(0.4),
        new Animated.Value(0.6),
        new Animated.Value(0.8),
        new Animated.Value(0.5),
        new Animated.Value(0.3),
    ]).current;
    const waveformAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

    const hasText = text.trim().length > 0;
    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';
    const isActiveRecording = recordingState !== 'idle';

    // Format duration as mm:ss
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Start waveform animation
    const startWaveformAnimation = useCallback(() => {
        const animations = waveformAnims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 0.2 + Math.random() * 0.8,
                        duration: 150 + Math.random() * 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.3 + Math.random() * 0.4,
                        duration: 150 + Math.random() * 100,
                        useNativeDriver: true,
                    }),
                ])
            )
        );
        waveformAnimationRef.current = Animated.parallel(animations);
        waveformAnimationRef.current.start();
    }, [waveformAnims]);

    // Stop waveform animation
    const stopWaveformAnimation = useCallback(() => {
        if (waveformAnimationRef.current) {
            waveformAnimationRef.current.stop();
            waveformAnimationRef.current = null;
        }
        // Reset to static state
        waveformAnims.forEach(anim => anim.setValue(0.4));
    }, [waveformAnims]);

    // Start timer
    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);
    }, []);

    // Stop timer
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTimer();
            stopWaveformAnimation();
        };
    }, [stopTimer, stopWaveformAnimation]);

    const handleSend = useCallback(() => {
        if (hasText) {
            onSendText(text.trim());
            setText('');
        }
    }, [text, hasText, onSendText]);

    // Start recording
    const startRecording = async () => {
        if (!Audio) {
            setPermissionDenied(true);
            return;
        }

        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                setPermissionDenied(true);
                return;
            }

            setPermissionDenied(false);
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            setRecordingState('recording');
            setRecordingDuration(0);
            startTimer();
            startWaveformAnimation();
        } catch (err) {
            console.log('Failed to start recording:', err);
        }
    };

    // Pause recording
    const pauseRecording = async () => {
        if (!recordingRef.current) return;

        try {
            await recordingRef.current.pauseAsync();
            setRecordingState('paused');
            stopTimer();
            stopWaveformAnimation();
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
            startWaveformAnimation();
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
        stopWaveformAnimation();
    };

    // Send recording
    const sendRecording = async () => {
        if (!recordingRef.current) return;

        try {
            stopTimer();
            stopWaveformAnimation();

            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            const duration = recordingDuration * 1000; // Convert to ms

            recordingRef.current = null;
            setRecordingState('idle');
            setRecordingDuration(0);

            if (uri) {
                onSendAudio(uri, duration);
            }
        } catch (err) {
            console.log('Failed to send recording:', err);
        }
    };

    // Handle mic button press
    const handleMicPress = () => {
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

    const handleAttachment = useCallback((result: AttachmentResult) => {
        if (result.type === 'image' && result.uri) {
            onSendImage(result.uri, result.name || 'image.jpg');
        } else if (result.type === 'document' && result.uri) {
            onSendDocument(result.uri, result.name || 'document');
        }
    }, [onSendImage, onSendDocument]);

    const handleMealPlanSelect = useCallback((plan: MealPlan) => {
        onSendMealPlan(plan);
    }, [onSendMealPlan]);

    // Render waveform bars
    const renderWaveform = () => (
        <View style={styles.waveformContainer}>
            {waveformAnims.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.waveformBar,
                        {
                            transform: [{ scaleY: anim }],
                        },
                    ]}
                />
            ))}
        </View>
    );

    // Render recording controls
    const renderRecordingUI = () => (
        <View style={styles.recordingContainer}>
            {/* Delete Button */}
            <TouchableOpacity
                style={styles.recordingButton}
                onPress={deleteRecording}
                activeOpacity={0.7}
            >
                <MaterialIcons name="delete" size={24} color="#EF4444" />
            </TouchableOpacity>

            {isRecording ? (
                <>
                    {/* Pause Button */}
                    <TouchableOpacity
                        style={[styles.recordingButton, styles.pauseButton]}
                        onPress={handlePauseToggle}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="pause" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Waveform */}
                    {renderWaveform()}

                    {/* Timer */}
                    <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
                </>
            ) : (
                <>
                    {/* Send Button (only in paused state) */}
                    <TouchableOpacity
                        onPress={sendRecording}
                        activeOpacity={0.8}
                        style={styles.sendVoiceButton}
                    >
                        <LinearGradient
                            colors={['#5073FE', '#02C3CD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.sendVoiceGradient}
                        >
                            <MaterialIcons name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
                            <Text style={styles.sendVoiceText}>{t.send}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Timer (static in paused state) */}
                    <Text style={[styles.timerText, styles.timerTextPaused]}>{formatDuration(recordingDuration)}</Text>
                </>
            )}
        </View>
    );

    return (
        <>
            {/* Reply Preview */}
            {replyingTo && !isActiveRecording && (
                <View style={styles.replyPreview}>
                    <View style={styles.replyContent}>
                        <View style={styles.replyBar} />
                        <View style={styles.replyTextContainer}>
                            <Text style={styles.replyLabel}>الرد على {replyingTo.sender === 'me' ? 'نفسك' : 'المريض'}</Text>
                            <Text style={styles.replyText} numberOfLines={1}>{replyingTo.content}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onCancelReply} style={styles.replyCancel}>
                        <MaterialIcons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Permission Warning */}
            {permissionDenied && (
                <View style={styles.warningBanner}>
                    <MaterialIcons name="warning" size={16} color="#F59E0B" />
                    <Text style={styles.warningText}>{t.micPermissionDenied}</Text>
                </View>
            )}

            <View style={styles.container}>
                {isActiveRecording ? (
                    // Recording UI
                    renderRecordingUI()
                ) : (
                    // Normal Input UI
                    <>
                        {/* Send/Mic Button - Left side (RTL) */}
                        {hasText ? (
                            <TouchableOpacity onPress={handleSend} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={['#5073FE', '#02C3CD']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sendButton}
                                >
                                    <MaterialIcons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleMicPress} activeOpacity={0.8}>
                                <View style={styles.micButton}>
                                    <MaterialIcons name="mic" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Emoji Button */}
                        <TouchableOpacity style={styles.emojiButton}>
                            <MaterialIcons name="sentiment-satisfied-alt" size={24} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Input Field */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder={t.placeholder}
                                placeholderTextColor="#9CA3AF"
                                value={text}
                                onChangeText={setText}
                                multiline
                                maxLength={1000}
                                textAlign="right"
                            />
                        </View>

                        {/* Attachment Button - Right side (RTL) */}
                        <TouchableOpacity
                            style={styles.attachButton}
                            onPress={() => setShowAttachmentSheet(true)}
                        >
                            <MaterialIcons
                                name="attach-file"
                                size={24}
                                color={colors.textSecondary}
                                style={styles.attachIcon}
                            />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Attachment Sheet */}
            <AttachmentSheet
                visible={showAttachmentSheet}
                onClose={() => setShowAttachmentSheet(false)}
                onAttachmentSelected={handleAttachment}
                onMealPlanPress={() => setShowMealPlanSheet(true)}
            />

            {/* Meal Plan Selector Sheet */}
            <MealPlanSelectorSheet
                visible={showMealPlanSheet}
                onClose={() => setShowMealPlanSheet(false)}
                onSelect={handleMealPlanSelect}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingHorizontal: horizontalScale(12),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(10),
        backgroundColor: colors.bgPrimary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: horizontalScale(8),
        minHeight: verticalScale(68),
    },
    attachButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachIcon: {
        transform: [{ rotate: '45deg' }],
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#F5F6F8',
        borderRadius: horizontalScale(24),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(10),
        minHeight: verticalScale(44),
        justifyContent: 'center',
    },
    input: {
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
        maxHeight: verticalScale(100),
        paddingVertical: 0,
        textAlign: 'right',
    },
    emojiButton: {
        padding: horizontalScale(4),
    },
    sendButton: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    sendIcon: {
        transform: [{ rotate: '180deg' }], // RTL: flip send icon
    },
    micButton: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    // Recording UI styles
    recordingContainer: {
        flex: 1,
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    recordingButton: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pauseButton: {
        backgroundColor: '#F59E0B',
    },
    waveformContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: verticalScale(32),
        gap: horizontalScale(3),
    },
    waveformBar: {
        width: horizontalScale(4),
        height: verticalScale(24),
        backgroundColor: colors.primaryDark,
        borderRadius: horizontalScale(2),
    },
    timerText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#EF4444',
        minWidth: horizontalScale(50),
        textAlign: 'left',
    },
    timerTextPaused: {
        color: colors.textSecondary,
    },
    sendVoiceButton: {
        flex: 1,
    },
    sendVoiceGradient: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(20),
        borderRadius: horizontalScale(24),
        gap: horizontalScale(8),
    },
    sendVoiceText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Warning banner
    warningBanner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(8),
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    warningText: {
        fontSize: ScaleFontSize(13),
        color: '#F59E0B',
        textAlign: 'right',
    },
    // Reply preview styles
    replyPreview: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        backgroundColor: colors.bgSecondary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    replyContent: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    replyBar: {
        width: horizontalScale(3),
        height: '100%',
        backgroundColor: colors.primaryDark,
        borderRadius: horizontalScale(2),
        minHeight: verticalScale(30),
    },
    replyTextContainer: {
        flex: 1,
    },
    replyLabel: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.primaryDark,
        textAlign: 'right',
    },
    replyText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    replyCancel: {
        padding: horizontalScale(8),
    },
});
