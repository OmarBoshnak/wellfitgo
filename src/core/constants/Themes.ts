export const colors = {
    primaryDark: '#5073FE',
    primaryLight: '#02C3CD',
    dark: '#000',
    darkGray: '#666',
    gray: '#AABBC5',
    white: '#FFFFFF',
    info: '#2F80EC',
    success: '#27AE61',
    warning: '#E2B93B',
    error: '#EB5757',
    faceBookButton: '#475993',
    googleButton: '#EA4335',
    // Additional colors for home screen
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F5F7FA',
    textPrimary: '#1A1A2E',
    textSecondary: '#7A7A8C',
    border: '#E8E8EE',
    primaryLightBg: 'rgba(80, 115, 254, 0.1)',
    secondary: '#E8E8EE',
};

export const gradients = {
    primary: ['#5073FE', '#02C3CD'] as const,
};

export const shadows = {
    light: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
};
