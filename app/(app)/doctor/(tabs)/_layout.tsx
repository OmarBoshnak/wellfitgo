import React from 'react';
import { Tabs } from 'expo-router';
import { Users, UtensilsCrossed, MessageSquare, BarChart3, Home } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Themes';
import { View, Text, StyleSheet } from 'react-native';
import { isRTL } from '@/src/core/constants/translations';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';

// Tab labels
const tabLabels = {
    index: isRTL ? 'الرئيسية' : 'Home',
    clients: isRTL ? 'العملاء' : 'Clients',
    plans: isRTL ? 'الخطط' : 'Plans',
    messages: isRTL ? 'الرسائل' : 'Messages',
    analytics: isRTL ? 'الإحصائيات' : 'Stats',
};

// Badge component for notifications
function TabBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
    );
}

export default function DoctorTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.bgPrimary,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: verticalScale(8),
                    paddingBottom: verticalScale(10),
                    height: verticalScale(70),
                },
                tabBarActiveTintColor: colors.success,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: ScaleFontSize(11),
                    fontWeight: '500',
                    marginTop: verticalScale(4),
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: tabLabels.index,
                    tabBarIcon: ({ color, size }) => <Home size={horizontalScale(size)} color={color} />,
                }}
            />
            <Tabs.Screen
                name="clients"
                options={{
                    title: tabLabels.clients,
                    tabBarIcon: ({ color, size }) => <Users size={horizontalScale(size)} color={color} />,
                }}
            />
            <Tabs.Screen
                name="plans"
                options={{
                    title: tabLabels.plans,
                    tabBarIcon: ({ color, size }) => <UtensilsCrossed size={horizontalScale(size)} color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: tabLabels.messages,
                    tabBarIcon: ({ color, size }) => (
                        <View>
                            <MessageSquare size={horizontalScale(size)} color={color} />
                            <TabBadge count={5} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: tabLabels.analytics,
                    tabBarIcon: ({ color, size }) => <BarChart3 size={horizontalScale(size)} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: verticalScale(-4),
        right: horizontalScale(-8),
        backgroundColor: colors.error,
        borderRadius: horizontalScale(10),
        minWidth: horizontalScale(18),
        height: horizontalScale(18),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(4),
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
    },
});
