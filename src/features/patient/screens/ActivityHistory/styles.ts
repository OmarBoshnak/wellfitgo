import { StyleSheet } from 'react-native';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },

    // Header
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgSecondary,
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: horizontalScale(40),
    },

    // Timeline Container
    timelineContainer: {
        flex: 1,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
    },

    // Timeline Item
    timelineItem: {
        flexDirection: 'row',
        marginBottom: verticalScale(0),
    },

    // Timeline Line & Dot Container
    timelineLineContainer: {
        width: horizontalScale(24),
        alignItems: 'center',
    },
    timelineLineTop: {
        width: 2,
        height: verticalScale(6),
        backgroundColor: colors.border,
    },
    timelineLineTopFirst: {
        backgroundColor: 'transparent',
    },
    timelineDot: {
        width: horizontalScale(12),
        height: horizontalScale(12),
        borderRadius: horizontalScale(6),
        borderWidth: 3,
        borderColor: colors.bgPrimary,
        zIndex: 1,
    },
    timelineLineBottom: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        minHeight: verticalScale(60),
    },
    timelineLineBottomLast: {
        backgroundColor: 'transparent',
    },

    // Content Card
    contentCard: {
        flex: 1,
        paddingBottom: verticalScale(20),
        paddingTop: verticalScale(0),
        marginLeft: horizontalScale(12),
    },
    contentCardRTL: {
        marginLeft: 0,
        marginRight: horizontalScale(12),
    },

    // Header Row (title + time)
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    contentTitle: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
    },
    contentTime: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginLeft: horizontalScale(8),
    },
    contentTimeRTL: {
        marginLeft: 0,
        marginRight: horizontalScale(8),
    },

    // Description
    contentDescription: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
        lineHeight: ScaleFontSize(20),
    },

    // Footer Row (date + actor)
    contentFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: verticalScale(8),
    },
    contentDate: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    footerDot: {
        width: horizontalScale(4),
        height: horizontalScale(4),
        borderRadius: horizontalScale(2),
        backgroundColor: colors.border,
        marginHorizontal: horizontalScale(8),
    },
    contentActor: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyIcon: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: verticalScale(12),
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },

    // List
    listContent: {
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(32),
    },
});
