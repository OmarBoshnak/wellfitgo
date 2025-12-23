import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { CalendarView } from '../types';
import { calendarTranslations as t } from '../translations';

interface ViewToggleProps {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
    currentView,
    onViewChange
}) => {
    const views: { key: CalendarView; label: string }[] = [
        { key: 'day', label: t.day },
        { key: 'week', label: t.week },
        // NO MONTH VIEW - intentionally excluded
    ];

    return (
        <View style={styles.container}>
            <View style={styles.toggleContainer}>
                {views.map((view) => (
                    <TouchableOpacity
                        key={view.key}
                        onPress={() => onViewChange(view.key)}
                        style={styles.toggleButton}
                    >
                        {currentView === view.key ? (
                            <LinearGradient
                                colors={['#4d6efe', '#3b82f6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.activeToggle}
                            >
                                <Text style={styles.activeText}>{view.label}</Text>
                            </LinearGradient>
                        ) : (
                            <View style={styles.inactiveToggle}>
                                <Text style={styles.inactiveText}>{view.label}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(25),
        padding: horizontalScale(4),
        gap: horizontalScale(4),
    },
    toggleButton: {
        borderRadius: horizontalScale(20),
        overflow: 'hidden',
    },
    activeToggle: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        shadowColor: '#4d6efe',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    inactiveToggle: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(8),
    },
    activeText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    inactiveText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
});

export default ViewToggle;
