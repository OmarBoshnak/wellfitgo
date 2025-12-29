import { Stack } from 'expo-router';
import { useAppStateTracking } from '@/src/core/hooks/useAppState';

export default function AppLayout() {
    // Track app state for online/offline status
    useAppStateTracking();

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
        </Stack>
    );
}
