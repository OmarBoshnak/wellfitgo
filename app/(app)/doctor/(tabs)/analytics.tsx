import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
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
} from 'lucide-react-native';
import { colors } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Translations
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
    weeklyWeightChanges: isRTL ? 'تغييرات الوزن الأسبوعية' : 'Weekly Weight Changes',
    kg: isRTL ? 'كجم' : 'kg',
    checkInStatus: isRTL ? 'حالة تسجيل العملاء' : 'Client Check-in Status',
    client: isRTL ? 'العميل' : 'Client',
    lastCheckIn: isRTL ? 'آخر تسجيل' : 'Last Check-in',
    status: isRTL ? 'الحالة' : 'Status',
    action: isRTL ? 'الإجراء' : 'Action',
    today: isRTL ? 'اليوم' : 'Today',
    dayAgo: isRTL ? 'منذ يوم' : '1 day ago',
    daysAgo: isRTL ? 'أيام مضت' : 'days ago',
    onTime: isRTL ? 'في الوقت' : 'On time',
    overdue: isRTL ? 'متأخر' : 'Overdue',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    viewProfile: isRTL ? 'عرض الملف' : 'View Profile',
};

// Days for chart
const dayLabels = isRTL
    ? ['إث', 'ث', 'أر', 'خ', 'ج', 'س', 'أح']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type TimeFilterType = '7days' | '30days' | '3months';

// Weekly Activity Data
const weeklyActivity = [
    { day: 'Mon', messages: 12, plans: 2, checkIns: 5 },
    { day: 'Tue', messages: 15, plans: 1, checkIns: 7 },
    { day: 'Wed', messages: 8, plans: 3, checkIns: 4 },
    { day: 'Thu', messages: 18, plans: 2, checkIns: 6 },
    { day: 'Fri', messages: 14, plans: 1, checkIns: 8 },
    { day: 'Sat', messages: 6, plans: 0, checkIns: 3 },
    { day: 'Sun', messages: 4, plans: 0, checkIns: 2 },
];

// Client Progress Data
const clientProgress = [
    { name: isRTL ? 'أحمد' : 'Ahmed', change: -0.9 },
    { name: isRTL ? 'سارة' : 'Sara', change: -1.2 },
    { name: isRTL ? 'كريم' : 'Karim', change: 0.5 },
    { name: isRTL ? 'ليلى' : 'Layla', change: -0.3 },
    { name: isRTL ? 'محمد' : 'Mohamed', change: -1.1 },
    { name: isRTL ? 'فاطمة' : 'Fatma', change: -0.8 },
    { name: isRTL ? 'علي' : 'Ali', change: -1.5 },
    { name: isRTL ? 'نور' : 'Nour', change: -0.6 },
];

// Check-in Status Data
const checkInStatus = [
    { client: isRTL ? 'أحمد حسن' : 'Ahmed Hassan', lastCheckIn: t.today, status: 'on-time' as const },
    { client: isRTL ? 'سارة محمد' : 'Sara Mohamed', lastCheckIn: t.dayAgo, status: 'on-time' as const },
    { client: isRTL ? 'ليلى أحمد' : 'Layla Ahmed', lastCheckIn: `5 ${t.daysAgo}`, status: 'overdue' as const },
    { client: isRTL ? 'محمد علي' : 'Mohamed Ali', lastCheckIn: t.today, status: 'on-time' as const },
    { client: isRTL ? 'كريم علي' : 'Karim Ali', lastCheckIn: `10 ${t.daysAgo}`, status: 'at-risk' as const },
];

const maxMessages = Math.max(...weeklyActivity.map(d => d.messages));
const maxChange = Math.max(...clientProgress.map(c => Math.abs(c.change)));

