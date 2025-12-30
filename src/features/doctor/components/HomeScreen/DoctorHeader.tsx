import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ViewStyle,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translations';

interface DoctorHeaderProps {
    userName: string;
    userImage?: string;
    style?: ViewStyle;
    notificationCount?: number; // Total notifications (messages + weight updates)
    onSearch?: (query: string) => void;
    onNotificationPress?: () => void;
    onLanguagePress?: () => void;
    onProfilePress?: () => void;
}

const DoctorHeader: React.FC<DoctorHeaderProps> = ({
    userName,
    userImage,
    style,
    notificationCount = 0,
    onSearch,
    onNotificationPress,
    onLanguagePress,
    onProfilePress,
}) => {
    const router = useRouter();
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Image source for avatar
    const imageSource = userImage ? { uri: userImage } : undefined;

    // Get current greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return isRTL ? 'صباح الخير' : 'Good morning';
        if (hour < 18) return isRTL ? 'مساء الخير' : 'Good afternoon';
        return isRTL ? 'مساء الخير' : 'Good evening';
    };


    const handleSearch = (text: string) => {
        setSearchQuery(text);
        onSearch?.(text);
    };

    return (
        <View style={[styles.header, style]}>
            {/* Main Header Row */}
            <View style={[styles.headerContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {/* Profile Avatar */}
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => router.push('/(app)/doctor/settings')}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarWrapper}>
                        {userImage ? (
                            <Image
                                source={imageSource}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.profileImage, styles.placeholderAvatar]}>
                                <Text style={styles.placeholderText}>
                                    {userName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
                {/* Greeting Section */}
                <View style={[styles.greetingContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={[styles.greeting, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {getGreeting()},{'\n'} 👋 {userName.split(' ')[0]}
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={[styles.actions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {/* Search Button */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setShowSearch(!showSearch)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="search-outline"
                            size={22}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>

                    {/* Notifications Button */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={onNotificationPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={notificationCount > 0 ? "notifications" : "notifications-outline"}
                            size={22}
                            color={notificationCount > 0 ? '#2563EB' : colors.textSecondary}
                        />
                        {notificationCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                </View>
            </View>

            {/* Expandable Search Bar */}
            {showSearch && (
                <View style={styles.searchContainer}>
                    <View style={[styles.searchInputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Ionicons
                            name="search-outline"
                            size={20}
                            color={colors.textSecondary}
                            style={isRTL ? styles.searchIconRTL : styles.searchIcon}
                        />
                        <TextInput
                            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                            placeholder={isRTL ? 'ابحث عن العملاء، الوجبات...' : 'Search clients, meals...'}
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => handleSearch('')}
                                style={styles.clearButton}
                            >
                                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greetingContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(2),
    },
    actions: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    iconButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: horizontalScale(8),
        minWidth: horizontalScale(16),
        height: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(4),
    },
    badgeText: {
        fontSize: ScaleFontSize(10),
        color: colors.white,
        fontWeight: '600',
    },
    avatarContainer: {
        marginLeft: isRTL ? 0 : horizontalScale(8),
        marginRight: isRTL ? horizontalScale(8) : 0,
    },
    avatarWrapper: {},
    profileImage: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
    },
    placeholderAvatar: {
        backgroundColor: '#5073FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#fff',
    },
    avatar: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        marginTop: verticalScale(5),
        paddingTop: verticalScale(8),
    },
    searchInputWrapper: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        paddingHorizontal: horizontalScale(12),
    },
    searchIcon: {
        marginRight: horizontalScale(8),
    },
    searchIconRTL: {
        marginLeft: horizontalScale(8),
    },
    searchInput: {
        flex: 1,
        paddingVertical: verticalScale(12),
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    clearButton: {
        padding: horizontalScale(4),
    },
});

export default DoctorHeader;
