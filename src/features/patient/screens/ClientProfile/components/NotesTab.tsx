import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, RefreshControl } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import { Save, Trash2, FileText, Plus, X } from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Themes';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { t } from '../translations';

// ============ TYPES ============

interface Note {
    id: Id<"clientNotes">;
    content: string;
    createdAt: number;
    updatedAt: number;
}

interface NotesTabProps {
    clientId: Id<"users">;
}

// ============ COMPONENT ============

export function NotesTab({ clientId }: NotesTabProps) {
    const notes = useQuery(api.clientProfile.getAllClientNotes, { clientId });
    const addNote = useMutation(api.clientProfile.addClientNote);
    const deleteNote = useMutation(api.clientProfile.deleteClientNote);

    const [isAdding, setIsAdding] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ============ HANDLERS ============

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) {
            Alert.alert('', isRTL ? 'الرجاء إدخال محتوى الملاحظة' : 'Please enter note content');
            return;
        }

        setIsSaving(true);
        try {
            await addNote({ clientId, content: newNoteContent });
            setNewNoteContent('');
            setIsAdding(false);
            Alert.alert('✅', isRTL ? 'تم حفظ الملاحظة بنجاح' : 'Note saved successfully');
        } catch (error) {
            console.error('Add note error:', error);
            Alert.alert(isRTL ? 'خطأ' : 'Error', String(error));
        }
        setIsSaving(false);
    };

    const handleDeleteNote = (noteId: Id<"clientNotes">) => {
        const deleteTitle = isRTL ? 'حذف الملاحظة' : 'Delete Note';
        const deleteMessage = isRTL ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?';
        const deleteBtn = isRTL ? 'حذف' : 'Delete';

        Alert.alert(
            deleteTitle,
            deleteMessage,
            [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                {
                    text: deleteBtn,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNote({ noteId });
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert(isRTL ? 'خطأ' : 'Error', String(error));
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month} • ${hours}:${minutes}`;
    };

    // ============ RENDER NOTE CARD ============

    const renderNoteCard = ({ item }: { item: Note }) => (
        <View style={styles.noteCard}>
            <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.cardIconContainer}>
                    <FileText size={18} color={colors.primaryDark} />
                </View>
                <View style={[styles.cardActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteNote(item.id)}
                    >
                        <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={[styles.noteContent, { textAlign: isRTL ? 'left' : 'right' }]}>
                {item.content}
            </Text>
        </View>
    );

    // ============ HEADER COMPONENT ============

    const ListHeader = () => (
        <>
            {/* Add Note Button */}
            {!isAdding && (
                <TouchableOpacity onPress={() => setIsAdding(true)} style={styles.addNoteButton}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.addNoteGradient}
                    >
                        <Plus size={20} color="#FFFFFF" />
                        <Text style={styles.addNoteText}>
                            {isRTL ? 'إضافة ملاحظة جديدة' : 'Add New Note'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Add Note Form */}
            {isAdding && (
                <View style={styles.addNoteForm}>
                    <View style={[styles.formHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.formTitle}>
                            {isRTL ? 'ملاحظة جديدة' : 'New Note'}
                        </Text>
                        <TouchableOpacity onPress={() => { setIsAdding(false); setNewNoteContent(''); }}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
                        value={newNoteContent}
                        onChangeText={setNewNoteContent}
                        placeholder={isRTL ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        autoFocus
                    />
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleAddNote}
                        disabled={isSaving}
                        style={styles.saveButtonWrapper}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButton}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Save size={20} color="#FFFFFF" />
                                    <Text style={styles.saveButtonText}>
                                        {isRTL ? 'حفظ الملاحظة' : 'Save Note'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </>
    );

    // ============ EMPTY STATE ============

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>
                {isRTL ? 'لا توجد ملاحظات' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {isRTL ? 'أضف ملاحظة لهذا العميل' : 'Add a note for this client'}
            </Text>
        </View>
    );

    // Loading
    if (notes === undefined) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={notes as Note[]}
                keyExtractor={(item) => item.id}
                renderItem={renderNoteCard}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={!isAdding ? EmptyState : null}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primaryDark]}
                        tintColor={colors.primaryDark}
                    />
                }
            />
        </View>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(80),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    // Add Note Button
    addNoteButton: {
        marginBottom: verticalScale(16),
        borderRadius: horizontalScale(12),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addNoteGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(12),
    },
    addNoteText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Add Note Form
    addNoteForm: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    formHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    formTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    textInput: {
        minHeight: verticalScale(120),
        fontSize: ScaleFontSize(15),
        lineHeight: ScaleFontSize(24),
        color: colors.textPrimary,
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(14),
        marginBottom: verticalScale(16),
    },
    saveButtonWrapper: {
        width: '100%',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(12),
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Note Card
    noteCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
        paddingBottom: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    cardIconContainer: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(10),
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardActions: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    noteDate: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    deleteButton: {
        padding: horizontalScale(8),
        backgroundColor: '#FEE2E2',
        borderRadius: horizontalScale(8),
    },
    noteContent: {
        fontSize: ScaleFontSize(15),
        lineHeight: ScaleFontSize(24),
        color: colors.textPrimary,
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: verticalScale(40),
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    emptySubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});
