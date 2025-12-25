/**
 * Hook for fetching recent activity feed
 * Formats activity text and relative times with i18n
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { isRTL } from "@/src/i18n";

// Activity types
type ActivityType =
    | "weight_log"
    | "message"
    | "meal_completed"
    | "plan_published"
    | "new_client";

// Raw activity from Convex
interface RawActivity {
    id: string;
    type: ActivityType;
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    timestamp: number;
    metadata: Record<string, unknown>;
}

// Formatted activity for UI
export interface Activity {
    id: string;
    text: string;
    time: string;
    type: ActivityType;
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    timestamp: number;
}

export interface UseRecentActivityResult {
    activities: Activity[];
    isLoading: boolean;
    isEmpty: boolean;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number, rtl: boolean): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
        return rtl ? "الآن" : "Just now";
    }
    if (minutes < 60) {
        return rtl ? `منذ ${minutes} د` : `${minutes} min ago`;
    }
    if (hours < 24) {
        return rtl ? `منذ ${hours} س` : `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    if (days < 7) {
        return rtl ? `منذ ${days} ي` : `${days} day${days > 1 ? "s" : ""} ago`;
    }
    return rtl ? `منذ ${Math.floor(days / 7)} أ` : `${Math.floor(days / 7)}w ago`;
}

/**
 * Format meal type for display
 */
function formatMealType(mealType: string, rtl: boolean): string {
    const mealTypes: Record<string, { en: string; ar: string }> = {
        breakfast: { en: "breakfast", ar: "الإفطار" },
        lunch: { en: "lunch", ar: "الغداء" },
        dinner: { en: "dinner", ar: "العشاء" },
        snack: { en: "snack", ar: "وجبة خفيفة" },
    };
    return mealTypes[mealType]?.[rtl ? "ar" : "en"] || mealType;
}

/**
 * Generate activity text based on type
 */
function generateActivityText(activity: RawActivity, rtl: boolean): string {
    const { type, clientName, metadata } = activity;

    switch (type) {
        case "weight_log": {
            const weight = metadata.weight as number;
            const unit = metadata.unit as string;
            return rtl
                ? `${clientName} سجل الوزن ${weight}${unit}`
                : `${clientName} logged weight ${weight}${unit}`;
        }

        case "message": {
            return rtl
                ? `رسالة جديدة من ${clientName}`
                : `New message from ${clientName}`;
        }

        case "meal_completed": {
            const mealType = formatMealType(metadata.mealType as string, rtl);
            return rtl
                ? `${clientName} أكمل ${mealType}`
                : `${clientName} completed ${mealType}`;
        }

        case "plan_published": {
            return rtl
                ? `أنشأت خطة لـ ${clientName}`
                : `You created plan for ${clientName}`;
        }

        case "new_client": {
            return rtl
                ? `${clientName} انضم إلى عملائك`
                : `${clientName} joined your clients`;
        }

        default:
            return rtl ? "نشاط جديد" : "New activity";
    }
}

/**
 * Hook for fetching and formatting recent activity
 */
export function useRecentActivity(limit: number = 10): UseRecentActivityResult {
    const rawActivities = useQuery(api.recentActivity.getRecentActivity, { limit });

    const result = useMemo(() => {
        // Loading state
        if (rawActivities === undefined) {
            return {
                activities: [],
                isLoading: true,
                isEmpty: false,
            };
        }

        // Empty or error state
        if (!rawActivities || rawActivities.length === 0) {
            return {
                activities: [],
                isLoading: false,
                isEmpty: true,
            };
        }

        // Transform activities
        const activities: Activity[] = rawActivities.map((raw) => ({
            id: raw.id,
            text: generateActivityText(raw as RawActivity, isRTL),
            time: formatRelativeTime(raw.timestamp, isRTL),
            type: raw.type as ActivityType,
            clientId: raw.clientId,
            clientName: raw.clientName,
            clientAvatar: raw.clientAvatar,
            timestamp: raw.timestamp,
        }));

        return {
            activities,
            isLoading: false,
            isEmpty: false,
        };
    }, [rawActivities]);

    return result;
}
