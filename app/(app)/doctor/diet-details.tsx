import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DietDetailsView } from '@/src/features/meals';
import { Id } from '@/convex/_generated/dataModel';

// ============ SCREEN COMPONENT ============
export default function DietDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        dietId: string;
    }>();

    const handleBack = () => {
        router.back();
    };

    const handleAssign = () => {
        // TODO: Open assign modal
        console.log('Assign diet:', params.dietId);
    };

    // Parse dietId as Convex ID
    const dietId = params.dietId as Id<"dietPlans">;

    return (
        <DietDetailsView
            dietId={dietId}
            onBack={handleBack}
            onAssign={handleAssign}
        />
    );
}
