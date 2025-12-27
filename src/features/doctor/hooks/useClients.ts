/**
 * Custom hook for fetching and managing clients
 * Wraps Convex queries and provides actions for the clients screen
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useCallback, useState } from "react";
import { Alert } from "react-native";
import { isRTL } from "@/src/core/i18n";
import { Id } from "@/convex/_generated/dataModel";

// ============ TYPES ============

export type ClientStatus = "active" | "new" | "atRisk" | "overdue" | "inactive";
export type ClientFilter = "all" | "active" | "inactive" | "new" | "atRisk";

export interface Client {
    id: Id<"users">;
    clerkId: string;
    name: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    avatar: string | null;
    gender: "male" | "female";

    // Status
    status: ClientStatus;
    subscriptionStatus: string;
    isActive: boolean;

    // Weight data
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    progress: number;

    // Activity tracking
    lastActiveAt?: number;
    lastCheckInDays: number | null;
    lastWeightLogDate?: string;

    // Messages
    unreadMessages: number;
    conversationId?: Id<"conversations">;

    // Plan info
    hasActivePlan: boolean;
    planExpiresAt?: string;

    // Timestamps
    createdAt: number;
    daysSinceJoined: number;
}

export interface ClientCounts {
    all: number;
    active: number;
    inactive: number;
    new: number;
    atRisk: number;
}

export interface UseClientsResult {
    clients: Client[];
    counts: ClientCounts;
    isLoading: boolean;
    isEmpty: boolean;

    // Actions
    sendReminder: (clientId: Id<"users">, type?: "checkin" | "weight" | "general") => Promise<void>;
    isSendingReminder: boolean;
}

// ============ TRANSLATIONS ============

const translations = {
    sent: isRTL ? "تم الإرسال" : "Sent",
    error: isRTL ? "خطأ" : "Error",
    ok: isRTL ? "حسناً" : "OK",
    reminderSent: isRTL
        ? (name: string) => `تم إرسال التذكير إلى ${name}`
        : (name: string) => `Reminder sent to ${name}`,
    failedToSend: isRTL ? "فشل إرسال التذكير" : "Failed to send reminder",
    // Time formatting
    never: isRTL ? "لم يسجل بعد" : "Never",
    today: isRTL ? "اليوم" : "Today",
    yesterday: isRTL ? "أمس" : "Yesterday",
    daysAgo: isRTL
        ? (days: number) => `منذ ${days} أيام`
        : (days: number) => `${days}d ago`,
    weeksAgo: isRTL
        ? (weeks: number) => `منذ ${weeks} أسبوع`
        : (weeks: number) => `${weeks}w ago`,
    monthsAgo: isRTL
        ? (months: number) => `منذ ${months} شهر`
        : (months: number) => `${months}mo ago`,
};

// ============ HELPER FUNCTIONS ============

/**
 * Format relative time for last check-in display
 */
export function formatLastCheckIn(days: number | null): string {
    if (days === null) {
        return translations.never;
    }
    if (days === 0) {
        return translations.today;
    }
    if (days === 1) {
        return translations.yesterday;
    }
    if (days < 7) {
        return translations.daysAgo(days);
    }
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return translations.weeksAgo(weeks);
    }
    const months = Math.floor(days / 30);
    return translations.monthsAgo(months);
}

// ============ MAIN HOOK ============

/**
 * Hook for fetching and managing clients on the coach dashboard
 */
export function useClients(
    filter: ClientFilter = "all",
    searchQuery: string = ""
): UseClientsResult {
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    // Fetch clients with filter and search
    const clientsData = useQuery(api.clients.getCoachClients, {
        filter: filter,
        searchQuery: searchQuery.trim() || undefined,
    });

    // Fetch counts for filter badges
    const countsData = useQuery(api.clients.getClientCounts, {});

    // Send reminder mutation
    const sendReminderMutation = useMutation(api.clients.sendClientReminder);

    // Transform clients data
    const clients = useMemo<Client[]>(() => {
        if (!clientsData) return [];
        // Cast to Client[] since Convex returns the correct shape
        return clientsData as unknown as Client[];
    }, [clientsData]);

    // Default counts if not loaded
    const counts = useMemo<ClientCounts>(() => {
        if (!countsData) {
            return { all: 0, active: 0, inactive: 0, new: 0, atRisk: 0 };
        }
        return countsData;
    }, [countsData]);

    // Send reminder action with feedback
    const sendReminder = useCallback(
        async (
            clientId: Id<"users">,
            type: "checkin" | "weight" | "general" = "general"
        ) => {
            setIsSendingReminder(true);
            try {
                const result = await sendReminderMutation({
                    clientId,
                    reminderType: type,
                });

                Alert.alert(
                    translations.sent,
                    translations.reminderSent(result.clientName),
                    [{ text: translations.ok }]
                );
            } catch (error: unknown) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : translations.failedToSend;

                Alert.alert(
                    translations.error,
                    errorMessage,
                    [{ text: translations.ok }]
                );
            } finally {
                setIsSendingReminder(false);
            }
        },
        [sendReminderMutation]
    );

    return {
        clients,
        counts,
        isLoading: clientsData === undefined,
        isEmpty: clientsData !== undefined && clientsData.length === 0,
        sendReminder,
        isSendingReminder,
    };
}
