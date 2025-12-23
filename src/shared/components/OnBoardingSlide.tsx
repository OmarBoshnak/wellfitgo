import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/utils/scaling';
import { colors } from '@/src/theme';

type Props = {
    item: {
        id: number;
        title: string;
        description: string;
    };
};

export const OnBoardingSlide = ({ item }: Props) => {
    return (
        <View style={styles.slide}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: verticalScale(40),
        marginVertical: verticalScale(10),
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: verticalScale(20),
        textAlign: 'center',
    },
    description: {
        fontSize: ScaleFontSize(14),
        textAlign: 'center',
        color: colors.textSecondary,
        marginHorizontal: horizontalScale(30),
        marginTop: verticalScale(10),
        lineHeight: 22,
    },
});

export default OnBoardingSlide;
