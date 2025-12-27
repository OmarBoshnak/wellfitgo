import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    listContent: {
        paddingBottom: verticalScale(32),
    },
    // Gradient Header
    gradientHeader: {
        paddingBottom: verticalScale(60),
    },
    headerNav: {
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        marginBottom: verticalScale(16),
    },
    headerButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
    },
    avatarContainer: {
        width: horizontalScale(88),
        height: horizontalScale(88),
        borderRadius: horizontalScale(44),
        borderWidth: 3,
        borderColor: '#FFFFFF',
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(44),
    },
    clientName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: verticalScale(8),
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(16),
        marginBottom: verticalScale(12),
    },
    premiumBadgeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#854D0E',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contactIcons: {
        alignItems: 'center',
        gap: horizontalScale(16),
    },
    iconDivider: {
        width: 1,
        height: verticalScale(12),
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    // Stats Cards
    statsCardsContainer: {
        marginTop: verticalScale(-40),
        paddingHorizontal: horizontalScale(16),
        zIndex: 10,
    },
    statsCards: {
        gap: horizontalScale(8),
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(10),
        alignItems: 'center',
        justifyContent: 'center',
        height: verticalScale(70),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    statCardHighlight: {
        borderWidth: 1,
        borderColor: 'rgba(80, 115, 254, 0.1)',
    },
    statLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: verticalScale(2),
    },
    statValue: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    statValueGradient: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.primaryDark,
    },
    statSubtext: {
        fontSize: ScaleFontSize(10),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    statChange: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: colors.success,
        marginTop: verticalScale(2),
    },
    // Actions
    actionsContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        gap: verticalScale(10),
    },
    primaryActionWrapper: {
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        height: verticalScale(48),
    },
    primaryActionText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        height: verticalScale(48),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 2,
        borderColor: colors.primaryDark,
    },
    secondaryActionText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.primaryDark,
        letterSpacing: 0.3,
    },
    // Tabs
    tabsContainer: {
        marginTop: verticalScale(20),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabsScroll: {
        paddingHorizontal: horizontalScale(8),
    },
    tab: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        position: 'relative',
    },
    tabText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.primaryDark,
        fontWeight: '600',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: horizontalScale(16),
        right: horizontalScale(16),
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    // Content
    tabContent: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
    },
    tabContentHorizontal: {
        paddingTop: verticalScale(8),
    },
    // Week Header
    weekHeader: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(4),
    },
    weekHeaderTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    weekHeaderDate: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Week Cards
    weekCardsContainer: {
        gap: horizontalScale(12),
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(8),
    },
    weekCard: {
        width: horizontalScale(140),
        height: verticalScale(140),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    progressRing: {
        position: 'absolute',
    },
    ringContent: {
        alignItems: 'center',
    },
    ringValue: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    ringLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(-2),
    },
    checkIconContainer: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(8),
    },
    weekCardTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    weekCardSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    weekCardEmoji: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    viewDetailsLink: {
        fontSize: ScaleFontSize(12),
        color: colors.primaryDark,
        fontWeight: '500',
        marginTop: verticalScale(6),
    },
    weekCardLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    weekCardWeightValue: {
        fontSize: ScaleFontSize(22),
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: verticalScale(4),
    },
    weightChangeRow: {
        alignItems: 'center',
        gap: horizontalScale(2),
        marginTop: verticalScale(4),
    },
    weightChangeText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.success,
    },
    weekCardToTarget: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    // Chart
    chartCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    chartHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    chartTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    periodChipsContainer: {
        gap: horizontalScale(8),
        marginBottom: verticalScale(16),
    },
    periodChip: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
    },
    periodChipActive: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: horizontalScale(16),
    },
    periodChipText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    periodChipTextActive: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    chartSvg: {
        alignSelf: 'center',
    },
    // Activity
    activityCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginTop: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
    activityItem: {
        gap: horizontalScale(12),
        paddingBottom: verticalScale(20),
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    timelineLine: {
        position: 'absolute',
        top: verticalScale(14),
        bottom: 0,
        width: 2,
        backgroundColor: colors.bgSecondary,
    },
    activityDot: {
        width: horizontalScale(12),
        height: horizontalScale(12),
        borderRadius: horizontalScale(6),
        marginTop: verticalScale(4),

    },
    activityContent: {
        flex: 1,
    },
    activityDate: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        marginBottom: verticalScale(2),
    },
    activityText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    activitySubtext: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: verticalScale(2),
    },
    loadMoreButton: {
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        marginTop: verticalScale(8),
    },
    loadMoreText: {
        fontSize: ScaleFontSize(14),
        color: colors.primaryDark,
        fontWeight: '500',
    },
    // Placeholder
    placeholderCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(24),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    placeholderTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    placeholderText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Loading State
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
    },
    loadingText: {
        marginTop: verticalScale(16),
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    // Error State
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        padding: horizontalScale(32),
    },
    errorEmoji: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    errorText: {
        fontSize: ScaleFontSize(18),
        color: colors.textPrimary,
        textAlign: 'center',
    },
    // Avatar Placeholder
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(44),
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: ScaleFontSize(32),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

