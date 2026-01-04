import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, FileText, Calendar } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { horizontalScale } from '@/src/core/utils/scaling';
import { styles } from '../styles';
import { t } from '../translations';
import { DietPlanSelector } from './DietPlanSelector';
import { Id } from '@/convex/_generated/dataModel';

interface ActionButtonsProps {
    client?: {
        id: Id<"users">;
        name: string;
        nameAr?: string;
        currentWeight: number;
        targetWeight: number;
        goal: string;
    };
    onSendMessage?: () => void;
    onScheduleCall?: () => void;
}

export function ActionButtons({
    client,
    onSendMessage,
    onScheduleCall,
}: ActionButtonsProps) {
    const [showDietSelector, setShowDietSelector] = useState(false);

    return (
        <>
            <View style={styles.actionsContainer}>
                {/* Send Message Button */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.primaryActionWrapper}
                    onPress={onSendMessage}
                >
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

                {/* Schedule Call Button */}
                <TouchableOpacity
                    style={styles.secondaryAction}
                    activeOpacity={0.7}
                    onPress={onScheduleCall}
                >
                    <Calendar size={horizontalScale(18)} color={colors.primaryDark} />
                    <Text style={styles.secondaryActionText}>{t.scheduleCall}</Text>
                </TouchableOpacity>
            </View>

        </>
    );
}

