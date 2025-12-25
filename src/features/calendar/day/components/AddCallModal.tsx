
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Search, Calendar, Clock, Phone, ChevronDown, Check } from 'lucide-react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { isRTL } from '@/src/i18n';
import { horizontalScale, verticalScale } from '@/src/utils/scaling';
import { dayViewTranslations as t, getMonthName, getDayNameFromIndex } from '../translations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface AddCallModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: Date;
    selectedHour: number;
    onEventCreated?: (event: any) => void;
    // Preselected client support (from client profile)
    preselectedClientId?: string;
    preselectedClientName?: string;
}

interface TimeSlot {
    value: string;  // "12:00", "12:30", etc.
    label: string;  // "12:00 م" or "12:00 PM"
}

// =============================================================================
// HELPER FUNCTIONS (Simple, Pure, Testable)
// =============================================================================

/**
 * Generates time slots between start and end times
 * @param startHour - Start hour (12 for 12 PM)
 * @param endHour - End hour (22 for 10 PM, includes 10:30)
 * @param stepMinutes - Interval in minutes (30)
 */
function generateTimeSlots(startHour = 12, endHour = 22, stepMinutes = 30): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let hour = startHour; hour <= endHour; hour++) {
        for (let min = 0; min < 60; min += stepMinutes) {
            // Stop after 22:30 (10:30 PM)
            if (hour === endHour && min > 30) break;

            const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

            // Format display: 12 stays 12, 13+ becomes 1-10
            const displayHour = hour === 12 ? 12 : hour - 12;
            const period = isRTL ? 'م' : 'PM';
            const label = `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;

            slots.push({ value, label });
        }
    }

    return slots;
}

/**
 * Formats date for display
 */
function formatDateDisplay(date: Date): string {
    return `${getDayNameFromIndex(date.getDay())}, ${getMonthName(date.getMonth())} ${date.getDate()}`;
}

/**
 * Gets the next valid end time after a start time
 */
function getNextEndTime(startValue: string, slots: TimeSlot[]): string {
    const startIndex = slots.findIndex(s => s.value === startValue);
    if (startIndex === -1 || startIndex >= slots.length - 1) {
        return slots[slots.length - 1].value;
    }
    return slots[startIndex + 1].value;
}

/**
 * Gets next 14 days starting from today for date picker
 */
function getNext14Days(): { date: Date; label: string; isToday: boolean }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Format: "الاثنين, ديسمبر 22" or "Monday, December 22"
        const dayName = getDayNameFromIndex(date.getDay());
        const monthName = getMonthName(date.getMonth());
        const dayNum = date.getDate();
        const label = `${dayName}, ${monthName} ${dayNum}`;

        days.push({
            date,
            label,
            isToday: i === 0
        });
    }
    return days;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TIME_SLOTS = generateTimeSlots(); // 12:00 PM to 10:30 PM

// =============================================================================
// COMPONENT
// =============================================================================

export const AddCallModal: React.FC<AddCallModalProps> = ({
    visible,
    onClose,
    selectedDate: initialDate,
    selectedHour,
    onEventCreated,
    preselectedClientId,
    preselectedClientName,
}) => {
    // -------------------------------------------------------------------------
    // STATE (Consolidated)
    // -------------------------------------------------------------------------
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [startTime, setStartTime] = useState(TIME_SLOTS[0].value);
    const [endTime, setEndTime] = useState(TIME_SLOTS[1].value);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [remind15Min, setRemind15Min] = useState(true);
    const [remindClient1Hour, setRemindClient1Hour] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Picker visibility (only one can be open at a time)
    const [activePicker, setActivePicker] = useState<'client' | 'date' | 'startTime' | 'endTime' | null>(null);

    // -------------------------------------------------------------------------
    // CONVEX - Fetch clients (firstName, lastName) from users table
    // -------------------------------------------------------------------------
    const clients = useQuery(api.calendar.getMyClients);
    const createCall = useMutation(api.calendar.createCalendarCall);

    // -------------------------------------------------------------------------
    // DERIVED VALUES
    // -------------------------------------------------------------------------
    const selectedClient = clients?.find((c: any) => c._id === selectedClientId);
    const formattedDate = formatDateDisplay(selectedDate);
    const isoDate = selectedDate.toISOString().split('T')[0];
    const next14Days = useMemo(() => getNext14Days(), []); // Next 2 weeks from today

    // Get time labels for display
    const startTimeLabel = TIME_SLOTS.find(s => s.value === startTime)?.label || TIME_SLOTS[0].label;
    const endTimeLabel = TIME_SLOTS.find(s => s.value === endTime)?.label || TIME_SLOTS[1].label;

    // -------------------------------------------------------------------------
    // EFFECTS
    // -------------------------------------------------------------------------

    // Reset form when modal opens
    useEffect(() => {
        if (visible) {
            setSelectedDate(initialDate);
            // If preselected client provided, use it; otherwise reset
            setSelectedClientId(preselectedClientId || null);
            setTitle('');
            setNotes('');
            setActivePicker(null);

            // Set initial time based on selected hour (clamp to valid range)
            const clampedHour = Math.max(12, Math.min(selectedHour, 22));
            const initialStart = `${clampedHour.toString().padStart(2, '0')}:00`;
            const validStart = TIME_SLOTS.find(s => s.value === initialStart)?.value || TIME_SLOTS[0].value;
            setStartTime(validStart);
            setEndTime(getNextEndTime(validStart, TIME_SLOTS));
        }
    }, [visible, initialDate, selectedHour, preselectedClientId]);

    // Auto-adjust endTime when startTime changes
    useEffect(() => {
        const startIndex = TIME_SLOTS.findIndex(s => s.value === startTime);
        const endIndex = TIME_SLOTS.findIndex(s => s.value === endTime);

        // If end is not after start, auto-fix it
        if (endIndex <= startIndex) {
            setEndTime(getNextEndTime(startTime, TIME_SLOTS));
        }
    }, [startTime]);

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------

    const togglePicker = (picker: typeof activePicker) => {
        setActivePicker(activePicker === picker ? null : picker);
    };

    const handleSelectTime = (value: string, type: 'start' | 'end') => {
        if (type === 'start') {
            setStartTime(value);
        } else {
            setEndTime(value);
        }
        setActivePicker(null);
    };

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setActivePicker(null);
    };

    const handleCreate = useCallback(async () => {
        if (!selectedClientId) {
            Alert.alert('', t.errorSelectClient);
            return;
        }

        setIsCreating(true);
        try {
            // Create event via Convex mutation
            const event = await createCall({
                clientId: selectedClientId as Id<"users">,
                date: isoDate,
                startTime,
                endTime,
                reason: title || 'Phone Call',
                notes: notes.trim() || undefined,
            });
            onEventCreated?.(event);
            onClose();
        } catch (error: any) {
            Alert.alert('', error.message || t.errorOverlap);
        } finally {
            setIsCreating(false);
        }
    }, [selectedClientId, selectedClient, isoDate, startTime, endTime, title, notes, createCall, onEventCreated, onClose]);



    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.container}>
                    {/* Drag Handle */}
                    <View style={styles.dragHandle}>
                        <View style={styles.dragIndicator} />
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.headerTitle}>{t.newAppointment}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#526477" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Client Section */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.client}
                            </Text>
                            <TouchableOpacity
                                style={[styles.selectInput, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={() => togglePicker('client')}
                            >
                                <Search size={20} color="#5173fb" />
                                <Text style={[
                                    styles.selectText,
                                    !selectedClient && !preselectedClientName && styles.placeholderText,
                                    { textAlign: isRTL ? 'left' : 'right', marginHorizontal: horizontalScale(8) }
                                ]}>
                                    {selectedClient
                                        ? `${selectedClient.firstName} ${selectedClient.lastName}`
                                        : preselectedClientName || t.selectClient
                                    }
                                </Text>
                                <ChevronDown size={20} color="#AAB8C5" />
                            </TouchableOpacity>

                            {activePicker === 'client' && (
                                <View style={styles.dropdown}>
                                    {clients?.map((client: any) => (
                                        <TouchableOpacity
                                            key={client._id}
                                            style={[
                                                styles.dropdownItem,
                                                { flexDirection: isRTL ? 'row' : 'row-reverse' },
                                                selectedClientId === client._id && styles.dropdownItemSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedClientId(client._id);
                                                setActivePicker(null);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>
                                                {client.firstName} {client.lastName}
                                            </Text>
                                            {selectedClientId === client._id && (
                                                <Check size={18} color="#5173fb" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Phone Call Indicator */}
                        <View style={[styles.phoneCallIndicator, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Phone size={20} color="#5173fb" />
                            <Text style={styles.phoneCallText}>
                                {isRTL ? 'مكالمة هاتفية' : 'Phone Call'}
                            </Text>
                        </View>

                        {/* Date Section */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.date}
                            </Text>
                            <TouchableOpacity
                                style={[styles.selectInput, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={() => togglePicker('date')}
                            >
                                <Calendar size={20} color="#5173fb" />
                                <Text style={[styles.selectText, { textAlign: isRTL ? 'left' : 'right', marginHorizontal: horizontalScale(8) }]}>
                                    {formattedDate}
                                </Text>
                                <ChevronDown size={20} color="#AAB8C5" />
                            </TouchableOpacity>

                            {/* Date Picker - Vertical List of Next 14 Days */}
                            {activePicker === 'date' && (
                                <ScrollView
                                    style={styles.datePicker}
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={false}
                                >
                                    {next14Days.map((item, index) => {
                                        const isSelected = item.date.toDateString() === selectedDate.toDateString();
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.dateItem,
                                                    isSelected && styles.dateItemSelected,
                                                ]}
                                                onPress={() => handleSelectDate(item.date)}
                                            >
                                                <Text style={[
                                                    styles.dateItemText,
                                                    isSelected && styles.dateItemTextSelected,
                                                ]}>
                                                    {item.label}
                                                    {item.isToday && (isRTL ? ' (اليوم)' : ' (Today)')}
                                                </Text>
                                                {isSelected && <Check size={18} color="#5173fb" />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Time Section */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.time}
                            </Text>
                            <View style={[styles.timeRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                {/* From Label */}
                                <Text style={styles.timeLabel}>{isRTL ? 'من' : 'From'}</Text>

                                {/* Start Time Picker */}
                                <TouchableOpacity
                                    style={[styles.timePicker, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                    onPress={() => togglePicker('startTime')}
                                >
                                    <Clock size={16} color="#526477" />
                                    <Text style={[styles.timeText, { textAlign: isRTL ? 'left' : 'right', marginHorizontal: 4 }]}>
                                        {startTimeLabel}
                                    </Text>
                                    <ChevronDown size={16} color="#AAB8C5" />
                                </TouchableOpacity>

                                {/* To Label */}
                                <Text style={styles.timeLabel}>{isRTL ? 'الى' : 'To'}</Text>

                                {/* End Time Picker */}
                                <TouchableOpacity
                                    style={[styles.timePicker, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                    onPress={() => togglePicker('endTime')}
                                >
                                    <Clock size={16} color="#526477" />
                                    <Text style={[styles.timeText, { textAlign: isRTL ? 'left' : 'right', marginHorizontal: 4 }]}>
                                        {endTimeLabel}
                                    </Text>
                                    <ChevronDown size={16} color="#AAB8C5" />
                                </TouchableOpacity>
                            </View>

                            {/* Start Time Dropdown */}
                            {activePicker === 'startTime' && (
                                <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                                    {TIME_SLOTS.map((slot) => (
                                        <TouchableOpacity
                                            key={slot.value}
                                            style={styles.timeOption}
                                            onPress={() => handleSelectTime(slot.value, 'start')}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,

                                                startTime === slot.value && styles.timeOptionSelected, { textAlign: isRTL ? 'left' : 'right' }
                                            ]}>
                                                {slot.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {/* End Time Dropdown - Only show times after startTime */}
                            {activePicker === 'endTime' && (
                                <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                                    {TIME_SLOTS
                                        .filter(slot => slot.value > startTime)
                                        .map((slot) => (
                                            <TouchableOpacity
                                                key={slot.value}
                                                style={styles.timeOption}
                                                onPress={() => handleSelectTime(slot.value, 'end')}
                                            >
                                                <Text style={[
                                                    styles.timeOptionText,
                                                    endTime === slot.value && styles.timeOptionSelected,
                                                    { textAlign: isRTL ? 'left' : 'right' }
                                                ]}>
                                                    {slot.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Title (Optional) */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? 'العنوان (اختياري)' : 'TITLE (OPTIONAL)'}
                            </Text>
                            <TextInput
                                style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                placeholder={isRTL ? 'مثال: استشارة أولية' : 'e.g., Initial Consultation'}
                                placeholderTextColor="#AAB8C5"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Notes (Optional) */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? 'ملاحظات (اختياري)' : 'NOTES (OPTIONAL)'}
                            </Text>
                            <TextInput
                                style={[styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                                placeholder={t.notesPlaceholder}
                                placeholderTextColor="#AAB8C5"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Reminders */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {t.reminders}
                            </Text>

                            <TouchableOpacity
                                style={[styles.checkboxRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={() => setRemind15Min(!remind15Min)}
                            >
                                <View style={[styles.checkbox, remind15Min && styles.checkboxChecked]}>
                                    {remind15Min && <Check size={14} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxLabel}>{t.remind15Min}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.checkboxRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={() => setRemindClient1Hour(!remindClient1Hour)}
                            >
                                <View style={[styles.checkbox, remindClient1Hour && styles.checkboxChecked]}>
                                    {remindClient1Hour && <Check size={14} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxLabel}>{t.remindClient1Hour}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: verticalScale(20) }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={[styles.footerButtons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                disabled={isCreating}
                            >
                                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.createButtonContainer}
                                onPress={handleCreate}
                                disabled={isCreating}
                            >
                                <LinearGradient
                                    colors={['#5173fb', '#60a5fa']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.createButton}
                                >
                                    {isCreating ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.createButtonText}>{t.createAppointment}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// =============================================================================
// STYLES (Preserved from original, added date picker styles)
// =============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 19, 35, 0.4)',
    },
    container: {
        backgroundColor: '#f8f9fc',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: SCREEN_HEIGHT * 0.85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    dragHandle: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#f8f9fc',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    dragIndicator: {
        width: 48,
        height: 6,
        backgroundColor: '#d1d5db',
        borderRadius: 3,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fc',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0d101c',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    phoneCallIndicator: {
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(81, 115, 251, 0.08)',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#5173fb',
    },
    phoneCallText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5173fb',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#AAB8C5',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    selectInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        paddingHorizontal: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    selectText: {
        flex: 1,
        fontSize: 16,
        color: '#0d101c',
    },
    placeholderText: {
        color: '#AAB8C5',
    },
    dropdown: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(81, 115, 251, 0.05)',
    },
    dropdownText: {
        fontSize: 16,
        color: '#0d101c',
    },
    // Date Picker Styles
    datePicker: {
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dateItemSelected: {
        backgroundColor: 'rgba(81, 115, 251, 0.05)',
    },
    dateItemText: {
        fontSize: 16,
        color: '#0d101c',
    },
    dateItemTextSelected: {
        color: '#5173fb',
        fontWeight: '600',
    },
    // Time Picker Styles
    timeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#526477',
        marginHorizontal: 4,
    },
    timeRow: {
        alignItems: 'center',
        gap: 8,
    },
    timePicker: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        paddingHorizontal: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    timeText: {
        flex: 1,
        fontSize: 16,
        color: '#0d101c',
    },
    timeDropdown: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    timeOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    timeOptionText: {
        fontSize: 15,
        color: '#0d101c',
    },
    timeOptionSelected: {
        color: '#5173fb',
        fontWeight: '600',
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#0d101c',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#0d101c',
        minHeight: 100,
        textAlignVertical: 'top',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    checkboxRow: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ced3e9',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#5173fb',
        borderColor: '#5173fb',
    },
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0d101c',
    },
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        paddingBottom: verticalScale(25),
    },
    footerButtons: {
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#526477',
    },
    createButtonContainer: {
        flex: 1,
    },
    createButton: {
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5173fb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default AddCallModal;
