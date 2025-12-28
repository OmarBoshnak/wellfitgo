import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { DietPlansList } from '@/src/features/meals';
import type { DietPlan } from '@/src/features/meals';
import { isRTL } from '@/src/core/constants/translations';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import AssignClientModal from '@/src/features/meals/components/AssignClientModal';

// ============ TRANSLATIONS ============
const t = {
    assignSuccess: isRTL ? 'تم التعيين بنجاح!' : 'Assignment successful!',
    assignFailed: isRTL ? 'فشل التعيين' : 'Assignment failed',
    clients: isRTL ? 'عملاء' : 'clients',
};

// ============ SCREEN COMPONENT ============
export default function DietPlansScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        categoryId: string;
        categoryName: string;
        categoryNameAr: string;
        categoryEmoji?: string;
        categoryDescription?: string;
    }>();

    // Parse category data from route params
    const category = {
        id: params.categoryId ?? '',
        name: params.categoryName ?? '',
        nameAr: params.categoryNameAr ?? '',
        emoji: params.categoryEmoji,
        description: params.categoryDescription,
    };

    // State for assign modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedDiet, setSelectedDiet] = useState<DietPlan | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    // Mutations
    const assignMutation = useMutation(api.plans.assignPlanToClients);

    // ============ NAVIGATION HANDLERS ============
    const handleBack = () => {
        router.back();
    };

    const handleAssign = (diet: DietPlan) => {
        setSelectedDiet(diet);
        setShowAssignModal(true);
    };

    const handleAssignToClients = useCallback(async (clientIds: Id<"users">[], settings: { startDate: string; durationWeeks: number | null; notifyPush: boolean }) => {
        if (clientIds.length === 0 || !selectedDiet) return;

        setIsAssigning(true);
        try {
            const result = await assignMutation({
                dietPlanId: selectedDiet.id as Id<"dietPlans">,
                clientIds,
                startDate: settings.startDate,
                durationWeeks: settings.durationWeeks ?? undefined,
                sendNotification: settings.notifyPush,
            });

            setShowAssignModal(false);

            if (result.success) {
                Alert.alert(
                    t.assignSuccess,
                    `${result.successCount}/${result.totalClients} ${t.clients}`
                );
            } else {
                Alert.alert(t.assignFailed, result.errors?.join('\n'));
            }
        } catch (error) {
            Alert.alert(t.assignFailed, String(error));
        } finally {
            setIsAssigning(false);
        }
    }, [selectedDiet, assignMutation]);

    const handleViewDetails = (diet: DietPlan) => {
        router.push({
            pathname: '/doctor/diet-details',
            params: {
                dietId: diet.id,
                dietRange: diet.targetCalories?.toString() ?? '',
                dietDescription: diet.description ?? '',
                categoryName: category.name,
                categoryEmoji: category.emoji ?? '',
            },
        });
    };

    const handleEdit = (diet: DietPlan) => {
        router.push({
            pathname: '/doctor/diet-edit',
            params: {
                dietId: diet.id,
                dietRange: diet.targetCalories?.toString() ?? '',
            },
        });
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <DietPlansList
                    category={category}
                    onBack={handleBack}
                    onAssign={handleAssign}
                    onView={handleViewDetails}
                    onEdit={handleEdit}
                />
            </ScrollView>

            {/* Assign Client Modal */}
            <AssignClientModal
                visible={showAssignModal}
                diet={{
                    name: selectedDiet?.name,
                    range: selectedDiet?.targetCalories ? `${selectedDiet.targetCalories} cal` : undefined,
                }}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssignToClients}
                isAssigning={isAssigning}
            />
        </SafeAreaView>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(24),
    },
});

