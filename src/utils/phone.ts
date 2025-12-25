/**
 * Phone call utilities for initiating calls to clients
 * Uses Linking API to open native phone dialer
 */
import { Linking, Alert } from 'react-native';

// Default country code for Egypt
const DEFAULT_COUNTRY_CODE = '+20';

/**
 * Normalizes phone number to international format
 * @param phoneNumber - Raw phone number from database
 * @param countryCode - Default country code if not present
 * @returns Normalized phone number with country code
 */
export function normalizePhoneNumber(
    phoneNumber: string,
    countryCode: string = DEFAULT_COUNTRY_CODE
): string {
    if (!phoneNumber || phoneNumber.trim() === '') {
        return '';
    }

    // Remove all non-digit characters except leading +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // If starts with +, keep it as is
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // If starts with 00, replace with +
    if (cleaned.startsWith('00')) {
        return '+' + cleaned.slice(2);
    }

    // If starts with 0, remove it and add country code
    if (cleaned.startsWith('0')) {
        return countryCode + cleaned.slice(1);
    }

    // Otherwise, add country code
    return countryCode + cleaned;
}

/**
 * Checks if device can make phone calls
 * @returns Promise<boolean>
 */
export async function canMakePhoneCalls(): Promise<boolean> {
    try {
        return await Linking.canOpenURL('tel:+1234567890');
    } catch {
        return false;
    }
}

/**
 * Initiates a phone call
 * @param phoneNumber - Phone number to call
 * @param options - Optional callbacks
 * @returns Promise<boolean> - true if call initiated successfully
 */
export async function initiatePhoneCall(
    phoneNumber: string,
    options?: {
        onError?: (error: Error) => void;
        onUnsupported?: () => void;
        countryCode?: string;
    }
): Promise<boolean> {
    const normalized = normalizePhoneNumber(phoneNumber, options?.countryCode);

    if (!normalized) {
        const error = new Error('Invalid phone number');
        options?.onError?.(error);
        return false;
    }

    const telUrl = `tel:${normalized}`;

    try {
        const canOpen = await Linking.canOpenURL(telUrl);

        if (!canOpen) {
            options?.onUnsupported?.();
            return false;
        }

        await Linking.openURL(telUrl);
        return true;
    } catch (error) {
        options?.onError?.(error as Error);
        return false;
    }
}

/**
 * Shows alert when phone number is missing
 * @param clientName - Name of the client
 * @param isRTL - RTL mode flag
 */
export function showMissingPhoneAlert(
    clientName: string,
    isRTL: boolean
): void {
    Alert.alert(
        isRTL ? 'لا يوجد رقم هاتف' : 'No Phone Number',
        isRTL
            ? `لا يوجد رقم هاتف مسجل لـ ${clientName}.`
            : `${clientName} doesn't have a phone number on file.`,
        [{ text: isRTL ? 'حسناً' : 'OK' }]
    );
}

/**
 * Shows alert when phone calls are not supported
 * @param isRTL - RTL mode flag
 */
export function showUnsupportedAlert(isRTL: boolean): void {
    Alert.alert(
        isRTL ? 'المكالمات غير مدعومة' : 'Calls Not Supported',
        isRTL
            ? 'المكالمات الهاتفية غير مدعومة على هذا الجهاز.'
            : 'Phone calls are not supported on this device.',
        [{ text: isRTL ? 'حسناً' : 'OK' }]
    );
}

/**
 * Shows confirmation dialog before calling
 * @param clientName - Name of the client
 * @param phoneNumber - Phone number to display
 * @param isRTL - RTL mode flag
 * @param onConfirm - Callback when user confirms
 */
export function showCallConfirmation(
    clientName: string,
    phoneNumber: string,
    isRTL: boolean,
    onConfirm: () => void
): void {
    const displayNumber = normalizePhoneNumber(phoneNumber);

    Alert.alert(
        isRTL ? 'اتصال بالعميل' : 'Call Client',
        isRTL
            ? `هل تريد الاتصال بـ ${clientName}؟\n${displayNumber}`
            : `Call ${clientName}?\n${displayNumber}`,
        [
            {
                text: isRTL ? 'إلغاء' : 'Cancel',
                style: 'cancel',
            },
            {
                text: isRTL ? 'اتصل الآن' : 'Call Now',
                onPress: onConfirm,
            },
        ]
    );
}
