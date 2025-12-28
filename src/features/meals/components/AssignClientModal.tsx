import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, Image, Dimensions, Animated, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Check, ChevronDown, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Duration options
const DURATION_OPTIONS = [
    { value: 'ongoing', label: isRTL ? 'مستمر (حتى التغيير)' : 'Ongoing (until changed)', weeks: null },
    { value: '1week', label: isRTL ? 'أسبوع واحد' : '1 Week', weeks: 1 },
    { value: '2weeks', label: isRTL ? 'أسبوعين' : '2 Weeks', weeks: 2 },
    { value: '4weeks', label: isRTL ? '4 أسابيع' : '4 Weeks', weeks: 4 },
    { value: '8weeks', label: isRTL ? '8 أسابيع' : '8 Weeks', weeks: 8 },
    { value: '12weeks', label: isRTL ? '12 أسبوع' : '12 Weeks', weeks: 12 },
];

const t = {
    assignDietProgram: isRTL ? 'تعيين برنامج غذائي' : 'Assign Diet Program',
    searchClients: isRTL ? 'البحث عن العملاء...' : 'Search clients...',
    selectClients: isRTL ? 'اختر العملاء' : 'Select Clients',
    selectedClients: isRTL ? 'عميل مختار' : 'client selected',
    selectedClientsPlural: isRTL ? 'عملاء مختارين' : 'clients selected',
    noClientSelected: isRTL ? 'لم يتم اختيار عميل' : 'No client selected',
    clientsWithoutPlan: isRTL ? 'عملاء بدون خطة غذائية' : 'Clients without diet plan',
    clientsWithPlan: isRTL ? 'عملاء لديهم خطة' : 'Clients with existing plan',
    noPlan: isRTL ? 'لا يوجد خطة حالية' : 'No current plan',
    willReplace: isRTL ? 'سيتم استبدال الخطة الحالية' : 'Will replace current plan',
    startDate: isRTL ? 'تاريخ البدء' : 'Start Date',
    duration: isRTL ? 'المدة' : 'Duration',
    selectDuration: isRTL ? 'اختر المدة' : 'Select Duration',
    notifications: isRTL ? 'الإشعارات' : 'Notifications',
    notifyPush: isRTL ? 'إرسال إشعار للعميل' : 'Notify client via push notification',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    assignTo: isRTL ? 'تعيين لـ' : 'Assign to',
    client: isRTL ? 'عميل' : 'Client',
    clients: isRTL ? 'عملاء' : 'Clients',
    planAssigned: isRTL ? 'تم تعيين الخطة!' : 'Plan Assigned!',
    hasBeenAssigned: isRTL ? 'تم تعيينه لـ' : 'has been assigned to',
    done: isRTL ? 'تم' : 'Done',
    viewClient: isRTL ? 'عرض العميل' : 'View Client',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noClients: isRTL ? 'لا يوجد عملاء' : 'No clients found',
    hasActivePlan: isRTL ? 'لديه خطة نشطة' : 'Has active plan',
    today: isRTL ? 'اليوم' : 'Today',
    tomorrow: isRTL ? 'غداً' : 'Tomorrow',
};

// Client type from Convex query
interface ConvexClient {
    id: Id<"users">;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    hasActivePlan: boolean;
}

// Success green gradient
const successGradient = ['#28af62', '#2cc56f'] as const;

interface AssignmentSettings {
    startDate: string;
    durationWeeks: number | null;
    notifyPush: boolean;
}

interface Props {
    visible: boolean;
    diet: {
        range?: string;
        name?: string;
    };
    onClose: () => void;
    onAssign: (selectedClients: Id<"users">[], settings: AssignmentSettings) => void;
    onViewClient?: (clientId: Id<"users">) => void;
    isAssigning?: boolean;
}

