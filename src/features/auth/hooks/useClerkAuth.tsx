import { useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/src/store/hooks';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Required for OAuth to work on native - this completes the auth session
WebBrowser.maybeCompleteAuthSession();

export const useClerkAuth = () => {
    const router = useRouter();
    const { signOut, isSignedIn } = useAuth();
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if user has completed onboarding
    const isOnboarded = useAppSelector((state) => state.user.isOnboarded);

    const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
    const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });

    // Convex mutation to sync user after OAuth
    const getOrCreateUser = useMutation(api.users.getOrCreateUser);

    // Route user based on onboarding status
    const routeAfterAuth = useCallback(() => {
        console.log('[Auth] Routing after auth, isOnboarded:', isOnboarded);
        if (isOnboarded) {
            router.replace('/(app)/(tabs)');
        } else {
            router.replace('/(auth)/HealthHistoryScreen');
        }
    }, [isOnboarded, router]);

    // Watch for sign-in state changes and route accordingly
    useEffect(() => {
        console.log('[Auth] Auth state - isSignedIn:', isSignedIn, 'user:', user?.id);
    }, [isSignedIn, user]);

    const signInWithGoogle = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const redirectUrl = Linking.createURL('');
            console.log('[Auth] Starting Google OAuth with redirectUrl:', redirectUrl);

            const result = await googleOAuth({ redirectUrl });

            // Detailed logging for debugging
            console.log('[Auth] Google OAuth result full:', JSON.stringify(result, null, 2));

            const { createdSessionId, setActive, signIn, signUp } = result;

            if (createdSessionId && setActive) {
                console.log('[Auth] Setting active session:', createdSessionId);
                await setActive({ session: createdSessionId });
                console.log('[Auth] Session activated, syncing with Convex...');

                // Sync user with Convex after successful OAuth
                try {
                    // Get user data from signUp/signIn result (more reliable than user object at this point)
                    const clerkId = signUp?.createdUserId || signIn?.createdSessionId || user?.id || '';
                    const firstName = signUp?.firstName || user?.firstName || 'User';
                    const lastName = signUp?.lastName || user?.lastName || undefined;
                    // Get email from signUp emailAddress or user object
                    const email = signUp?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress;
                    const avatarUrl = signUp?.imageUrl || user?.imageUrl || undefined;

                    console.log('[Auth] User data for Convex - clerkId:', clerkId, 'email:', email);

                    const convexUser = await getOrCreateUser({
                        clerkId,
                        firstName,
                        lastName,
                        email,
                        avatarUrl,
                    });
                    console.log('[Auth] User synced with Convex:', convexUser);

                    // Check if user has completed onboarding in Convex (has height and weight data)
                    const hasCompletedOnboarding = convexUser &&
                        convexUser.height &&
                        convexUser.height > 0 &&
                        convexUser.currentWeight &&
                        convexUser.currentWeight > 0;

                    console.log('[Auth] Convex onboarding status:', hasCompletedOnboarding);

                    if (hasCompletedOnboarding) {
                        router.replace('/(app)/(tabs)');
                    } else {
                        router.replace('/(auth)/HealthHistoryScreen');
                    }
                } catch (convexError) {
                    console.error('[Auth] Failed to sync with Convex:', convexError);
                    // Fall back to Redux state if Convex fails
                    routeAfterAuth();
                }
            } else {
                console.log('[Auth] No session created.');
                if (signUp?.missingFields) {
                    console.log('[Auth] Missing fields for sign up:', JSON.stringify(signUp.missingFields, null, 2));
                }
                if (signIn?.firstFactorVerification?.status) {
                    console.log('[Auth] Sign in verification status:', signIn.firstFactorVerification.status);
                }

                setError('يلزم إكمال بعض البيانات لتسجيل الدخول. يرجى التحقق من إعدادات حسابك.');
            }
        } catch (err: any) {
            console.error('[Auth] Google OAuth error:', err);
            setError(err.message || 'حدث خطأ أثناء تسجيل الدخول بجوجل');
        } finally {
            setLoading(false);
        }
    }, [googleOAuth, routeAfterAuth]);

    const signInWithApple = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const redirectUrl = Linking.createURL('');
            console.log('[Auth] Starting Apple OAuth with redirectUrl:', redirectUrl);

            const result = await appleOAuth({ redirectUrl });

            // Detailed logging for debugging
            console.log('[Auth] Apple OAuth result full:', JSON.stringify(result, null, 2));

            const { createdSessionId, setActive, signUp } = result;

            if (createdSessionId && setActive) {
                console.log('[Auth] Setting active session:', createdSessionId);
                await setActive({ session: createdSessionId });
                console.log('[Auth] Session activated, syncing with Convex...');

                // Sync user with Convex after successful OAuth
                try {
                    // Get user data from signUp result (more reliable than user object at this point)
                    const clerkId = signUp?.createdUserId || user?.id || '';
                    const firstName = signUp?.firstName || user?.firstName || 'User';
                    const lastName = signUp?.lastName || user?.lastName || undefined;
                    // Get email from signUp emailAddress or user object
                    const email = signUp?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress;
                    const avatarUrl = signUp?.imageUrl || user?.imageUrl || undefined;

                    console.log('[Auth] User data for Convex - clerkId:', clerkId, 'email:', email);

                    const convexUser = await getOrCreateUser({
                        clerkId,
                        firstName,
                        lastName,
                        email,
                        avatarUrl,
                    });
                    console.log('[Auth] User synced with Convex:', convexUser);

                    // Check if user has completed onboarding in Convex (has height and weight data)
                    const hasCompletedOnboarding = convexUser &&
                        convexUser.height &&
                        convexUser.height > 0 &&
                        convexUser.currentWeight &&
                        convexUser.currentWeight > 0;

                    console.log('[Auth] Convex onboarding status:', hasCompletedOnboarding);

                    if (hasCompletedOnboarding) {
                        router.replace('/(app)/(tabs)');
                    } else {
                        router.replace('/(auth)/HealthHistoryScreen');
                    }
                } catch (convexError) {
                    console.error('[Auth] Failed to sync with Convex:', convexError);
                    // Fall back to Redux state if Convex fails
                    routeAfterAuth();
                }
            } else {
                console.log('[Auth] No session created.');
                if (signUp?.missingFields) {
                    console.log('[Auth] Missing fields for sign up:', JSON.stringify(signUp.missingFields, null, 2));
                }
                setError('يلزم إكمال بعض البيانات لتسجيل الدخول.');
            }
        } catch (err: any) {
            console.error('[Auth] Apple OAuth error:', err);
            setError(err.message || 'حدث خطأ أثناء تسجيل الدخول بـ Apple');
        } finally {
            setLoading(false);
        }
    }, [appleOAuth, routeAfterAuth]);

    const handleSignOut = useCallback(async () => {
        try {
            setLoading(true);
            await signOut();
            router.replace('/(auth)/LoginScreen');
        } catch (err: any) {
            console.error('[Auth] Sign out error:', err);
            setError(err.message || 'حدث خطأ أثناء تسجيل الخروج');
        } finally {
            setLoading(false);
        }
    }, [signOut, router]);

    return {
        signInWithGoogle,
        signInWithApple,
        signOut: handleSignOut,
        loading,
        error,
        isSignedIn,
        isOnboarded,
        routeAfterAuth,
    };
};
