import React from 'react';
import { View, Text } from 'react-native';
import { isRTL } from '@/src/core/constants/translations';
import { styles } from '../styles';
import { getActorLabel } from '../translations';

// Activity item type from Convex
export interface ActivityItem {
    id: string;
    type: 'weight' | 'meals' | 'message' | 'missed' | 'plan' | 'water';
    color: string;
    title: string;
    description: string;
    time: string;
    date: string;
    actor: 'coach' | 'client' | 'system';
    actorName: string;
    timestamp: number;
}

interface ActivityTimelineItemProps {
    activity: ActivityItem;
    isFirst: boolean;
    isLast: boolean;
}

export function ActivityTimelineItem({ activity, isFirst, isLast }: ActivityTimelineItemProps) {
    return (
        <View style={[
            styles.timelineItem,
            { flexDirection: isRTL ? 'row' : 'row-reverse' }
        ]}>
            {/* Timeline Line & Dot */}
            <View style={styles.timelineLineContainer}>
                {/* Top line */}
                <View style={[
                    styles.timelineLineTop,
                    isFirst && styles.timelineLineTopFirst
                ]} />

                {/* Dot */}
                <View style={[
                    styles.timelineDot,
                    { backgroundColor: activity.color }
                ]} />

                {/* Bottom line */}
                <View style={[
                    styles.timelineLineBottom,
                    isLast && styles.timelineLineBottomLast
                ]} />
            </View>

            {/* Content */}
            <View style={[
                styles.contentCard,
                isRTL && styles.contentCardRTL
            ]}>
                {/* Header: Title + Time */}
                <View style={[
                    styles.contentHeader,
                    { flexDirection: isRTL ? 'row' : 'row-reverse' }
                ]}>
                    <Text style={[
                        styles.contentTitle,
                        { textAlign: isRTL ? 'left' : 'right' }
                    ]}>
                        {activity.title}
                    </Text>
                    <Text style={[
                        styles.contentTime,
                        isRTL && styles.contentTimeRTL
                    ]}>
                        {activity.time}
                    </Text>
                </View>

                {/* Description */}
                {activity.description !== '' && (
                    <Text style={[
                        styles.contentDescription,
                        { textAlign: isRTL ? 'left' : 'right' }
                    ]}>
                        {activity.description}
                    </Text>
                )}

                {/* Footer: Date + Actor */}
                <View style={[
                    styles.contentFooter,
                    { flexDirection: isRTL ? 'row' : 'row-reverse' }
                ]}>
                    <Text style={styles.contentDate}>{activity.date}</Text>
                    <View style={styles.footerDot} />
                    <Text style={styles.contentActor}>
                        {getActorLabel(activity.actor)}: {activity.actorName}
                    </Text>
                </View>
            </View>
        </View>
    );
}
