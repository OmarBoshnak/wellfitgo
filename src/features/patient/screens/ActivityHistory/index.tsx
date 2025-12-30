import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { isRTL } from '@/src/core/constants/translations';
import { colors } from '@/src/core/constants/Themes';
import { ActivityTimelineItem, ActivityItem } from './components/ActivityTimelineItem';
import { styles } from './styles';
import { t } from './translations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActivityHistoryScreenProps {
    clientId?: string;
}

export default function ActivityHistoryScreen({ clientId: propClientId }: ActivityHistoryScreenProps) {
    const router = useRouter();
    const params = useLocalSearchParams<{ clientId: string }>();
    const insets = useSafeAreaInsets();

    // Use prop or route param
    const clientId = propClientId || params.clientId;

    // Fetch all activities from Convex
    const activities = useQuery(
        api.clientProfile.getAllClientActivity,
        clientId ? { clientId: clientId as Id<"users"> } : "skip"
    );

    // Memoize activities to prevent scroll reset
    const memoizedActivities = useMemo(
        () => (activities ?? []) as ActivityItem[],
        [activities]
    );
    const activitiesLength = memoizedActivities.length;

    const isLoading = activities === undefined;

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Memoized key extractor - CRITICAL for preventing scroll reset
    const keyExtractor = useCallback((item: ActivityItem) => item.id, []);

    // Memoized render item - CRITICAL for preventing scroll reset
    const renderItem = useCallback(
        ({ item, index }: { item: ActivityItem; index: number }) => (
            <ActivityTimelineItem
                activity={item}
                isFirst={index === 0}
                isLast={index === activitiesLength - 1}
            />
        ),
        [activitiesLength]
    );

    // Memoized empty component
    const ListEmptyComponent = useMemo(
        () => (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>{t.noActivities}</Text>
            </View>
        ),
        []
    );

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={[
                        styles.headerContent,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' }
                    ]}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Ionicons
                                name={isRTL ? "chevron-back" : "chevron-back"}
                                size={24}
                                color={colors.textPrimary}
                            />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t.screenTitle}</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </View>

                {/* Loading indicator */}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sticky Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[
                    styles.headerContent,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Ionicons
                            name={isRTL ? "chevron-back" : "chevron-forward"}
                            size={24}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t.screenTitle}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {/* Timeline FlatList */}
            <FlatList
                data={memoizedActivities}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={ListEmptyComponent}
                initialNumToRender={20}
                maxToRenderPerBatch={15}
                windowSize={21}
                removeClippedSubviews={false}
                extraData={activitiesLength}
            />
        </View>
    );
}
