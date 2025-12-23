import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Image,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, shadows, gradients } from '@/src/constants/Themes';
import { ScaleFontSize } from '@/src/utils/scaling';
import { isRTL } from '@/src/constants/translations';
import { ToggleSwitch } from '@/src/shared';
import { SegmentedControl } from '@/src/shared';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { updateTargetWeight, setHealthData, resetUser } from '@/src/store/userSlice';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const { signOut } = useClerk();
    const { user: clerkUser } = useUser();
    const router = useRouter();

    // Get user data from Redux
    const user = useAppSelector((state) => state.user);
    const weightHistory = user.weightHistory;

    // Logout/Delete state
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get member since date from first weight entry
    const memberSinceDate = useMemo(() => {
        if (weightHistory.length > 0) {
            // Sort by date to get the earliest entry
            const sorted = [...weightHistory].sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const date = new Date(sorted[0].date);
            const monthNames = isRTL
                ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        }
        // Default to current month if no weight history
        const now = new Date();
        const monthNames = isRTL
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }, [weightHistory]);

    // Get user's full name
    const fullName = useMemo(() => {
        const first = user.firstName || '';
        const last = user.lastName || '';
        if (first || last) {
            return `${first} ${last}`.trim();
        }
        return isRTL ? 'أحمد محمد' : 'Ahmed Mohamed';
    }, [user.firstName, user.lastName]);

    // Get initials for avatar
    const initials = useMemo(() => {
        if (user.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        }
        return 'A';
    }, [user.firstName]);    // State
    const [pushNotifications, setPushNotifications] = useState(true);
    const [mealReminders, setMealReminders] = useState(true);
    const [weeklyCheckin, setWeeklyCheckin] = useState(true);
    const [coachMessages, setCoachMessages] = useState(true);
    const [motivationalMessages, setMotivationalMessages] = useState(false);
    const [language, setLanguage] = useState(isRTL ? 0 : 1);
    const [theme, setTheme] = useState(0);
    const [units, setUnits] = useState(0);
    const [showPhotoSheet, setShowPhotoSheet] = useState(false);
    const [showLogoutSheet, setShowLogoutSheet] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showTargetEdit, setShowTargetEdit] = useState(false);
    const [newTargetWeight, setNewTargetWeight] = useState('');

    // Personal info edit state
    const [showPersonalInfoEdit, setShowPersonalInfoEdit] = useState(false);
    const [editingField, setEditingField] = useState<'name' | 'gender' | 'age' | 'height' | 'activity' | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Convex mutations
    const updateProfileMutation = useMutation(api.users.updateProfile);
    const deleteAccountMutation = useMutation(api.users.deleteAccount);

    // Handle logout
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Sign out from Clerk
            await signOut();
            // Reset Redux state
            dispatch(resetUser());
            // Close the modal
            setShowLogoutSheet(false);
            // Navigate to login
            router.replace('/(auth)/LoginScreen');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل في تسجيل الخروج' : 'Failed to log out'
            );
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Handle delete account
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            // 1. Try to delete user data from Convex database
            try {
                console.log('[Delete] Deleting user from Convex...');
                await deleteAccountMutation();
                console.log('[Delete] User deleted from Convex');
            } catch (convexError) {
                // If Convex delete fails, continue with sign out anyway
                console.log('[Delete] Convex delete failed (may already be deleted):', convexError);
            }

            // 2. Delete from Clerk
            try {
                if (clerkUser) {
                    await clerkUser.delete();
                    console.log('[Delete] User deleted from Clerk');
                } else {
                    console.warn('[Delete] No Clerk user found to delete');
                    await signOut();
                }
            } catch (clerkError) {
                console.error('[Delete] Failed to delete from Clerk:', clerkError);
                // Fallback to sign out if delete fails
                await signOut();
            }

            // 3. Reset Redux local state
            dispatch(resetUser());

            // 4. Close modal and navigate
            setShowDeleteConfirm(false);
            router.replace('/(auth)/LoginScreen');

            Alert.alert(
                isRTL ? 'تم الحذف' : 'Account Deleted',
                isRTL ? 'تم حذف حسابك بنجاح' : 'Your account has been deleted successfully'
            );
        } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل في حذف الحساب' : 'Failed to delete account'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // Open personal info edit modal
    const handleEditPersonalInfo = (field: 'name' | 'gender' | 'age' | 'height' | 'activity') => {
        setEditingField(field);
        switch (field) {
            case 'name':
                setEditValue(`${user.firstName} ${user.lastName}`.trim());
                break;
            case 'gender':
                setEditValue(user.gender || '');
                break;
            case 'age':
                setEditValue(user.age || '');
                break;
            case 'height':
                setEditValue(user.height || '');
                break;
            case 'activity':
                setEditValue(user.medicalConditions || '');
                break;
        }
        setShowPersonalInfoEdit(true);
    };

    // Save personal info
    const handleSavePersonalInfo = async () => {
        if (!editingField) return;
        setIsSaving(true);

        try {
            let updates: any = {};
            let reduxUpdates: any = { ...user };

            switch (editingField) {
                case 'name':
                    const [firstName, ...lastParts] = editValue.trim().split(' ');
                    const lastName = lastParts.join(' ');
                    updates = { firstName, lastName };
                    reduxUpdates.firstName = firstName;
                    reduxUpdates.lastName = lastName;
                    break;
                case 'gender':
                    updates = { gender: editValue as 'male' | 'female' };
                    reduxUpdates.gender = editValue;
                    break;
                case 'age':
                    updates = { dateOfBirth: calculateDOBFromAge(parseInt(editValue)) };
                    reduxUpdates.age = editValue;
                    break;
                case 'height':
                    updates = { height: parseFloat(editValue) };
                    reduxUpdates.height = editValue;
                    break;
                case 'activity':
                    updates = { activityLevel: editValue };
                    reduxUpdates.medicalConditions = editValue;
                    break;
            }

            // Update Convex
            await updateProfileMutation(updates);

            // Update Redux
            dispatch(setHealthData({
                firstName: reduxUpdates.firstName || '',
                lastName: reduxUpdates.lastName || '',
                phoneNumber: reduxUpdates.phoneNumber || '',
                gender: reduxUpdates.gender || '',
                age: reduxUpdates.age || '',
                height: reduxUpdates.height || '',
                heightUnit: reduxUpdates.heightUnit || 'cm',
                currentWeight: reduxUpdates.currentWeight || '',
                targetWeight: reduxUpdates.targetWeight || '',
                goal: reduxUpdates.goal || '',
                medicalConditions: reduxUpdates.medicalConditions || '',
            }));

            setShowPersonalInfoEdit(false);
            setEditingField(null);
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile'
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to calculate DOB from age
    const calculateDOBFromAge = (age: number): string => {
        const today = new Date();
        const birthYear = today.getFullYear() - age;
        return `${birthYear}-01-01`;
    };

    // Open target edit modal
    const handleOpenTargetEdit = () => {
        setNewTargetWeight(user.targetWeight || '65');
        setShowTargetEdit(true);
    };

    // Save new target weight
    const handleSaveTarget = () => {
        const newTarget = parseFloat(newTargetWeight);
        if (isNaN(newTarget) || newTarget <= 0) {
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'يرجى إدخال وزن صحيح' : 'Please enter a valid weight'
            );
            return;
        }
        dispatch(updateTargetWeight(newTargetWeight));
        setShowTargetEdit(false);
    };

    // Weight data from Redux
    const startWeight = useMemo(() => {
        // Get start weight from health history (initial weight at onboarding)
        return user.startWeight || parseFloat(user.currentWeight) || 70;
    }, [user.startWeight, user.currentWeight]);

    const targetWeight = useMemo(() => {
        // Get target weight from health history
        return parseFloat(user.targetWeight) || 65;
    }, [user.targetWeight]);

    const currentWeight = useMemo(() => {
        // Get current weight from latest weight check-in
        if (weightHistory.length > 0) {
            // Sort by date to get the most recent entry
            const sorted = [...weightHistory].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            return sorted[0].value;
        }
        // Fall back to start weight if no check-ins yet
        return startWeight;
    }, [weightHistory, startWeight]);

    // Calculate progress (handle both weight loss and gain goals)
    const progress = useMemo(() => {
        const totalChange = Math.abs(startWeight - targetWeight);
        if (totalChange === 0) return 100;

        const currentChange = Math.abs(startWeight - currentWeight);
        const progressValue = (currentChange / totalChange) * 100;

        // Clamp between 0 and 100
        return Math.min(Math.max(progressValue, 0), 100);
    }, [startWeight, currentWeight, targetWeight]);

    // Weight remaining to goal
    const weightToGo = useMemo(() => {
        const diff = currentWeight - targetWeight;
        return Math.abs(diff).toFixed(1);
    }, [currentWeight, targetWeight]);

    // Determine if losing or gaining
    const isLosingWeight = user.goal === 'loss' || currentWeight > targetWeight;

    // Photo handlers
    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                isRTL ? 'تحتاج إذن' : 'Permission needed',
                isRTL ? 'نحتاج إذن للوصول للكاميرا' : 'We need permission to access your camera'
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0].uri);
            setShowPhotoSheet(false);
        }
    };

    const handleChooseFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                isRTL ? 'تحتاج إذن' : 'Permission needed',
                isRTL ? 'نحتاج إذن للوصول للصور' : 'We need permission to access your photos'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0].uri);
            setShowPhotoSheet(false);
        }
    };

    const handleRemovePhoto = () => {
        Alert.alert(
            isRTL ? 'حذف الصورة' : 'Remove Photo',
            isRTL ? 'هل أنت متأكد أنك تريد حذف صورة الملف الشخصي؟' : 'Are you sure you want to remove your profile photo?',
            [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                {
                    text: isRTL ? 'حذف' : 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setProfileImage(null);
                        setShowPhotoSheet(false);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>

            <ScrollView style={[styles.scrollView, { paddingTop: insets.top, }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Header Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{initials}</Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton} onPress={() => setShowPhotoSheet(true)}>
                            <Ionicons name="camera" size={16} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>
                        {fullName}
                    </Text>
                    <Text style={styles.memberSince}>
                        {isRTL ? `عضو منذ ${memberSinceDate}` : `Member since ${memberSinceDate}`}
                    </Text>
                </View>

                {/* Weight Progress Card */}
                <LinearGradient
                    colors={gradients.primary as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.progressCard}
                >
                    <View style={[styles.weightColumns]}>
                        <View style={styles.weightColumn}>
                            <Text style={styles.weightLabel}>{isRTL ? 'البداية' : 'Started'}</Text>
                            <Text style={styles.weightValue}>{startWeight} kg</Text>
                        </View>
                        <View style={styles.weightColumnCenter}>
                            <Text style={styles.weightLabel}>{isRTL ? 'الحالي' : 'Current'}</Text>
                            <Text style={styles.weightValueLarge}>{currentWeight} kg</Text>
                        </View>
                        <View style={styles.weightColumn}>
                            <Text style={styles.weightLabel}>{isRTL ? 'الهدف' : 'Target'}</Text>
                            <Text style={styles.weightValue}>{targetWeight} kg</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                    </View>
                    <Text style={styles.progressText}>
                        {(startWeight - currentWeight).toFixed(1)} kg {isRTL ? 'مفقودة' : 'lost'} • {progress.toFixed(0)}% {isRTL ? 'إلى الهدف' : 'to goal'}
                    </Text>
                </LinearGradient>

                {/* My Plan Section */}

                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'خطتي' : 'My Plan'}</Text>
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.row, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={handleOpenTargetEdit}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                            <Ionicons name="flag" size={20} color={colors.success} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? 'الهدف الحالي' : 'Current Goal'}
                            </Text>
                            <Text style={[styles.rowValue, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isLosingWeight
                                    ? (isRTL ? `خسارة ${weightToGo} كجم` : `${weightToGo} kg to goal (${targetWeight} kg)`)
                                    : (isRTL ? `خسارة ${weightToGo} كجم ` : `${weightToGo} kg to goal (${targetWeight} kg)`)
                                }
                            </Text>
                        </View>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.row, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primaryLightBg }]}>
                            <Ionicons name="calendar" size={20} color={colors.info} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'البرنامج' : 'Program'}</Text>
                            <Text style={[styles.rowValue, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الشهر 2 من 3 • الأسبوع 6' : 'Month 2 of 3 • Week 6'}</Text>
                        </View>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>{isRTL ? 'نشط' : 'Active'}</Text>
                        </View>
                    </View>

                    <View style={[styles.row, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={styles.coachAvatar}>
                            <Text style={styles.coachAvatarText}>S</Text>
                            <View style={styles.onlineIndicator} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'مدربي' : 'My Coach'}</Text>
                            <Text style={[styles.rowValue, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'سارة أحمد' : 'Sarah Ahmed'}</Text>
                        </View>
                        <TouchableOpacity style={styles.messageButton}>
                            <Text style={styles.messageButtonText}>{isRTL ? 'رسالة' : 'Message'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Subscription Section */}
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الاشتراك' : 'Subscription'}</Text>
                <View style={styles.section}>
                    <TouchableOpacity disabled style={[styles.row, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 167, 38, 0.1)' }]}>
                            <Ionicons name="diamond" size={20} color="#FFA726" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الخطة الحالية' : 'Current Plan'}</Text>
                            <Text style={[styles.rowValue, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'شهري مميز' : 'Premium Monthly'}</Text>
                        </View>
                        <View style={styles.proBadge}>
                            <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity disabled style={[styles.row, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(171, 71, 188, 0.1)' }]}>
                            <Ionicons name="card" size={20} color="#AB47BC" />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الفاتورة التالية' : 'Next Billing'}</Text>
                            <Text style={[styles.rowValue, { textAlign: isRTL ? 'left' : 'right' }]}>Dec 25, 2024 • $19.99</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.outlineButton}>
                            <Text style={styles.outlineButtonText}>{isRTL ? 'إدارة الاشتراك' : 'Manage Subscription'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Personal Information Section */}
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'المعلومات الشخصية' : 'Personal Information'}</Text>
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.infoRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => handleEditPersonalInfo('name')}
                    >
                        <Text style={styles.infoLabel}>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Text>
                        <View style={[styles.infoValueContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.infoValue}>{fullName}</Text>
                            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.infoRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => handleEditPersonalInfo('gender')}
                    >
                        <Text style={styles.infoLabel}>{isRTL ? 'الجنس' : 'Gender'}</Text>
                        <View style={[styles.infoValueContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.infoValue}>
                                {user.gender === 'male' ? (isRTL ? 'ذكر' : 'Male') : user.gender === 'female' ? (isRTL ? 'أنثى' : 'Female') : '-'}
                            </Text>
                            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.infoRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => handleEditPersonalInfo('age')}
                    >
                        <Text style={styles.infoLabel}>{isRTL ? 'العمر' : 'Age'}</Text>
                        <View style={[styles.infoValueContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.infoValue}>
                                {user.age ? (isRTL ? `${user.age} سنة` : `${user.age} years`) : '-'}
                            </Text>
                            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.infoRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => handleEditPersonalInfo('height')}
                    >
                        <Text style={styles.infoLabel}>{isRTL ? 'الطول' : 'Height'}</Text>
                        <View style={[styles.infoValueContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.infoValue}>
                                {user.height ? `${user.height} ${user.heightUnit || 'cm'}` : '-'}
                            </Text>
                            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.infoRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => handleEditPersonalInfo('activity')}
                    >
                        <Text style={styles.infoLabel}>{isRTL ? 'مستوى النشاط' : 'Activity Level'}</Text>
                        <View style={[styles.infoValueContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.infoValue}>
                                {user.medicalConditions || (isRTL ? 'نشط بشكل معتدل' : 'Moderately Active')}
                            </Text>
                            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Notifications Section */}
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الإشعارات' : 'Notifications'}</Text>
                <View style={styles.section}>
                    <View style={[styles.notificationMasterRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name="notifications" size={24} color={colors.textPrimary} />
                        <View style={styles.rowContent}>
                            <Text style={[styles.notificationMasterLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الإشعارات' : 'Push Notifications'}</Text>
                            <Text style={[styles.notificationMasterSub, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'تمكين جميع الإشعارات' : 'Enable all notifications'}</Text>
                        </View>
                        <ToggleSwitch enabled={pushNotifications} onChange={setPushNotifications} isRTL={isRTL} />
                    </View>

                    <View style={[styles.notificationSubRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name="restaurant" size={20} color={colors.success} />
                        <View style={styles.rowContent}>
                            <Text style={[styles.notificationLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'تذكير الوجبات' : 'Meal Reminders'}</Text>
                            <Text style={[styles.notificationSub, { textAlign: isRTL ? 'left' : 'right' }]}>8:00 AM, 1:00 PM, 7:00 PM</Text>
                        </View>
                        <ToggleSwitch enabled={mealReminders} onChange={setMealReminders} isRTL={isRTL} />
                    </View>

                    <View style={[styles.notificationSubRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name="scale" size={20} color={colors.info} />
                        <View style={styles.rowContent}>
                            <Text style={[styles.notificationLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الفحص الأسبوعي' : 'Weekly Check-in'}</Text>
                            <Text style={[styles.notificationSub, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'كل جمعة الساعة 8:00 مساءً' : 'Every Friday at 8:00 PM'}</Text>
                        </View>
                        <ToggleSwitch enabled={weeklyCheckin} onChange={setWeeklyCheckin} isRTL={isRTL} />
                    </View>

                    <View style={[styles.notificationSubRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name="chatbubble" size={20} color="#42A5F5" />
                        <View style={styles.rowContent}>
                            <Text style={[styles.notificationLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'رسائل المدرب' : 'Coach Messages'}</Text>
                        </View>
                        <ToggleSwitch enabled={coachMessages} onChange={setCoachMessages} isRTL={isRTL} />
                    </View>

                    <View style={[styles.notificationSubRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name="sparkles" size={20} color="#FFA726" />
                        <View style={styles.rowContent}>
                            <Text style={[styles.notificationLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'رسائل تحفيزية' : 'Motivational Messages'}</Text>
                        </View>
                        <ToggleSwitch enabled={motivationalMessages} onChange={setMotivationalMessages} isRTL={isRTL} />
                    </View>
                </View>

                {/* App Settings Section */}
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'إعدادات التطبيق' : 'App Settings'}</Text>
                <View style={styles.section}>
                    <View style={[styles.settingRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.settingLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'اللغة' : 'Language'}</Text>
                        <SegmentedControl options={['العربي', 'EN']} selected={language} onChange={setLanguage} width={100} />
                    </View>

                    <View style={[styles.settingRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Ionicons name={theme === 0 ? "sunny-outline" : "moon-outline"} size={20} color={colors.textSecondary} />
                        <Text style={[styles.settingLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'المظهر' : 'Theme'}</Text>
                        <SegmentedControl options={['Light', 'Dark']} selected={theme} onChange={setTheme} width={100} />
                    </View>
                </View>

                {/* Support Section */}
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'الدعم' : 'Support'}</Text>
                <View style={styles.section}>
                    {[
                        { icon: 'help-circle-outline', label: isRTL ? 'مركز المساعدة' : 'Help Center', color: colors.textSecondary },
                        { icon: 'logo-whatsapp', label: isRTL ? 'دعم واتساب' : 'WhatsApp Support', color: '#25D366' },
                        { icon: 'mail-outline', label: isRTL ? 'دعم البريد الإلكتروني' : 'Email Support', color: colors.textSecondary },
                        { icon: 'star-outline', label: isRTL ? 'قيم WellFitGo' : 'Rate WellFitGo', color: '#FFC107' },
                    ].map((item, index, arr) => (
                        <TouchableOpacity key={index} style={[styles.supportRow, index < arr.length - 1 && styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                            <Text style={[styles.supportLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{item.label}</Text>
                            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={[styles.legalRow, styles.rowBorder, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={[styles.legalText, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'شروط الخدمة' : 'Terms of Service'}</Text>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.legalRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={[styles.legalText, { textAlign: isRTL ? 'left' : 'right' }]}>{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</Text>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutSheet(true)}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>{isRTL ? 'تسجيل الخروج' : 'Log Out'}</Text>
                </TouchableOpacity>

                {/* Delete Account */}
                <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteConfirm(true)}>
                    <Text style={styles.deleteText}>{isRTL ? 'حذف حسابي' : 'Delete my account'}</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerVersion}>WellFitGo v1.0.0</Text>
                </View>
            </ScrollView>

            {/* Photo Picker Modal */}
            <Modal visible={showPhotoSheet} animationType="slide" transparent onRequestClose={() => setShowPhotoSheet(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPhotoSheet(false)} />
                    <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>{isRTL ? 'تحديث صورة الملف الشخصي' : 'Update Profile Photo'}</Text>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto}>
                            <Ionicons name="camera" size={24} color={colors.success} />
                            <Text style={styles.sheetOptionText}>{isRTL ? 'التقط صورة' : 'Take Photo'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetOption} onPress={handleChooseFromLibrary}>
                            <Ionicons name="images" size={24} color={colors.info} />
                            <Text style={styles.sheetOptionText}>{isRTL ? 'اختر من المعرض' : 'Choose from Library'}</Text>
                        </TouchableOpacity>
                        {profileImage && (
                            <TouchableOpacity style={[styles.sheetOption, styles.sheetOptionDanger]} onPress={handleRemovePhoto}>
                                <Ionicons name="trash" size={24} color={colors.error} />
                                <Text style={[styles.sheetOptionText, { color: colors.error }]}>{isRTL ? 'حذف الصورة' : 'Remove Photo'}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPhotoSheet(false)}>
                            <Text style={styles.sheetCancelText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Logout Confirm Modal */}
            <Modal visible={showLogoutSheet} animationType="fade" transparent onRequestClose={() => setShowLogoutSheet(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.confirmTitle}>{isRTL ? 'تسجيل الخروج؟' : 'Log Out?'}</Text>
                        <Text style={styles.confirmMessage}>
                            {isRTL ? 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟' : 'Are you sure you want to log out of your account?'}
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowLogoutSheet(false)}>
                                <Text style={styles.confirmCancelText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmLogout}
                                onPress={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <Text style={styles.confirmLogoutText}>{isRTL ? 'تسجيل الخروج' : 'Log Out'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Target Weight Edit Modal */}
            <Modal visible={showTargetEdit} animationType="fade" transparent onRequestClose={() => setShowTargetEdit(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowTargetEdit(false)} />
                    <View style={[styles.confirmSheet, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.confirmTitle}>
                            {isRTL ? 'تعديل الوزن المستهدف' : 'Edit Target Weight'}
                        </Text>
                        <Text style={[styles.confirmMessage, { marginBottom: 16 }]}>
                            {isRTL ? 'أدخل وزنك المستهدف الجديد' : 'Enter your new target weight'}
                        </Text>
                        <View style={styles.targetInputContainer}>
                            <TextInput
                                style={styles.targetInput}
                                value={newTargetWeight}
                                onChangeText={setNewTargetWeight}
                                keyboardType="decimal-pad"
                                placeholder={isRTL ? 'الوزن بالكيلوجرام' : 'Weight in kg'}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <Text style={styles.targetInputUnit}>kg</Text>
                        </View>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowTargetEdit(false)}>
                                <Text style={styles.confirmCancelText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.confirmLogout, { backgroundColor: colors.success }]} onPress={handleSaveTarget}>
                                <Text style={styles.confirmLogoutText}>{isRTL ? 'حفظ' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Personal Info Edit Modal */}
            <Modal visible={showPersonalInfoEdit} animationType="fade" transparent onRequestClose={() => setShowPersonalInfoEdit(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPersonalInfoEdit(false)} />
                    <View style={[styles.confirmSheet, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.confirmTitle}>
                            {editingField === 'name' && (isRTL ? 'تعديل الاسم' : 'Edit Name')}
                            {editingField === 'gender' && (isRTL ? 'تعديل الجنس' : 'Edit Gender')}
                            {editingField === 'age' && (isRTL ? 'تعديل العمر' : 'Edit Age')}
                            {editingField === 'height' && (isRTL ? 'تعديل الطول' : 'Edit Height')}
                            {editingField === 'activity' && (isRTL ? 'تعديل مستوى النشاط' : 'Edit Activity Level')}
                        </Text>

                        {/* Gender Selector */}
                        {editingField === 'gender' ? (
                            <View style={styles.genderSelector}>
                                <TouchableOpacity
                                    style={[styles.genderOption, editValue === 'male' && styles.genderOptionSelected]}
                                    onPress={() => setEditValue('male')}
                                >
                                    <Ionicons name="male" size={24} color={editValue === 'male' ? colors.white : colors.info} />
                                    <Text style={[styles.genderOptionText, editValue === 'male' && styles.genderOptionTextSelected]}>
                                        {isRTL ? 'ذكر' : 'Male'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderOption, editValue === 'female' && styles.genderOptionSelected]}
                                    onPress={() => setEditValue('female')}
                                >
                                    <Ionicons name="female" size={24} color={editValue === 'female' ? colors.white : '#E91E63'} />
                                    <Text style={[styles.genderOptionText, editValue === 'female' && styles.genderOptionTextSelected]}>
                                        {isRTL ? 'أنثى' : 'Female'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.targetInputContainer}>
                                <TextInput
                                    style={styles.targetInput}
                                    value={editValue}
                                    onChangeText={setEditValue}
                                    keyboardType={editingField === 'age' || editingField === 'height' ? 'numeric' : 'default'}
                                    placeholder={
                                        editingField === 'name' ? (isRTL ? 'الاسم الكامل' : 'Full Name') :
                                            editingField === 'age' ? (isRTL ? 'العمر' : 'Age') :
                                                editingField === 'height' ? (isRTL ? 'الطول' : 'Height') :
                                                    (isRTL ? 'مستوى النشاط' : 'Activity Level')
                                    }
                                    placeholderTextColor={colors.textSecondary}
                                />
                                {editingField === 'height' && <Text style={styles.targetInputUnit}>cm</Text>}
                                {editingField === 'age' && <Text style={styles.targetInputUnit}>{isRTL ? 'سنة' : 'years'}</Text>}
                            </View>
                        )}

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowPersonalInfoEdit(false)}>
                                <Text style={styles.confirmCancelText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmLogout, { backgroundColor: colors.success }]}
                                onPress={handleSavePersonalInfo}
                                disabled={isSaving}
                            >
                                <Text style={styles.confirmLogoutText}>
                                    {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Delete Account Confirm Modal */}
            <Modal visible={showDeleteConfirm} animationType="fade" transparent onRequestClose={() => setShowDeleteConfirm(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmSheet}>
                        <View style={styles.sheetHandle} />
                        <Ionicons name="warning" size={48} color={colors.error} style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.confirmTitle}>{isRTL ? 'حذف الحساب؟' : 'Delete Account?'}</Text>
                        <Text style={styles.confirmMessage}>
                            {isRTL
                                ? 'هل أنت متأكد أنك تريد حذف حسابك؟ سيتم حذف جميع بياناتك نهائياً ولا يمكن استعادتها.'
                                : 'Are you sure you want to delete your account? All your data will be permanently deleted and cannot be recovered.'
                            }
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowDeleteConfirm(false)}>
                                <Text style={styles.confirmCancelText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmLogout}
                                onPress={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <Text style={styles.confirmLogoutText}>{isRTL ? 'حذف' : 'Delete'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgSecondary },
    header: { alignItems: 'center', justifyContent: 'center', marginVertical: 10, backgroundColor: 'transparent' },
    headerTitle: { fontSize: ScaleFontSize(18), fontWeight: '600', color: colors.textPrimary },
    settingsButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },

    // Profile Card
    profileCard: { backgroundColor: colors.bgPrimary, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16, ...shadows.light },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.primaryDark, backgroundColor: colors.primaryLightBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 32, color: colors.primaryDark, fontWeight: '600' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 48 },
    editAvatarButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    userName: { fontSize: ScaleFontSize(22), fontWeight: '600', color: colors.textPrimary },
    memberSince: { fontSize: ScaleFontSize(14), color: colors.textSecondary, marginTop: 4 },

    // Progress Card
    progressCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24
    },
    weightColumns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    weightColumn: { alignItems: 'center' },
    weightColumnCenter: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, alignItems: 'center' },
    weightLabel: { fontSize: ScaleFontSize(12), color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    weightValue: { fontSize: ScaleFontSize(20), color: colors.white, fontWeight: '600' },
    weightValueLarge: { fontSize: ScaleFontSize(24), color: colors.white, fontWeight: '700' },
    progressBarContainer: { marginBottom: 8 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.white, borderRadius: 4 },
    progressText: { fontSize: ScaleFontSize(14), color: colors.white, textAlign: 'center' },

    // Section
    sectionTitle: { fontSize: ScaleFontSize(18), fontWeight: '600', color: colors.textPrimary, marginBottom: 12, paddingHorizontal: 4 },
    section: { backgroundColor: colors.bgPrimary, borderRadius: 16, marginBottom: 24, overflow: 'hidden', ...shadows.light },

    // Rows
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: ScaleFontSize(12), color: colors.textSecondary, marginBottom: 2 },
    rowValue: { fontSize: ScaleFontSize(16), color: colors.textPrimary },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    activeBadge: { backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    activeBadgeText: { fontSize: ScaleFontSize(12), color: colors.success, fontWeight: '600' },
    proBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFA726' },
    proBadgeText: { fontSize: ScaleFontSize(11), color: colors.white, fontWeight: '700' },
    buttonRow: { padding: 16 },
    outlineButton: { borderWidth: 1.5, borderColor: colors.primaryDark, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
    outlineButtonText: { fontSize: ScaleFontSize(16), color: colors.primaryDark, fontWeight: '600' },

    // Coach
    coachAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
    coachAvatarText: { fontSize: 16, color: colors.white, fontWeight: '600' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.bgPrimary },
    messageButton: { backgroundColor: colors.primaryDark, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    messageButtonText: { fontSize: ScaleFontSize(14), color: colors.white, fontWeight: '600' },

    // Info Row
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
    infoLabel: { fontSize: ScaleFontSize(14), color: colors.textSecondary },
    infoValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoValue: { fontSize: ScaleFontSize(16), color: colors.textPrimary },

    // Notification Rows
    notificationMasterRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    notificationMasterLabel: { fontSize: ScaleFontSize(16), color: colors.textPrimary, },
    notificationMasterSub: { fontSize: ScaleFontSize(13), color: colors.textSecondary, marginTop: 4 },
    notificationSubRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    notificationLabel: { fontSize: ScaleFontSize(16), color: colors.textPrimary },
    notificationSub: { fontSize: ScaleFontSize(13), color: colors.textSecondary, marginTop: 4 },

    // Settings
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 12 },
    settingLabel: { flex: 1, fontSize: ScaleFontSize(16), color: colors.textPrimary },
    cacheSize: { fontSize: ScaleFontSize(14), color: colors.textSecondary },

    // Support
    supportRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 12 },
    supportLabel: { flex: 1, fontSize: ScaleFontSize(16), color: colors.textPrimary },
    legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 48 },
    legalText: { fontSize: ScaleFontSize(14), color: colors.textSecondary },

    // Logout
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgPrimary, borderRadius: 12, height: 52, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    logoutText: { fontSize: ScaleFontSize(16), color: colors.error },
    deleteButton: { alignItems: 'center', marginBottom: 24 },
    deleteText: { fontSize: ScaleFontSize(14), color: colors.error, textDecorationLine: 'underline' },

    // Footer
    footer: { alignItems: 'center', marginBottom: 40 },
    footerVersion: { fontSize: ScaleFontSize(12), color: colors.textSecondary },
    footerMade: { fontSize: ScaleFontSize(12), color: colors.textSecondary, marginTop: 4 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: ScaleFontSize(18), fontWeight: '600', color: colors.textPrimary, marginBottom: 24 },
    sheetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 16, marginBottom: 12 },
    sheetOptionDanger: { backgroundColor: 'rgba(239, 83, 80, 0.1)' },
    sheetOptionText: { fontSize: ScaleFontSize(16), color: colors.textPrimary },
    sheetCancel: { alignItems: 'center', paddingVertical: 12 },
    sheetCancelText: { fontSize: ScaleFontSize(16), color: colors.textSecondary },
    confirmSheet: { backgroundColor: colors.bgPrimary, borderRadius: 24, margin: 16, padding: 24 },
    confirmTitle: { fontSize: ScaleFontSize(18), fontWeight: '600', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
    confirmMessage: { fontSize: ScaleFontSize(14), color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    confirmButtons: { flexDirection: 'row', gap: 12 },
    confirmCancel: { flex: 1, height: 48, backgroundColor: colors.bgSecondary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    confirmCancelText: { fontSize: ScaleFontSize(16), color: colors.textSecondary },
    confirmLogout: { flex: 1, height: 48, backgroundColor: colors.error, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    confirmLogoutText: { fontSize: ScaleFontSize(16), color: colors.white, fontWeight: '600' },

    // Target Weight Input
    targetInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 24, paddingHorizontal: 16 },
    targetInput: { flex: 1, height: 56, fontSize: ScaleFontSize(18), color: colors.textPrimary, textAlign: 'center' },
    targetInputUnit: { fontSize: ScaleFontSize(16), color: colors.textSecondary, fontWeight: '600' },

    // Gender Selector
    genderSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    genderOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.border },
    genderOptionSelected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
    genderOptionText: { fontSize: ScaleFontSize(16), color: colors.textPrimary, fontWeight: '600' },
    genderOptionTextSelected: { color: colors.white },
});

export default ProfileScreen;
