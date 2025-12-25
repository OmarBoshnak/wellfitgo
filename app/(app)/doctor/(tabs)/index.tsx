import React, { useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Users,
    Scale,
    MessageSquare,
    FileText,
} from 'lucide-react-native';
import { colors } from '@/src/theme';
import { DoctorHeader } from '@/src/features/clients';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { doctorTranslations as t } from '@/src/i18n';
import { horizontalScale, verticalScale } from '@/src/utils/scaling';
import { useCoachInbox } from '@/src/features/messaging/hooks/useMessaging';
import { useClientsNeedingAttention } from '@/src/hooks/useClientsNeedingAttention';
import { useTodaysAppointments } from '@/src/hooks/useTodaysAppointments';
import { usePhoneCall } from '@/src/hooks/usePhoneCall';
import { useWeeklyActivity } from '@/src/hooks/useWeeklyActivity';
import { useRecentActivity } from '@/src/hooks/useRecentActivity';

// Extracted Components
import {
    StatsGrid,
    ClientsAttentionSection,
    AppointmentsSection,
    WeeklyActivitySection,
    RecentActivitySection,
    NotificationPanel,
    type Appointment,
    type Activity,
} from '@/src/component/doctor/HomeScreen';



// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DoctorDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const convexUser = useQuery(api.users.currentUser);
    const dashboardStats = useQuery(api.users.getDashboardStats);
    const userName = convexUser?.firstName || 'Doctor';

    // Get real-time unread messages count from Convex
    const { totalUnread, oldestUnread, isLoading: messagesLoading } = useCoachInbox();

    // ============ CLIENTS NEEDING ATTENTION ============
    // Fetch real clients data from Convex - show top 5 on dashboard
    const {
        clients: attentionClients,
        isLoading: attentionLoading,
        isEmpty: noAttentionNeeded,
        refetch: refetchAttention,
    } = useClientsNeedingAttention(5);

    // ============ TODAY'S APPOINTMENTS ============
    // Fetch real appointments data from Convex
    const {
        appointments,
        isLoading: appointmentsLoading,
        isEmpty: noAppointments,
        refetch: refetchAppointments,
    } = useTodaysAppointments(5);

    // ============ PHONE CALL ============
    const { callClient } = usePhoneCall();

    // ============ WEEKLY ACTIVITY ============
    const {
        stats: weeklyStats,
        chartData: weeklyChartData,
        isLoading: weeklyLoading,
        isEmpty: noWeeklyActivity,
    } = useWeeklyActivity();

    // ============ RECENT ACTIVITY ============
    const {
        activities: recentActivities,
        isLoading: activitiesLoading,
        isEmpty: noActivities,
    } = useRecentActivity(5);

    // ============================================================
    // NOTIFICATION GATING EXAMPLE
    // ============================================================
    // The user's notification settings are available via convexUser.notificationSettings
    // Use these to gate push token registration and notification displays:
    //
    // const { pushEnabled, newMessages, appointments } = convexUser?.notificationSettings ?? {
    //     pushEnabled: true,
    //     newMessages: true,
    //     appointments: true,
    // };
    //
    // 1. PUSH TOKEN REGISTRATION (in useEffect on app mount):
    //    if (pushEnabled) {
    //        await registerForPushNotificationsAsync();
    //    }
    //
    // 2. NOTIFICATION BADGE (conditionally show):
    //    const showBadge = pushEnabled && (totalUnread > 0);
    //
    // 3. GATING INDIVIDUAL NOTIFICATIONS:
    //    - For messages: only show if pushEnabled && newMessages
    //    - For appointments: only show if pushEnabled && appointments
    // ============================================================

    // Notification panel visibility state
    const [showNotifications, setShowNotifications] = useState(false);

    // Build dynamic subtext for unread messages card
    // Shows message preview + relative time, or "No unread" if none
    const unreadSubtext = oldestUnread
        ? `${oldestUnread.preview.slice(0, 25)}${oldestUnread.preview.length > 25 ? '...' : ''} • ${oldestUnread.relativeTime}`
        : t.oldestMessage; // Fallback to default translation

    // Handle notification item press
    const handleNotificationPress = (notification: any) => {
        setShowNotifications(false);
        if (notification.type === 'message') {
            router.push('/(app)/doctor/(tabs)/messages');
        } else if (notification.type === 'weight_log') {
            // Navigate to client profile or weight logs
            router.push('/(app)/doctor/(tabs)/clients');
        }
    };

    // --------------------------------------------------------
    // NAVIGATION HANDLERS
    // --------------------------------------------------------

    const navigateTo = (view: string, _clientId?: string) => {
        switch (view) {
            case 'clients':
                router.push('/(app)/doctor/(tabs)/clients');
                break;
            case 'messages':
                router.push('/(app)/doctor/(tabs)/messages');
                break;
            case 'meal-plans':
                router.push('/(app)/(tabs)/meals');
                break;
            case 'analytics':
                break;
            case 'client-profile':
                break;
            default:
                break;
        }
    };

    // ============ ATTENTION SECTION HANDLERS ============
    const handleClientPress = (clientId: string) => {
        // Use type assertion for dynamic route - expo-router doesn't type dynamic segments well
        router.push(`/(app)/doctor/client/${clientId}` as any);
    };

    const handleMessagePress = (clientId: string) => {
        // Navigate to messages screen with client context
        router.push({
            pathname: '/(app)/doctor/(tabs)/messages',
            params: { openChatWithClient: clientId },
        });
    };

    const handleViewAllAttention = () => {
        router.push({
            pathname: '/(app)/doctor/(tabs)/clients',
            params: { filter: 'needs_attention' },
        });
    };

    // --------------------------------------------------------
    // STATS GRID DATA
    // --------------------------------------------------------

    const statsData = [
        {
            icon: <Users size={horizontalScale(22)} color="#16A34A" />,
            iconBgColor: '#DCFCE7',
            value: dashboardStats?.totalActiveClients?.toString() || '0',
            label: t.activeClients,
            trend: dashboardStats?.trendUp
                ? `+${dashboardStats.trendPercentage}% ${t.thisMonth}`
                : `-${dashboardStats?.trendPercentage || 0}% ${t.thisMonth}`,
            trendUp: dashboardStats?.trendUp ?? true,
            onPress: () => navigateTo('clients'),
        },
        {
            icon: <MessageSquare size={horizontalScale(22)} color="#2563EB" />,
            iconBgColor: '#DBEAFE',
            value: totalUnread?.toString() || '0',
            label: t.unreadMessages,
            subtext: unreadSubtext,
            onPress: () => navigateTo('messages'),
        },
        {
            icon: <FileText size={horizontalScale(22)} color="#DC2626" />,
            iconBgColor: '#FEE2E2',
            value: dashboardStats?.expiringPlansCount?.toString() || '0',
            label: t.plansExpiring,
            // Show nearest expiring plan's client name and days until expiry
            subtext: dashboardStats?.nearestExpiringPlan
                ? `${dashboardStats.nearestExpiringPlan.clientName} • ${dashboardStats.nearestExpiringPlan.daysUntilExpiry}d`
                : t.inNextDays,
            onPress: () => navigateTo('meal-plans'),
        },
    ];

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <DoctorHeader
                userName={userName}
                userImage={convexUser?.avatarUrl}
                notificationCount={dashboardStats?.totalNotifications || 0}
                onNotificationPress={() => setShowNotifications(true)}
                style={{ paddingTop: insets.top }}
            />

            {/* Notification Panel Dropdown */}
            <NotificationPanel
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNotificationPress={handleNotificationPress}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Stats Grid */}
                <StatsGrid stats={statsData} />

                {/* Clients Needing Attention */}
                <ClientsAttentionSection
                    clients={attentionClients}
                    isLoading={attentionLoading}
                    isEmpty={noAttentionNeeded}
                    onViewAll={handleViewAllAttention}
                    onClientPress={handleClientPress}
                    onMessagePress={handleMessagePress}
                    onRetry={refetchAttention}
                />

                {/* Today's Appointments */}
                <AppointmentsSection
                    appointments={appointments}
                    isLoading={appointmentsLoading}
                    isEmpty={noAppointments}
                    onAddPress={() => router.push('/(app)/doctor/calendar')}
                    onSchedulePress={() => router.push('/(app)/doctor/calendar')}
                    onAppointmentPress={() => router.push('/(app)/doctor/calendar')}
                    onStartCall={(apt) => {
                        // For video calls, navigate to calendar
                        router.push('/(app)/doctor/calendar');
                    }}
                    onStartPhoneCall={(apt) => {
                        // Initiate phone call using hook
                        callClient(apt.clientId, apt.clientName, apt.clientPhone);
                    }}
                    onRetry={refetchAppointments}
                />

                {/* This Week's Activity */}
                <WeeklyActivitySection
                    chartData={weeklyChartData}
                    stats={weeklyStats}
                    isLoading={weeklyLoading}
                    isEmpty={noWeeklyActivity}
                    onViewAnalytics={() => navigateTo('analytics')}
                />

                {/* Recent Activity Feed */}
                <RecentActivitySection
                    activities={recentActivities}
                    isLoading={activitiesLoading}
                    isEmpty={noActivities}
                    onSeeAll={() => navigateTo('analytics')}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: horizontalScale(12),
        paddingBottom: verticalScale(32),
    },
});
