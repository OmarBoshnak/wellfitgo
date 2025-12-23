import { Stack } from 'expo-router';

export default function AppLayout() {
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
