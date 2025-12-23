import React from 'react';
import {
    TouchableOpacity,
    Text,
    Image,
    StyleSheet,
    View,
    ImageSourcePropType,
} from 'react-native';
import { colors } from '@/src/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

interface AuthButtonProps {
    title: string;
    color: string;
    onPress: () => void;
    image?: ImageSourcePropType;
    icon?: React.ReactNode;
}

const AuthButton: React.FC<AuthButtonProps> = ({
    title,
    color,
    onPress,
    image,
    icon,
}) => {
    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <Text style={styles.text}>{title}</Text>
                {image && (
                    <Image source={image} style={styles.image} resizeMode="contain" />
                )}
                {icon && <View style={styles.iconContainer}>{icon}</View>}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        paddingVertical: verticalScale(14),
        paddingHorizontal: horizontalScale(20),
        borderRadius: horizontalScale(15),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        marginHorizontal: horizontalScale(10),
    },
    iconContainer: {
        marginHorizontal: horizontalScale(10),
    },
    text: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.white,
        textAlign: 'center',
    },
});

export default AuthButton;
