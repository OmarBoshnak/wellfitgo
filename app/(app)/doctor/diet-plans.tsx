import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { DietPlansList } from '@/src/features/meals';
import type { DietPlan } from '@/src/features/meals';

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

    // ============ NAVIGATION HANDLERS ============
    const handleBack = () => {
        router.back();
    };

    const handleAssign = (diet: DietPlan) => {
        // TODO: Open assign modal or navigate to assign screen
        console.log('Assign diet:', diet);
    };

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
