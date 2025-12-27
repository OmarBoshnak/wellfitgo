import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import { t } from '../translations';

interface PlaceholderSectionProps {
    tabLabel: string;
}

export function PlaceholderSection({ tabLabel }: PlaceholderSectionProps) {
    return (
        <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>{tabLabel}</Text>
            <Text style={styles.placeholderText}>{t.placeholderText}</Text>
        </View>
    );
}
