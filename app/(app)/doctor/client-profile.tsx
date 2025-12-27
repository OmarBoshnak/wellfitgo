import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ClientProfileScreen from '@/src/features/patient/screens/ClientProfile';

export default function ClientProfileRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return <ClientProfileScreen clientId={id} />;
}
