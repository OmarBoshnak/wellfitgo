/**
 * DoctorSettingsScreen - Settings menu for doctor/coach
 * Features: Profile header with avatar upload, menu sections (Account, Work, Support, Other), Sign Out
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import {
    User,
    Bell,
    Globe,
    Users,
    ChevronRight,
    ChevronLeft,
    Camera,
    ArrowLeft,
} from 'lucide-react-native';
import { colors } from '@/src/core/theme';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = {
    // Header
    registeredDietitian: isRTL ? 'أخصائي تغذية معتمد' : 'Registered Dietitian',
    activeClients: isRTL ? 'عميل نشط' : 'active clients',

    // Section titles
    account: isRTL ? 'الحساب' : 'Account',
    work: isRTL ? 'العمل' : 'Work',
    support: isRTL ? 'الدعم' : 'Support',
    other: isRTL ? 'أخرى' : 'Other',

    // Account items
    editProfile: isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile',
    notifications: isRTL ? 'الإشعارات' : 'Notifications',
    language: isRTL ? 'اللغة والمنطقة' : 'Language & Region',

    // Actions
    signOut: isRTL ? 'تسجيل الخروج' : 'Sign Out',
    signOutConfirm: isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to sign out?',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
};

// =============================================================================
// TYPES
// =============================================================================

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    subLabel?: string;
    rightText?: string;
    onPress?: () => void;
}

interface MenuSectionProps {
    title: string;
    children: React.ReactNode;
}

// =============================================================================
// COMPONENTS
// =============================================================================

function MenuItem({ icon, label, subLabel, rightText, onPress }: MenuItemProps) {
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    return (
        <TouchableOpacity
            style={[styles.menuItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuItemLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.menuIconContainer}>
                    {icon}
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {label}
                    </Text>
                    {subLabel && (
                        <Text style={[styles.menuSubLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {subLabel}
                        </Text>
                    )}
                </View>
            </View>
            <View style={[styles.menuItemRight, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {rightText && <Text style={styles.menuRightText}>{rightText}</Text>}
                <ChevronIcon size={24} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );
}

function MenuSection({ title, children }: MenuSectionProps) {
    return (
        <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                    {title}
                </Text>
            </View>
            {children}
        </View>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DoctorSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useQuery(api.users.currentUser);
    const dashboardStats = useQuery(api.users.getDashboardStats);
    const updateProfile = useMutation(api.users.updateProfile);

    // Language state - synced with Convex
    const [languageIndex, setLanguageIndex] = useState(user?.preferredLanguage === 'en' ? 1 : 0);
    const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

    // Sync language from Convex on load
    useEffect(() => {
        if (user && !isLanguageLoaded) {
            setLanguageIndex(user.preferredLanguage === 'en' ? 1 : 0);
            setIsLanguageLoaded(true);
        }
    }, [user, isLanguageLoaded]);

    // Handle language change - save to Convex
    const handleLanguageChange = async (index: number) => {
        setLanguageIndex(index);
        const newLang = index === 1 ? 'en' : 'ar';
        try {
            await updateProfile({ preferredLanguage: newLang as 'ar' | 'en' });
            // Note: Full app language switch would require app restart or context refresh
        } catch (error) {
            console.error('Failed to update language:', error);
            // Revert on error
            setLanguageIndex(index === 1 ? 0 : 1);
        }
    };

    // Avatar upload state
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Convex mutations for avatar upload
    const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
    const updateAvatar = useMutation(api.users.updateAvatar);

    const fullName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Doctor';
    const avatarUrl = user?.avatarUrl;
    const activeClients = dashboardStats?.totalActiveClients || 0;

    // Handle avatar image selection and upload
    const handleEditAvatar = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    isRTL ? 'تحتاج إذن' : 'Permission needed',
                    isRTL ? 'نحتاج إذن للوصول للصور' : 'We need permission to access your photos'
                );
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingAvatar(true);
                const imageUri = result.assets[0].uri;

                try {
                    // Get upload URL from Convex
                    const uploadUrl = await generateUploadUrl();

                    // Fetch the image and upload to Convex storage
                    const response = await fetch(imageUri);
                    const blob = await response.blob();

                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': blob.type || 'image/jpeg' },
                        body: blob,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('Upload failed');
                    }

                    const { storageId } = await uploadResponse.json();

                    // Update user avatar with the storage ID - Convex will convert to URL
                    await updateAvatar({ storageId });

                    Alert.alert(
                        isRTL ? 'تم التحديث' : 'Updated',
                        isRTL ? 'تم تحديث صورتك الشخصية بنجاح' : 'Your profile photo has been updated successfully'
                    );
                } catch (uploadError) {
                    console.error('[Settings] Failed to upload avatar:', uploadError);
                    Alert.alert(
                        isRTL ? 'خطأ' : 'Error',
                        isRTL ? 'فشل رفع الصورة' : 'Failed to upload image'
                    );
                } finally {
                    setIsUploadingAvatar(false);
                }
            }
        } catch (error) {
            console.error('[Settings] Avatar picker error:', error);
            setIsUploadingAvatar(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            t.signOut,
            t.signOutConfirm,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.signOut,
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement sign out logic with Clerk
                        console.log('Sign out pressed');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Gradient Header */}
                <LinearGradient
                    colors={['#5073FE', '#02C3CD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.header, { paddingTop: insets.top }]}
                >
                    <TouchableOpacity onPress={() => router.back()}>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 10 }} >
                            <ArrowLeft size={24} color={colors.white} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>

                        {/* Avatar with Edit Button */}
                        <TouchableOpacity
                            style={styles.avatarWrapper}
                            onPress={handleEditAvatar}
                            disabled={isUploadingAvatar}
                            activeOpacity={0.8}
                        >
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarInitials}>
                                        {fullName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            {/* Loading overlay */}
                            {isUploadingAvatar && (
                                <View style={styles.avatarLoadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}

                            {/* Edit button */}
                            <View style={styles.avatarEditButton}>
                                <Camera size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        {/* User Info */}
                        <Text style={styles.userName}>{fullName}</Text>
                        <Text style={styles.userRole}>{t.registeredDietitian}</Text>

                        {/* Active Clients Badge */}
                        <View style={styles.clientsBadge}>
                            <Users size={14} color="#fff" />
                            <Text style={styles.clientsBadgeText}>
                                {activeClients} {t.activeClients}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
                <View style={{ paddingHorizontal: horizontalScale(10), marginTop: verticalScale(20) }}>
                    {/* Account Section */}
                    <MenuSection title={t.account}>
                        <MenuItem
                            icon={<User size={20} color="#355dfd" />}
                            label={t.editProfile}
                            onPress={() => router.push('/(app)/doctor/edit-profile')}
                        />
                        <MenuItem
                            icon={<Bell size={20} color="#355dfd" />}
                            label={t.notifications}
                            onPress={() => router.push('/(app)/doctor/notification-settings')}
                        />

                        {/* Language Toggle - Inline */}
                        <View style={[styles.languageRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={[styles.menuItemLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={styles.menuIconContainer}>
                                    <Globe size={20} color="#355dfd" />
                                </View>
                                <Text style={[styles.menuLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {isRTL ? 'اللغة' : 'Language'}
                                </Text>
                            </View>
                            <SegmentedControl
                                options={['العربي', 'EN']}
                                selected={languageIndex}
                                onChange={handleLanguageChange}
                                width={100}
                            />
                        </View>
                    </MenuSection>



                    {/* Sign Out Button */}
                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.signOutText}>{t.signOut}</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Header
    header: {
        paddingBottom: verticalScale(40),
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: verticalScale(24),
        paddingHorizontal: horizontalScale(24),
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: verticalScale(12),
    },
    avatar: {
        width: horizontalScale(80),
        height: horizontalScale(80),
        borderRadius: horizontalScale(40),
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        backgroundColor: '#E8F4FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: '#5073FE',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        backgroundColor: '#22C55E',
        borderWidth: 3,
        borderColor: '#5073FE',
    },
    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 10,
        left: 0,
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(14),
        backgroundColor: '#355dfd',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: horizontalScale(40),
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: '#fff',
        marginBottom: verticalScale(4),
    },
    userRole: {
        fontSize: ScaleFontSize(14),
        color: 'rgba(255,255,255,0.9)',
        marginBottom: verticalScale(12),
    },
    clientsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: 100,
    },
    clientsBadgeText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: '#fff',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {

        paddingBottom: verticalScale(100),
    },
    // Menu Section
    menuSection: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        marginBottom: verticalScale(20),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Menu Item
    menuItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    languageRow: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLeft: {
        alignItems: 'center',
        gap: horizontalScale(16),
        flex: 1,
    },
    menuIconContainer: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: 8,
        backgroundColor: 'rgba(53, 93, 253, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuTextContainer: {
        flex: 1,
    },
    menuLabel: {
        fontSize: ScaleFontSize(16),
        fontWeight: '400',
        color: colors.textPrimary,
    },
    menuSubLabel: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#355dfd',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: verticalScale(2),
    },
    menuItemRight: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    menuRightText: {
        fontSize: ScaleFontSize(14),
        color: '#9CA3AF',
        fontWeight: '500',
    },
    // Sign Out
    signOutButton: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        paddingVertical: verticalScale(16),
        alignItems: 'center',
        marginBottom: verticalScale(32),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    signOutText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: '#EB5757',
    },
});
