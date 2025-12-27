import React from 'react';
import { View, FlatList, ListRenderItem, ActivityIndicator, Text } from 'react-native';
import { useClientProfileScreen, ClientProfile } from './hooks/useClientProfileScreen';
import {
    ProfileHeader,
    StatsCards,
    ActionButtons,
    ProfileTabs,
    WeekSummary,
    WeightProgressChart,
    ActivityTimeline,
    PlaceholderSection,
} from './components';
import { MealPlanTab } from './components/MealPlanTab';
import { NotesTab } from './components/NotesTab';
import { SettingsTab } from './components/SettingsTab';
import { styles } from './styles';
import { SectionItem, TABS } from './types';
import { AddCallModal } from '@/src/features/calendar/day/components/AddCallModal';
import { colors } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';

// ============ TYPES ============

interface ClientProfileScreenProps {
    clientId?: string;
}

// ============ LOADING & ERROR STATES ============

function LoadingSkeleton() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={styles.loadingText}>
                {isRTL ? "جاري التحميل..." : "Loading..."}
            </Text>
        </View>
    );
}

function NotFound() {
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorText}>
                {isRTL ? "لم يتم العثور على العميل" : "Client not found"}
            </Text>
        </View>
    );
}

// ============ MAIN COMPONENT ============

export default function ClientProfileScreen({ clientId }: ClientProfileScreenProps) {
    const {
        activeTab,
        chartPeriod,
        showCallModal,
        client,
        activities,
        tabs,
        sections,
        chartData,
        weeklyStats,
        weightDiff,
        remainingWeight,
        isLoading,
        chartLoading,
        statsLoading,
        handleBack,
        handleCall,
        handleEmail,
        handleSendMessage,
        handleScheduleCall,
        handleCloseCallModal,
        handleTabChange,
        handlePeriodChange,
    } = useClientProfileScreen(clientId);

    // Loading state
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Not found state
    if (!client) {
        return <NotFound />;
    }

    const renderSection: ListRenderItem<SectionItem> = ({ item }) => {
        switch (item.type) {
            case 'header':
                return (
                    <ProfileHeader
                        client={client}
                        onBack={handleBack}
                        onCall={handleCall}
                        onEmail={handleEmail}
                    />
                );
            case 'stats':
                return (
                    <StatsCards
                        startWeight={client.startWeight}
                        currentWeight={client.currentWeight}
                        targetWeight={client.targetWeight}
                        startDate={client.startDate}
                        weightDiff={weightDiff}
                        remainingWeight={remainingWeight}
                    />
                );
            case 'actions':
                return (
                    <ActionButtons
                        client={{
                            id: client.id,
                            name: client.name,
                            nameAr: client.name, // Use same for now
                            currentWeight: client.currentWeight,
                            targetWeight: client.targetWeight,
                            goal: 'weight_loss',
                        }}
                        onSendMessage={handleSendMessage}
                        onScheduleCall={handleScheduleCall}
                    />
                );
            case 'tabs':
                return (
                    <ProfileTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />
                );
            case 'weekHeader':
                return (
                    <WeekSummary
                        currentWeight={client.currentWeight}
                        weeklyChange={client.weeklyChange}
                        remainingWeight={remainingWeight}
                        weeklyStats={weeklyStats}
                        isLoading={statsLoading}
                    />
                );
            case 'chart':
                return (
                    <View style={styles.tabContent}>
                        <WeightProgressChart
                            period={chartPeriod}
                            onPeriodChange={handlePeriodChange}
                            chartData={chartData}
                            isLoading={chartLoading}
                        />
                    </View>
                );
            case 'activity':
                return (
                    <View style={styles.tabContent}>
                        <ActivityTimeline activities={activities} />
                    </View>
                );
            case 'mealPlanContent':
                return (
                    <View style={styles.tabContent}>
                        <MealPlanTab clientId={client.id} clientName={client.name} />
                    </View>
                );
            case 'notesContent':
                return (
                    <View style={styles.tabContent}>
                        <NotesTab clientId={client.id} />
                    </View>
                );
            case 'settingsContent':
                return (
                    <View style={styles.tabContent}>
                        <SettingsTab clientId={client.id} />
                    </View>
                );
            case 'placeholder':
                return (
                    <View style={styles.tabContent}>
                        <PlaceholderSection
                            tabLabel={TABS.find(tab => tab.id === activeTab)?.label || ''}
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderSection}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                stickyHeaderIndices={[3]} // Make tabs sticky
            />

            {/* Schedule Call Modal */}
            <AddCallModal
                visible={showCallModal}
                onClose={handleCloseCallModal}
                selectedDate={new Date()}
                selectedHour={14} // Default to 2 PM
                preselectedClientId={client.id}
                preselectedClientName={client.name}
                onEventCreated={handleCloseCallModal}
            />
        </View>
    );
}
