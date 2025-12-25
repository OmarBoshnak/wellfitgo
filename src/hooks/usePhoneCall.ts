/**
 * Hook for initiating phone calls to clients
 * Handles loading state and error callbacks
 */
import { useCallback, useState } from 'react';
import {
    initiatePhoneCall,
    showMissingPhoneAlert,
    showUnsupportedAlert,
    showCallConfirmation
} from '@/src/utils/phone';
import { isRTL } from '@/src/i18n';

interface UsePhoneCallOptions {
    onCallStarted?: () => void;
    onCallFailed?: (error: Error) => void;
    showConfirmation?: boolean;
}

interface UsePhoneCallResult {
    callClient: (
        clientId: string,
        clientName: string,
        phoneNumber: string | null | undefined
    ) => Promise<void>;
    isInitiatingCall: boolean;
}

/**
 * Hook for initiating phone calls to clients
 */
export function usePhoneCall(options?: UsePhoneCallOptions): UsePhoneCallResult {
    const [isInitiatingCall, setIsInitiatingCall] = useState(false);
    const showConfirmation = options?.showConfirmation ?? true;

    const callClient = useCallback(async (
        _clientId: string,
        clientName: string,
        phoneNumber: string | null | undefined
    ) => {
        // Check if phone number exists
        if (!phoneNumber) {
            showMissingPhoneAlert(clientName, isRTL);
            return;
        }

        const doCall = async () => {
            setIsInitiatingCall(true);

            try {
                const success = await initiatePhoneCall(phoneNumber, {
                    onError: (error) => {
                        options?.onCallFailed?.(error);
                    },
                    onUnsupported: () => {
                        showUnsupportedAlert(isRTL);
                    },
                });

                if (success) {
                    options?.onCallStarted?.();
                }
            } finally {
                setIsInitiatingCall(false);
            }
        };

        // Show confirmation dialog if enabled
        if (showConfirmation) {
            showCallConfirmation(clientName, phoneNumber, isRTL, doCall);
        } else {
            await doCall();
        }
    }, [options, showConfirmation]);

    return {
        callClient,
        isInitiatingCall,
    };
}
