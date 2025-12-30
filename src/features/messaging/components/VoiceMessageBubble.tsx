import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';

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

// Generate fake waveform data
const generateWaveform = (seed: number, bars: number = 32): number[] => {
    const waveform: number[] = [];
    for (let i = 0; i < bars; i++) {
        // Generate semi-random but deterministic values based on seed
        const value = 0.2 + Math.abs(Math.sin(seed * (i + 1) * 0.3)) * 0.8;
        waveform.push(value);
    }
    return waveform;
};

// Speed options
const SPEED_OPTIONS = [1, 1.5, 2] as const;
type PlaybackSpeed = typeof SPEED_OPTIONS[number];

interface Props {
    id: string;
    audioUri: string;
    duration?: number;
    isMine: boolean;
    timestamp: string;
    waveformData?: number[];
}

export default function VoiceMessageBubble({ id, audioUri, duration = 0, isMine, timestamp, waveformData }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [positionMillis, setPositionMillis] = useState(0);
    const [durationMillis, setDurationMillis] = useState(duration);
    const [isLoading, setIsLoading] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
    const soundRef = useRef<any>(null);

    // Generate waveform from message ID as seed
    const waveform = useMemo(() => {
        if (waveformData) return waveformData;
        const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return generateWaveform(seed, 28);
    }, [id, waveformData]);

    // Fetch actual file URL from Convex storage
    const isStorageId = audioUri && !audioUri.startsWith('file://') && !audioUri.startsWith('http');
    const fileUrl = useQuery(
        api.chat.getFileUrl,
        isStorageId ? { storageId: audioUri as any } : "skip"
    );

    // Guard: Only use the URL if it's actually defined
    const actualAudioUri = isStorageId ? (fileUrl || null) : audioUri;

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
            soundRef.current = null;
        });

        return () => {
            playbackListeners.delete(id);
            // iOS: Must fully unload sounds on unmount
            if (soundRef.current) {
                const sound = soundRef.current;
                if (currentSound === sound) {
                    currentSound = null;
                    currentlyPlayingId = null;
                }
                soundRef.current = null;
                // Async cleanup
                sound.unloadAsync().catch(() => { });
            }
        };
    }, [id]);

    const onPlaybackStatusUpdate = useCallback((status: any) => {
        if (status.isLoaded) {
            setPositionMillis(status.positionMillis || 0);
            if (status.durationMillis) {
                setDurationMillis(status.durationMillis);
            }
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                setIsPlaying(false);
                setPositionMillis(0);
                // Reset position to beginning for replay
                if (soundRef.current) {
                    soundRef.current.setPositionAsync(0).catch(() => { });
                }
                // Keep the sound loaded but mark as not playing
                currentlyPlayingId = null;
            }
        }
    }, []);

    const handlePlayPause = async () => {
        // Guard: Audio module must be available
        if (!Audio) {
            Alert.alert('خطأ', 'الصوت غير متاح');
            return;
        }

        // Guard: URL must be defined (iOS crashes on undefined)
        if (!actualAudioUri) {
            console.warn('[VoiceMessage] Audio URI missing, skipping playback');
            return;
        }

        // Haptic feedback
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) { }

        if (isPlaying) {
            // Pause current playback
            if (soundRef.current) {
                try {
                    await soundRef.current.pauseAsync();
                } catch (e) {
                    console.log('Error pausing:', e);
                }
            }
        } else {
            // Check if we have an existing sound object for this message
            if (soundRef.current) {
                try {
                    // IMPORTANT: Reset audio mode to playback mode (iOS requirement)
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        playsInSilentModeIOS: true,
                    });
                    // Replay from current position (or from start if finished)
                    await soundRef.current.playAsync();
                    currentlyPlayingId = id;
                    return;
                } catch (e) {
                    console.log('Error resuming/replaying:', e);
                    // Reset and try fresh
                    try {
                        await soundRef.current.unloadAsync();
                    } catch (err) { }
                    soundRef.current = null;
                    currentSound = null;
                    currentlyPlayingId = null;
                }
            }

            // Start fresh playback
            if (!soundRef.current) {
                // Stop any currently playing audio first
                await stopCurrentPlayback();

                setIsLoading(true);
                try {
                    // CRITICAL iOS FIX: Fully reset audio session before playback
                    // This ensures we're not stuck in recording mode
                    console.log('[VoiceMessage] Resetting audio mode for playback...');
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,     // Disable recording mode
                        playsInSilentModeIOS: true,    // Allow playback in silent mode
                        staysActiveInBackground: false,
                        interruptionModeIOS: 1,        // Do not mix with other audio
                        shouldDuckAndroid: true,
                        interruptionModeAndroid: 1,
                        playThroughEarpieceAndroid: false,
                    });
                    console.log('[VoiceMessage] Audio mode reset complete');

                    console.log('[VoiceMessage] Loading audio from:', actualAudioUri);
                    console.log('[VoiceMessage] Audio URI type:', typeof actualAudioUri);
                    console.log('[VoiceMessage] Is storage ID:', isStorageId);
                    console.log('[VoiceMessage] File URL from query:', fileUrl);

                    // Validate URL before attempting to load
                    if (!actualAudioUri || typeof actualAudioUri !== 'string') {
                        throw new Error(`Invalid audio URI: ${actualAudioUri}`);
                    }

                    // Ensure the URL is properly formatted
                    const audioUrl = actualAudioUri.trim();
                    console.log('[VoiceMessage] Final audio URL:', audioUrl);

                    // iOS FIX: Download remote audio to local cache first
                    // expo-av hangs when streaming remote audio on iOS
                    let localUri = audioUrl;

                    if (audioUrl.startsWith('http')) {
                        console.log('[VoiceMessage] Downloading audio for iOS playback...');

                        // Create a unique filename based on the URL
                        const urlHash = audioUrl.split('/').pop() || id;
                        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
                        const localPath = `${cacheDir}voice_${urlHash}.m4a`;

                        // Check if already cached
                        const fileInfo = await FileSystem.getInfoAsync(localPath);

                        if (fileInfo.exists) {
                            console.log('[VoiceMessage] Using cached audio file:', localPath);
                            localUri = localPath;
                        } else {
                            console.log('[VoiceMessage] Downloading to:', localPath);
                            try {
                                const downloadResult = await FileSystem.downloadAsync(audioUrl, localPath);
                                console.log('[VoiceMessage] Download complete, status:', downloadResult.status);

                                if (downloadResult.status !== 200) {
                                    throw new Error(`Download failed with status ${downloadResult.status}`);
                                }

                                localUri = downloadResult.uri;
                                console.log('[VoiceMessage] Local URI:', localUri);
                            } catch (downloadError: any) {
                                console.log('[VoiceMessage] Download failed:', downloadError?.message);
                                throw new Error(`Failed to download audio: ${downloadError?.message}`);
                            }
                        }
                    }

                    // Create sound from local file
                    console.log('[VoiceMessage] Creating sound from:', localUri);
                    let sound: any = null;
                    let status: any = null;

                    try {
                        const result = await Audio.Sound.createAsync(
                            { uri: localUri },
                            {
                                shouldPlay: false,
                                volume: 1.0,
                                progressUpdateIntervalMillis: 100,
                            },
                            onPlaybackStatusUpdate
                        );
                        sound = result.sound;
                        status = result.status;
                        console.log('[VoiceMessage] Sound created successfully');
                    } catch (loadError: any) {
                        console.log('[VoiceMessage] Sound.createAsync error:', loadError?.message || loadError);
                        throw new Error(`Failed to load audio: ${loadError?.message || 'Unknown error'}`);
                    }

                    console.log('[VoiceMessage] Sound created, status:', JSON.stringify(status));

                    if (!sound) {
                        throw new Error('Failed to create sound object - sound is null');
                    }

                    if (status && !status.isLoaded) {
                        console.log('[VoiceMessage] Audio failed to load, error:', status.error);
                        throw new Error(`Audio not loaded: ${status.error || 'Unknown reason'}`);
                    }

                    // Set playback rate if needed (after creation for iOS)
                    if (playbackSpeed !== 1) {
                        console.log('[VoiceMessage] Setting playback speed:', playbackSpeed);
                        try {
                            await sound.setRateAsync(playbackSpeed, true);
                        } catch (rateError) {
                            console.log('[VoiceMessage] Failed to set rate, using default:', rateError);
                        }
                    }

                    // Start playback
                    console.log('[VoiceMessage] Starting playback...');
                    await sound.playAsync();

                    soundRef.current = sound;
                    currentSound = sound;
                    currentlyPlayingId = id;
                    console.log('[VoiceMessage] Audio started successfully');
                } catch (e: any) {
                    console.log('[VoiceMessage] Error playing audio:', e?.message || e);
                    console.log('[VoiceMessage] Full error:', JSON.stringify(e));
                    Alert.alert('خطأ', `تعذر تشغيل الرسالة الصوتية: ${e?.message || 'Unknown error'}`);
                    setIsPlaying(false);
                    setPositionMillis(0);
                    // Cleanup on error
                    if (soundRef.current) {
                        try {
                            await soundRef.current.unloadAsync();
                        } catch (err) { }
                    }
                    soundRef.current = null;
                    currentSound = null;
                    currentlyPlayingId = null;
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    const handleSpeedChange = async () => {
        // Haptic feedback
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) { }

        const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
        const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
        const newSpeed = SPEED_OPTIONS[nextIndex];
        setPlaybackSpeed(newSpeed);

        if (soundRef.current && isPlaying) {
            try {
                await soundRef.current.setRateAsync(newSpeed, true);
            } catch (e) {
                console.log('Error changing playback speed:', e);
            }
        }
    };

    const handleSeek = async (event: any) => {
        if (!soundRef.current || durationMillis === 0) return;

        const { locationX } = event.nativeEvent;
        const waveformWidth = horizontalScale(140);
        const seekRatio = Math.max(0, Math.min(1, locationX / waveformWidth));
        const seekPosition = seekRatio * durationMillis;

        await soundRef.current.setPositionAsync(seekPosition);
        setPositionMillis(seekPosition);
    };

    const progress = durationMillis > 0 ? positionMillis / durationMillis : 0;
    const playedBars = Math.floor(progress * waveform.length);
    const displayTime = isPlaying ? formatTime(positionMillis) : formatTime(durationMillis);

    // Render waveform bars
    const renderWaveform = () => (
        <Pressable style={styles.waveformContainer} onPress={handleSeek}>
            {waveform.map((amplitude, index) => {
                const isPlayed = index < playedBars;
                const barColor = isMine
                    ? isPlayed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)'
                    : isPlayed ? colors.primaryDark : '#D1D5DB';

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.waveformBar,
                            {
                                height: verticalScale(4 + amplitude * 18),
                                backgroundColor: barColor,
                            }
                        ]}
                    />
                );
            })}
        </Pressable>
    );

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
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={isLoading ? 'hourglass-empty' : isPlaying ? 'pause' : 'play-arrow'}
                                size={26}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>

                        {/* Waveform */}
                        <View style={styles.waveformWrapper}>
                            {renderWaveform()}
                        </View>

                        {/* Time & Speed Control */}
                        <View style={styles.rightControls}>
                            <TouchableOpacity
                                style={styles.speedButton}
                                onPress={handleSpeedChange}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.speedTextMine}>{playbackSpeed}x</Text>
                            </TouchableOpacity>
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
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={isLoading ? 'hourglass-empty' : isPlaying ? 'pause' : 'play-arrow'}
                                size={26}
                                color={colors.primaryDark}
                            />
                        </TouchableOpacity>

                        {/* Waveform */}
                        <View style={styles.waveformWrapper}>
                            {renderWaveform()}
                        </View>

                        {/* Time & Speed Control */}
                        <View style={styles.rightControls}>
                            <TouchableOpacity
                                style={[styles.speedButton, styles.speedButtonClient]}
                                onPress={handleSpeedChange}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.speedTextClient}>{playbackSpeed}x</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Timestamp */}
            <View style={[styles.metaRow, isMine ? styles.metaRowMine : styles.metaRowClient]}>
                <Text style={styles.timestamp}>{timestamp}</Text>
                {isMine && (
                    <MaterialIcons name="done-all" size={14} color={colors.primaryDark} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: horizontalScale(10),
        marginVertical: verticalScale(4),
    },
    containerMine: {
        alignItems: 'flex-start',
    },
    containerClient: {
        alignItems: 'flex-end',
    },
    bubble: {
        borderRadius: horizontalScale(18),
        paddingVertical: verticalScale(10),
        paddingHorizontal: horizontalScale(10),
        maxWidth: '85%',
        minWidth: horizontalScale(240),
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
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: horizontalScale(10),
        marginBottom: verticalScale(4),
    },
    playButton: {
        width: horizontalScale(35),
        height: horizontalScale(35),
        borderRadius: horizontalScale(20),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButtonClient: {
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
    },
    waveformWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: verticalScale(28),
        gap: horizontalScale(2),
        transform: [{ rotate: '180deg' }],
    },
    waveformBar: {
        width: horizontalScale(3),
        borderRadius: horizontalScale(1.5),
    },
    rightControls: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    timeMine: {
        fontSize: ScaleFontSize(10),
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'left',
        paddingHorizontal: horizontalScale(30)
    },
    timeClient: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    speedButton: {
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(10),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    speedButtonClient: {
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
    },
    speedTextMine: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    speedTextClient: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.primaryDark,
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
        fontSize: ScaleFontSize(10),
        color: '#AAB8C5',
    },
});
