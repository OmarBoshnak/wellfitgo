import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder component - needs implementation
interface Props {
    clientId?: string;
    clientName?: string;
    clientAvatar?: string;
    onBack?: () => void;
}

export default function MealPlanCreator({ onBack }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Meal Plan Creator - Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        color: '#666',
    },
});
