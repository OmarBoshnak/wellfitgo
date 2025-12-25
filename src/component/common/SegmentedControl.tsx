/**
 * SegmentedControl - iOS-style segmented control component
 * Used for toggling between options like language (AR/EN)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

interface SegmentedControlProps {
    options: string[];
    selected: number;
    onChange: (index: number) => void;
    width?: number;
}

export function SegmentedControl({ options, selected, onChange, width = 100 }: SegmentedControlProps) {
    return (
        <View style={[styles.container, { width: horizontalScale(width) }]}>
            {options.map((option, index) => (
                <Pressable
                    key={option}
                    style={[
                        styles.segment,
                        selected === index && styles.segmentSelected,
                    ]}
                    onPress={() => onChange(index)}
                >
                    <Text
                        style={[
                            styles.label,
                            selected === index && styles.labelSelected,
                        ]}
                    >
                        {option}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        padding: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: verticalScale(6),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    segmentSelected: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: '#6B7280',
    },
    labelSelected: {
        color: '#1F2937',
        fontWeight: '600',
    },
});
