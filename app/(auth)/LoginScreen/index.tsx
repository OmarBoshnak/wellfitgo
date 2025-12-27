import { AuthButton, GradientBackground } from '@/src/components/ui';
import { colors } from '@/src/core/constants/Themes';
import { useClerkAuth } from '@/src/features/auth/hooks/useClerkAuth';
import {
    horizontalScale,
    ScaleFontSize,
    verticalScale,
} from '@/src/core/utils/scaling';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

const LoginScreen = () => {
    const logo = require('@/assets/Wellfitgo.png');
    const { signInWithGoogle, signInWithApple, loading, error } = useClerkAuth();

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    const handleAppleSignIn = async () => {
        await signInWithApple();
    };

    return (
        <GradientBackground>
            <Image source={logo} style={styles.logoStyle} resizeMode={'contain'} />
            <Text style={styles.title}>أهلا بيك في ويل. فيت. جو!</Text>
            <Text style={styles.subtitle}>سجل دخولك للبدء في رحلتك الصحية</Text>

            <View style={styles.buttonWrap}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primaryLight} />
                ) : (
                    <>
                        <AuthButton
                            title={'تسجيل الدخول بإستخدام جوجل'}
                            color={colors.googleButton}
                            onPress={handleGoogleSignIn}
                            image={require('@/assets/google.png')}
                        />
                        <View style={{ marginVertical: verticalScale(12) }} />
                        <AuthButton
                            title={'تسجيل الدخول بإستخدام Apple'}
                            color={colors.dark}
                            onPress={handleAppleSignIn}
                            icon={<Ionicons name="logo-apple" size={24} color={colors.white} />}
                        />
                    </>
                )}
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    logoStyle: {
        height: verticalScale(100),
        width: horizontalScale(100),
    },
    title: {
        marginTop: verticalScale(20),
        paddingHorizontal: horizontalScale(20),
        fontSize: ScaleFontSize(26),
        fontWeight: 'bold',
        color: colors.dark,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: verticalScale(8),
        paddingHorizontal: horizontalScale(20),
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    buttonWrap: {
        marginTop: verticalScale(60),
        alignItems: 'center',
        marginHorizontal: horizontalScale(20),
    },
    errorText: {
        marginTop: 20,
        color: 'red',
        textAlign: 'center',
    },
});

export default LoginScreen;
