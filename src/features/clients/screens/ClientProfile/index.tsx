import React from 'react';
import { View, FlatList, ListRenderItem } from 'react-native';
import { useClientProfileScreen } from './hooks/useClientProfileScreen';
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
import { styles } from './styles';
import { SectionItem, TABS } from './types';

export default function ClientProfileScreen() {
    const {
        activeTab,
        chartPeriod,
        client,
        activities,
        tabs,
        sections,
        weightDiff,
        remainingWeight,
        handleBack,
        handleCall,
        handleEmail,
        handleTabChange,
        handlePeriodChange,
    } = useClientProfileScreen();

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
                return <ActionButtons />;
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
                    />
                );
            case 'chart':
                return (
                    <View style={styles.tabContent}>
                        <WeightProgressChart
                            period={chartPeriod}
                            onPeriodChange={handlePeriodChange}
                        />
                    </View>
                );
            case 'activity':
                return (
                    <View style={styles.tabContent}>
                        <ActivityTimeline activities={activities} />
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
        </View>
    );
}
