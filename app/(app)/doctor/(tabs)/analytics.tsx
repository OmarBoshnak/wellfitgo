import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
    TrendingUp,
    TrendingDown,
    Users,
    MessageSquare,
    Clock,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    BarChart3,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import {
    useDoctorAnalytics,
    formatLastCheckIn,
    calculateProgressPercentages,
    type TimeRange,
    type ClientStatus,
} from '@/src/features/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TRANSLATIONS ============
const t = {
    title: isRTL ? 'الإحصائيات' : 'Analytics',
    performanceOverview: isRTL ? 'نظرة عامة على الأداء' : 'Your performance overview',
    last7Days: isRTL ? 'آخر 7 أيام' : 'Last 7 days',
    last30Days: isRTL ? 'آخر 30 يوم' : 'Last 30 days',
    last3Months: isRTL ? 'آخر 3 أشهر' : 'Last 3 months',
    exportReport: isRTL ? 'تصدير التقرير' : 'Export Report',
    activeClients: isRTL ? 'العملاء النشطين' : 'Active Clients',
    avgProgress: isRTL ? 'متوسط تقدم العملاء' : 'Avg. Client Progress',
    checkInRate: isRTL ? 'معدل التسجيل' : 'Check-in Rate',
    responseTime: isRTL ? 'وقت الاستجابة' : 'Response Time',
    vsLastPeriod: isRTL ? 'مقارنة بالفترة السابقة' : 'vs last period',
    slower: isRTL ? 'أبطأ' : 'Slower',
    hours: isRTL ? 'ساعات' : 'hours',
    kgWeek: isRTL ? 'كجم/أسبوع' : 'kg/week',
    progressDistribution: isRTL ? 'توزيع تقدم العملاء' : 'Client Progress Distribution',
    clients: isRTL ? 'عملاء' : 'Clients',
    onTrack: isRTL ? 'على المسار' : 'On Track',
    needsSupport: isRTL ? 'يحتاج دعم' : 'Needs Support',
    atRisk: isRTL ? 'معرض للخطر' : 'At Risk',
    dailyActivity: isRTL ? 'النشاط اليومي' : 'Daily Activity',
    messages: isRTL ? 'الرسائل' : 'Messages',
    plans: isRTL ? 'الخطط' : 'Plans',
    checkIns: isRTL ? 'التسجيلات' : 'Check-ins',
    checkInStatus: isRTL ? 'حالة تسجيل العملاء' : 'Client Check-in Status',
    client: isRTL ? 'العميل' : 'Client',
    lastCheckIn: isRTL ? 'آخر تسجيل' : 'Last Check-in',
    status: isRTL ? 'الحالة' : 'Status',
    action: isRTL ? 'الإجراء' : 'Action',
    today: isRTL ? 'اليوم' : 'Today',
    dayAgo: isRTL ? 'منذ يوم' : '1 day ago',
    daysAgo: isRTL ? 'أيام مضت' : 'days ago',
    never: isRTL ? 'لم يسجل' : 'Never',
    onTime: isRTL ? 'في الوقت' : 'On time',
    overdue: isRTL ? 'متأخر' : 'Overdue',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    viewProfile: isRTL ? 'عرض الملف' : 'View Profile',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noClients: isRTL ? 'لا يوجد عملاء بعد' : 'No clients yet',
    noClientsDesc: isRTL
        ? 'ابدأ بإضافة عملاء لرؤية الإحصائيات'
        : 'Add clients to see analytics',
    noData: isRTL ? 'لا توجد بيانات' : 'No data',
};

// Day labels for chart (last 7 days dynamic)
const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const dayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabelsAr = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'];
    return isRTL ? dayLabelsAr[dayIndex] : dayLabelsEn[dayIndex];
};