export default function AssignClientModal({ visible, diet, onClose, onAssign, onViewClient, isAssigning = false }: Props) {
    const [selectedClients, setSelectedClients] = useState<Id<"users">[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notifyPush, setNotifyPush] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [assignedClients, setAssignedClients] = useState<ConvexClient[]>([]);
    const scaleAnim = useState(new Animated.Value(0.8))[0];
    const opacityAnim = useState(new Animated.Value(0))[0];

    // Date picker state
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Duration state
    const [selectedDuration, setSelectedDuration] = useState('ongoing');
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    // Clients dropdown state
    const [showClientsPicker, setShowClientsPicker] = useState(true); // Show by default

    // Fetch real clients from Convex
    const clients = useQuery(api.plans.getMyClients) ?? [];
    const isLoading = clients === undefined;

    // Filter clients based on search term
    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return clients;
        const query = searchTerm.toLowerCase();
        return clients.filter((client) => {
            const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
            return fullName.includes(query);
        });
    }, [clients, searchTerm]);

    // Split into clients with and without plans
    const clientsWithoutPlan = useMemo(() => filteredClients.filter(c => !c.hasActivePlan), [filteredClients]);
    const clientsWithPlan = useMemo(() => filteredClients.filter(c => c.hasActivePlan), [filteredClients]);

    useEffect(() => {
        if (showSuccess) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [showSuccess]);

    const toggleClient = (clientId: Id<"users">) => {
        setSelectedClients(prev =>
            prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
        );
    };

    // Get selected duration option
    const getDurationWeeks = (): number | null => {
        const option = DURATION_OPTIONS.find(o => o.value === selectedDuration);
        return option?.weeks ?? null;
    };

    // Format date for display
    const formatDisplayDate = (date: Date): string => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate.getTime() === today.getTime()) {
            return t.today;
        } else if (checkDate.getTime() === tomorrow.getTime()) {
            return t.tomorrow;
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Get selected duration label
    const getSelectedDurationLabel = (): string => {
        const option = DURATION_OPTIONS.find(o => o.value === selectedDuration);
        return option?.label || t.selectDuration;
    };

    // Get selected clients label
    const getSelectedClientsLabel = (): string => {
        if (selectedClients.length === 0) {
            return t.noClientSelected;
        } else if (selectedClients.length === 1) {
            return `1 ${t.selectedClients}`;
        } else {
            return `${selectedClients.length} ${t.selectedClientsPlural}`;
        }
    };

    // Handle date change
    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const handleAssign = () => {
        // Get assigned client details from real clients
        const assigned = clients.filter(c => selectedClients.includes(c.id));
        setAssignedClients(assigned);
        setShowSuccess(true);
    };

    const handleDone = () => {
        const settings: AssignmentSettings = {
            startDate: startDate.toISOString().split('T')[0],
            durationWeeks: getDurationWeeks(),
            notifyPush,
        };
        onAssign(selectedClients, settings);
        setShowSuccess(false);
        setSelectedClients([]);
        setAssignedClients([]);
    };

    const handleViewClient = () => {
        if (onViewClient && assignedClients.length > 0) {
            onViewClient(assignedClients[0].id);
        }
        handleDone();
    };

    const renderCheckbox = (checked: boolean, onToggle: () => void, label: string) => (
        <TouchableOpacity
            style={[styles.checkboxRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            {checked ? (
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkboxChecked}
                >
                    <Check size={horizontalScale(12)} color="#FFFFFF" strokeWidth={3} />
                </LinearGradient>
            ) : (
                <View style={styles.checkboxUnchecked} />
            )}
            <Text style={[styles.checkboxLabel, { textAlign: isRTL ? 'left' : 'right' }]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderClientCard = (client: ConvexClient, hasExistingPlan: boolean) => {
        const isSelected = selectedClients.includes(client.id);
        const fullName = `${client.firstName} ${client.lastName}`.trim();

        return (
            <TouchableOpacity
                key={client.id}
                style={[styles.clientCard, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                onPress={() => toggleClient(client.id)}
                activeOpacity={0.7}
            >
                {client.avatarUrl ? (
                    <Image
                        source={{ uri: client.avatarUrl }}
                        style={[styles.avatar, !isSelected && hasExistingPlan && styles.avatarInactive]}
                    />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder, !isSelected && hasExistingPlan && styles.avatarInactive]}>
                        <Text style={styles.avatarPlaceholderText}>
                            {client.firstName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {fullName}
                    </Text>
                    {hasExistingPlan ? (
                        <View style={styles.planInfoRow}>
                            <View style={[styles.activePlanBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <AlertCircle size={horizontalScale(12)} color="#F59E0B" />
                                <Text style={styles.activePlanBadgeText}>{t.hasActivePlan}</Text>
                            </View>
                            {isSelected && (
                                <Text style={styles.replaceWarning}>⚠️ {t.willReplace}</Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.noPlanBadge}>
                            <Text style={styles.noPlanDot}>🔴</Text>
                            <Text style={styles.noPlanText}>{t.noPlan}</Text>
                        </View>
                    )}
                </View>
                {isSelected ? (
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.selectionChecked}
                    >
                        <Check size={horizontalScale(16)} color="#FFFFFF" strokeWidth={3} />
                    </LinearGradient>
                ) : (
                    <View style={styles.selectionUnchecked} />
                )}
            </TouchableOpacity>
        );
    };

    // Success Modal
    const renderSuccessModal = () => (
        <Modal visible={showSuccess} transparent animationType="none">
            <View style={styles.successOverlay}>
                <Animated.View
                    style={[
                        styles.successCard,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    {/* Handle */}
                    <View style={styles.successHandle}>
                        <View style={styles.successHandleBar} />
                    </View>

                    {/* Content */}
                    <View style={styles.successContent}>
                        {/* Success Icon with Glow */}
                        <View style={styles.successIconContainer}>
                            <View style={styles.successIconGlow} />
                            <CheckCircle
                                size={horizontalScale(64)}
                                color="#28af62"
                                fill="#28af62"
                                strokeWidth={0}
                            />
                        </View>

                        {/* Headline */}
                        <Text style={styles.successTitle}>{t.planAssigned}</Text>

                        {/* Body Text */}
                        <Text style={styles.successBody}>
                            <Text style={styles.successBold}>
                                {diet?.name || 'Classic'} {diet?.range || '1200-1300'}
                            </Text>
                            {' '}{t.hasBeenAssigned}{' '}
                            <Text style={styles.successBoldDark}>
                                {assignedClients.length} {assignedClients.length === 1 ? t.client : t.clients}
                            </Text>
                        </Text>

                        {/* Avatar Group */}
                        <View style={styles.avatarGroup}>
                            {assignedClients.slice(0, 3).map((client, index) => (
                                <View
                                    key={client.id}
                                    style={[
                                        styles.avatarGroupItem,
                                        { zIndex: 10 - index, marginLeft: index > 0 ? horizontalScale(-12) : 0 },
                                    ]}
                                >
                                    {client.avatarUrl ? (
                                        <Image source={{ uri: client.avatarUrl }} style={styles.avatarGroupImage} />
                                    ) : (
                                        <View style={[styles.avatarGroupImage, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarPlaceholderText}>
                                                {client.firstName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                            {assignedClients.length > 3 && (
                                <View style={[styles.avatarGroupMore, { marginLeft: horizontalScale(-12) }]}>
                                    <Text style={styles.avatarGroupMoreText}>+{assignedClients.length - 3}</Text>
                                </View>
                            )}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.successButtons}>
                            {/* Done Button */}
                            <TouchableOpacity onPress={handleDone} activeOpacity={0.9} style={styles.doneButtonWrapper}>
                                <LinearGradient
                                    colors={successGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.doneButton}
                                >
                                    <Text style={styles.doneButtonText}>{t.done}</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* View Client Button */}
                            <TouchableOpacity
                                onPress={handleViewClient}
                                style={styles.viewClientButton}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.viewClientButtonText}>{t.viewClient}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );

    return (
        <>
            <Modal visible={visible && !showSuccess} animationType="slide" transparent onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {/* Drag Handle */}
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.assignDietProgram}
                            </Text>
                            <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                🥗 {diet?.name || 'Classic'} {diet?.range || '1200-1300'}
                            </Text>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Settings Section */}
                            <View style={styles.settingsSection}>
                                {/* Clients Dropdown */}
                                <View style={styles.settingGroup}>
                                    <Text style={[styles.settingLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                        {t.selectClients.toUpperCase()}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.settingButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                        onPress={() => setShowClientsPicker(!showClientsPicker)}
                                    >
                                        <View style={[styles.settingButtonLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                            <Users size={horizontalScale(18)} color={selectedClients.length > 0 ? colors.primaryDark : colors.textSecondary} />
                                            <Text style={[
                                                styles.settingButtonText,
                                                selectedClients.length > 0 && styles.settingButtonTextActive
                                            ]}>
                                                {getSelectedClientsLabel()}
                                            </Text>
                                        </View>
                                        <ChevronDown
                                            size={horizontalScale(20)}
                                            color={colors.textSecondary}
                                            style={{ transform: [{ rotate: showClientsPicker ? '180deg' : '0deg' }] }}
                                        />
                                    </TouchableOpacity>

                                    {/* Expanded Client List */}
                                    {showClientsPicker && (
                                        <View style={styles.clientsDropdown}>
                                            {/* Search within dropdown */}
                                            <View style={[styles.searchInputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                                <Search size={horizontalScale(18)} color={colors.textSecondary} />
                                                <TextInput
                                                    style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                                    placeholder={t.searchClients}
                                                    placeholderTextColor={colors.textSecondary}
                                                    value={searchTerm}
                                                    onChangeText={setSearchTerm}
                                                />
                                            </View>

                                            {/* Loading State */}
                                            {isLoading ? (
                                                <View style={styles.loadingContainer}>
                                                    <ActivityIndicator size="small" color={colors.primaryDark} />
                                                    <Text style={styles.loadingText}>{t.loading}</Text>
                                                </View>
                                            ) : filteredClients.length === 0 ? (
                                                <View style={styles.emptyContainer}>
                                                    <Text style={styles.emptyText}>{t.noClients}</Text>
                                                </View>
                                            ) : (
                                                <>
                                                    {/* Clients Without Plan */}
                                                    {clientsWithoutPlan.length > 0 && (
                                                        <View style={styles.clientSection}>
                                                            <Text style={[styles.clientSectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                                                {t.clientsWithoutPlan}
                                                            </Text>
                                                            {clientsWithoutPlan.map((client) => renderClientCard(client, false))}
                                                        </View>
                                                    )}

                                                    {/* Clients With Plan */}
                                                    {clientsWithPlan.length > 0 && (
                                                        <View style={styles.clientSection}>
                                                            <Text style={[styles.clientSectionTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                                                                {t.clientsWithPlan}
                                                            </Text>
                                                            {clientsWithPlan.map((client) => renderClientCard(client, true))}
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    )}
                                </View>

                                {/* Start Date */}
                                <View style={styles.settingGroup}>
                                    <Text style={[styles.settingLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                        {t.startDate.toUpperCase()}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.settingButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <View style={[styles.settingButtonLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                            <Calendar size={horizontalScale(18)} color={colors.primaryDark} />
                                            <Text style={styles.settingButtonText}>
                                                {formatDisplayDate(startDate)}
                                            </Text>
                                        </View>
                                        <ChevronDown size={horizontalScale(20)} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={startDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={handleDateChange}
                                            minimumDate={new Date()}
                                        />
                                    )}
                                </View>

                                {/* Duration */}
                                <View style={styles.settingGroup}>
                                    <Text style={[styles.settingLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                        {t.duration.toUpperCase()}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.settingButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                        onPress={() => setShowDurationPicker(!showDurationPicker)}
                                    >
                                        <Text style={styles.settingButtonText}>{getSelectedDurationLabel()}</Text>
                                        <ChevronDown size={horizontalScale(20)} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    {showDurationPicker && (
                                        <View style={styles.durationOptions}>
                                            {DURATION_OPTIONS.map((option) => (
                                                <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                        styles.durationOption,
                                                        selectedDuration === option.value && styles.durationOptionSelected,
                                                        { flexDirection: isRTL ? 'row' : 'row-reverse' },
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedDuration(option.value);
                                                        setShowDurationPicker(false);
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.durationOptionText,
                                                        selectedDuration === option.value && styles.durationOptionTextSelected,
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                    {selectedDuration === option.value && (
                                                        <Check size={horizontalScale(18)} color={colors.primaryDark} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Notifications - Single Option */}
                                <View style={styles.settingGroup}>
                                    <Text style={[styles.settingLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                        {t.notifications.toUpperCase()}
                                    </Text>
                                    <View style={styles.checkboxList}>
                                        {renderCheckbox(notifyPush, () => setNotifyPush(!notifyPush), t.notifyPush)}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer */}
                        <View style={[styles.footer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.assignButtonWrapper}
                                onPress={handleAssign}
                                disabled={selectedClients.length === 0}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={selectedClients.length > 0 ? gradients.primary : ['#E1E8EF', '#E1E8EF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.assignButton}
                                >
                                    <Text style={[
                                        styles.assignButtonText,
                                        selectedClients.length === 0 && styles.assignButtonTextDisabled
                                    ]}>
                                        {t.assignTo} {selectedClients.length} {selectedClients.length === 1 ? t.client : t.clients}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {renderSuccessModal()}
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: horizontalScale(24),
        borderTopRightRadius: horizontalScale(24),
        height: SCREEN_HEIGHT * 0.85,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(4),
    },
    handle: {
        width: horizontalScale(40),
        height: verticalScale(4),
        backgroundColor: '#AAB8C5',
        borderRadius: horizontalScale(2),
    },
    // Header
    header: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(4),
        paddingBottom: verticalScale(8),
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginVertical: verticalScale(10),
    },
    // Search
    searchContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(16),
    },
    searchInputWrapper: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(16),
        alignItems: 'center',
        height: verticalScale(44),
    },
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
        marginHorizontal: horizontalScale(8),
    },
    // Content
    content: {
        flex: 1,
    },
    section: {
        paddingTop: verticalScale(8),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: '#AAB8C5',
        letterSpacing: 0.8,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: verticalScale(8),
    },
    // Client Card
    clientCard: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        alignItems: 'center',
    },
    avatar: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        marginRight: horizontalScale(12),
    },
    avatarInactive: {
        opacity: 0.7,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    clientWeight: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    noPlanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(4),
        marginTop: verticalScale(4),
    },
    noPlanDot: {
        fontSize: ScaleFontSize(10),
    },
    noPlanText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(10),
    },
    planInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: horizontalScale(8),
        marginTop: verticalScale(4),
    },
    existingPlanBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: horizontalScale(6),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(10),
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    existingPlanText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: '#F97316',
    },
    replaceWarning: {
        fontSize: ScaleFontSize(10),
        fontWeight: '500',
        color: '#F59E0B',
    },
    avatarPlaceholder: {
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPlaceholderText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    activePlanBadge: {
        alignItems: 'center',
        gap: horizontalScale(4),
        backgroundColor: '#FFF7ED',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(10),
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    activePlanBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: '#F59E0B',
    },
    // Clients Dropdown
    clientsDropdown: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        marginTop: verticalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        maxHeight: verticalScale(300),
    },
    clientSection: {
        paddingVertical: verticalScale(8),
    },
    clientSectionTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.textSecondary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(6),
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    loadingContainer: {
        paddingVertical: verticalScale(20),
        alignItems: 'center',
        gap: verticalScale(8),
    },
    loadingText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    emptyContainer: {
        paddingVertical: verticalScale(20),
        alignItems: 'center',
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    settingButtonTextActive: {
        color: colors.primaryDark,
        fontWeight: '600',
    },
    durationOptions: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        marginTop: verticalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    durationOption: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    durationOptionSelected: {
        backgroundColor: 'rgba(80, 115, 254, 0.05)',
    },
    durationOptionText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    durationOptionTextSelected: {
        fontWeight: '600',
        color: colors.primaryDark,
    },
    selectionChecked: {
        width: horizontalScale(24),
        height: horizontalScale(24),
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionUnchecked: {
        width: horizontalScale(24),
        height: horizontalScale(24),
        borderRadius: horizontalScale(12),
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.bgPrimary,
    },
    // Settings
    settingsSection: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(24),
    },
    settingGroup: {
        marginBottom: verticalScale(16),
    },
    settingLabel: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: '#AAB8C5',
        marginBottom: verticalScale(8),
    },
    settingButton: {
        backgroundColor: colors.bgSecondary,
        height: verticalScale(44),
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingButtonLeft: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    settingEmoji: {
        fontSize: ScaleFontSize(16),
    },
    settingButtonText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    // Checkboxes
    checkboxList: {
        gap: verticalScale(4),
    },
    checkboxRow: {
        alignItems: 'center',
        height: verticalScale(44),
        gap: horizontalScale(12),
    },
    checkboxChecked: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxUnchecked: {
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(4),
        borderWidth: 1.5,
        borderColor: '#AAB8C5',
        backgroundColor: 'transparent',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    // Footer
    footer: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(32),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
        gap: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 8,
        backgroundColor: colors.bgPrimary,
    },
    cancelButton: {
        height: verticalScale(48),
        paddingHorizontal: horizontalScale(24),
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    assignButtonWrapper: {
        flex: 1,
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    assignButton: {
        height: verticalScale(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    assignButtonTextDisabled: {
        color: colors.textSecondary,
    },
    // Success Modal
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCard: {
        width: horizontalScale(300),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 20,
        overflow: 'hidden',
    },
    successHandle: {
        width: '100%',
        alignItems: 'center',
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(4),
    },
    successHandleBar: {
        height: verticalScale(6),
        width: horizontalScale(40),
        borderRadius: horizontalScale(3),
        backgroundColor: '#E2E8F0',
    },
    successContent: {
        alignItems: 'center',
        paddingHorizontal: horizontalScale(24),
        paddingBottom: verticalScale(24),
        paddingTop: verticalScale(8),
    },
    successIconContainer: {
        marginBottom: verticalScale(16),
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIconGlow: {
        position: 'absolute',
        width: horizontalScale(80),
        height: horizontalScale(80),
        borderRadius: horizontalScale(40),
        backgroundColor: 'rgba(40, 175, 98, 0.2)',
    },
    successTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: '#526477',
        marginBottom: verticalScale(8),
    },
    successBody: {
        fontSize: ScaleFontSize(14),
        color: '#8093A5',
        textAlign: 'center',
        lineHeight: ScaleFontSize(22),
        marginBottom: verticalScale(24),
    },
    successBold: {
        fontWeight: '600',
        color: '#64748B',
    },
    successBoldDark: {
        fontWeight: '700',
        color: '#1E293B',
    },
    avatarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(32),
    },
    avatarGroupItem: {
        borderRadius: horizontalScale(20),
        borderWidth: 2,
        borderColor: colors.bgPrimary,
    },
    avatarGroupImage: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
    },
    avatarGroupMore: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.bgPrimary,
    },
    avatarGroupMoreText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: '#64748B',
    },
    successButtons: {
        width: '100%',
        gap: verticalScale(12),
    },
    doneButtonWrapper: {
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        shadowColor: '#28af62',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    doneButton: {
        height: verticalScale(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    viewClientButton: {
        height: verticalScale(48),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: 'rgba(40, 175, 98, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewClientButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#28af62',
    },
});
