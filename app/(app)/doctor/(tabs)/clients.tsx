import React, { useState, useRef } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    Clock,
    Mail,
    MoreVertical,
    Plus,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react-native';
import { colors, gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/utils/scaling';

// Translations
const t = {
    title: isRTL ? 'العملاء' : 'Clients',
    searchPlaceholder: isRTL ? 'ابحث بالاسم أو البريد...' : 'Search by name or email...',
    allClients: isRTL ? 'جميع العملاء' : 'All Clients',
    active: isRTL ? 'نشط' : 'Active',
    inactive: isRTL ? 'غير نشط' : 'Inactive',
    new: isRTL ? 'جديد' : 'New',
    atRisk: isRTL ? 'معرض للخطر' : 'At Risk',
    overdue: isRTL ? 'متأخر' : 'Overdue',
    weightProgress: isRTL ? 'تقدم الوزن' : 'Weight Progress',
    onboarding: isRTL ? 'التسجيل' : 'Onboarding',
    lastCheckIn: isRTL ? 'آخر تسجيل' : 'Last check-in',
    joined: isRTL ? 'انضم' : 'Joined',
    unread: isRTL ? 'غير مقروء' : 'unread',
    viewProfile: isRTL ? 'عرض الملف' : 'View Profile',
    message: isRTL ? 'رسالة' : 'Message',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    // Modal translations
    addNewClient: isRTL ? 'إضافة عميل جديد' : 'Add New Client',
    step1: isRTL ? 'الخطوة 1 من 2: المعلومات الأساسية' : 'Step 1 of 2: Basic Information',
    fullName: isRTL ? 'الاسم الكامل' : 'Full Name',
    email: isRTL ? 'البريد الإلكتروني' : 'Email',
    phoneNumber: isRTL ? 'رقم الهاتف' : 'Phone Number',
    gender: isRTL ? 'الجنس' : 'Gender',
    male: isRTL ? 'ذكر' : 'Male',
    female: isRTL ? 'أنثى' : 'Female',
    height: isRTL ? 'الطول (سم)' : 'Height (cm)',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    next: isRTL ? 'التالي' : 'Next',
};

type FilterStatus = 'all' | 'active' | 'inactive' | 'new' | 'atRisk';

// Mock clients data with updated structure
const mockClients = [
    {
        id: '1',
        name: isRTL ? 'سارة محمد' : 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV2xQmlyfFZn1G4eGyLe2eKAEbWsr5s5pr85m2688aDtAV90Jij4qmRmSqcT5wiJhMdPLZgvvHRCVvhLH901MotiNnaUXVE_c1XLHBRGVsXs4oajD33DhXw68XbkMIVMtMvR72nF7U1cek4btq_QW0kNATEYS7BwVIpT3DdEAaed0trwfMC-4hcYsB4ooVxCm7uPZEBFGr1Per4_OClhMPX93yjSoQarGmNSj6WMemamPOj8WAMVcY3xfxWsirEagcb8JlnRnxFbQ',
        status: 'active' as const,
        startWeight: 75,
        currentWeight: 68,
        targetWeight: 60,
        progress: 60,
        lastCheckIn: isRTL ? 'منذ يومين' : '2d ago',
        unreadMessages: 5,
        isOverdue: false,
        isNew: false,
    },
    {
        id: '2',
        name: isRTL ? 'أحمد حسن' : 'Ahmed Hassan',
        email: 'ahmed.h@example.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBU7-Y76H21BM0qPq1muXSG5TkI3Y3K_Db5V-E3uS0SlPVrIeBlXlkFBjrfr-Rgzps2WAVxk9wx46mLTKjnGrn1RBOLOEMkZG-gav4u6YtHllDDrqp6fHiP0jCUSqvYNnNv5IkaiBUDHSC2tVYx9Amuij4URahbl847pg56pJy7IuU5wu8ZpIIvBFQR5GybotyQD46MHqXaI1ki5RVjG15qP0CAflUaupoxLW8zCOnYmIyuvXujDrGSPviSwUwr-rzOJ5_L59fWn74',
        status: 'active' as const,
        startWeight: 85,
        currentWeight: 82,
        targetWeight: 75,
        progress: 30,
        lastCheckIn: isRTL ? 'منذ 10 أيام' : '10 days ago',
        unreadMessages: 0,
        isOverdue: true,
        isNew: false,
    },
    {
        id: '3',
        name: isRTL ? 'إيميلي تشين' : 'Emily Chen',
        email: 'emily.c@example.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR4FWG9x8cLYB8Ttj9nA3Ou-eTZluqmKYfXwq2dWuVhZuQTd7vU-H6fbom2rn4TxdyEDsuwjl1FhJ7nEKaPZWmwyU-3HEhAP9ABdVag95yqP8aLW59RBxzZ2TcxscXcIgRl498KRbVyH43tog7TNtv7jAnhscf2RkEnSg-xjts8BRUJD_o2p4sqV9a9Mqn6OnHSmfcJOvoNCz4XLFuDWdlpiqzIut7DTSuWgFFFLi6-zMwKxZrJi_GJ9OZRBpLNICi_Rej8Na5p5s',
        status: 'active' as const,
        startWeight: 65,
        currentWeight: 65,
        targetWeight: 58,
        progress: 10,
        lastCheckIn: isRTL ? 'أمس' : 'Yesterday',
        unreadMessages: 0,
        isOverdue: false,
        isNew: true,
    },
    {
        id: '4',
        name: isRTL ? 'محمد علي' : 'Mohamed Ali',
        email: 'mohamed.ali@email.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
        status: 'inactive' as const,
        startWeight: 90,
        currentWeight: 85,
        targetWeight: 80,
        progress: 50,
        lastCheckIn: isRTL ? 'منذ 30 يوم' : '30 days ago',
        unreadMessages: 0,
        isOverdue: false,
        isNew: false,
    },
];

export default function ClientsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter clients based on active filter and search query
    const filteredClients = mockClients.filter((client) => {
        // Search filter
        const matchesSearch =
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        let matchesFilter = true;
        switch (activeFilter) {
            case 'active':
                matchesFilter = client.status === 'active' && !client.isOverdue;
                break;
            case 'inactive':
                matchesFilter = client.status === 'inactive';
                break;
            case 'new':
                matchesFilter = client.isNew;
                break;
            case 'atRisk':
                matchesFilter = client.isOverdue;
                break;
        }

        return matchesSearch && matchesFilter;
    });

    const navigateToProfile = (clientId: string) => {
        router.push(`/(app)/doctor/client-profile?id=${clientId}`);
    };

    const filterChips: { key: FilterStatus; label: string }[] = [
        { key: 'all', label: t.allClients },
        { key: 'active', label: t.active },
        { key: 'inactive', label: t.inactive },
        { key: 'new', label: t.new },
        { key: 'atRisk', label: t.atRisk },
    ];

    const renderFilterChip = (item: { key: FilterStatus; label: string }) => {
        const isActive = activeFilter === item.key;

        if (isActive) {
            return (
                <TouchableOpacity
                    key={item.key}
                    onPress={() => setActiveFilter(item.key)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.filterChipActive}
                    >
                        <Text style={styles.filterChipTextActive}>{item.label}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={item.key}
                style={styles.filterChip}
                onPress={() => setActiveFilter(item.key)}
                activeOpacity={0.7}
            >
                <Text style={styles.filterChipText}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    const renderClientCard = (client: typeof mockClients[0]) => {
        const isOverdue = client.isOverdue;
        const isNewClient = client.isNew;

        return (
            <View
                key={client.id}
                style={[
                    styles.clientCard,
                    isOverdue && styles.clientCardOverdue,
                ]}
            >
                {/* Header */}
                <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.cardHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: client.avatar }} style={styles.avatar} />
                        </View>
                        <View style={[styles.clientInfo, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                            <View style={[styles.nameRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.clientName}>{client.name}</Text>
                                {isOverdue ? (
                                    <View style={styles.overdueStatus}>
                                        <Bell size={horizontalScale(10)} color="#92400E" />
                                        <Text style={styles.overdueStatusText}>{t.overdue}</Text>
                                    </View>
                                ) : isNewClient ? (
                                    <View style={styles.newStatus}>
                                        <Text style={styles.newStatusText}>{t.new}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.activeStatus}>
                                        <Text style={styles.activeStatusText}>{t.active}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.clientEmail}>{client.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Section */}
                {!isOverdue && (
                    <View style={styles.progressSection}>
                        <View style={[styles.progressHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.progressLabel}>
                                {isNewClient ? t.onboarding : t.weightProgress}
                            </Text>
                            <Text style={styles.progressPercentage}>{client.progress}%</Text>
                        </View>
                        {!isNewClient && (
                            <View style={[styles.weightFlow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.weightText}>
                                    {client.startWeight} kg <Text style={styles.weightArrow}>{isRTL ? '←' : '→'}</Text> {client.currentWeight} kg <Text style={styles.weightArrow}>{isRTL ? '←' : '→'}</Text> {client.targetWeight} kg
                                </Text>
                            </View>
                        )}
                        {isNewClient && (
                            <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse' }}>
                                <Text style={[styles.weightText, { textAlign: isRTL ? 'right' : 'left' }]}>
                                    {isRTL ? 'البداية ← التقييم' : 'Start → Assessment'}
                                </Text>

                            </View>
                        )}
                        <View style={styles.progressBarContainer}>
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBarFill, { width: `${client.progress}%` }]}
                            />
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={[styles.cardFooter, isOverdue && styles.cardFooterOverdue]}>
                    {/* Info Badges */}
                    <View style={[styles.infoBadges, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.infoBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Clock size={horizontalScale(12)} color={colors.textSecondary} />
                            <Text style={[
                                styles.infoBadgeText,
                                isOverdue && styles.infoBadgeTextDanger,
                            ]}>
                                {isOverdue ? t.lastCheckIn + ': ' : (isNewClient ? t.joined + ': ' : t.lastCheckIn + ': ')}
                                {client.lastCheckIn}
                            </Text>
                        </View>
                        {client.unreadMessages > 0 && (
                            <View style={[styles.unreadBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Mail size={horizontalScale(12)} color={colors.error} />
                                <Text style={styles.unreadBadgeText}>
                                    {client.unreadMessages} {t.unread}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.actionButtons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <TouchableOpacity
                            style={styles.viewProfileButton}
                            onPress={() => navigateToProfile(client.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewProfileText}>{t.viewProfile}</Text>
                        </TouchableOpacity>
                        {isOverdue ? (
                            <TouchableOpacity style={styles.reminderButton} activeOpacity={0.7}>
                                <Bell size={horizontalScale(16)} color="#FFFFFF" />
                                <Text style={styles.reminderButtonText}>{t.sendReminder}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity activeOpacity={0.8}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.messageButton}
                                >
                                    <Text style={styles.messageButtonText}>{t.message}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                <Text style={styles.title}>{t.title}</Text>
                <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setShowSearch(!showSearch)}
                        activeOpacity={0.7}
                    >
                        <Search size={horizontalScale(22)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar (Expandable) */}
            {showSearch && (
                <View style={styles.searchContainer}>
                    <View style={[styles.searchInputWrapper, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Search size={horizontalScale(18)} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                            placeholder={t.searchPlaceholder}
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={horizontalScale(18)} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.filterScrollContent,
                        { flexDirection: isRTL ? 'row' : 'row-reverse' },
                    ]}
                >
                    {filterChips.map(renderFilterChip)}
                </ScrollView>
            </View>

            {/* Client List */}
            <ScrollView
                style={styles.clientList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.clientListContent}
            >
                {filteredClients.map(renderClientCard)}
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Header
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(8),
        backgroundColor: colors.bgSecondary,
    },
    title: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    headerActions: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    headerIconButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Search
    searchContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(8),
    },
    searchInputWrapper: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        gap: horizontalScale(10),
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    // Filter Chips
    filterContainer: {
        paddingBottom: verticalScale(8),
    },
    filterScrollContent: {
        paddingHorizontal: horizontalScale(16),
        gap: horizontalScale(10),
    },
    filterChip: {
        height: verticalScale(36),
        paddingHorizontal: horizontalScale(18),
        borderRadius: horizontalScale(18),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        height: verticalScale(36),
        paddingHorizontal: horizontalScale(18),
        borderRadius: horizontalScale(18),
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    filterChipTextActive: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Client List
    clientList: {
        flex: 1,
    },
    clientListContent: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(100),
        gap: verticalScale(16),
    },
    // Client Card
    clientCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    clientCardOverdue: {
        backgroundColor: '#FFFBEB',
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
    },
    cardHeader: {
        padding: horizontalScale(16),
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardHeaderLeft: {
        flex: 1,
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    avatarContainer: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        borderWidth: 2,
        borderColor: colors.bgPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(24),
    },
    clientInfo: {
        flex: 1,
    },
    nameRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(2),
    },
    clientName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    activeStatus: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(4),
    },
    activeStatusText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#166534',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    newStatus: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(4),
    },
    newStatusText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#1E40AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    overdueStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(4),
        backgroundColor: 'rgba(226, 185, 59, 0.2)',
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(4),
    },
    overdueStatusText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#92400E',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clientEmail: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    moreButton: {
        padding: horizontalScale(4),
    },
    // Progress Section
    progressSection: {
        marginHorizontal: horizontalScale(16),
        marginBottom: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(14),
    },
    progressHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(6),
    },
    progressLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressPercentage: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: colors.success,
    },
    weightFlow: {
        marginBottom: verticalScale(8),
    },
    weightText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textPrimary,
        fontFamily: 'monospace',
    },
    weightArrow: {
        color: colors.textSecondary,
    },
    progressBarContainer: {
        height: verticalScale(8),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        overflow: 'hidden',
        marginVertical: verticalScale(10)
    },
    progressBarFill: {
        height: '100%',
        borderRadius: horizontalScale(4),
    },
    // Card Footer
    cardFooter: {
        padding: horizontalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: verticalScale(12),
    },
    cardFooterOverdue: {
        borderTopColor: 'rgba(226, 185, 59, 0.3)',
    },
    infoBadges: {
        flexWrap: 'wrap',
        gap: horizontalScale(8),
    },
    infoBadge: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    infoBadgeText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    infoBadgeTextDanger: {
        color: colors.error,
        fontWeight: '700',
    },
    unreadBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    unreadBadgeText: {
        fontSize: ScaleFontSize(12),
        color: colors.error,
        fontWeight: '700',
    },
    actionButtons: {
        gap: horizontalScale(10),
    },
    viewProfileButton: {
        flex: 1,
        height: verticalScale(38),
        borderRadius: horizontalScale(10),
        borderWidth: 1.5,
        borderColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewProfileText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    messageButton: {
        flex: 1,
        height: verticalScale(38),
        width: horizontalScale(130),
        borderRadius: horizontalScale(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    reminderButton: {
        flex: 1,
        flexDirection: 'row',
        height: verticalScale(38),
        borderRadius: horizontalScale(10),
        backgroundColor: colors.warning,
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(6),
    },
    reminderButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: verticalScale(90),
        right: horizontalScale(16),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: horizontalScale(56),
        height: horizontalScale(56),
        borderRadius: horizontalScale(28),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: horizontalScale(24),
        borderTopRightRadius: horizontalScale(24),
        maxHeight: '90%',
    },
    modalHeader: {
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: horizontalScale(20),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    modalSubtitle: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    closeButton: {
        padding: horizontalScale(4),
    },
    modalBody: {
        padding: horizontalScale(20),
    },
    inputGroup: {
        marginBottom: verticalScale(16),
    },
    inputLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    textInput: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: horizontalScale(10),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
    },
    genderRow: {
        gap: horizontalScale(20),
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    genderOptionActive: {},
    radioOuter: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterActive: {
        borderColor: colors.success,
    },
    radioInner: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: colors.success,
    },
    genderText: {
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
    },
    modalFooter: {
        padding: horizontalScale(20),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: horizontalScale(12),
    },
    cancelButton: {
        flex: 1,
        paddingVertical: verticalScale(14),
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: horizontalScale(10),
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
    },
    nextButton: {
        flex: 1,
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(10),
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: ScaleFontSize(15),
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
