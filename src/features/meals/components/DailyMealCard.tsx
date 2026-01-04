import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '@/src/core/constants/Themes';
import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';

interface DailyMealCardProps {
    meal: {
        id: string;
        dailyId: string;
        emoji?: string;
        name: string;
        nameAr?: string;
        note?: string;
        noteAr?: string;
        isCompleted: boolean;
    };
    onComplete: (mealId: string, noteAr: string) => void;
    onUncomplete: (mealId: string) => void;
    disabled?: boolean;
}

/**
 * Simple meal card for daily format diets
 * Shows emoji, meal name, note description, and a checkbox
 * 
 * ┌─────────────────────────────────┐
 * │ ☕ الإفطار                    ☐ │
 * │ تمرَتين فقط + شاي أو قهوة        │
 * └─────────────────────────────────┘
 */
export const DailyMealCard: React.FC<DailyMealCardProps> = ({
    meal,
    onComplete,
    onUncomplete,
    disabled = false,
}) => {
    const handleToggle = () => {
        if (disabled) return;
        if (meal.isCompleted) {
            onUncomplete(meal.dailyId);
        } else {
            onComplete(meal.dailyId, meal.noteAr || meal.note || '');
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                meal.isCompleted && styles.cardCompleted,
            ]}
            onPress={handleToggle}
            activeOpacity={disabled ? 1 : 0.7}
            disabled={disabled}
        >
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={[styles.mealInfo, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.emoji}>{meal.emoji || '🍽️'}</Text>
                    <Text style={[styles.mealName, isRTL && styles.textRTL]}>
                        {isRTL ? (meal.nameAr || meal.name) : meal.name}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.checkbox,
                        meal.isCompleted && styles.checkboxCompleted,
                        disabled && styles.checkboxDisabled,
                    ]}
                    onPress={handleToggle}
                    disabled={disabled}
                >
                    {meal.isCompleted && (
                        <Ionicons name="checkmark" size={18} color={colors.white} />
                    )}
                </TouchableOpacity>
            </View>

            {(meal.noteAr || meal.note) && (
                <Text style={[styles.noteText, isRTL && styles.textRTL]}>
                    {isRTL ? (meal.noteAr || meal.note) : (meal.note || meal.noteAr)}
                </Text>
            )}

            {meal.isCompleted && (
                <View style={[styles.completedBadge, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.completedText}>
                        {isRTL ? 'تم' : 'Done'}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        ...shadows.light,
    },
    cardCompleted: {
        backgroundColor: 'rgba(40, 175, 98, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(40, 175, 98, 0.2)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(8),
    },
    mealInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: horizontalScale(10),
    },
    emoji: {
        fontSize: ScaleFontSize(24),
    },
    mealName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    textRTL: {
        textAlign: 'left',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgSecondary,
    },
    checkboxCompleted: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    checkboxDisabled: {
        opacity: 0.5,
    },
    noteText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        lineHeight: 22,
        paddingTop: verticalScale(4),
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: verticalScale(8),
    },
    completedText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.success,
    },
});

export default DailyMealCard;
