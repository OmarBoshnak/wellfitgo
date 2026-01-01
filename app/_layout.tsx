import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@/src/core/utils/cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/src/store';
import { ActivityIndicator, View } from 'react-native';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import * as Sentry from '@sentry/react-native';
import { AnalyticsProvider } from '@/src/core/providers/AnalyticsProvider';

// Initialize Sentry
Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__, // Print debug info in development
    tracesSampleRate: 1.0, // Performance monitoring
    environment: __DEV__ ? 'development' : 'production',
});

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

// Initialize Convex client
const convex = new ConvexReactClient(CONVEX_URL);

function InitialLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    // Fetch user data from Convex to check onboarding status
    // Returns undefined while loading, null if not found/auth, user object if found
    const convexUser = useQuery(api.users.currentUser);

    useEffect(() => {
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';
        const currentScreen = segments[1]; // e.g., 'LoginScreen', 'health-history'

        // Allow SplashScreen and OnBoardingScreen for unauthenticated users
        const isPublicScreen = currentScreen === 'SplashScreen' || currentScreen === 'OnBoardingScreen';

        if (isSignedIn) {
            // User is signed in. Check onboarding status from Convex.
            if (convexUser === undefined) return; // Loading user data...

            const userRole = convexUser?.role;

            // Admin and Coach skip onboarding - go directly to doctor dashboard
            if (userRole === 'admin' || userRole === 'coach') {
                const isAtDoctorDashboard = segments.some(s => s === 'doctor');
                if (!isAtDoctorDashboard) {
                    router.replace('/(app)/doctor/(tabs)');
                }
                return;
            }

            // For clients, check onboarding status
            const hasCompletedOnboarding = convexUser &&
                (convexUser.height ?? 0) > 0 &&
                (convexUser.currentWeight ?? 0) > 0;

            if (hasCompletedOnboarding) {
                // User is onboarded. Redirect to home if they are in Auth group or Splash
                // BUT allow BookCallScreen to be visited (user needs to book a call after onboarding)
                const isAtBookCallScreen = segments.some(s => s.toLowerCase().includes('bookcall'));

                if ((inAuthGroup && !isAtBookCallScreen) || isPublicScreen) {
                    router.replace('/(app)/(tabs)');
                }
            } else {
                // User is NOT onboarded. Force them to HealthHistoryScreen.
                // BUT allow BookCallScreen (user can navigate there from HealthHistoryScreen)
                const isAtHealthHistory = segments.some(s => s.toLowerCase().includes('healthhistory'));
                const isAtBookCallScreen = segments.some(s => s.toLowerCase().includes('bookcall'));

                if (!isAtHealthHistory && !isAtBookCallScreen) {
                    router.replace('/(auth)/HealthHistoryScreen');
                }
            }
        } else if (!isSignedIn && inAppGroup && !isPublicScreen) {
            // Not signed in + trying to access App -> Redirect to Login
            router.push('/(auth)/LoginScreen');
        }
    }, [isLoaded, isSignedIn, segments, convexUser]);

    useEffect(() => {
        if (isLoaded) {
            SplashScreen.hideAsync();
        }
    }, [isLoaded]);

    // Set user context in Sentry for better error tracking
    useEffect(() => {
        if (convexUser && convexUser._id) {
            Sentry.setUser({
                id: convexUser._id,
                email: convexUser.email,
                username: convexUser.role,
            });
        } else if (!isSignedIn) {
            Sentry.setUser(null);
        }
    }, [convexUser, isSignedIn]);

    return <Slot />;
}

// Loading component while data is being loaded from AsyncStorage
function LoadingView() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#4CAF50" />
        </View>
    );
}

function RootLayout() {
    return (
        <Provider store={store}>
            <PersistGate loading={<LoadingView />} persistor={persistor}>
                <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
                    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                        <ClerkLoaded>
                            <AnalyticsProvider>
                                <InitialLayout />
                            </AnalyticsProvider>
                        </ClerkLoaded>
                    </ConvexProviderWithClerk>
                </ClerkProvider>
            </PersistGate>
        </Provider>
    );
}

// Wrap with Sentry for error boundary coverage
export default Sentry.wrap(RootLayout);
