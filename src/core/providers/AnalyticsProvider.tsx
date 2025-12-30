import React, { ReactNode, useEffect } from 'react';
import { PostHogProvider as PHProvider } from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

interface Props {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: Props) {
  if (!POSTHOG_API_KEY) {
    if (__DEV__) {
        console.log('PostHog API Key not found, analytics disabled');
    }
    return <>{children}</>;
  }

  return (
    <PHProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
      }}
    >
      {children}
    </PHProvider>
  );
}
