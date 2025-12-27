import Constants from 'expo-constants';
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Determines if the device has a notch (iPhone X and later, or Android devices with notch)
 * Uses the status bar height as an indicator for iOS devices
 */
const hasNotch = (): boolean => {
    if (Platform.OS === 'ios') {
        // iPhone X and later have a status bar height > 20
        return Constants.statusBarHeight > 20;
    }
    // For Android, check if status bar height is significantly larger than default
    return (StatusBar.currentHeight ?? 0) > 24;
};

const isSmall = width <= 375 && !hasNotch();
const isLarge = width >= 430 || (height >= 900 && hasNotch());

const guideLineBaseWidth = (): number => {
    if (isSmall) {
        return 330;
    }
    if (isLarge) {
        return 390;
    }
    return 350;
};

const horizontalScale = (size: number): number =>
    (width / guideLineBaseWidth()) * size;

const guideLineBaseHeight = (): number => {
    if (isSmall) {
        return 550;
    } else if (width > 440) {
        return 620;
    }
    if (isLarge) {
        return 780;
    }
    return 680;
};

const verticalScale = (size: number): number =>
    (height / guideLineBaseHeight()) * size;

const guideLineBaseFontsize = (): number => {
    if (width > 410) {
        return 430;
    }
    return 400;
};

const ScaleFontSize = (size: number): number =>
    Math.round((width / guideLineBaseFontsize()) * size);

// Export device info for debugging purposes
const deviceInfo = {
    width,
    height,
    hasNotch: hasNotch(),
    isSmall,
    isLarge,
    platform: Platform.OS,
};

export { deviceInfo, hasNotch, horizontalScale, ScaleFontSize, verticalScale };

