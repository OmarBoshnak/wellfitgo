import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

// Arabic translations
const t = {
    noMessages: 'لا توجد رسائل بعد',
    startConversation: 'ابدأ محادثة مع عملائك لمتابعة تقدمهم.',
};

export default function EmptyState() {
    return (
        <View style={styles.container}>
            <MaterialIcons name="chat-bubble-outline" size={80} color="#AAB8C5" />
            <Text style={styles.title}>{t.noMessages}</Text>
            <Text style={styles.subtitle}>{t.startConversation}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: horizontalScale(32),
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: verticalScale(16),
        marginBottom: verticalScale(8),
        textAlign: 'center',
    },
    subtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: ScaleFontSize(22),
    },
});