export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const [timeFilter, setTimeFilter] = useState<TimeFilterType>('7days');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const timeFilters: { key: TimeFilterType; label: string }[] = [
        { key: '7days', label: t.last7Days },
        { key: '30days', label: t.last30Days },
        { key: '3months', label: t.last3Months },
    ];

    const currentFilterLabel = timeFilters.find(f => f.key === timeFilter)?.label || t.last7Days;

    // Progress distribution data
    const progressData = {
        onTrack: { percentage: 60, count: 23, color: '#10B981' },
        needsSupport: { percentage: 25, count: 10, color: '#F59E0B' },
        atRisk: { percentage: 15, count: 5, color: '#EF4444' },
    };

    const totalClients = 38;
    const chartSize = horizontalScale(160);
    const strokeWidth = horizontalScale(16);
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const DirectionalChevron = () => isRTL
        ? <ChevronLeft size={horizontalScale(18)} color={colors.success} />
        : <ChevronRight size={horizontalScale(18)} color={colors.success} />;

    // Calculate total activity
    const totalMessages = weeklyActivity.reduce((sum, d) => sum + d.messages, 0);
    const totalPlans = weeklyActivity.reduce((sum, d) => sum + d.plans, 0);
    const totalCheckIns = weeklyActivity.reduce((sum, d) => sum + d.checkIns, 0);

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : verticalScale(16) }]}>
                <View style={[styles.headerTop, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t.title}</Text>
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
                        value="38"
                        trend={`+3 ${t.vsLastPeriod}`}
                        trendUp={true}
                    />
                    <StatCard
                        icon={<TrendingDown size={horizontalScale(22)} color="#3B82F6" />}
                        iconBg="#3B82F620"
                        label={t.avgProgress}
                        value={`0.9 ${t.kgWeek}`}
                        trend="+12%"
                        trendUp={true}
                    />
                    <StatCard
                        icon={<MessageSquare size={horizontalScale(22)} color="#8B5CF6" />}
                        iconBg="#8B5CF620"
                        label={t.checkInRate}
                        value="85%"
                        trend="-2%"
                        trendUp={false}
                    />
                    <StatCard
                        icon={<Clock size={horizontalScale(22)} color="#F59E0B" />}
                        iconBg="#F59E0B20"
                        label={t.responseTime}
                        value={`2.3 ${t.hours}`}
                        trend={t.slower}
                        trendUp={false}
                    />
                </View>

                {/* Progress Distribution */}
                <View style={styles.chartCard}>
                    <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.progressDistribution}
                    </Text>

                    <View style={styles.donutContainer}>
                        <View style={styles.donutChart}>
                            <Svg width={chartSize} height={chartSize}>
                                {/* On Track - 60% */}
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
                                {/* Needs Support - 25% */}
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
                                {/* At Risk - 15% */}
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
                                <Text style={styles.donutCenterValue}>{totalClients}</Text>
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

                {/* Daily Activity Chart */}
                <View style={styles.chartCard}>
                    <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.dailyActivity}
                    </Text>

                    <View style={[styles.barChartContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {weeklyActivity.map((day, index) => (
                            <View key={index} style={styles.barColumn}>
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
                                            { height: `${(day.plans / 3) * 50}%` },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barCheckIns,
                                            { height: `${(day.checkIns / 8) * 50}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{dayLabels[index]}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Activity Totals */}
                    <View style={[styles.activityTotals, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={[styles.activityDot, { backgroundColor: '#3B82F6' }]} />
                            <View>
                                <Text style={styles.activityTotalLabel}>{t.messages}</Text>
                                <Text style={styles.activityTotalValue}>{totalMessages}</Text>
                            </View>
                        </View>
                        <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
                            <View>
                                <Text style={styles.activityTotalLabel}>{t.plans}</Text>
                                <Text style={styles.activityTotalValue}>{totalPlans}</Text>
                            </View>
                        </View>
                        <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={[styles.activityDot, { backgroundColor: '#F59E0B' }]} />
                            <View>
                                <Text style={styles.activityTotalLabel}>{t.checkIns}</Text>
                                <Text style={styles.activityTotalValue}>{totalCheckIns}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Weekly Weight Changes */}
                <View style={styles.chartCard}>
                    <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.weeklyWeightChanges}
                    </Text>

                    {clientProgress.map((client, index) => (
                        <View key={index} style={[styles.weightRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.weightName, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {client.name}
                            </Text>
                            <View style={styles.weightBarContainer}>
                                <View style={styles.weightBarBg}>
                                    <View
                                        style={[
                                            styles.weightBar,
                                            {
                                                width: `${(Math.abs(client.change) / maxChange) * 50}%`,
                                                backgroundColor: client.change < 0 ? '#10B981' : '#EF4444',
                                                alignSelf: client.change < 0 ? 'flex-end' : 'flex-start',
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text
                                style={[
                                    styles.weightValue,
                                    { color: client.change < 0 ? '#10B981' : '#EF4444' },
                                ]}
                            >
                                {client.change > 0 ? '+' : ''}{client.change} {t.kg}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Check-in Status Table */}
                <View style={styles.tableCard}>
                    <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.checkInStatus}
                    </Text>

                    {/* Table Header */}
                    <View style={[styles.tableHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.tableHeaderText, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>
                            {t.client}
                        </Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: isRTL ? 'right' : 'left' }]}>
                            {t.lastCheckIn}
                        </Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                            {t.status}
                        </Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: isRTL ? 'right' : 'left' }]}>
                            {t.action}
                        </Text>
                    </View>

                    {/* Table Rows */}
                    {checkInStatus.map((item, index) => (
                        <View
                            key={index}
                            style={[styles.tableRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        >
                            <Text
                                style={[styles.tableText, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}
                                numberOfLines={1}
                            >
                                {item.client}
                            </Text>
                            <Text
                                style={[styles.tableTextSecondary, { flex: 1.5, textAlign: isRTL ? 'right' : 'left' }]}
                            >
                                {item.lastCheckIn}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        item.status === 'on-time' && styles.statusOnTime,
                                        item.status === 'overdue' && styles.statusOverdue,
                                        item.status === 'at-risk' && styles.statusAtRisk,
                                    ]}
                                >
                                    <Text style={styles.statusEmoji}>
                                        {item.status === 'on-time' && '✅'}
                                        {item.status === 'overdue' && '⚠️'}
                                        {item.status === 'at-risk' && '🔴'}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.actionContainer, { flex: 1.5, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                {item.status !== 'on-time' && (
                                    <TouchableOpacity activeOpacity={0.7}>
                                        <Text style={styles.actionText}>{t.sendReminder}</Text>
                                    </TouchableOpacity>
                                )}
                                {item.status === 'at-risk' && (
                                    <TouchableOpacity style={{ marginHorizontal: horizontalScale(4) }} activeOpacity={0.7}>
                                        <Text style={styles.actionTextGreen}>{t.viewProfile}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: verticalScale(32) }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Stat Card Component
interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    trend: string;
    trendUp: boolean;
}

function StatCard({ icon, iconBg, label, value, trend, trendUp }: StatCardProps) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                {icon}
            </View>
            <Text style={[styles.statLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
            <Text style={[styles.statValue, { textAlign: isRTL ? 'right' : 'left' }]}>{value}</Text>
            <View style={[styles.trendRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {trendUp ? (
                    <TrendingUp size={horizontalScale(12)} color={colors.success} />
                ) : (
                    <TrendingDown size={horizontalScale(12)} color={colors.error} />
                )}
                <Text style={[styles.trendText, { color: trendUp ? colors.success : colors.error }]}>
                    {trend}
                </Text>
            </View>
        </View>
    );
}

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
        alignItems: 'flex-start',
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
    headerActions: {
        gap: horizontalScale(8),
    },
    filterDropdown: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8), // Increased for touch area
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        gap: horizontalScale(4),
        minHeight: verticalScale(44), // Ensure min height for touch target
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
        shadowOffset: { width: 0, height: verticalScale(4) }, // Scaled
        shadowOpacity: 0.1,
        shadowRadius: horizontalScale(8), // Scaled
        elevation: 4,
        zIndex: 100,
        minWidth: horizontalScale(120),
    },
    dropdownItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        minHeight: verticalScale(44), // Ensure min height
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
        shadowOffset: { width: 0, height: verticalScale(2) }, // Scaled
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8), // Scaled
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
    chartCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) }, // Scaled
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8), // Scaled
        elevation: 2,
    },
    cardTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
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
    weightRow: {
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    weightName: {
        width: horizontalScale(70),
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
    },
    weightBarContainer: {
        flex: 1,
        paddingHorizontal: horizontalScale(8),
    },
    weightBarBg: {
        height: verticalScale(24),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(4),
        overflow: 'hidden',
    },
    weightBar: {
        height: '100%',
        borderRadius: horizontalScale(4),
    },
    weightValue: {
        width: horizontalScale(60),
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
        textAlign: 'right',
    },
    tableCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        paddingVertical: verticalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) }, // Scaled
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8), // Scaled
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
        minHeight: verticalScale(44), // Touch target
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
        paddingVertical: verticalScale(4), // Touch area
    },
    actionTextGreen: {
        fontSize: ScaleFontSize(12),
        color: '#10B981',
        fontWeight: '500',
        paddingVertical: verticalScale(4), // Touch area
    },
});
