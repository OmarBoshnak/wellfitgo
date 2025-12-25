import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ClientProfileScreen from '@/src/features/clients/screens/ClientProfile';

export default function ClientProfileRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return <ClientProfileScreen clientId={id} />;
}
