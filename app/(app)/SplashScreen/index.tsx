import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { colors } from '@/src/core/constants/Themes';

const SplashScreen = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const convexUser = useQuery(api.users.currentUser);
    const [isAnimationDone, setIsAnimationDone] = useState(false);
    const [showLoading, setShowLoading] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const loadingFade = useRef(new Animated.Value(0)).current;

    // Start fade-in animation on mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.out(Easing.back(1.5)),
            }),
        ]).start(() => {
            // After logo animation, wait a bit then show loading if needed
            setTimeout(() => {
                setIsAnimationDone(true);
                setShowLoading(true);
                Animated.timing(loadingFade, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }, 500);
        });
    }, [fadeAnim, scaleAnim, loadingFade]);

    // Handle navigation once everything is loaded
    useEffect(() => {
        // Wait for animation to complete
        if (!isAnimationDone) return;

        // Wait for Clerk to load
        if (!isLoaded) return;

        // If not signed in, go to onboarding
        if (!isSignedIn) {
            navigateWithFadeOut('/OnBoardingScreen');
            return;
        }

        // If signed in, wait for Convex user data
        if (convexUser === undefined) return; // Still loading...

        // Now we have all data, navigate based on role
        const userRole = convexUser?.role;

        if (userRole === 'admin' || userRole === 'coach') {
            navigateWithFadeOut('/(app)/doctor/(tabs)');
        } else {
            // Client - check onboarding status
            const hasCompletedOnboarding = convexUser &&
                (convexUser.height ?? 0) > 0 &&
                (convexUser.currentWeight ?? 0) > 0;

            if (hasCompletedOnboarding) {
                navigateWithFadeOut('/(app)/(tabs)');
            } else {
                navigateWithFadeOut('/(auth)/HealthHistoryScreen');
            }
        }
    }, [isAnimationDone, isLoaded, isSignedIn, convexUser]);

    const navigateWithFadeOut = (route: string) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            router.replace(route as any);
        });
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../../../assets/Wellfitgo.png')}
                    resizeMode="contain"
                    style={styles.logo}
                />
            </Animated.View>

            {/* Loading Indicator */}
            {showLoading && (
                <Animated.View style={[styles.loadingContainer, { opacity: loadingFade }]}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 150,
        width: 150,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
});

export default SplashScreen;
