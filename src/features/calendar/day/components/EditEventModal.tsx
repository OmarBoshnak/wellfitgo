/**
 * EditEventModal - Edit or delete an existing calendar event
 * Features: Edit date/time, save changes, delete event
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Calendar, Clock, Trash2, Check } from 'lucide-react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { isRTL } from '@/src/core/i18n';
import { horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { dayViewTranslations as t, getMonthName, getDayNameFromIndex } from '../translations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface EditEventModalProps {
    visible: boolean;
    onClose: () => void;
    event: {
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        reason: string;
        clientName?: string;
    } | null;
    onEventUpdated?: () => void;
    onEventDeleted?: () => void;
}

interface TimeSlot {
    value: string;
    label: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function generateTimeSlots(startHour = 12, endHour = 22, stepMinutes = 30): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let min = 0; min < 60; min += stepMinutes) {
            if (hour === endHour && min > 30) break;
            const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            const displayHour = hour === 12 ? 12 : hour - 12;
            const period = isRTL ? 'م' : 'PM';
            const label = `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
            slots.push({ value, label });
        }
    }
    return slots;
}

function getNext14Days(): { date: Date; label: string; isoDate: string }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayName = getDayNameFromIndex(date.getDay());
        const monthName = getMonthName(date.getMonth());
        const dayNum = date.getDate();
        const label = `${dayName}, ${monthName} ${dayNum}`;
        // Use local date formatting to avoid UTC timezone shift
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;

        days.push({ date, label, isoDate });
    }
    return days;
}

const TIME_SLOTS = generateTimeSlots();

// =============================================================================
// COMPONENT
// =============================================================================

export const EditEventModal: React.FC<EditEventModalProps> = ({
    visible,
    onClose,
    event,
    onEventUpdated,
    onEventDeleted,
}) => {
    // State
    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activePicker, setActivePicker] = useState<'date' | 'startTime' | 'endTime' | null>(null);

    // Convex mutations
    const updateEvent = useMutation(api.calendar.updateEvent);
    const cancelEvent = useMutation(api.calendar.cancelEvent);

    // Derived
    const next14Days = useMemo(() => getNext14Days(), []);
    const startTimeLabel = TIME_SLOTS.find(s => s.value === startTime)?.label || '';
    const endTimeLabel = TIME_SLOTS.find(s => s.value === endTime)?.label || '';
    const selectedDateLabel = next14Days.find(d => d.isoDate === selectedDate)?.label || selectedDate;

    // Initialize from event
    useEffect(() => {
        if (visible && event) {
            setSelectedDate(event.date);
            setStartTime(event.startTime);
            setEndTime(event.endTime);
            setActivePicker(null);
        }
    }, [visible, event]);

    // Auto-adjust endTime when startTime changes
    useEffect(() => {
        const startIndex = TIME_SLOTS.findIndex(s => s.value === startTime);
        const endIndex = TIME_SLOTS.findIndex(s => s.value === endTime);
        if (endIndex <= startIndex && startIndex < TIME_SLOTS.length - 1) {
            setEndTime(TIME_SLOTS[startIndex + 1].value);
        }
    }, [startTime]);

    const togglePicker = (picker: typeof activePicker) => {
        setActivePicker(activePicker === picker ? null : picker);
    };

    const handleSave = async () => {
        if (!event) return;

        setIsSaving(true);
        try {
            await updateEvent({
                eventId: event._id as Id<"calendarEvents">,
                date: selectedDate,
                startTime,
                endTime,
            });
            onEventUpdated?.();
            onClose();
        } catch (error: any) {
            Alert.alert(isRTL ? 'خطأ' : 'Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!event) return;

        Alert.alert(
            isRTL ? 'حذف الموعد' : 'Delete Appointment',
            isRTL ? 'هل أنت متأكد من حذف هذا الموعد؟' : 'Are you sure you want to delete this appointment?',
            [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                {
                    text: isRTL ? 'حذف' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await cancelEvent({ eventId: event._id as Id<"calendarEvents"> });
                            onEventDeleted?.();
                            onClose();
                        } catch (error: any) {
                            Alert.alert(isRTL ? 'خطأ' : 'Error', error.message);
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    if (!event) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.container}>
                    {/* Header */}
                    <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.headerTitle}>
                            {isRTL ? 'تعديل الموعد' : 'Edit Appointment'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#526477" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Client Name (Read-only) */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? 'العميل' : 'CLIENT'}
                            </Text>
                            <View style={styles.readOnlyField}>
                                <Text style={styles.readOnlyText}>{event.clientName || 'Unknown'}</Text>
                            </View>
                        </View>

                        {/* Date Picker */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? 'التاريخ' : 'DATE'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.pickerButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={() => togglePicker('date')}
                            >
                                <Calendar size={20} color="#5173fb" />
                                <Text style={[styles.pickerText, { textAlign: isRTL ? 'left' : 'right', flex: 1, marginHorizontal: 8 }]}>
                                    {selectedDateLabel}
                                </Text>
                            </TouchableOpacity>

                            {activePicker === 'date' && (
                                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                                    {next14Days.map((item, index) => {
                                        const isSelected = item.isoDate === selectedDate;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                                                onPress={() => {
                                                    setSelectedDate(item.isoDate);
                                                    setActivePicker(null);
                                                }}
                                            >
                                                <Text style={[styles.dropdownText, isSelected && styles.dropdownTextSelected]}>
                                                    {item.label}
                                                </Text>
                                                {isSelected && <Check size={18} color="#5173fb" />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Time Pickers */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { textAlign: isRTL ? 'left' : 'right' }]}>
                                {isRTL ? 'الوقت' : 'TIME'}
                            </Text>
                            <View style={[styles.timeRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Text style={styles.timeLabel}>{isRTL ? 'من' : 'From'}</Text>
                                <TouchableOpacity
                                    style={[styles.timePicker, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                    onPress={() => togglePicker('startTime')}
                                >
                                    <Clock size={16} color="#526477" />
                                    <Text style={[styles.timeText, { marginHorizontal: 4 }]}>{startTimeLabel}</Text>
                                </TouchableOpacity>

                                <Text style={styles.timeLabel}>{isRTL ? 'الى' : 'To'}</Text>
                                <TouchableOpacity
                                    style={[styles.timePicker, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                    onPress={() => togglePicker('endTime')}
                                >
                                    <Clock size={16} color="#526477" />
                                    <Text style={[styles.timeText, { marginHorizontal: 4 }]}>{endTimeLabel}</Text>
                                </TouchableOpacity>
                            </View>

                            {activePicker === 'startTime' && (
                                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                                    {TIME_SLOTS.map((slot) => (
                                        <TouchableOpacity
                                            key={slot.value}
                                            style={[styles.dropdownItem, startTime === slot.value && styles.dropdownItemSelected]}
                                            onPress={() => {
                                                setStartTime(slot.value);
                                                setActivePicker(null);
                                            }}
                                        >
                                            <Text style={[styles.dropdownText, startTime === slot.value && styles.dropdownTextSelected]}>
                                                {slot.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {activePicker === 'endTime' && (
                                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                                    {TIME_SLOTS.filter(s => s.value > startTime).map((slot) => (
                                        <TouchableOpacity
                                            key={slot.value}
                                            style={[styles.dropdownItem, endTime === slot.value && styles.dropdownItemSelected]}
                                            onPress={() => {
                                                setEndTime(slot.value);
                                                setActivePicker(null);
                                            }}
                                        >
                                            <Text style={[styles.dropdownText, endTime === slot.value && styles.dropdownTextSelected]}>
                                                {slot.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        <View style={{ height: verticalScale(20) }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={[styles.footerButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            {/* Delete Button */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDelete}
                                disabled={isDeleting || isSaving}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="#ef4444" size="small" />
                                ) : (
                                    <Trash2 size={20} color="#ef4444" />
                                )}
                            </TouchableOpacity>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={styles.saveButtonContainer}
                                onPress={handleSave}
                                disabled={isSaving || isDeleting}
                            >
                                <LinearGradient
                                    colors={['#5173fb', '#60a5fa']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.saveButton}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// =============================================================================
// STYLES
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
        maxHeight: SCREEN_HEIGHT * 0.75,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0d101c',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 10,
        paddingTop: 24,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: horizontalScale(15)
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#AAB8C5',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    readOnlyField: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 16,
    },
    readOnlyText: {
        fontSize: 16,
        color: '#526477',
    },
    pickerButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        paddingHorizontal: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: '#0d101c',
    },
    dropdown: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ced3e9',
        maxHeight: 140,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(81, 115, 251, 0.05)',
    },
    dropdownText: {
        fontSize: 16,
        color: '#0d101c',
    },
    dropdownTextSelected: {
        color: '#5173fb',
        fontWeight: '600',
    },
    timeRow: {
        alignItems: 'center',
        gap: 8,
    },
    timeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#526477',
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
    },
    timeText: {
        fontSize: 16,
        color: '#0d101c',
    },
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        padding: 16,
        paddingBottom: verticalScale(25),
    },
    footerButtons: {
        alignItems: 'center',
        gap: 12,
    },
    deleteButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonContainer: {
        flex: 1,
    },
    saveButton: {
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default EditEventModal;
