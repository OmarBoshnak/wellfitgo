import React, { useState, useCallback } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Bell,
    Clock,
    Mail,
    Search,
    X,
    User,
    AlertTriangle,
    CheckCircle,
    UserPlus,
    UserX,
} from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/core/utils/scaling';
import {
    useClients,
    formatLastCheckIn,
    type Client,
    type ClientStatus,
    type ClientFilter,
} from '@/src/features/doctor/hooks/useClients';
import { Id } from '@/convex/_generated/dataModel';

// ============ TRANSLATIONS ============
const t = {
    title: isRTL ? 'العملاء' : 'Clients',
    searchPlaceholder: isRTL ? 'ابحث بالاسم أو البريد...' : 'Search by name or email...',
    allClients: isRTL ? 'الكل' : 'All',
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
    noClients: isRTL ? 'لا يوجد عملاء' : 'No clients',
    noClientsSubtext: isRTL ? 'لم يتم العثور على عملاء' : 'No clients found',
    noActiveClients: isRTL ? 'لا يوجد عملاء نشطين' : 'No active clients',
    noInactiveClients: isRTL ? 'لا يوجد عملاء غير نشطين' : 'No inactive clients',
    noNewClients: isRTL ? 'لا يوجد عملاء جدد' : 'No new clients',
    noAtRiskClients: isRTL ? 'لا يوجد عملاء معرضين للخطر 🎉' : 'No at-risk clients 🎉',
};

// ============ STATUS COMPONENTS ============

/** Status icon component - displays lucide icon based on status */
function StatusIcon({ status }: { status: ClientStatus }) {
    const size = horizontalScale(12);
    switch (status) {
        case 'active':
            return <CheckCircle size={size} color="#16A34A" />;
        case 'new':
            return <UserPlus size={size} color="#2563EB" />;
        case 'atRisk':
            return <AlertTriangle size={size} color="#D97706" />;
        case 'overdue':
            return <Bell size={size} color="#DC2626" />;
        case 'inactive':
            return <UserX size={size} color="#6B7280" />;
        default:
            return null;
    }
}

/** Status badge component - displays colored badge with icon */
function StatusBadge({ status }: { status: ClientStatus }) {
    const getStatusStyle = () => {
        switch (status) {
            case 'active':
                return { bg: '#DCFCE7', text: '#166534', label: t.active };
            case 'new':
                return { bg: '#DBEAFE', text: '#1E40AF', label: t.new };
            case 'atRisk':
                return { bg: '#FEF3C7', text: '#92400E', label: t.atRisk };
            case 'overdue':
                return { bg: '#FEE2E2', text: '#991B1B', label: t.overdue };
            case 'inactive':
                return { bg: '#F3F4F6', text: '#6B7280', label: t.inactive };
            default:
                return { bg: '#F3F4F6', text: '#6B7280', label: '' };
        }
    };

    const style = getStatusStyle();

    return (
        <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
            <StatusIcon status={status} />
            <Text style={[styles.statusBadgeText, { color: style.text }]}>
                {style.label}
            </Text>
        </View>
    );
}

// ============ LOADING & EMPTY STATES ============

/** Skeleton loading card for clients */
function ClientCardSkeleton() {
    return (
        <View style={styles.clientCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.skeletonAvatar, styles.skeleton]} />
                    <View style={styles.skeletonInfo}>
                        <View style={[styles.skeletonName, styles.skeleton]} />
                        <View style={[styles.skeletonEmail, styles.skeleton]} />
                    </View>
                </View>
            </View>
            <View style={styles.progressSection}>
                <View style={[styles.skeletonProgress, styles.skeleton]} />
            </View>
        </View>
    );
}

/** Empty state component */
function EmptyState({ filter }: { filter: ClientFilter }) {
    const getEmptyMessage = () => {
        switch (filter) {
            case 'active':
                return t.noActiveClients;
            case 'inactive':
                return t.noInactiveClients;
            case 'new':
                return t.noNewClients;
            case 'atRisk':
                return t.noAtRiskClients;
            default:
                return t.noClients;
        }
    };

    return (
        <View style={styles.emptyState}>
            <User size={horizontalScale(48)} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
            <Text style={styles.emptyStateSubtext}>{t.noClientsSubtext}</Text>
        </View>
    );
}

// ============ MAIN COMPONENT ============

