import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, FileText, Calendar } from 'lucide-react-native';
import { colors, gradients } from '@/src/constants/Themes';
import { horizontalScale } from '@/src/utils/scaling';
import { styles } from '../styles';
import { t } from '../translations';
import { MealPlanCreatorFlow } from '@/src/features/meal-plans';
import type { ClientInfo } from '@/src/features/meal-plans';

interface ActionButtonsProps {
    client?: ClientInfo;
}

export function ActionButtons({ client }: ActionButtonsProps) {
    const [showCreatorFlow, setShowCreatorFlow] = useState(false);

    // Default client for demo purposes
    const defaultClient: ClientInfo = client || {
        id: '1',
        name: 'Ahmed Hassan',
        nameAr: 'أحمد حسن',
        currentWeight: 75,
        targetWeight: 65,
        goal: 'weight_loss',
    };

    return (
        <>
            <View style={styles.actionsContainer}>
                <TouchableOpacity activeOpacity={0.9} style={styles.primaryActionWrapper}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryAction}
                    >
                        <Send size={horizontalScale(18)} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>{t.sendMessage}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.secondaryAction}
                    activeOpacity={0.7}
                    onPress={() => setShowCreatorFlow(true)}
                >
                    <FileText size={horizontalScale(18)} color={colors.primaryDark} />
                    <Text style={styles.secondaryActionText}>{t.createMealPlan}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.7}>
                    <Calendar size={horizontalScale(18)} color={colors.primaryDark} />
                    <Text style={styles.secondaryActionText}>{t.scheduleCall}</Text>
                </TouchableOpacity>
            </View>

            {/* Carousel Flow - All 4 screens with smooth transitions */}
            <MealPlanCreatorFlow
                visible={showCreatorFlow}
                client={defaultClient}
                onClose={() => setShowCreatorFlow(false)}
                onComplete={() => {
                    setShowCreatorFlow(false);
                    // TODO: Show success toast
                }}
            />
        </>
    );
}
