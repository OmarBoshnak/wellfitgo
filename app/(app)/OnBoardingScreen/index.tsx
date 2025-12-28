import React from 'react';
import {Dimensions, Image, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useRouter} from 'expo-router';
import Swiper from 'react-native-swiper';
import {Slides} from '@/src/core/constants/Slides';
import {OnBoardingSlide} from '@/src/components/ui';
import {colors} from '@/src/core/constants/Themes';
import {horizontalScale, ScaleFontSize, verticalScale} from '@/src/core/utils/scaling';

const {width, height} = Dimensions.get('window');

const OnBoardingScreen = () => {
    const router = useRouter();

    const handleGetStarted = () => {
        router.replace('/(auth)/LoginScreen');
    };

    const handleLogin = () => {
        router.replace('/(auth)/LoginScreen');
    };

    return (
        <View style={styles.container}>
            {/* Hero Image */}
            <Image
                style={styles.image}
                source={require('@/assets/slide.png')}
                resizeMode="contain"
            />

            {/* Swiper for Slides */}
            <Swiper
                loop={true}
                autoplay={true}
                autoplayTimeout={4}
                showsPagination={true}
                dot={<View style={styles.dot}/>}
                activeDot={<View style={styles.activeDot}/>}
                paginationStyle={styles.pagination}
            >
                {Slides.map((slide) => (
                    <OnBoardingSlide key={slide.id} item={slide}/>
                ))}
            </Swiper>

            {/* Get Started Button */}
            <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                <Text style={styles.buttonText}>ابدأ الآن</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: verticalScale(50),
        backgroundColor: colors.bgPrimary,
    },
    image: {
        marginTop: verticalScale(50),
        width: width * 0.9,
        height: height * 0.45,
    },
    dot: {
        backgroundColor: colors.border,
        width: horizontalScale(8),
        height: verticalScale(8),
        borderRadius: 4,
        margin: 5,
    },
    activeDot: {
        backgroundColor: colors.primaryDark,
        width: horizontalScale(20),
        height: verticalScale(8),
        borderRadius: 4,
        margin: 5,
    },
    pagination: {
        bottom: verticalScale(10),
    },
    button: {
        marginTop: verticalScale(10),
        backgroundColor: colors.primaryDark,
        paddingVertical: verticalScale(14),
        paddingHorizontal: horizontalScale(80),
        borderRadius: 30,
    },
    buttonText: {
        color: colors.white,
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
    },
    loginText: {
        marginTop: verticalScale(15),
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});

export default OnBoardingScreen;
