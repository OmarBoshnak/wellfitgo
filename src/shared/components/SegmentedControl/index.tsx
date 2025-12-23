import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/constants/Themes';
import { ScaleFontSize } from '@/src/utils/scaling';

interface SegmentedControlProps {
    options: string[];
    selected: number;
    onChange: (index: number) => void;
    width?: number;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
    options,
    selected,
    onChange,
    width = 150,
}) => {
    return (
        <View style={[styles.container, { width }]}>
            {options.map((option, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.option,
                        selected === index && styles.optionSelected,
                    ]}
                    onPress={() => onChange(index)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.optionText,
                            selected === index && styles.optionTextSelected,
                        ]}
                    >
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.bgSecondary,
        borderRadius: 8,
        padding: 2,
    },
    option: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    optionSelected: {
        backgroundColor: colors.bgPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    optionText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
});

export default SegmentedControl;
