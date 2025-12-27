import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ChatConversation } from './types';

// Arabic translations
const t = {
    online: 'متصل',
    offline: 'غير متصل',
};

interface Props {
    conversation: ChatConversation;
    onBack: () => void;
    onOptions: () => void;
}

const ChatHeader = React.memo(function ChatHeader({ conversation, onBack, onOptions }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top : verticalScale(12) }]}>
            {/* RTL Layout: Back on left, options on right */}
            <View style={styles.content}>
                {/* Right: Back Button (RTL) */}
                <TouchableOpacity style={styles.iconButton} onPress={onBack}>
                    <MaterialIcons name="arrow-forward" size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                {/* Center: User Info */}
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
                        {conversation.isOnline && <View style={styles.onlineDot} />}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.userName}>{conversation.name}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: conversation.isOnline ? '#10B981' : '#9CA3AF' }]} />
                            <Text style={[styles.statusText, { color: conversation.isOnline ? '#10B981' : '#9CA3AF' }]}>
                                {conversation.isOnline ? t.online : t.offline}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Left: Options Button (RTL) */}
                <TouchableOpacity style={styles.iconButton} onPress={onOptions}>
                    <MaterialIcons name="more-vert" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default ChatHeader;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(12),
    },
    iconButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: horizontalScale(20),
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingHorizontal: horizontalScale(8),
        gap: horizontalScale(12),
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        borderWidth: 1,
        borderColor: colors.border,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        left: 0, // RTL: left side
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: colors.bgPrimary,
    },
    textContainer: {
        alignItems: 'flex-end', // RTL
    },
    userName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'right',
    },
    statusRow: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        gap: horizontalScale(4),
        marginTop: verticalScale(2),
    },
    statusDot: {
        width: horizontalScale(6),
        height: horizontalScale(6),
        borderRadius: horizontalScale(3),
    },
    statusText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
    },
});
