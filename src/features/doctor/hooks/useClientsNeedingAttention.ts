/**
 * Custom hook for fetching clients needing attention
 * Wraps Convex query and transforms data for UI consumption
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isRTL } from "@/src/core/i18n";

// ============ TYPES ============
export interface AttentionClient {
    id: string;
    name: string;
    avatar: string;
    status: string;
    statusType: "critical" | "warning" | "info";
    lastActive?: string;
    feeling?: string;
    // Attention metadata
    attentionType: "late_message" | "weight_gain" | "missing_checkin";
    weightChange?: number;
    lastMessageTime?: number;
    daysSinceCheckin?: number | null;
}

export interface UseClientsNeedingAttentionResult {
    clients: AttentionClient[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    refetch: () => void;
}

// ============ TRANSLATIONS ============
const attentionTranslations = {
    // Status messages
    unreadMessage: isRTL ? "رسالة غير مقروءة" : "Unread message",
    weightGain: isRTL ? "زيادة +{x} كجم هذا الأسبوع" : "Weight +{x}kg this week",
    noCheckinDays: isRTL ? "لا تسجيل منذ {x} أيام" : "No check-in for {x} days",
    noCheckinYet: isRTL ? "لا توجد تسجيلات وزن بعد" : "No weigh-ins yet",
    // Time ago
    justNow: isRTL ? "الآن" : "just now",
    minutesAgo: isRTL ? "منذ {x} د" : "{x}m ago",
    hoursAgo: isRTL ? "منذ {x} س" : "{x}h ago",
    daysAgo: isRTL ? "منذ {x} ي" : "{x}d ago",
};

// ============ HELPER FUNCTIONS ============

/**
 * Format relative time from timestamp
 */
function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return attentionTranslations.justNow;
    if (minutes < 60) return attentionTranslations.minutesAgo.replace("{x}", String(minutes));
    if (hours < 24) return attentionTranslations.hoursAgo.replace("{x}", String(hours));
    return attentionTranslations.daysAgo.replace("{x}", String(days));
}

/**
 * Map feeling enum to emoji
 */
function getFeelingEmoji(feeling: string | null): string | undefined {
    if (!feeling) return undefined;
    const feelingMap: Record<string, string> = {
        very_hard: "😫",
        challenging: "😕",
        good: "🙂",
        great: "😀",
        excellent: "🤩",
    };
    return feelingMap[feeling];
}

/**
 * Generate status message based on attention type
 */
function generateStatusMessage(
    attentionType: AttentionClient["attentionType"],
    data: {
        weightChange?: number;
        daysSinceCheckin?: number | null;
        lastMessageTime?: number;
        hasAnyCheckins?: boolean;
    }
): string {
    switch (attentionType) {
        case "missing_checkin":
            if (!data.hasAnyCheckins) {
                return attentionTranslations.noCheckinYet;
            }
            return attentionTranslations.noCheckinDays.replace(
                "{x}",
                String(data.daysSinceCheckin ?? 0)
            );

        case "weight_gain":
            return attentionTranslations.weightGain.replace(
                "{x}",
                String(data.weightChange ?? 0)
            );

        case "late_message":
            const timeAgo = data.lastMessageTime
                ? formatTimeAgo(data.lastMessageTime)
                : "";
            return `${attentionTranslations.unreadMessage} • ${timeAgo}`;

        default:
            return "";
    }
}

/**
 * Map attention type to status type
 */
function getStatusType(attentionType: AttentionClient["attentionType"]): "critical" | "warning" | "info" {
    switch (attentionType) {
        case "missing_checkin":
            return "critical";
        case "weight_gain":
            return "warning";
        case "late_message":
            return "info";
        default:
            return "info";
    }
}

// ============ MAIN HOOK ============
export function useClientsNeedingAttention(
    limit?: number
): UseClientsNeedingAttentionResult {
    // Call Convex query
    const rawData = useQuery(api.attention.getClientsNeedingAttention, {
        limit: limit ?? 50,
    });

    // Handle loading state
    if (rawData === undefined) {
        return {
            clients: [],
            isLoading: true,
            isEmpty: false,
            refetch: () => { },
        };
    }

    // Transform raw data to AttentionClient format
    const clients: AttentionClient[] = rawData.map((client) => {
        const attentionType = client.attentionType;
        const statusType = getStatusType(attentionType);

        // Generate status message
        const status = generateStatusMessage(attentionType, {
            weightChange: client.weightChange ?? undefined,
            daysSinceCheckin: client.daysSinceCheckin,
            lastMessageTime: client.lastMessageTime ?? undefined,
            hasAnyCheckins: client.hasAnyCheckins,
        });

        // Generate last active time for late messages
        const lastActive = client.lastMessageTime
            ? formatTimeAgo(client.lastMessageTime)
            : undefined;

        return {
            id: client.id,
            name: client.name,
            avatar: client.avatarUrl || "https://via.placeholder.com/100",
            status,
            statusType,
            lastActive,
            feeling: getFeelingEmoji(client.feeling),
            attentionType,
            weightChange: client.weightChange ?? undefined,
            lastMessageTime: client.lastMessageTime ?? undefined,
            daysSinceCheckin: client.daysSinceCheckin,
        };
    });

    return {
        clients,
        isLoading: false,
        isEmpty: clients.length === 0,
        // Convex queries auto-refetch, but expose function for manual trigger
        refetch: () => { },
    };
}
