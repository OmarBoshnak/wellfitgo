import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
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
};

interface Props {
    onSendText: (text: string) => void;
    onSendAudio: (uri: string) => void;
    onSendImage: (uri: string, name: string) => void;
    onSendDocument: (uri: string, name: string) => void;
    onSendMealPlan: (plan: MealPlan) => void;
}

export default function ChatInput({
    onSendText,
    onSendAudio,
    onSendImage,
    onSendDocument,
    onSendMealPlan
}: Props) {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<any>(null);
    const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [showMealPlanSheet, setShowMealPlanSheet] = useState(false);
    const pulseAnim = useState(new Animated.Value(1))[0];

    const hasText = text.trim().length > 0;

    // Start pulse animation for recording
    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

    const handleSend = useCallback(() => {
        if (hasText) {
            onSendText(text.trim());
            setText('');
        }
    }, [text, hasText, onSendText]);

    const startRecording = async () => {
        if (!Audio) {
            Alert.alert('غير متاح', t.recordingNotAvailable);
            return;
        }

        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Audio permission not granted');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            startPulse();
            console.log('Recording started');
        } catch (err) {
            console.log('Failed to start recording:', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            stopPulse();
            setIsRecording(false);

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                console.log('Recording stopped, URI:', uri);
                onSendAudio(uri);
            }
        } catch (err) {
            console.log('Failed to stop recording:', err);
        }
    };

    const handleMicPress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
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

    return (
        <>
            <View style={styles.container}>
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
                        <Animated.View
                            style={[
                                styles.micButton,
                                isRecording && styles.micButtonRecording,
                                { transform: [{ scale: isRecording ? pulseAnim : 1 }] },
                            ]}
                        >
                            <MaterialIcons
                                name={isRecording ? 'stop' : 'mic'}
                                size={20}
                                color="#FFFFFF"
                            />
                        </Animated.View>
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
        alignItems: 'flex-end',
        paddingHorizontal: horizontalScale(12),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(24),
        backgroundColor: colors.bgPrimary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: horizontalScale(8),
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
    micButtonRecording: {
        backgroundColor: '#EF4444',
    },
});
