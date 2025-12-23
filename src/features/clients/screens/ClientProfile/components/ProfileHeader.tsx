import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Mail, Phone, MapPin, MoreVertical } from 'lucide-react-native';
import { gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale } from '@/src/utils/scaling';
import { styles } from '../styles';
import { t } from '../translations';
import { Client } from '../mock';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
    client: Client;
    onBack: () => void;
    onCall: () => void;
    onEmail: () => void;
}

export function ProfileHeader({
    client,
    onBack,
    onCall,
    onEmail
}: ProfileHeaderProps) {
    const insets = useSafeAreaInsets();
    return (
        <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientHeader}
        >
            {/* Header Navigation */}
            <View style={[styles.headerNav, { paddingTop: insets.top, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                >
                    {isRTL ? (
                        <ArrowLeft size={horizontalScale(24)} color="#FFFFFF" />
                    ) : (
                        <ArrowRight size={horizontalScale(24)} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: client.avatar }} style={styles.avatar} />
                </View>
                <Text style={styles.clientName}>{client.name}</Text>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>{t.premiumClient}</Text>
                </View>
                {/* Contact Icons */}
                <View style={[styles.contactIcons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity onPress={onEmail}>
                        <Mail size={horizontalScale(18)} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                    <View style={styles.iconDivider} />
                    <TouchableOpacity onPress={onCall}>
                        <Phone size={horizontalScale(18)} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}
