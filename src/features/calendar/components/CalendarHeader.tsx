import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { calendarTranslations as t } from '../translations';

interface CalendarHeaderProps {
    style?: ViewStyle;
    onEditPress?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ style, onEditPress }) => {
    const router = useRouter();

    return (
        <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }, style]}>
            <TouchableOpacity
                onPress={() => router.back()}
            >
                <ArrowLeft
                    size={horizontalScale(24)}
                    color={colors.dark}
                />
            </TouchableOpacity>

            <Text style={styles.title}>{t.calendar}</Text>

            <TouchableOpacity onPress={onEditPress}>
                <View style={styles.addButton}>
                    <Text style={styles.addButtonText}>{t.add}</Text>
                </View>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.primaryDark,
    },
});

export default CalendarHeader;
