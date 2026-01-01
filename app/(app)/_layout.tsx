import { Stack } from 'expo-router';
import { useAppStateTracking } from '@/src/core/hooks/useAppState';
import { usePushNotifications } from '@/src/core/hooks/usePushNotifications';

export default function AppLayout() {
    // Track app state for online/offline status
    useAppStateTracking();

    // Register for push notifications and save token to Convex
    usePushNotifications();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="doctor" />
            <Stack.Screen name="OnBoardingScreen" />
            <Stack.Screen name="SplashScreen" />
            <Stack.Screen name="HomeScreen" />
            <Stack.Screen name="active-plan-dashboard" />
        </Stack>
    );
}
