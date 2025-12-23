import { useState, useCallback } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { TabType, SectionItem, TABS, ChartPeriod } from '../types';
import { mockClient, mockActivity } from '../mock';

export function useClientProfileScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M');

    // Derived values
    const weightDiff = mockClient.startWeight - mockClient.currentWeight;
    const remainingWeight = mockClient.currentWeight - mockClient.targetWeight;

    // Handlers
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleCall = useCallback(() => {
        Linking.openURL(`tel:${mockClient.phone}`);
    }, []);

    const handleEmail = useCallback(() => {
        Linking.openURL(`mailto:${mockClient.email}`);
    }, []);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const handlePeriodChange = useCallback((period: ChartPeriod) => {
        setChartPeriod(period);
    }, []);

    // Build sections based on active tab
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

        return [
            ...baseSections,
            { id: 'placeholder', type: 'placeholder' },
        ];
    }, [activeTab]);

    return {
        // State
        activeTab,
        chartPeriod,

        // Data
        client: mockClient,
        activities: mockActivity,
        tabs: TABS,
        sections: getSections(),

        // Computed
        weightDiff,
        remainingWeight,

        // Handlers
        handleBack,
        handleCall,
        handleEmail,
        handleTabChange,
        handlePeriodChange,
    };
}