// ============ MAIN COMPONENT ============
export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const [timeFilter, setTimeFilter] = useState<TimeRange>('7days');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Fetch analytics data from Convex
    const { data, isLoading, isEmpty } = useDoctorAnalytics(timeFilter);

    const timeFilters: { key: TimeRange; label: string }[] = [
        { key: '7days', label: t.last7Days },
        { key: '30days', label: t.last30Days },
        { key: '3months', label: t.last3Months },
    ];

    const currentFilterLabel = timeFilters.find(f => f.key === timeFilter)?.label || t.last7Days;

    // Calculate progress distribution with percentages
    const progressData = useMemo(() => {
        if (!data) return null;
        const buckets = calculateProgressPercentages(data.progressBuckets);
        return {
            onTrack: { percentage: buckets.onTrack.percentage, count: buckets.onTrack.count, color: '#10B981' },
            needsSupport: { percentage: buckets.needsSupport.percentage, count: buckets.needsSupport.count, color: '#F59E0B' },
            atRisk: { percentage: buckets.atRisk.percentage, count: buckets.atRisk.count, color: '#EF4444' },
            total: buckets.total,
        };
    }, [data]);

    // Chart calculations
    const chartSize = horizontalScale(160);
    const strokeWidth = horizontalScale(16);
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate bar chart max values
    const maxMessages = useMemo(() => {
        if (!data?.dailyActivity.length) return 1;
        return Math.max(...data.dailyActivity.map(d => d.messages), 1);
    }, [data]);

    const maxPlans = useMemo(() => {
        if (!data?.dailyActivity.length) return 1;
        return Math.max(...data.dailyActivity.map(d => d.plans), 1);
    }, [data]);

    const maxCheckIns = useMemo(() => {
        if (!data?.dailyActivity.length) return 1;
        return Math.max(...data.dailyActivity.map(d => d.checkIns), 1);
    }, [data]);

    // Calculate totals for daily activity
    const activityTotals = useMemo(() => {
        if (!data?.dailyActivity.length) return { messages: 0, plans: 0, checkIns: 0 };
        return data.dailyActivity.reduce(
            (acc, day) => ({
                messages: acc.messages + day.messages,
                plans: acc.plans + day.plans,
                checkIns: acc.checkIns + day.checkIns,
            }),
            { messages: 0, plans: 0, checkIns: 0 }
        );
    }, [data]);

    // Format check-in time helper
    const lastCheckInTranslations = {
        today: t.today,
        dayAgo: t.dayAgo,
        daysAgo: t.daysAgo,
        never: t.never,
    };

    // Map client status to display
    const getStatusDisplay = (status: ClientStatus): { emoji: string; style: object } => {
        switch (status) {
            case 'on_track':
                return { emoji: '✅', style: styles.statusOnTime };
            case 'needs_support':
                return { emoji: '⚠️', style: styles.statusOverdue };
            case 'at_risk':
                return { emoji: '🔴', style: styles.statusAtRisk };
        }
    };

    // ============ LOADING STATE ============
    if (isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <Text style={[styles.title, { textAlign: isRTL ? 'left' : 'right' }]}>{t.title}</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.success} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============ EMPTY STATE ============
    if (isEmpty || !data) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <Text style={[styles.title, { textAlign: isRTL ? 'left' : 'right' }]}>{t.title}</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <BarChart3 size={horizontalScale(64)} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>{t.noClients}</Text>
                    <Text style={styles.emptyDescription}>{t.noClientsDesc}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============ MAIN RENDER ============
    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[styles.headerTop, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.title, { textAlign: isRTL ? 'left' : 'left' }]}>{t.title}</Text>
                    </View>
                    <View style={[styles.headerActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        {/* Time Filter Dropdown */}
                        <TouchableOpacity
                            style={[styles.filterDropdown, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.filterDropdownText}>{currentFilterLabel}</Text>
                            <ChevronDown size={horizontalScale(16)} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Dropdown Menu */}
                {showFilterDropdown && (
                    <View style={styles.dropdownMenu}>
                        {timeFilters.map(filter => (
                            <TouchableOpacity
                                key={filter.key}
                                style={[
                                    styles.dropdownItem,
                                    timeFilter === filter.key && styles.dropdownItemActive,
                                ]}
                                onPress={() => {
                                    setTimeFilter(filter.key);
                                    setShowFilterDropdown(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.dropdownItemText,
                                    timeFilter === filter.key && styles.dropdownItemTextActive,
                                    { textAlign: isRTL ? 'right' : 'left' },
                                ]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Overview Stats */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<Users size={horizontalScale(22)} color="#10B981" />}
                        iconBg="#10B98120"
                        label={t.activeClients}
                        value={String(data.overview.activeClients)}
                        trend={null}
                        trendUp={true}
                    />
                    <StatCard
                        icon={<TrendingDown size={horizontalScale(22)} color="#3B82F6" />}
                        iconBg="#3B82F620"
                        label={t.avgProgress}
                        value={data.overview.avgProgress !== null
                            ? `${Math.abs(data.overview.avgProgress).toFixed(1)} ${t.kgWeek}`
                            : t.noData
                        }
                        trend={null}
                        trendUp={data.overview.avgProgress !== null && data.overview.avgProgress < 0}
                    />
                    <StatCard
                        icon={<MessageSquare size={horizontalScale(22)} color="#8B5CF6" />}
                        iconBg="#8B5CF620"
                        label={t.checkInRate}
                        value={`${data.overview.checkInRate}%`}
                        trend={null}
                        trendUp={data.overview.checkInRate >= 80}
                    />
                    <StatCard
                        icon={<Clock size={horizontalScale(22)} color="#F59E0B" />}
                        iconBg="#F59E0B20"
                        label={t.responseTime}
                        value={data.overview.responseTime !== null
                            ? `${data.overview.responseTime.toFixed(1)} ${t.hours}`
                            : t.noData
                        }
                        trend={null}
                        trendUp={false}
                    />
                </View>

                {/* Progress Distribution */}
                {progressData && progressData.total > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={[styles.cardTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.progressDistribution}
                        </Text>

                        <View style={styles.donutContainer}>
                            <View style={styles.donutChart}>
                                <Svg width={chartSize} height={chartSize}>
                                    {/* On Track */}
                                    <Circle
                                        cx={chartSize / 2}
                                        cy={chartSize / 2}
                                        r={radius}
                                        fill="transparent"
                                        stroke={progressData.onTrack.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${(progressData.onTrack.percentage / 100) * circumference} ${circumference}`}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}
                                    />
                                    {/* Needs Support */}
                                    <Circle
                                        cx={chartSize / 2}
                                        cy={chartSize / 2}
                                        r={radius}
                                        fill="transparent"
                                        stroke={progressData.needsSupport.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${(progressData.needsSupport.percentage / 100) * circumference} ${circumference}`}
                                        strokeDashoffset={-(progressData.onTrack.percentage / 100) * circumference}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}
                                    />
                                    {/* At Risk */}
                                    <Circle
                                        cx={chartSize / 2}
                                        cy={chartSize / 2}
                                        r={radius}
                                        fill="transparent"
                                        stroke={progressData.atRisk.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${(progressData.atRisk.percentage / 100) * circumference} ${circumference}`}
                                        strokeDashoffset={-((progressData.onTrack.percentage + progressData.needsSupport.percentage) / 100) * circumference}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}
                                    />
                                </Svg>
                                <View style={styles.donutCenter}>
                                    <Text style={styles.donutCenterValue}>{progressData.total}</Text>
                                    <Text style={styles.donutCenterLabel}>{t.clients}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Legend */}
                        <View style={styles.legendContainer}>
                            <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <View style={[styles.legendDot, { backgroundColor: progressData.onTrack.color }]} />
                                    <Text style={styles.legendText}>{t.onTrack}</Text>
                                </View>
                                <Text style={styles.legendValue}>{progressData.onTrack.percentage}% ({progressData.onTrack.count})</Text>
                            </View>
                            <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <View style={[styles.legendDot, { backgroundColor: progressData.needsSupport.color }]} />
                                    <Text style={styles.legendText}>{t.needsSupport}</Text>
                                </View>
                                <Text style={styles.legendValue}>{progressData.needsSupport.percentage}% ({progressData.needsSupport.count})</Text>
                            </View>
                            <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <View style={[styles.legendDot, { backgroundColor: progressData.atRisk.color }]} />
                                    <Text style={styles.legendText}>{t.atRisk}</Text>
                                </View>
                                <Text style={styles.legendValue}>{progressData.atRisk.percentage}% ({progressData.atRisk.count})</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Daily Activity Chart */}
                {data.dailyActivity.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={[styles.cardTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.dailyActivity}
                        </Text>

                        <View style={[styles.barChartContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            {data.dailyActivity.map((day, index) => (
                                <View key={day.date} style={styles.barColumn}>
                                    <View style={styles.barsWrapper}>
                                        <View
                                            style={[
                                                styles.bar,
                                                styles.barMessages,
                                                { height: `${(day.messages / maxMessages) * 60}%` },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.bar,
                                                styles.barPlans,
                                                { height: `${(day.plans / Math.max(maxPlans, 1)) * 50}%` },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.bar,
                                                styles.barCheckIns,
                                                { height: `${(day.checkIns / Math.max(maxCheckIns, 1)) * 50}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.barLabel}>{getDayLabel(day.date)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Activity Totals */}
                        <View style={[styles.activityTotals, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.activityDot, { backgroundColor: '#3B82F6' }]} />
                                <View>
                                    <Text style={styles.activityTotalLabel}>{t.messages}</Text>
                                    <Text style={styles.activityTotalValue}>{activityTotals.messages}</Text>
                                </View>
                            </View>
                            <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
                                <View>
                                    <Text style={styles.activityTotalLabel}>{t.plans}</Text>
                                    <Text style={styles.activityTotalValue}>{activityTotals.plans}</Text>
                                </View>
                            </View>
                            <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.activityDot, { backgroundColor: '#F59E0B' }]} />
                                <View>
                                    <Text style={styles.activityTotalLabel}>{t.checkIns}</Text>
                                    <Text style={styles.activityTotalValue}>{activityTotals.checkIns}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Check-in Status Table */}
                {data.clients.length > 0 && (
                    <View style={styles.tableCard}>
                        <Text style={[styles.cardTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                            {t.checkInStatus}
                        </Text>

                        {/* Table Header */}
                        <View style={[styles.tableHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.client}
                            </Text>
                            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.lastCheckIn}
                            </Text>
                            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.status}
                            </Text>
                            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.action}
                            </Text>
                        </View>

                        {/* Table Rows */}
                        {data.clients.map((client) => {
                            const statusDisplay = getStatusDisplay(client.status);
                            const lastCheckInText = formatLastCheckIn(client.lastCheckIn, lastCheckInTranslations);

                            return (
                                <View
                                    key={client.id}
                                    style={[styles.tableRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                >
                                    <Text
                                        style={[styles.tableText, { flex: 2, textAlign: isRTL ? 'left' : 'right' }]}
                                        numberOfLines={1}
                                    >
                                        {client.name}
                                    </Text>
                                    <Text
                                        style={[styles.tableTextSecondary, { flex: 1.5, textAlign: isRTL ? 'left' : 'right' }]}
                                    >
                                        {lastCheckInText}
                                    </Text>
                                    <View style={{ flex: 1 }}>
                                        <View style={[styles.statusBadge, statusDisplay.style]}>
                                            <Text style={styles.statusEmoji}>{statusDisplay.emoji}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.actionContainer, { flex: 1.5, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                        {client.status !== 'on_track' && (
                                            <TouchableOpacity activeOpacity={0.7}>
                                                <Text style={styles.actionText}>{t.sendReminder}</Text>
                                            </TouchableOpacity>
                                        )}
                                        {client.status === 'at_risk' && (
                                            <TouchableOpacity style={{ marginHorizontal: horizontalScale(4) }} activeOpacity={0.7}>
                                                <Text style={styles.actionTextGreen}>{t.viewProfile}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={{ height: verticalScale(32) }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ============ STAT CARD COMPONENT ============
interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    trend: string | null;
    trendUp: boolean;
}

function StatCard({ icon, iconBg, label, value, trend, trendUp }: StatCardProps) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                {icon}
            </View>
            <Text style={[styles.statLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{label}</Text>
            <Text style={[styles.statValue, { textAlign: isRTL ? 'left' : 'right' }]}>{value}</Text>
            {trend && (
                <View style={[styles.trendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {trendUp ? (
                        <TrendingUp size={horizontalScale(12)} color={colors.success} />
                    ) : (
                        <TrendingDown size={horizontalScale(12)} color={colors.error} />
                    )}
                    <Text style={[styles.trendText, { color: trendUp ? colors.success : colors.error }]}>
                        {trend}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerActions: {
        gap: horizontalScale(8),
    },
    filterDropdown: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        gap: horizontalScale(4),
        minHeight: verticalScale(44),
        justifyContent: 'center',
    },
    filterDropdownText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
    },
    dropdownMenu: {
        position: 'absolute',
        top: verticalScale(80),
        right: horizontalScale(16),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(4) },
        shadowOpacity: 0.1,
        shadowRadius: horizontalScale(8),
        elevation: 4,
        zIndex: 100,
        minWidth: horizontalScale(120),
    },
    dropdownItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        minHeight: verticalScale(44),
        justifyContent: 'center',
    },
    dropdownItemActive: {
        backgroundColor: colors.success + '10',
    },
    dropdownItemText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    dropdownItemTextActive: {
        color: colors.success,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(32),
    },
    // Loading & Empty States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(32),
        gap: verticalScale(12),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: verticalScale(8),
    },
    emptyDescription: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: verticalScale(16),
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(14),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    statIcon: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(10),
    },
    statLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginBottom: verticalScale(4),
    },
    statValue: {
        fontSize: ScaleFontSize(22),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(6),
    },
    trendRow: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    trendText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
    },
    // Chart Card
    chartCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    cardTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
        paddingHorizontal: horizontalScale(16),
    },
    // Donut Chart
    donutContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    donutChart: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutCenterValue: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    donutCenterLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    // Legend
    legendContainer: {
        gap: verticalScale(8),
    },
    legendItem: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    legendRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    legendDot: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
    },
    legendText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    legendValue: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Bar Chart
    barChartContainer: {
        height: verticalScale(160),
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: verticalScale(16),
        paddingTop: verticalScale(20),
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
    },
    barsWrapper: {
        flex: 1,
        width: '80%',
        justifyContent: 'flex-end',
        gap: verticalScale(2),
        paddingTop: verticalScale(15),
    },
    bar: {
        width: '100%',
        borderRadius: horizontalScale(3),
    },
    barMessages: {
        backgroundColor: '#3B82F6',
    },
    barPlans: {
        backgroundColor: '#10B981',
    },
    barCheckIns: {
        backgroundColor: '#F59E0B',
    },
    barLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(6),
    },
    // Activity Totals
    activityTotals: {
        justifyContent: 'space-around',
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    activityTotal: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    activityDot: {
        width: horizontalScale(10),
        height: horizontalScale(4),
        borderRadius: horizontalScale(5),
    },
    activityTotalLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    activityTotalValue: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    // Table
    tableCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        paddingVertical: verticalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
        overflow: 'hidden',
    },
    tableHeader: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    tableHeaderText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tableRow: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        alignItems: 'center',
        minHeight: verticalScale(44),
    },
    tableText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
        fontWeight: '500',
    },
    tableTextSecondary: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(12),
        alignSelf: 'flex-start',
    },
    statusOnTime: {
        backgroundColor: '#10B98120',
    },
    statusOverdue: {
        backgroundColor: '#F59E0B20',
    },
    statusAtRisk: {
        backgroundColor: '#EF444420',
    },
    statusEmoji: {
        fontSize: ScaleFontSize(12),
    },
    actionContainer: {
        flexWrap: 'wrap',
        gap: horizontalScale(4),
    },
    actionText: {
        fontSize: ScaleFontSize(12),
        color: '#3B82F6',
        fontWeight: '500',
        paddingVertical: verticalScale(4),
    },
    actionTextGreen: {
        fontSize: ScaleFontSize(12),
        color: '#10B981',
        fontWeight: '500',
        paddingVertical: verticalScale(4),
    },
});
