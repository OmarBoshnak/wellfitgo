import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale } from '@/src/core/utils/scaling';

interface FloatingAddButtonProps {
    onPress?: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={[
                styles.container,
                isRTL ? styles.containerRTL : styles.containerLTR
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={['#4d6efe', '#6b85ff']}
                style={styles.button}
            >
                <Plus size={horizontalScale(32)} color="#FFFFFF" />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: verticalScale(60), // Above tab bar
        zIndex: 1000,
    },
    containerLTR: {
        right: horizontalScale(20),
    },
    containerRTL: {
        left: horizontalScale(20),
    },
    button: {
        width: horizontalScale(56),
        height: horizontalScale(56),
        borderRadius: horizontalScale(28),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4d6efe',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
});

export default FloatingAddButton;
