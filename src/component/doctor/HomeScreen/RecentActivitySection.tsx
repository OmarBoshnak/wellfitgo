import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { isRTL, doctorTranslations as t, translateActivity, translateTime } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// Types
export interface Activity {
    id: string;
    text: string;
    time: string;
}

export interface RecentActivitySectionProps {
    activities: Activity[];
    onSeeAll?: () => void;
}

// Directional Arrow Component
function DirectionalArrow({ size = 16, color = colors.success }: { size?: number; color?: string }) {
    const scaledSize = horizontalScale(size);
    return isRTL ? <ArrowLeft size={scaledSize} color={color} /> : <ArrowRight size={scaledSize} color={color} />;
}

export function RecentActivitySection({
    activities,
    onSeeAll
}: RecentActivitySectionProps) {
    return (
        <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitleSmall, { textAlign: isRTL ? 'left' : 'right' }]}>{t.recentActivity}</Text>
            {activities.map((activity) => (
                <View key={activity.id} style={[styles.activityItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={[styles.activityText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {translateActivity(activity.text)}
                    </Text>
                    <Text style={[styles.activityTime, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {translateTime(activity.time)}
                    </Text>
                </View>
            ))}
            <TouchableOpacity
                style={[styles.viewAnalyticsLink, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                onPress={onSeeAll}
            >
                <Text style={styles.viewAnalyticsText}>{t.seeAllActivity}</Text>
                <DirectionalArrow />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    sectionTitleSmall: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
    activityItem: {
        marginBottom: verticalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    activityText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
    },
    activityTime: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginHorizontal: horizontalScale(10)
    },
    viewAnalyticsLink: {
        alignItems: 'center',
        marginTop: verticalScale(16),
        gap: horizontalScale(4),
    },
    viewAnalyticsText: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        fontWeight: '500',
    },
});
