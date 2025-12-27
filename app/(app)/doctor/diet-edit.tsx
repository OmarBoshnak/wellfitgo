import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EditDietScreen from '@/src/features/meals/components/EditDietScreen';
import { Id } from '@/convex/_generated/dataModel';

// ============ SCREEN COMPONENT ============
export default function DietEditRoute() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        dietId: string;
    }>();

    const handleBack = () => {
        router.back();
    };

    const handleSave = () => {
        // Navigate back after save
        router.back();
    };

    // Parse dietId as Convex ID
    const dietId = params.dietId as Id<"dietPlans">;

    return (
        <EditDietScreen
            dietId={dietId}
            onBack={handleBack}
            onSave={handleSave}
        />
    );
}
