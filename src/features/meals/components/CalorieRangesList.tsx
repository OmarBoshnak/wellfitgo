import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Search, Users } from 'lucide-react-native';
import { colors, gradients } from '@/src/constants/Themes';
import { isRTL } from '@/src/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

const t = {
    diets: isRTL ? 'الأنظمة الغذائية' : 'Diets',
    chooseCalorie: isRTL ? 'اختر نطاق السعرات لعميلك' : 'Choose calorie range for your client',
    caloriesDay: isRTL ? 'سعرات/يوم' : 'Calories/day',
    meals: isRTL ? 'وجبات' : 'meals',
    options: isRTL ? 'خيارات' : 'options',
    egyptianOptions: isRTL ? 'خيارات مصرية' : 'Egyptian options',
    usedWith: isRTL ? 'مستخدم مع' : 'Used with',
    clients: isRTL ? 'عملاء' : 'clients',
    assignToClient: isRTL ? 'تعيين للعميل' : 'Assign to Client',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    edit: isRTL ? 'تعديل' : 'Edit',
};

interface CalorieRange {
    id: string;
    range: string;
    description: string;
    meals: number;
    options: number;
    clients: number;
}

const CALORIE_RANGES: CalorieRange[] = [
    { id: '1', range: '1100-1200', description: isRTL ? 'فقدان وزن سريع' : 'Aggressive weight loss', meals: 5, options: 48, clients: 12 },
    { id: '2', range: '1200-1300', description: isRTL ? 'فقدان وزن معتدل' : 'Steady weight loss', meals: 5, options: 46, clients: 8 },
    { id: '3', range: '1300-1400', description: isRTL ? 'فقدان وزن معتدل' : 'Moderate weight loss', meals: 5, options: 50, clients: 15 },
    { id: '4', range: '1400-1500', description: isRTL ? 'فقدان وزن متوازن' : 'Balanced weight loss', meals: 5, options: 52, clients: 9 },
    { id: '5', range: '1500-1600', description: isRTL ? 'فقدان وزن بطيء' : 'Slow weight loss', meals: 5, options: 54, clients: 20 },
    { id: '6', range: '1600-1700', description: isRTL ? 'الحفاظ على الوزن (منخفض)' : 'Weight maintenance (low)', meals: 5, options: 48, clients: 14 },
    { id: '7', range: '1700-1800', description: isRTL ? 'الحفاظ على الوزن' : 'Weight maintenance', meals: 5, options: 52, clients: 22 },
    { id: '8', range: '1800-1900', description: isRTL ? 'الحفاظ على الوزن (نشط)' : 'Weight maintenance (active)', meals: 5, options: 50, clients: 16 },
    { id: '9', range: '1900-2000', description: isRTL ? 'زيادة معتدلة' : 'Moderate bulk', meals: 6, options: 55, clients: 7 },
    { id: '10', range: '2000-2100', description: isRTL ? 'بناء العضلات' : 'Muscle Gain', meals: 6, options: 52, clients: 10 },
];

interface Props {
    category: {
        id: string;
        name: string;
        nameAr: string;
        emoji?: string;
        description?: string;
    };
    onBack: () => void;
    onAssign: (diet: CalorieRange) => void;
    onView: (diet: CalorieRange) => void;
    onEdit: (diet: CalorieRange) => void;
}

export default function CalorieRangesList({ category, onBack, onAssign, onView, onEdit }: Props) {
    const BackArrow = () => isRTL
        ? <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />;

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackArrow />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        {category?.name} {t.diets}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {category?.nameAr}
                    </Text>
                </View>
                <TouchableOpacity style={styles.searchButton}>
                    <Search size={horizontalScale(24)} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderBanner = () => (
        <View style={[styles.banner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.bannerEmoji}>{category?.emoji || '🥗'}</Text>
            <Text style={[styles.bannerText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {category?.description || 'Balanced nutrition with Egyptian food options'}
            </Text>
        </View>
    );

    const renderCalorieCard = (diet: CalorieRange) => (
        <View key={diet.id} style={styles.dietCard}>
            {/* Calories Header */}
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.calorieLabel}>{t.caloriesDay}</Text>
                <View style={[styles.calorieRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.fireEmoji}>🔥</Text>
                    <Text style={styles.calorieText}>{diet.range}</Text>
                </View>
            </View>

            {/* Description & Meta */}
            <View style={styles.dietInfo}>
                <Text style={[styles.dietDescription, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {diet.description}
                </Text>
                <Text style={[styles.dietMeta, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {diet.meals} {t.meals} • {t.egyptianOptions} • {diet.options} {t.options}
                </Text>
            </View>

            {/* Usage Stats */}
            <View style={[styles.usageRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Users size={horizontalScale(14)} color={colors.textSecondary} />
                <Text style={styles.usageText}>
                    {t.usedWith} {diet.clients} {t.clients}
                </Text>
            </View>

            {/* Action Buttons */}
            <View style={[styles.buttonRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                    style={styles.assignButtonWrapper}
                    onPress={() => onAssign(diet)}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.assignButton}
                    >
                        <Text style={styles.assignButtonText}>{t.assignToClient}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => onView(diet)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.viewButtonText}>{t.viewDetails}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEdit(diet)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.editButtonText}>{t.edit}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderBanner()}

            {/* Section Title */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t.chooseCalorie}
            </Text>

            {/* Diet Cards */}
            <View style={styles.cardsList}>
                {CALORIE_RANGES.map(renderCalorieCard)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    header: {
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: verticalScale(12),
        marginBottom: verticalScale(16),
        marginHorizontal: horizontalScale(-16),
        paddingHorizontal: horizontalScale(16),
    },
    headerRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    searchButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Banner
    banner: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        alignItems: 'center',
        gap: horizontalScale(16),
        marginBottom: verticalScale(20),
        borderWidth: 1,
        borderColor: colors.border,
    },
    bannerEmoji: {
        fontSize: ScaleFontSize(32),
    },
    bannerText: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        lineHeight: ScaleFontSize(20),
    },
    // Section Title
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
    // Cards List
    cardsList: {
        gap: verticalScale(12),
    },
    // Diet Card
    dietCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: colors.border,
        gap: verticalScale(12),
    },
    calorieLabel: {
        fontSize: ScaleFontSize(11),
        color: '#AAB8C5',
        marginBottom: verticalScale(2),
    },
    calorieRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    fireEmoji: {
        fontSize: ScaleFontSize(20),
    },
    calorieText: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    dietInfo: {
        gap: verticalScale(4),
    },
    dietDescription: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    dietMeta: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    usageRow: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    usageText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    // Buttons
    buttonRow: {
        gap: horizontalScale(8),
        marginTop: verticalScale(4),
    },
    assignButtonWrapper: {
        flex: 1,
        borderRadius: horizontalScale(8),
        overflow: 'hidden',
    },
    assignButton: {
        height: verticalScale(36),
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignButtonText: {
        fontSize: ScaleFontSize(14),
        color: '#FFFFFF',
        fontWeight: '500',
    },
    viewButton: {
        flex: 0.7,
        height: verticalScale(36),
        borderWidth: 1,
        borderColor: colors.primaryDark,
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewButtonText: {
        fontSize: ScaleFontSize(14),
        color: colors.primaryDark,
        fontWeight: '500',
    },
    editButton: {
        flex: 0.5,
        height: verticalScale(36),
        borderWidth: 1,
        borderColor: colors.textSecondary,
        borderRadius: horizontalScale(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        fontWeight: '500',
    },
});
