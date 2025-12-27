import React from 'react';
import {
    Image,
    ImageBackground,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { colors } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';

type Props = {
    children: React.ReactNode;
    showBackButton?: boolean;
};

const GradientBackground = ({ children, showBackButton = true }: Props) => {
    const router = useRouter();

    // Use require for local image asset
    const backgroundImage = require('@/assets/background.png');

    return (
        <ImageBackground
            source={backgroundImage}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container}>
                {showBackButton && (
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <TouchableOpacity
                            style={[
                                styles.icon,
                                { alignSelf: isRTL ? 'flex-start' : 'flex-end' }
                            ]}
                            onPress={() => router.back()}
                        >
                            <Ionicons
                                name={isRTL ? "arrow-back" : "arrow-forward"}
                                size={24}
                                color={colors.textPrimary}
                            />
                        </TouchableOpacity>

                    </View>
                )}
                <StatusBar barStyle="dark-content" />
                <View style={styles.overlay}>{children}</View>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
    },
    icon: {
        marginHorizontal: horizontalScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        width: 40,
        backgroundColor: colors.white,
        borderRadius: 100,
    },
    overlay: {
        flex: 1,
        marginTop: verticalScale(20),
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    title: {
        fontSize: ScaleFontSize(30),
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
    },
});

export default GradientBackground;
