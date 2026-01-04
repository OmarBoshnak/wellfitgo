import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CreateDietScreen from '@/src/features/meals/components/CreateDietScreen';
import { DietPlanType } from '@/src/features/meals/hooks/usePlanMutations';

export default function DietCreateScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        categoryId: string;
        categoryType: string;
    }>();

    const handleBack = () => {
        router.back();
    };

    const handleSave = () => {
        // After save, go back to diet plans list
        router.back();
    };

    return (
        <CreateDietScreen
            categoryId={params.categoryId ?? 'custom'}
            categoryType={(params.categoryType ?? 'custom') as DietPlanType}
            onBack={handleBack}
            onSave={handleSave}
        />
    );
}
