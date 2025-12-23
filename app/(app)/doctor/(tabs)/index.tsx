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

// Extracted Components
import {
    StatsGrid,
    ClientsAttentionSection,
    AppointmentsSection,
    WeeklyActivitySection,
    RecentActivitySection,
    NotificationPanel,
    type Client,
    type Appointment,
    type Activity,
} from '@/src/component/doctor/HomeScreen';

// ============================================================
// MOCK DATA
// ============================================================

const mockClientsNeedingAttention: Client[] = [
    {
        id: '1',
        name: 'Ahmed Hassan',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        status: 'Missed 2 check-ins',
        statusType: 'critical',
        lastActive: '10 days ago',
    },
    {
        id: '2',
        name: 'Layla Mohamed',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
        status: 'Weight +1.5kg this week',
        statusType: 'warning',
        feeling: '😕',
    },
    {
        id: '3',
        name: 'Karim Ali',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
        status: 'Requested plan change',
        statusType: 'info',
        lastActive: '2 hours ago',
    },
];

const mockAppointments: Appointment[] = [
    {
        id: '1',
        time: '10:00 AM',
        type: 'video',
        clientName: 'Sara Ahmed',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        duration: '30 min',
    },
    {
        id: '2',
        time: '2:00 PM',
        type: 'phone',
        clientName: 'Mohamed Ali',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
        duration: '45 min',
    },
];

const mockRecentActivity: Activity[] = [
    { id: '1', text: 'Sara Ahmed logged weight 68kg', time: '2 min ago' },
    { id: '2', text: 'New message from Karim', time: '15 min ago' },
    { id: '3', text: 'Layla completed all meals', time: '1 hour ago' },
    { id: '4', text: 'Mohamed opened meal plan', time: '2 hours ago' },
    { id: '5', text: 'You created plan for Ahmed', time: '3 hours ago' },
];

const mockWeeklyChartData = [42, 35, 48, 38, 52, 45, 28];

const mockWeeklyStats = {
    messages: 142,
    plans: 8,
    checkins: 24,
};

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
                    clients={mockClientsNeedingAttention}
                    onViewAll={() => navigateTo('clients')}
                    onClientPress={(clientId) => navigateTo('client-profile', clientId)}
                    onMessagePress={() => navigateTo('messages')}
                />

                {/* Today's Appointments */}
                <AppointmentsSection
                    appointments={mockAppointments}
                    onAddPress={() => router.push('/(app)/doctor/calendar')}
                    onSchedulePress={() => router.push('/(app)/doctor/calendar')}
                />

                {/* This Week's Activity */}
                <WeeklyActivitySection
                    chartData={mockWeeklyChartData}
                    stats={mockWeeklyStats}
                    onViewAnalytics={() => navigateTo('analytics')}
                />

                {/* Recent Activity Feed */}
                <RecentActivitySection
                    activities={mockRecentActivity}
                    onSeeAll={() => { }}
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
