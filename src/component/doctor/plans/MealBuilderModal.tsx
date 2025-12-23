import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder component - needs implementation
interface Props {
    onClose?: () => void;
    onSave?: () => void;
}

export default function MealBuilderModal({ onClose }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Meal Builder - Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        color: '#666',
    },
});
