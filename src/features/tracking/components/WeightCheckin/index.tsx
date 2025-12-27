import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, shadows } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { addWeightEntry, selectCurrentWeight } from '@/src/store/userSlice';

const { width, height } = Dimensions.get('window');

interface WeightCheckinProps {
    visible: boolean;
    onClose: () => void;
    onComplete: () => void;
    isRTL: boolean;
}

const translations = {
    title: (isRTL: boolean) => isRTL ? 'تسجيل الوزن الأسبوعي' : 'Weekly Weight Check-in',
    currentWeight: (isRTL: boolean) => isRTL ? 'الوزن الحالي' : 'Current Weight',
    newWeight: (isRTL: boolean) => isRTL ? 'الوزن الجديد' : 'New Weight',
    save: (isRTL: boolean) => isRTL ? 'حفظ' : 'Save',
    cancel: (isRTL: boolean) => isRTL ? 'إلغاء' : 'Cancel',
    kg: 'kg',
    success: (isRTL: boolean) => isRTL ? 'تم الحفظ بنجاح! 🎉' : 'Saved Successfully! 🎉',
};

export const WeightCheckin: React.FC<WeightCheckinProps> = ({
    visible,
    onClose,
    onComplete,
    isRTL,
}) => {
    const dispatch = useAppDispatch();
    const currentWeight = useAppSelector(selectCurrentWeight);

    const [newWeight, setNewWeight] = useState<number>(currentWeight || 70);
    const [showSuccess, setShowSuccess] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0));
    const [successAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            setNewWeight(currentWeight || 70);
            setShowSuccess(false);
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 10,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible, currentWeight]);

    const adjustWeight = (delta: number) => {
        setNewWeight(prev => Math.max(30, Math.min(200, parseFloat((prev + delta).toFixed(1)))));
    };

    const handleSave = () => {
        dispatch(addWeightEntry(newWeight));

        // Show success animation
        setShowSuccess(true);
        Animated.sequence([
            Animated.spring(successAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }),
            Animated.delay(1000),
            Animated.timing(successAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowSuccess(false);
            onComplete();
        });
    };

    const weightDiff = newWeight - currentWeight;
    const diffColor = weightDiff > 0 ? colors.error : weightDiff < 0 ? colors.success : colors.textSecondary;
    const diffSign = weightDiff > 0 ? '+' : '';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={styles.overlay} tint="dark">
                <TouchableOpacity
                    style={styles.overlayTouch}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <Animated.View
                        style={[
                            styles.container,
                            { transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <TouchableOpacity activeOpacity={1}>
                            {/* Header */}
                            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {translations.title(isRTL)}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Current Weight Display */}
                            <View style={styles.currentWeightContainer}>
                                <Text style={styles.currentWeightLabel}>
                                    {translations.currentWeight(isRTL)}
                                </Text>
                                <Text style={styles.currentWeightValue}>
                                    {currentWeight.toFixed(1)} <Text style={styles.unit}>{translations.kg}</Text>
                                </Text>
                            </View>

                            {/* New Weight Input */}
                            <View style={styles.newWeightContainer}>
                                <Text style={styles.newWeightLabel}>
                                    {translations.newWeight(isRTL)}
                                </Text>

                                <View style={[styles.weightInputRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    {/* Decrease Button */}
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => adjustWeight(-0.1)}
                                        onLongPress={() => adjustWeight(-1)}
                                    >
                                        <Ionicons name="remove" size={28} color={colors.primaryDark} />
                                    </TouchableOpacity>

                                    {/* Weight Display */}
                                    <View style={styles.weightDisplay}>
                                        <Text style={styles.weightValue}>
                                            {newWeight.toFixed(1)}
                                        </Text>
                                        <Text style={styles.weightUnit}>{translations.kg}</Text>
                                    </View>

                                    {/* Increase Button */}
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => adjustWeight(0.1)}
                                        onLongPress={() => adjustWeight(1)}
                                    >
                                        <Ionicons name="add" size={28} color={colors.primaryDark} />
                                    </TouchableOpacity>
                                </View>

                                {/* Weight Difference */}
                                {weightDiff !== 0 && (
                                    <Text style={[styles.diffText, { color: diffColor }]}>
                                        {diffSign}{weightDiff.toFixed(1)} kg
                                    </Text>
                                )}
                            </View>

                            {/* Quick Adjust Buttons */}
                            <View style={[styles.quickAdjustRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                {[-1, -0.5, 0.5, 1].map((delta) => (
                                    <TouchableOpacity
                                        key={delta}
                                        style={styles.quickButton}
                                        onPress={() => adjustWeight(delta)}
                                    >
                                        <Text style={styles.quickButtonText}>
                                            {delta > 0 ? '+' : ''}{delta}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Action Buttons */}
                            <View style={[styles.buttonRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>
                                        {translations.cancel(isRTL)}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleSave} activeOpacity={0.9}>
                                    <LinearGradient
                                        colors={gradients.primary}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[styles.saveButton, shadows.medium]}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {translations.save(isRTL)}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Success Overlay */}
                    {showSuccess && (
                        <Animated.View
                            style={[
                                styles.successOverlay,
                                {
                                    opacity: successAnim,
                                    transform: [{ scale: successAnim }]
                                }
                            ]}
                        >
                            <View style={styles.successContent}>
                                <Text style={styles.successEmoji}>🎉</Text>
                                <Text style={styles.successText}>
                                    {translations.success(isRTL)}
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </TouchableOpacity>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    overlayTouch: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    container: {
        width: width * 0.9,
        maxWidth: 400,
        backgroundColor: colors.bgPrimary,
        borderRadius: 24,
        padding: horizontalScale(24),
        ...shadows.light,
    },
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(20),
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    currentWeightContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(24),
        paddingVertical: verticalScale(16),
        backgroundColor: colors.bgSecondary,
        borderRadius: 16,
    },
    currentWeightLabel: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginBottom: 4,
    },
    currentWeightValue: {
        fontSize: ScaleFontSize(32),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    unit: {
        fontSize: ScaleFontSize(18),
        color: colors.textSecondary,
        fontWeight: '400',
    },
    newWeightContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    newWeightLabel: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginBottom: 12,
    },
    weightInputRow: {
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    adjustButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.light,
    },
    weightDisplay: {
        alignItems: 'center',
    },
    weightValue: {
        fontSize: ScaleFontSize(48),
        fontWeight: '700',
        color: colors.primaryDark,
    },
    weightUnit: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
        marginTop: -4,
    },
    diffText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        marginTop: 8,
    },
    quickAdjustRow: {
        justifyContent: 'center',
        gap: horizontalScale(10),
        marginBottom: verticalScale(24),
    },
    quickButton: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: 20,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    buttonRow: {
        gap: horizontalScale(12),
    },
    cancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textSecondary,
    },
    saveButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(32),
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.white,
    },
    successOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContent: {
        backgroundColor: colors.bgPrimary,
        padding: horizontalScale(40),
        borderRadius: 24,
        alignItems: 'center',
        ...shadows.medium,
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    successText: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.success,
        textAlign: 'center',
    },
});

export default WeightCheckin;
