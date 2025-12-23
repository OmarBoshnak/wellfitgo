import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
    FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/utils/scaling';

// Arabic translations
const t = {
    selectMealPlan: 'اختر الخطة الغذائية',
    cancel: 'إلغاء',
    weightLoss: 'فقدان الوزن',
    maintenance: 'المحافظة',
    muscleGain: 'بناء العضلات',
};

// Mock meal plans
export interface MealPlan {
    id: string;
    nameAr: string;
    nameEn: string;
    type: 'weightLoss' | 'maintenance' | 'muscleGain';
    calories: string;
}

const MOCK_MEAL_PLANS: MealPlan[] = [
    { id: '1', nameAr: 'خطة 1200-1300 سعرة', nameEn: 'Classic 1200-1300', type: 'weightLoss', calories: '1200-1300' },
    { id: '2', nameAr: 'خطة 1400-1500 سعرة', nameEn: 'Balanced 1400-1500', type: 'weightLoss', calories: '1400-1500' },
    { id: '3', nameAr: 'خطة 1600-1800 سعرة', nameEn: 'Active 1600-1800', type: 'maintenance', calories: '1600-1800' },
    { id: '4', nameAr: 'خطة 2000-2200 سعرة', nameEn: 'Performance 2000-2200', type: 'muscleGain', calories: '2000-2200' },
    { id: '5', nameAr: 'خطة البروتين العالي', nameEn: 'High Protein Plan', type: 'muscleGain', calories: '1800-2000' },
    { id: '6', nameAr: 'خطة الكيتو', nameEn: 'Keto Plan', type: 'weightLoss', calories: '1400-1600' },
];

const getTypeLabel = (type: MealPlan['type']): string => {
    switch (type) {
        case 'weightLoss': return t.weightLoss;
        case 'maintenance': return t.maintenance;
        case 'muscleGain': return t.muscleGain;
    }
};

const getTypeColor = (type: MealPlan['type']): string => {
    switch (type) {
        case 'weightLoss': return '#10B981';
        case 'maintenance': return '#3B82F6';
        case 'muscleGain': return '#F59E0B';
    }
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (plan: MealPlan) => void;
}

export default function MealPlanSelectorSheet({ visible, onClose, onSelect }: Props) {
    const insets = useSafeAreaInsets();

    const handleSelect = (plan: MealPlan) => {
        onSelect(plan);
        onClose();
    };

    const renderItem = ({ item }: { item: MealPlan }) => (
        <TouchableOpacity
            style={styles.planItem}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.planIcon}>
                <MaterialIcons name="restaurant-menu" size={24} color="#EA5757" />
            </View>
            <View style={styles.planContent}>
                <Text style={styles.planName}>{item.nameAr}</Text>
                <View style={styles.planMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
                        <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
                            {getTypeLabel(item.type)}
                        </Text>
                    </View>
                    <Text style={styles.caloriesText}>{item.calories} سعرة</Text>
                </View>
            </View>
            <MaterialIcons name="chevron-left" size={24} color="#D1D5DB" />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View />
            </Pressable>

            {/* Sheet */}
            <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
                {/* Drag Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Title */}
                <Text style={styles.title}>{t.selectMealPlan}</Text>

                {/* Meal Plans List */}
                <FlatList
                    data={MOCK_MEAL_PLANS}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                {/* Cancel Button */}
                <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
                    <Text style={styles.cancelText}>{t.cancel}</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '80%',
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: horizontalScale(32),
        borderTopRightRadius: horizontalScale(32),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(8),
    },
    handle: {
        width: horizontalScale(48),
        height: verticalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: colors.border,
    },
    title: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: verticalScale(16),
    },
    list: {
        maxHeight: verticalScale(350),
    },
    listContent: {
        paddingHorizontal: horizontalScale(16),
        gap: verticalScale(8),
    },
    planItem: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(12),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(16),
        gap: horizontalScale(12),
    },
    planIcon: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(12),
        backgroundColor: 'rgba(234, 87, 87, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    planContent: {
        flex: 1,
        alignItems: 'flex-end', // RTL
    },
    planName: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'right',
    },
    planMeta: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        gap: horizontalScale(8),
        marginTop: verticalScale(4),
    },
    typeBadge: {
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(6),
    },
    typeBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
    },
    caloriesText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    cancelButton: {
        marginTop: verticalScale(16),
        marginHorizontal: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
    },
    cancelText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
});
