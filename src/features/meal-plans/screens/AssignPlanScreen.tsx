/**
 * AssignPlanScreen
 * Step 4: Final assignment settings (date, notifications, message)
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';
import { mealPlanColors, mealPlanGradients, borderRadius, shadows } from '../constants';
import { t } from '../translations';
import { ProgressSteps } from '../components/ProgressSteps';
import { BottomCTA } from '../components/BottomCTA';
import type { ClientInfo, NotificationSettings } from '../types';

interface AssignPlanScreenProps {
    client: ClientInfo;
    planName: string;
    onBack: () => void;
    onAssign: (data: {
        startDate: Date;
        notifications: NotificationSettings;
        personalMessage: string;
        saveAsTemplate: boolean;
    }) => void;
    onSaveDraft: () => void;
}

export function AssignPlanScreen({
    client,
    planName,
    onBack,
    onAssign,
    onSaveDraft,
}: AssignPlanScreenProps) {
    const insets = useSafeAreaInsets();
    const clientName = isRTL ? client.nameAr : client.name;

    // Form state
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [startDate] = useState(tomorrow);
    const [notifications, setNotifications] = useState<NotificationSettings>({
        push: true,
        email: false,
        whatsapp: false,
    });
    const [personalMessage, setPersonalMessage] = useState('');
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const monthNames = isRTL
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${t.tomorrow}, ${monthNames[date.getMonth()]} ${day}`;
    };

    const toggleNotification = (key: keyof NotificationSettings) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAssign = () => {
        onAssign({
            startDate,
            notifications,
            personalMessage,
            saveAsTemplate,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[styles.headerTop, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={styles.progressContainer}>
                        <ProgressSteps currentStep={4} />
                    </View>
                    <Text style={styles.headerTitle}>{t.assignPlan}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={'arrow-back'}
                            size={horizontalScale(24)}
                            color={mealPlanColors.textMain}
                        />
                    </TouchableOpacity>

                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Client Confirmation Card */}
                <LinearGradient
                    colors={[...mealPlanGradients.button]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.clientCard}
                >
                    <View style={styles.clientCardBlur1} />
                    <View style={styles.clientCardBlur2} />
                    <View style={[styles.clientCardContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={styles.clientAvatar}>
                            {client.avatarUrl ? (
                                <Image source={{ uri: client.avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{clientName.charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.clientInfo}>
                            <Text style={[styles.clientName, { textAlign: isRTL ? 'left' : 'right' }]}>{clientName}</Text>
                            <Text style={[styles.clientPlan, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.willReceive} {planName}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Settings Section */}
                <View style={styles.settings}>
                    {/* Start Date */}
                    <View style={styles.settingCard}>
                        <Text style={styles.settingLabel}>{t.startDate}</Text>
                        <TouchableOpacity style={styles.dateButton} activeOpacity={0.7}>
                            <View style={[styles.dateContent, isRTL && styles.dateContentRTL]}>
                                <View style={styles.dateIcon}>
                                    <Ionicons name="calendar" size={horizontalScale(24)} color={mealPlanColors.primary} />
                                </View>
                                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                            </View>
                            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={horizontalScale(20)} color={mealPlanColors.textDesc} />
                        </TouchableOpacity>
                    </View>

                    {/* Notifications */}
                    <View style={styles.settingCard}>
                        <Text style={styles.settingLabel}>{t.notifications}</Text>
                        <View style={styles.checkboxGroup}>
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => toggleNotification('push')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, notifications.push && styles.checkboxChecked]}>
                                    {notifications.push && (
                                        <Ionicons name="checkmark" size={horizontalScale(18)} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={[styles.checkboxLabel, isRTL && styles.textRTL]}>{t.sendPushNotification}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Personal Message */}
                    <View style={styles.settingCard}>
                        <Text style={styles.settingLabel}>{t.personalMessage}</Text>
                        <TextInput
                            style={[styles.messageInput, isRTL && styles.messageInputRTL]}
                            value={personalMessage}
                            onChangeText={setPersonalMessage}
                            placeholder={`${t.addMessageFor} ${clientName.split(' ')[0]}...`}
                            placeholderTextColor={mealPlanColors.textDesc}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Save as Template */}
                    <TouchableOpacity
                        style={styles.templateRow}
                        onPress={() => setSaveAsTemplate(!saveAsTemplate)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, saveAsTemplate && styles.checkboxChecked]}>
                            {saveAsTemplate && (
                                <Ionicons name="checkmark" size={horizontalScale(18)} color="#FFFFFF" />
                            )}
                        </View>
                        <Text style={[styles.templateLabel, isRTL && styles.textRTL]}>{t.saveAsTemplate}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: verticalScale(120) }} />
            </ScrollView>

            {/* Bottom CTA */}
            <BottomCTA
                primaryLabel={t.assign}
                onPrimaryPress={handleAssign}
                secondaryLabel={t.saveAsDraft}
                onSecondaryPress={onSaveDraft}
                showArrow={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: mealPlanColors.backgroundLight,
    },
    header: {
        backgroundColor: mealPlanColors.backgroundLight,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(12),
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: mealPlanColors.textMain,
    },
    progressContainer: {
        width: horizontalScale(40),
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
    },
    // Client Card
    clientCard: {
        borderRadius: borderRadius.lg,
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        overflow: 'hidden',
        ...shadows.primaryButton,
    },
    clientCardBlur1: {
        position: 'absolute',
        right: -16,
        top: -16,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    clientCardBlur2: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    clientCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    clientCardContentRTL: {
        flexDirection: 'row-reverse',
    },
    clientAvatar: {
        width: horizontalScale(64),
        height: horizontalScale(64),
        borderRadius: horizontalScale(32),
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.9)',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    clientPlan: {
        fontSize: ScaleFontSize(14),
        color: 'rgba(255,255,255,0.8)',
        marginTop: verticalScale(4),
    },
    // Settings
    settings: {
        gap: verticalScale(16),
    },
    settingCard: {
        backgroundColor: mealPlanColors.cardLight,
        borderRadius: borderRadius.lg,
        padding: horizontalScale(16),
        ...shadows.card,
    },
    settingLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: mealPlanColors.textSubtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: verticalScale(12),
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: horizontalScale(12),
    },
    dateContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    dateContentRTL: {
        flexDirection: 'row-reverse',
    },
    dateIcon: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: borderRadius.sm,
        backgroundColor: mealPlanColors.cardLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
    },
    checkboxGroup: {
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
        paddingVertical: verticalScale(8),
    },
    checkbox: {
        width: horizontalScale(24),
        height: horizontalScale(24),
        borderRadius: borderRadius.sm,
        borderWidth: 2,
        borderColor: mealPlanColors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: mealPlanColors.primary,
        borderColor: mealPlanColors.primary,
    },
    checkboxLabel: {
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
    },
    divider: {
        height: 1,
        backgroundColor: `${mealPlanColors.border}50`,
    },
    messageInput: {
        backgroundColor: mealPlanColors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: horizontalScale(12),
        fontSize: ScaleFontSize(16),
        color: mealPlanColors.textMain,
        minHeight: verticalScale(80),
    },
    messageInputRTL: {
        textAlign: 'right',
    },
    templateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(8),
    },
    templateLabel: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: mealPlanColors.textSlate,
    },
    textRTL: {
        textAlign: 'right',
    },
});