export default function ClientsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // State
    const [activeFilter, setActiveFilter] = useState<ClientFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch clients using Convex hook
    const {
        clients,
        counts,
        isLoading,
        isEmpty,
        sendReminder,
        isSendingReminder,
    } = useClients(activeFilter, searchQuery);

    // ============ HANDLERS ============

    const navigateToProfile = useCallback((clientId: Id<"users">) => {
        router.push(`/(app)/doctor/client-profile?id=${clientId}`);
    }, [router]);

    const navigateToMessages = useCallback((clientId: Id<"users">) => {
        router.push({
            pathname: '/(app)/doctor/(tabs)/messages',
            params: { openChatWithClient: clientId },
        });
    }, [router]);

    const handleSendReminder = useCallback(async (client: Client) => {
        // Determine reminder type based on client status
        const reminderType = client.lastCheckInDays && client.lastCheckInDays > 7
            ? "weight"
            : "general";
        await sendReminder(client.id, reminderType);
    }, [sendReminder]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        // Convex auto-refreshes, wait briefly for UX
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // ============ FILTER CHIPS ============

    const filterChips: { key: ClientFilter; label: string; count: number }[] = [
        { key: 'all', label: t.allClients, count: counts.all },
        { key: 'active', label: t.active, count: counts.active },
        { key: 'new', label: t.new, count: counts.new },
        { key: 'atRisk', label: t.atRisk, count: counts.atRisk },
        { key: 'inactive', label: t.inactive, count: counts.inactive },
    ];

    const renderFilterChip = (item: typeof filterChips[0]) => {
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
                        <Text style={styles.filterChipTextActive}>
                            {item.label} {item.count > 0 && `(${item.count})`}
                        </Text>
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
                <Text style={styles.filterChipText}>
                    {item.label} {item.count > 0 && `(${item.count})`}
                </Text>
            </TouchableOpacity>
        );
    };

    // ============ CLIENT CARD ============

    const renderClientCard = (client: Client) => {
        const isOverdue = client.status === 'overdue';
        const isAtRisk = client.status === 'atRisk';
        const isNewClient = client.status === 'new';
        const needsReminder = isOverdue || isAtRisk;

        return (
            <View
                key={client.id}
                style={[
                    styles.clientCard,
                    isOverdue && styles.clientCardOverdue,
                    isAtRisk && styles.clientCardAtRisk,
                ]}
            >
                {/* Header */}
                <TouchableOpacity
                    style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                    onPress={() => navigateToProfile(client.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.cardHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={styles.avatarContainer}>
                            {client.avatar ? (
                                <Image source={{ uri: client.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {client.firstName.charAt(0)}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={[styles.clientInfo, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                            <View style={[styles.nameRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.clientName}>{client.name}</Text>
                                <StatusBadge status={client.status} />
                            </View>
                            <Text style={styles.clientEmail}>{client.email}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Progress Section - hide for overdue to show urgency */}
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
                                    {client.startWeight} kg
                                    <Text style={styles.weightArrow}> {isRTL ? '←' : '→'} </Text>
                                    {client.currentWeight} kg
                                    <Text style={styles.weightArrow}> {isRTL ? '←' : '→'} </Text>
                                    {client.targetWeight} kg
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
                <View style={[styles.cardFooter, needsReminder && styles.cardFooterWarning]}>
                    {/* Info Badges */}
                    <View style={[styles.infoBadges, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.infoBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Clock size={horizontalScale(12)} color={colors.textSecondary} />
                            <Text
                                style={[
                                    styles.infoBadgeText,
                                    needsReminder && styles.infoBadgeTextDanger,
                                ]}
                            >
                                {isNewClient ? t.joined : t.lastCheckIn}:{' '}
                                {formatLastCheckIn(
                                    isNewClient ? client.daysSinceJoined : client.lastCheckInDays
                                )}
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

                        {needsReminder ? (
                            <TouchableOpacity
                                style={styles.reminderButton}
                                onPress={() => handleSendReminder(client)}
                                activeOpacity={0.7}
                                disabled={isSendingReminder}
                            >
                                {isSendingReminder ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Bell size={horizontalScale(16)} color="#FFFFFF" />
                                        <Text style={styles.reminderButtonText}>{t.sendReminder}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigateToMessages(client.id)}
                            >
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

    // ============ RENDER ============

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

            {/* Search Bar */}
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primaryDark}
                    />
                }
            >
                {/* Loading State */}
                {isLoading && (
                    <>
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                    </>
                )}

                {/* Empty State */}
                {!isLoading && isEmpty && <EmptyState filter={activeFilter} />}

                {/* Client Cards */}
                {!isLoading && !isEmpty && clients.map(renderClientCard)}
            </ScrollView>
        </SafeAreaView>
    );
}

// ============ STYLES ============

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
    clientCardAtRisk: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
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
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(24),
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(24),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPlaceholderText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
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
    clientEmail: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    // Status Badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(3),
        borderRadius: horizontalScale(4),
        gap: horizontalScale(4),
    },
    statusBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        marginVertical: verticalScale(10),
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
    cardFooterWarning: {
        backgroundColor: '#FFFBEB',
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
    // Loading Skeleton
    skeleton: {
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    skeletonAvatar: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
    },
    skeletonInfo: {
        flex: 1,
        marginHorizontal: horizontalScale(12),
        gap: verticalScale(8),
    },
    skeletonName: {
        width: '60%',
        height: verticalScale(16),
    },
    skeletonEmail: {
        width: '80%',
        height: verticalScale(12),
    },
    skeletonProgress: {
        width: '100%',
        height: verticalScale(60),
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyStateText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: verticalScale(16),
    },
    emptyStateSubtext: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
});
