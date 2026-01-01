/**
 * Push Notifications Hook
 * Handles registration for push notifications and token storage
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

interface UsePushNotificationsResult {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: string | null;
    isRegistered: boolean;
    registerForPushNotifications: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);

    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

    // Convex mutations
    const savePushToken = useMutation(api.users.savePushToken);
    const currentUser = useQuery(api.users.currentUser);

    // Register for push notifications
    const registerForPushNotifications = useCallback(async () => {
        try {
            // Check if it's a physical device
            if (!Device.isDevice) {
                setError('Push notifications require a physical device');
                return;
            }

            // Check/request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                setError('Permission not granted for push notifications');
                return;
            }

            // Get the Expo push token
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
            });
            const token = tokenData.data;
            setExpoPushToken(token);

            // Save to Convex if user is authenticated
            if (currentUser && token) {
                await savePushToken({ expoPushToken: token });
                setIsRegistered(true);
            }

            // Android-specific channel setup
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#02C3CD',
                });
            }

            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to register for push notifications';
            setError(message);
            console.error('[PushNotifications] Error:', message);
        }
    }, [currentUser, savePushToken]);

    // Set up notification listeners
    useEffect(() => {
        // Listener for incoming notifications while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // Listener for user interaction with notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('[PushNotifications] Notification tapped:', data);
            // Handle navigation based on notification data here
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    // Auto-register when user is authenticated
    useEffect(() => {
        if (currentUser && !isRegistered && !expoPushToken) {
            registerForPushNotifications();
        }
    }, [currentUser, isRegistered, expoPushToken, registerForPushNotifications]);

    return {
        expoPushToken,
        notification,
        error,
        isRegistered,
        registerForPushNotifications,
    };
}

export default usePushNotifications;
