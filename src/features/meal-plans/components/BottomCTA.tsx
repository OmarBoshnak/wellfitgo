/**
 * BottomCTA Component
 * Sticky footer with primary/secondary action buttons
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { mealPlanColors, mealPlanGradients, borderRadius, shadows } from '../constants';

interface BottomCTAProps {
    primaryLabel: string;
    onPrimaryPress: () => void;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
    showArrow?: boolean;
    disabled?: boolean;
}

export function BottomCTA({
    primaryLabel,
    onPrimaryPress,
    secondaryLabel,
    onSecondaryPress,
    showArrow = true,
    disabled = false,
}: BottomCTAProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, verticalScale(16)) }]}>
            {secondaryLabel && onSecondaryPress && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onSecondaryPress}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryButtonWrapper, { flex: 1.5 }]}
                        onPress={onPrimaryPress}
                        activeOpacity={0.9}
                        disabled={disabled}
                    >
                        <LinearGradient
                            colors={[...mealPlanGradients.button]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.primaryButton, disabled && styles.disabledButton]}
                        >
                            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
            {!secondaryLabel && (
                <TouchableOpacity
                    style={styles.primaryButtonWrapper}
                    onPress={onPrimaryPress}
                    activeOpacity={0.9}
                    disabled={disabled}
                >
                    <LinearGradient
                        colors={[...mealPlanGradients.button]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.primaryButton, disabled && styles.disabledButton]}
                    >
                        <View style={[styles.buttonContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                            {showArrow && (
                                <Ionicons
                                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                                    size={horizontalScale(20)}
                                    color="#FFFFFF"
                                />
                            )}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: mealPlanColors.border,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: horizontalScale(12),
    },
    primaryButtonWrapper: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        ...shadows.primaryButton,
    },
    primaryButton: {
        height: verticalScale(48),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    buttonContentRTL: {
        flexDirection: 'row-reverse',
    },
    primaryButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        flex: 1,
        height: verticalScale(48),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: mealPlanColors.textSubtext,
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: mealPlanColors.textSlate,
    },
});
