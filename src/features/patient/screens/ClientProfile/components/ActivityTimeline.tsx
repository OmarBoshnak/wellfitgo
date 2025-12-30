import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale } from '@/src/core/utils/scaling';
import { styles } from '../styles';
import { t } from '../translations';

// Activity interface matching Convex data
interface Activity {
    id: string;
    type: "weight" | "meals" | "message" | "missed" | "plan" | "water";
    color: string;
    date: string;
    text: string;
    subtext: string;
}

interface ActivityTimelineProps {
    activities: Activity[];
    clientId: string;
}

export function ActivityTimeline({ activities, clientId }: ActivityTimelineProps) {
    const router = useRouter();

    const handleLoadMore = () => {
        router.push({
            pathname: '/(app)/doctor/activity-history',
            params: { clientId },
        });
    };

    return (
        <View style={styles.activityCard}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                {t.recentActivity}
            </Text>
            {activities.map((activity, index) => (
                <View
                    key={activity.id}
                    style={[styles.activityItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                >
                    {/* Timeline Line */}
                    {index < activities.length - 1 && (
                        <View
                            style={[
                                styles.timelineLine,
                                { [isRTL ? 'left' : 'right']: horizontalScale(5) }
                            ]}
                        />
                    )}
                    {/* Dot */}
                    <View style={[styles.activityDot, { backgroundColor: activity.color }]} />
                    {/* Content */}
                    <View style={[styles.activityContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                            <Text style={[styles.activityDate, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {activity.date}
                            </Text>
                            <Text style={[styles.activityText, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {activity.text}
                            </Text>
                            {activity.subtext !== '' && (
                                <Text style={[styles.activitySubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {activity.subtext}
                                </Text>
                            )}

                        </View>
                    </View>
                </View>
            ))}
            <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreText}>{t.loadMore}</Text>
            </TouchableOpacity>
        </View>
    );
}
