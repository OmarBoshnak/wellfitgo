import { useState, useCallback, useMemo } from 'react';
import { Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { TabType, SectionItem, TABS, ChartPeriod } from '../types';
import { isRTL } from '@/src/core/constants/translations';
import { usePhoneCall } from '@/src/features/doctor/hooks/usePhoneCall';

// ============ TYPES ============

export interface ClientProfile {
    id: Id<"users">;
    name: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    avatar: string | null;
    location: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    weeklyChange: number;
    startDate: string;
    joinedAt: number;
    lastActiveAt?: number;
    subscriptionStatus: string;
    conversationId: Id<"conversations"> | null;
    unreadMessages: number;
    hasActivePlan: boolean;
    activePlanId: Id<"weeklyMealPlans"> | null;
    planWeekStart?: string;
    planWeekEnd?: string;
    weightHistory: Array<{
        id: Id<"weightLogs">;
        weight: number;
        unit: string;
        date: string;
        feeling?: string;
        createdAt: number;
    }>;
}

export interface Activity {
    id: string;
    type: "weight" | "meals" | "message" | "missed" | "plan";
    color: string;
    date: string;
    text: string;
    subtext: string;
    timestamp: number;
}

export interface UseClientProfileResult {
    // State
    activeTab: TabType;
    chartPeriod: ChartPeriod;
    showCallModal: boolean;

    // Data
    client: ClientProfile | null;
    activities: Activity[];
    tabs: typeof TABS;
    sections: SectionItem[];
    chartData: {
        points: Array<{ date: string; weight: number; timestamp: number }>;
        targetWeight: number;
        minWeight: number;
        maxWeight: number;
        currentWeight: number;
        startWeight: number;
    } | null;
    weeklyStats: {
        mealsCompleted: number;
        mealsTotal: number;
        hasWeightLog: boolean;
        lastWeightLogDate?: string | null;
        lastWeightLogFeeling?: string | null;
    } | null;

    // Computed
    weightDiff: number;
    remainingWeight: number;
    isLoading: boolean;
    chartLoading: boolean;
    statsLoading: boolean;

    // Handlers
    handleBack: () => void;
    handleCall: () => void;
    handleEmail: () => void;
    handleSendMessage: () => void;
    handleScheduleCall: () => void;
    handleCloseCallModal: () => void;
    handleTabChange: (tab: TabType) => void;
    handlePeriodChange: (period: ChartPeriod) => void;
}

// ============ TRANSLATIONS ============

const alertMessages = {
    noPhone: {
        title: isRTL ? "لا يوجد رقم هاتف" : "No Phone Number",
        message: isRTL
            ? "هذا العميل ليس لديه رقم هاتف مسجل"
            : "This client doesn't have a phone number on file",
    },
    noEmail: {
        title: isRTL ? "لا يوجد بريد إلكتروني" : "No Email",
        message: isRTL
            ? "هذا العميل ليس لديه بريد إلكتروني مسجل"
            : "This client doesn't have an email on file",
    },
};

// ============ MAIN HOOK ============

export function useClientProfileScreen(clientId?: string): UseClientProfileResult {
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M');
    const [showCallModal, setShowCallModal] = useState(false);

    // Phone call hook (same as DayEventCard)
    const { callClient } = usePhoneCall();

    // ============ CONVEX QUERIES ============

    // Fetch client profile
    const clientData = useQuery(
        api.clientProfile.getClientProfile,
        clientId ? { clientId: clientId as Id<"users"> } : "skip"
    );

    // Fetch activity timeline
    const activitiesData = useQuery(
        api.clientProfile.getClientActivity,
        clientId ? { clientId: clientId as Id<"users">, limit: 20 } : "skip"
    );

    // Fetch chart data
    const chartData = useQuery(
        api.clientProfile.getWeightChartData,
        clientId ? { clientId: clientId as Id<"users">, period: chartPeriod } : "skip"
    );

    // Fetch weekly stats
    const weeklyStatsData = useQuery(
        api.clientProfile.getWeeklyStats,
        clientId ? { clientId: clientId as Id<"users"> } : "skip"
    );

    // ============ TRANSFORM DATA ============

    const client = useMemo((): ClientProfile | null => {
        if (!clientData) return null;
        return clientData as unknown as ClientProfile;
    }, [clientData]);

    const activities = useMemo((): Activity[] => {
        if (!activitiesData) return [];
        return activitiesData as Activity[];
    }, [activitiesData]);

    // ============ COMPUTED VALUES ============

    const weightDiff = client ? client.startWeight - client.currentWeight : 0;
    const remainingWeight = client ? client.currentWeight - client.targetWeight : 0;
    const isLoading = clientData === undefined;
    const chartLoading = chartData === undefined;
    const statsLoading = weeklyStatsData === undefined;

    // ============ HANDLERS ============

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Phone call handler using usePhoneCall hook (same as DayEventCard)
    const handleCall = useCallback(() => {
        if (client) {
            callClient(
                client.id,
                client.name,
                client.phone || null
            );
        }
    }, [client, callClient]);

    const handleEmail = useCallback(() => {
        if (client?.email) {
            Linking.openURL(`mailto:${client.email}`);
        } else {
            Alert.alert(alertMessages.noEmail.title, alertMessages.noEmail.message);
        }
    }, [client]);

    const handleSendMessage = useCallback(() => {
        if (client) {
            router.push({
                pathname: '/(app)/doctor/(tabs)/messages',
                params: { openChatWithClient: client.id },
            });
        }
    }, [client, router]);

    const handleScheduleCall = useCallback(() => {
        setShowCallModal(true);
    }, []);

    const handleCloseCallModal = useCallback(() => {
        setShowCallModal(false);
    }, []);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const handlePeriodChange = useCallback((period: ChartPeriod) => {
        setChartPeriod(period);
    }, []);

    // ============ BUILD SECTIONS ============

    const getSections = useCallback((): SectionItem[] => {
        const baseSections: SectionItem[] = [
            { id: 'header', type: 'header' },
            { id: 'stats', type: 'stats' },
            { id: 'actions', type: 'actions' },
            { id: 'tabs', type: 'tabs' },
        ];

        if (activeTab === 'overview') {
            return [
                ...baseSections,
                { id: 'weekSummary', type: 'weekHeader' },
                { id: 'chart', type: 'chart' },
                { id: 'activity', type: 'activity' },
            ];
        }

        if (activeTab === 'meal-plan') {
            return [
                ...baseSections,
                { id: 'mealPlanContent', type: 'mealPlanContent' },
            ];
        }

        if (activeTab === 'notes') {
            return [
                ...baseSections,
                { id: 'notesContent', type: 'notesContent' },
            ];
        }

        if (activeTab === 'settings') {
            return [
                ...baseSections,
                { id: 'settingsContent', type: 'settingsContent' },
            ];
        }

        return [
            ...baseSections,
            { id: 'placeholder', type: 'placeholder' },
        ];
    }, [activeTab]);

    return {
        // State
        activeTab,
        chartPeriod,
        showCallModal,

        // Data
        client,
        activities,
        tabs: TABS,
        sections: getSections(),
        chartData: chartData as UseClientProfileResult['chartData'],
        weeklyStats: weeklyStatsData as UseClientProfileResult['weeklyStats'],

        // Computed
        weightDiff,
        remainingWeight,
        isLoading,
        chartLoading,
        statsLoading,

        // Handlers
        handleBack,
        handleCall,
        handleEmail,
        handleSendMessage,
        handleScheduleCall,
        handleCloseCallModal,
        handleTabChange,
        handlePeriodChange,
    };
}
