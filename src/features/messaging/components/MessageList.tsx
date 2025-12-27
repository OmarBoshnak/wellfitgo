import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors } from '@/src/core/constants/Themes';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ChatMessage } from './types';
import MessageBubble from './MessageBubble';

// Arabic translations
const t = {
    today: 'اليوم',
};

interface Props {
    messages: ChatMessage[];
    avatarUri?: string;
}

const MessageList = React.memo(function MessageList({ messages, avatarUri }: Props) {
    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
        // Determine if we should show avatar (first message or different sender)
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar = !prevMessage ||
            prevMessage.sender !== item.sender ||
            prevMessage.type === 'system';

        return (
            <MessageBubble
                message={item}
                showAvatar={showAvatar && item.sender === 'client'}
                avatarUri={avatarUri}
            />
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.dateSeparator}>{t.today}</Text>
        </View>
    );

    const keyExtractor = (item: ChatMessage) => item.id;

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderHeader}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
    );
});

export default MessageList;

const styles = StyleSheet.create({
    list: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    contentContainer: {
        paddingVertical: verticalScale(16),
        paddingBottom: verticalScale(8),
    },
    header: {
        alignItems: 'center',
        paddingVertical: verticalScale(8),
        marginBottom: verticalScale(8),
    },
    dateSeparator: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#AAB8C5',
    },
});
