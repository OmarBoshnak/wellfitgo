import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ActivityHistoryScreen from '@/src/features/patient/screens/ActivityHistory';

export default function ActivityHistoryRoute() {
    const { clientId } = useLocalSearchParams<{ clientId: string }>();

    return <ActivityHistoryScreen clientId={clientId} />;
}
