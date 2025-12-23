import React, { createContext, useContext, useRef, useCallback } from 'react';

// Lazy import expo-av
let Audio: any = null;
try {
    Audio = require('expo-av').Audio;
} catch (e) {
    console.log('expo-av not available');
}

interface AudioController {
    currentSound: any;
    currentId: string | null;
    play: (id: string, uri: string, onStatusUpdate: (status: any) => void) => Promise<void>;
    pause: () => Promise<void>;
    stop: () => Promise<void>;
    seek: (positionMillis: number) => Promise<void>;
    isPlaying: (id: string) => boolean;
}

const AudioControllerContext = createContext<AudioController | null>(null);

export function AudioControllerProvider({ children }: { children: React.ReactNode }) {
    const soundRef = useRef<any>(null);
    const currentIdRef = useRef<string | null>(null);
    const statusCallbackRef = useRef<((status: any) => void) | null>(null);

    const stop = useCallback(async () => {
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (e) {
                console.log('Error stopping audio:', e);
            }
            soundRef.current = null;
            currentIdRef.current = null;
            statusCallbackRef.current = null;
        }
    }, []);

    const play = useCallback(async (id: string, uri: string, onStatusUpdate: (status: any) => void) => {
        if (!Audio) {
            console.log('Audio not available');
            return;
        }

        // If same audio, resume
        if (currentIdRef.current === id && soundRef.current) {
            await soundRef.current.playAsync();
            return;
        }

        // Stop previous audio
        await stop();

        try {
            // Create new sound
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                onStatusUpdate
            );

            soundRef.current = sound;
            currentIdRef.current = id;
            statusCallbackRef.current = onStatusUpdate;
        } catch (e) {
            console.log('Error playing audio:', e);
        }
    }, [stop]);

    const pause = useCallback(async () => {
        if (soundRef.current) {
            try {
                await soundRef.current.pauseAsync();
            } catch (e) {
                console.log('Error pausing audio:', e);
            }
        }
    }, []);

    const seek = useCallback(async (positionMillis: number) => {
        if (soundRef.current) {
            try {
                await soundRef.current.setPositionAsync(positionMillis);
            } catch (e) {
                console.log('Error seeking audio:', e);
            }
        }
    }, []);

    const isPlaying = useCallback((id: string) => {
        return currentIdRef.current === id;
    }, []);

    const controller: AudioController = {
        currentSound: soundRef.current,
        currentId: currentIdRef.current,
        play,
        pause,
        stop,
        seek,
        isPlaying,
    };

    return (
        <AudioControllerContext.Provider value={controller}>
            {children}
        </AudioControllerContext.Provider>
    );
}

export function useAudioController() {
    const context = useContext(AudioControllerContext);
    if (!context) {
        throw new Error('useAudioController must be used within AudioControllerProvider');
    }
    return context;
}

export default AudioControllerContext;
