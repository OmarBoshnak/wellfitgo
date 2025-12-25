import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder component - needs implementation
interface Props {
    meal?: any;
    onBack?: () => void;
    onDone?: () => void;
}

export default function EditMealCategories({ onBack }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Edit Meal Categories - Coming Soon</Text>
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