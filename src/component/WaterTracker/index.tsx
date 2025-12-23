import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, shadows } from '@/src/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    addWater,
    setGoal,
    undoLast,
    checkAndResetDaily,
    selectWaterIntake,
    selectWaterGoal,
    selectWaterLogs,
    selectWaterPercentage,
} from '@/src/store/waterSlice';

const { width } = Dimensions.get('window');

interface WaterTrackerProps {
    visible: boolean;
    onClose: () => void;
    isRTL: boolean;
}

type ViewType = 'main' | 'settings' | 'history';

const translations = {
    title: (isRTL: boolean) => isRTL ? 'تتبع المياه' : 'Hydrate',
    cups: (isRTL: boolean) => isRTL ? 'كوب' : 'Cups',
    cup: (isRTL: boolean) => isRTL ? 'كوب' : 'cup',
    goal: (isRTL: boolean) => isRTL ? 'الهدف' : 'Goal',
    drinkCup: (isRTL: boolean) => isRTL ? 'اضافة كوب' : 'add Cup',
    settings: (isRTL: boolean) => isRTL ? 'الإعدادات' : 'Settings',
    history: (isRTL: boolean) => isRTL ? 'سجل اليوم' : "Today's Logs",
    back: (isRTL: boolean) => isRTL ? 'رجوع' : 'Back',
    dailyGoal: (isRTL: boolean) => isRTL ? 'الهدف اليومي (أكواب)' : 'Daily Goal (Cups)',
    recommended: (isRTL: boolean) => isRTL ? 'الموصى به: 8 أكواب' : 'Recommended: 8 Cups',
    noLogs: (isRTL: boolean) => isRTL ? 'لم يتم تسجيل أي أكواب بعد.' : 'No cups logged yet.',
    goalReached: (isRTL: boolean) => isRTL ? '🎉 هدف اليوم تحقق!' : '🎉 Daily Goal Reached!',
    complete: (isRTL: boolean) => isRTL ? 'مكتمل' : 'COMPLETE',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const WaterTracker: React.FC<WaterTrackerProps> = ({
    visible,
    onClose,
    isRTL,
}) => {
    const dispatch = useAppDispatch();
    const intake = useAppSelector(selectWaterIntake);
    const goal = useAppSelector(selectWaterGoal);
    const logs = useAppSelector(selectWaterLogs);
    const percentage = useAppSelector(selectWaterPercentage);

    const [currentView, setCurrentView] = useState<ViewType>('main');
    const [showCelebration, setShowCelebration] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0));
    const [celebrationAnim] = useState(new Animated.Value(0));
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Circle dimensions
    const circleSize = horizontalScale(200);
    const strokeWidth = horizontalScale(16);
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        if (visible) {
            dispatch(checkAndResetDaily());
            setCurrentView('main');
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 10,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    useEffect(() => {
        // Animate progress circle
        Animated.timing(progressAnim, {
            toValue: Math.min(percentage, 100),
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    useEffect(() => {
        // Check if goal was just reached
        if (intake >= goal && intake > 0) {
            setShowCelebration(true);
            Animated.sequence([
                Animated.spring(celebrationAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.delay(2000),
                Animated.timing(celebrationAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setShowCelebration(false));
        }
    }, [intake, goal]);

    const handleAddCup = () => {
        dispatch(addWater(1));
    };

    const handleRemoveLog = (logId: string) => {
        dispatch(undoLast());
    };

    const handleSetGoal = (newGoal: number) => {
        dispatch(setGoal(newGoal));
    };

    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    // Get today's date string
    const getDateString = () => {
        const now = new Date();
        if (isRTL) {
            return now.toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' });
        }
        return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    // Settings View
    if (currentView === 'settings') {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <BlurView intensity={20} style={styles.overlay} tint="dark">
                    <View style={styles.fullScreenContainer}>
                        <LinearGradient
                            colors={['#2563EB', '#3B82F6']}
                            style={styles.gradientBackground}
                        >
                            {/* Header */}
                            <View style={[styles.subViewHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setCurrentView('main')}
                                >
                                    <Ionicons
                                        name={isRTL ? 'chevron-forward' : 'chevron-back'}
                                        size={24}
                                        color="#FFF"
                                    />
                                    <Text style={styles.backText}>{translations.back(isRTL)}</Text>
                                </TouchableOpacity>
                                <Text style={styles.subViewTitle}>{translations.settings(isRTL)}</Text>
                                <View style={{ width: 80 }} />
                            </View>

                            {/* Goal Setting Card */}
                            <View style={styles.settingsCard}>
                                <Text style={styles.settingsLabel}>
                                    {translations.dailyGoal(isRTL)}
                                </Text>
                                <View style={[styles.goalSliderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.goalButtonsContainer}>
                                        {[4, 6, 8, 10, 12, 14, 16].map((g) => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[
                                                    styles.goalChip,
                                                    goal === g && styles.goalChipActive,
                                                ]}
                                                onPress={() => handleSetGoal(g)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.goalChipText,
                                                        goal === g && styles.goalChipTextActive,
                                                    ]}
                                                >
                                                    {g}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.recommendedText}>
                                    {translations.recommended(isRTL)}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                </BlurView>
            </Modal>
        );
    }

    // History View
    if (currentView === 'history') {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <BlurView intensity={20} style={styles.overlay} tint="dark">
                    <View style={styles.fullScreenContainer}>
                        <LinearGradient
                            colors={['#2563EB', '#3B82F6']}
                            style={styles.gradientBackground}
                        >
                            {/* Header */}
                            <View style={[styles.subViewHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setCurrentView('main')}
                                >
                                    <Ionicons
                                        name={isRTL ? 'chevron-forward' : 'chevron-back'}
                                        size={24}
                                        color="#FFF"
                                    />
                                    <Text style={styles.backText}>{translations.back(isRTL)}</Text>
                                </TouchableOpacity>
                                <Text style={styles.subViewTitle}>{translations.history(isRTL)}</Text>
                                <View style={{ width: 80 }} />
                            </View>

                            {/* Logs List */}
                            {logs.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="water-outline" size={64} color="rgba(255,255,255,0.3)" />
                                    <Text style={styles.emptyText}>{translations.noLogs(isRTL)}</Text>
                                </View>
                            ) : (
                                <ScrollView style={styles.logsScrollView} showsVerticalScrollIndicator={false}>
                                    {logs.map((log) => (
                                        <View
                                            key={log.id}
                                            style={[styles.logCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                        >
                                            <View style={[styles.logInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                                <View style={styles.logIconContainer}>
                                                    <Ionicons name="cafe-outline" size={20} color="#FFF" />
                                                </View>
                                                <View>
                                                    <Text style={styles.logAmount}>
                                                        {log.amount} {translations.cup(isRTL)}
                                                    </Text>
                                                    <Text style={styles.logTime}>{log.time}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveLog(log.id)}
                                                style={styles.deleteButton}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.6)" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                        </LinearGradient>
                    </View>
                </BlurView>
            </Modal>
        );
    }

    // Main View
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <BlurView intensity={20} style={styles.overlay} tint="dark">
                <View style={styles.fullScreenContainer}>
                    <LinearGradient
                        colors={['#2563EB', '#3B82F6']}
                        style={styles.gradientBackground}
                    >
                        {/* Header */}
                        <View style={[styles.mainHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View>
                                <Text style={[styles.mainTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {translations.title(isRTL)}
                                </Text>
                                <Text style={[styles.dateText, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {getDateString()}
                                </Text>
                            </View>
                            <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setCurrentView('history')}
                                >
                                    <Ionicons name="time-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => setCurrentView('settings')}
                                >
                                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={onClose}
                                >
                                    <Ionicons name="close" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Main Content */}
                        <View style={styles.mainContent}>
                            {/* Progress Circle */}
                            <View style={styles.progressCircleContainer}>
                                {/* Glow Effect */}
                                <View style={styles.glowEffect} />

                                <Svg width={circleSize} height={circleSize} style={styles.progressSvg}>
                                    {/* Background Circle */}
                                    <Circle
                                        cx={circleSize / 2}
                                        cy={circleSize / 2}
                                        r={radius}
                                        stroke="rgba(0,0,0,0.1)"
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                    />
                                    {/* Progress Circle */}
                                    <AnimatedCircle
                                        cx={circleSize / 2}
                                        cy={circleSize / 2}
                                        r={radius}
                                        stroke="#FFFFFF"
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                                    />
                                </Svg>

                                {/* Center Content */}
                                <View style={styles.centerContent}>
                                    <Text style={styles.intakeValue}>{intake}</Text>
                                    <Text style={styles.goalText}>/ {goal} {translations.cups(isRTL)}</Text>
                                    {intake >= goal && (
                                        <View style={styles.completeBadge}>
                                            <Ionicons name="trophy" size={12} color="#FCD34D" />
                                            <Text style={styles.completeText}>{translations.complete(isRTL)}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Add Cup Button */}
                            <TouchableOpacity
                                style={styles.addCupButton}
                                onPress={handleAddCup}
                                activeOpacity={0.9}
                            >
                                <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse' }}>
                                    <Ionicons name="cafe" size={24} color="#2563EB" />
                                    <Text style={styles.addCupText}>{translations.drinkCup(isRTL)}</Text>
                                    <View style={styles.plusBadge}>
                                        <Text style={styles.plusText}>+1</Text>
                                    </View>

                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Celebration Overlay */}
                        {showCelebration && (
                            <Animated.View
                                style={[
                                    styles.celebrationOverlay,
                                    {
                                        opacity: celebrationAnim,
                                        transform: [{ scale: celebrationAnim }],
                                    },
                                ]}
                            >
                                <View style={styles.celebrationContent}>
                                    <Text style={styles.celebrationEmoji}>💧🎉💧</Text>
                                    <Text style={styles.celebrationText}>
                                        {translations.goalReached(isRTL)}
                                    </Text>
                                </View>
                            </Animated.View>
                        )}
                    </LinearGradient>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    fullScreenContainer: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
        paddingTop: verticalScale(60),
        paddingHorizontal: horizontalScale(20),
    },

    // Main View Header
    mainHeader: {
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: verticalScale(20),
    },
    mainTitle: {
        fontSize: ScaleFontSize(32),
        fontWeight: '700',
        color: '#FFF',
    },
    dateText: {
        fontSize: ScaleFontSize(14),
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    headerActions: {
        gap: horizontalScale(8),
    },
    headerButton: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(14),
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Main Content
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Progress Circle
    progressCircleContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(50),
    },
    glowEffect: {
        position: 'absolute',
        width: horizontalScale(220),
        height: horizontalScale(220),
        borderRadius: horizontalScale(110),
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
    },
    progressSvg: {
        position: 'relative',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    intakeValue: {
        fontSize: ScaleFontSize(64),
        fontWeight: '700',
        color: '#FFF',
    },
    goalText: {
        fontSize: ScaleFontSize(16),
        color: 'rgba(255,255,255,0.8)',
        marginTop: -4,
    },
    completeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: horizontalScale(20),
        marginTop: verticalScale(8),
        gap: 4,
    },
    completeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#FFF',
    },

    // Add Cup Button
    addCupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: verticalScale(18),
        paddingHorizontal: horizontalScale(20),
        borderRadius: horizontalScale(30),
        gap: horizontalScale(12),
        ...shadows.medium,
    },
    addCupText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#2563EB',
        marginHorizontal: horizontalScale(10)
    },
    plusBadge: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(8),
    },
    plusText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: '#2563EB',
    },

    // Sub View Header
    subViewHeader: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(30),
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backText: {
        fontSize: ScaleFontSize(16),
        color: '#FFF',
        fontWeight: '500',
    },
    subViewTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: '#FFF',
    },

    // Settings View
    settingsCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: horizontalScale(24),
        padding: horizontalScale(24),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    settingsLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: verticalScale(16),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    goalSliderRow: {
        marginBottom: verticalScale(12),
    },
    goalButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: horizontalScale(8),
    },
    goalChip: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(10),
        borderRadius: horizontalScale(20),
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    goalChipActive: {
        backgroundColor: '#FFF',
    },
    goalChipText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFF',
    },
    goalChipTextActive: {
        color: '#2563EB',
    },
    recommendedText: {
        fontSize: ScaleFontSize(12),
        color: 'rgba(255,255,255,0.6)',
    },

    // History View
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: ScaleFontSize(16),
        color: 'rgba(255,255,255,0.5)',
        marginTop: verticalScale(16),
    },
    logsScrollView: {
        flex: 1,
    },
    logCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logInfo: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    logIconContainer: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(12),
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logAmount: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#FFF',
    },
    logTime: {
        fontSize: ScaleFontSize(12),
        color: 'rgba(255,255,255,0.6)',
    },
    deleteButton: {
        padding: horizontalScale(8),
    },

    // Celebration
    celebrationOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    celebrationContent: {
        backgroundColor: '#FFF',
        padding: horizontalScale(40),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
        ...shadows.medium,
    },
    celebrationEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    celebrationText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#2563EB',
        textAlign: 'center',
    },
});

export default WaterTracker;
