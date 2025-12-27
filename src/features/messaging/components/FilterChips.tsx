import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

export type FilterType = 'all' | 'unread' | 'clients' | 'team';

interface Props {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

// Arabic labels for filters
const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'unread', label: 'غير مقروءة' },
    { key: 'clients', label: 'العملاء' },
    { key: 'team', label: 'الفريق' },
];

export default function FilterChips({ activeFilter, onFilterChange }: Props) {
    const renderChip = (filter: typeof FILTERS[0]) => {
        const isActive = activeFilter === filter.key;

        if (isActive) {
            return (
                <TouchableOpacity
                    key={filter.key}
                    activeOpacity={0.9}
                    onPress={() => onFilterChange(filter.key)}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.chipActive}
                    >
                        <Text style={styles.chipTextActive}>{filter.label}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={filter.key}
                style={styles.chip}
                activeOpacity={0.7}
                onPress={() => onFilterChange(filter.key)}
            >
                <Text style={styles.chipText}>{filter.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {/* Render in reverse order for RTL scroll behavior */}
            {[...FILTERS].reverse().map(renderChip)}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse', // RTL: Start from right
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(16),
        gap: horizontalScale(12),
    },
    chip: {
        height: verticalScale(32),
        paddingHorizontal: horizontalScale(16),
        borderRadius: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipActive: {
        height: verticalScale(32),
        paddingHorizontal: horizontalScale(16),
        borderRadius: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    chipText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    chipTextActive: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#FFFFFF',
    },
});
