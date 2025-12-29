import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

// Lazy import expo-av
let Audio: any = null;
try {
    Audio = require('expo-av').Audio;
} catch (e) {
    console.log('expo-av not available for VoiceMessageBubble');
}

// Singleton to track currently playing audio
let currentlyPlayingId: string | null = null;
let currentSound: any = null;
const playbackListeners: Map<string, () => void> = new Map();

const stopCurrentPlayback = async () => {
    if (currentSound) {
        try {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
        } catch (e) {
            console.log('Error stopping current playback:', e);
        }
        currentSound = null;
    }
    if (currentlyPlayingId && playbackListeners.has(currentlyPlayingId)) {
        const listener = playbackListeners.get(currentlyPlayingId);
        if (listener) listener();
    }
    currentlyPlayingId = null;
};

interface Props {
    id: string;
    audioUri: string; // This is now the storage ID
    duration?: number; // in milliseconds
    isMine: boolean;
    timestamp: string;
}

export default function VoiceMessageBubble({ id, audioUri, duration = 0, isMine, timestamp }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [positionMillis, setPositionMillis] = useState(0);
    const [durationMillis, setDurationMillis] = useState(duration);
    const [isLoading, setIsLoading] = useState(false);
    const soundRef = useRef<any>(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Fetch actual file URL from Convex storage
    // If audioUri starts with 'file://' it's a local file, otherwise it's a storage ID
    const isStorageId = audioUri && !audioUri.startsWith('file://') && !audioUri.startsWith('http');
    const fileUrl = useQuery(
        api.chat.getFileUrl,
        isStorageId ? { storageId: audioUri as any } : "skip"
    );

    // Use either the fetched URL or the original URI (for local files)
    const actualAudioUri = isStorageId ? fileUrl : audioUri;

    // Format time as mm:ss
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Register listener for when another audio starts playing
    useEffect(() => {
        playbackListeners.set(id, () => {
            setIsPlaying(false);
            setPositionMillis(0);
            progressAnim.setValue(0);
            soundRef.current = null;
        });

        return () => {
            playbackListeners.delete(id);
            // Cleanup sound on unmount
            if (soundRef.current) {
                // If this is the global current sound, clear it to avoid stale reference errors
                if (currentSound === soundRef.current) {
                    currentSound = null;
                    currentlyPlayingId = null;
                }

                soundRef.current.unloadAsync().catch(() => { });
                soundRef.current = null;
            }
        };
    }, [id]);

    // Update progress bar animation
    useEffect(() => {
        if (durationMillis > 0) {
            const progress = positionMillis / durationMillis;
            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 100,
                useNativeDriver: false,
            }).start();
        }
    }, [positionMillis, durationMillis]);

    const onPlaybackStatusUpdate = useCallback((status: any) => {
        if (status.isLoaded) {
            setPositionMillis(status.positionMillis || 0);
            if (status.durationMillis) {
                setDurationMillis(status.durationMillis);
            }
            setIsPlaying(status.isPlaying);

            // If finished playing, reset
            if (status.didJustFinish) {
                setIsPlaying(false);
                setPositionMillis(0);
                progressAnim.setValue(0);
                currentlyPlayingId = null;
            }
        }
    }, []);

    const handlePlayPause = async () => {
        if (!Audio) {
            console.log('Audio not available');
            return;
        }

        // Wait for URL to be available if it's a storage ID
        if (!actualAudioUri) {
            console.log('Audio URL not yet available');
            return;
        }

        if (isPlaying) {
            // Pause
            if (soundRef.current) {
                await soundRef.current.pauseAsync();
            }
        } else {
            // Check if we're resuming the same audio
            if (currentlyPlayingId === id && soundRef.current) {
                await soundRef.current.playAsync();
            } else {
                // Stop any currently playing audio
                await stopCurrentPlayback();

                setIsLoading(true);
                try {
                    // Ensure audio mode is set for playback
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        playsInSilentModeIOS: true,
                        staysActiveInBackground: false,
                        shouldDuckAndroid: true,
                        playThroughEarpieceAndroid: false
                    });

                    // Create sound with a timeout race to prevent infinite loading
                    const soundPromise = Audio.Sound.createAsync(
                        { uri: actualAudioUri },
                        { shouldPlay: true, positionMillis: positionMillis },
                        onPlaybackStatusUpdate
                    );

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Audio load timeout')), 8000)
                    );

                    const result: any = await Promise.race([soundPromise, timeoutPromise]);
                    const { sound } = result;

                    soundRef.current = sound;
                    currentSound = sound;
                    currentlyPlayingId = id;
                } catch (e: any) {
                    console.log('Error playing audio:', e);

                    // Show error to user if it's not just a cancellation
                    if (e.message === 'Audio load timeout') {
                        Alert.alert('خطأ', 'تعذر تشغيل الرسالة الصوتية: انتهت مهلة التحميل');
                    } else {
                        // alert('تعذر تشغيل الرسالة الصوتية');
                    }

                    // Reset state on error
                    setIsPlaying(false);
                    setPositionMillis(0);
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    const handleSeek = async (event: any) => {
        if (!soundRef.current || durationMillis === 0) return;

        const { locationX } = event.nativeEvent;
        const progressBarWidth = horizontalScale(160); // Approximate width
        const seekRatio = Math.max(0, Math.min(1, locationX / progressBarWidth));
        const seekPosition = seekRatio * durationMillis;

        await soundRef.current.setPositionAsync(seekPosition);
        setPositionMillis(seekPosition);
    };

    const progress = durationMillis > 0 ? positionMillis / durationMillis : 0;
    const displayTime = isPlaying ? formatTime(positionMillis) : formatTime(durationMillis);

    return (
        <View style={[styles.container, isMine ? styles.containerMine : styles.containerClient]}>
            {isMine ? (
                <LinearGradient
                    colors={['#5073FE', '#02C3CD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.bubble, styles.bubbleMine]}
                >
                    <View style={styles.content}>
                        {/* Play/Pause Button */}
                        <TouchableOpacity
                            style={styles.playButton}
                            onPress={handlePlayPause}
                            disabled={isLoading}
                        >
                            <MaterialIcons
                                name={isLoading ? 'hourglass-empty' : isPlaying ? 'pause' : 'play-arrow'}
                                size={25}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>

                        {/* Progress Bar & Time */}
                        <View style={styles.progressContainer}>
                            <TouchableOpacity
                                style={styles.progressBar}
                                onPress={handleSeek}
                                activeOpacity={0.8}
                            >
                                <View style={styles.progressTrack}>
                                    <Animated.View
                                        style={[
                                            styles.progressFill,
                                            styles.progressFillMine,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    />
                                    <Animated.View
                                        style={[
                                            styles.progressKnob,
                                            styles.progressKnobMine,
                                            {
                                                left: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.timeMine}>{displayTime}</Text>
                        </View>
                    </View>
                </LinearGradient>
            ) : (
                <View style={[styles.bubble, styles.bubbleClient]}>
                    <View style={styles.content}>
                        {/* Play/Pause Button */}
                        <TouchableOpacity
                            style={[styles.playButton, styles.playButtonClient]}
                            onPress={handlePlayPause}
                            disabled={isLoading}
                        >
                            <MaterialIcons
                                name={isLoading ? 'hourglass-empty' : isPlaying ? 'pause' : 'play-arrow'}
                                size={28}
                                color={colors.primaryDark}
                            />
                        </TouchableOpacity>

                        {/* Progress Bar & Time */}
                        <View style={styles.progressContainer}>
                            <TouchableOpacity
                                style={styles.progressBar}
                                onPress={handleSeek}
                                activeOpacity={0.8}
                            >
                                <View style={styles.progressTrack}>
                                    <Animated.View
                                        style={[
                                            styles.progressFill,
                                            styles.progressFillClient,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    />
                                    <Animated.View
                                        style={[
                                            styles.progressKnob,
                                            styles.progressKnobClient,
                                            {
                                                left: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.timeClient}>{displayTime}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Timestamp */}
            <View style={[styles.metaRow, isMine ? styles.metaRowMine : styles.metaRowClient]}>
                <Text style={styles.timestamp}>{timestamp}</Text>
                {isMine && (
                    <MaterialIcons name="done-all" size={16} color={colors.primaryDark} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: horizontalScale(16),
        marginVertical: verticalScale(4),
    },
    containerMine: {
        alignItems: 'flex-start', // RTL: my messages on left
    },
    containerClient: {
        alignItems: 'flex-end', // RTL: client messages on right
    },
    bubble: {
        borderRadius: horizontalScale(16),
        paddingVertical: verticalScale(8),
        paddingHorizontal: horizontalScale(10),
        maxWidth: '80%',
        minWidth: horizontalScale(200),
    },
    bubbleMine: {
        borderBottomRightRadius: horizontalScale(4),
    },
    bubbleClient: {
        backgroundColor: colors.bgPrimary,
        borderBottomRightRadius: horizontalScale(4),
        borderWidth: 1,
        borderColor: colors.border,
    },
    content: {
        flexDirection: 'row-reverse', // LTR for progress bar
        alignItems: 'center',
        gap: horizontalScale(10),
    },
    playButton: {
        width: horizontalScale(30),
        height: horizontalScale(30),
        borderRadius: horizontalScale(22),
        marginBottom: verticalScale(10),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButtonClient: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        height: verticalScale(20),
        justifyContent: 'center',
    },
    progressTrack: {
        height: verticalScale(4),
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: horizontalScale(2),
        position: 'relative',
        overflow: 'visible',
        transform: [{ scaleX: -1 }], // Flip to make progress go left to right
    },
    progressFill: {
        height: '100%',
        borderRadius: horizontalScale(2),
    },
    progressFillMine: {
        backgroundColor: '#FFFFFF',
    },
    progressFillClient: {
        backgroundColor: colors.primaryDark,
    },
    progressKnob: {
        position: 'absolute',
        top: -verticalScale(4),
        width: horizontalScale(12),
        height: horizontalScale(12),
        borderRadius: horizontalScale(6),
        marginLeft: -horizontalScale(6),
    },
    progressKnobMine: {
        backgroundColor: '',
    },
    progressKnobClient: {
        backgroundColor: colors.primaryDark,
    },
    timeMine: {
        fontSize: ScaleFontSize(11),
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'left',
    },
    timeClient: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    metaRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: horizontalScale(4),
        marginTop: verticalScale(4),
    },
    metaRowMine: {
        justifyContent: 'flex-start',
        marginLeft: horizontalScale(4),
    },
    metaRowClient: {
        justifyContent: 'flex-end',
        marginRight: horizontalScale(4),
    },
    timestamp: {
        fontSize: ScaleFontSize(11),
        color: '#AAB8C5',
    },
});
