import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Hook to track app state and update lastActiveAt in Convex
 * - Updates on app coming to foreground
 * - Updates periodically every 60 seconds while active
 */
export function useAppStateTracking() {
    const { isSignedIn } = useAuth();
    const updateLastActive = useMutation(api.clients.updateLastActive);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isSignedIn) return;

        const updateActivity = async () => {
            try {
                await updateLastActive({});
            } catch (e) {
                // Silently fail - non-critical operation
                console.log('Failed to update last active:', e);
            }
        };

        // Update immediately on mount
        updateActivity();

        // Handle app state changes
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                updateActivity();
                // Start periodic updates
                if (!intervalRef.current) {
                    intervalRef.current = setInterval(updateActivity, 60000); // Every 60 seconds
                }
            } else {
                // Stop periodic updates when app goes to background
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Start periodic updates if app is already active
        if (AppState.currentState === 'active') {
            intervalRef.current = setInterval(updateActivity, 60000);
        }

        return () => {
            subscription.remove();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isSignedIn, updateLastActive]);
}
