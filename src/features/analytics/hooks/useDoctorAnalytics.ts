/**
 * Hook for fetching doctor analytics data from Convex
 * Provides real-time dashboard metrics with loading and empty states
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";

// ============ TYPES ============

export type TimeRange = "7days" | "30days" | "3months";

export type ClientStatus = "on_track" | "needs_support" | "at_risk";

export interface OverviewStats {
    activeClients: number;
    avgProgress: number | null;
    checkInRate: number;
    responseTime: number | null;
}

export interface ProgressBuckets {
    onTrack: number;
    needsSupport: number;
    atRisk: number;
}

export interface DailyActivity {
    date: string;
    messages: number;
    plans: number;
    checkIns: number;
}

export interface ClientCheckIn {
    id: Id<"users">;
    name: string;
    lastCheckIn: string | null;
    status: ClientStatus;
}

export interface DoctorAnalyticsData {
    overview: OverviewStats;
    progressBuckets: ProgressBuckets;
    dailyActivity: DailyActivity[];
    clients: ClientCheckIn[];
}

export interface UseDoctorAnalyticsResult {
    data: DoctorAnalyticsData | null;
    isLoading: boolean;
    isEmpty: boolean;
}

// ============ DEFAULTS ============

const defaultOverview: OverviewStats = {
    activeClients: 0,
    avgProgress: null,
    checkInRate: 0,
    responseTime: null,
};

const defaultBuckets: ProgressBuckets = {
    onTrack: 0,
    needsSupport: 0,
    atRisk: 0,
};

const defaultData: DoctorAnalyticsData = {
    overview: defaultOverview,
    progressBuckets: defaultBuckets,
    dailyActivity: [],
    clients: [],
};

// ============ MAIN HOOK ============

/**
 * Fetch doctor analytics data with real-time updates
 * @param timeRange - The time period to aggregate data for (7days, 30days, 3months)
 */
export function useDoctorAnalytics(
    timeRange: TimeRange = "7days"
): UseDoctorAnalyticsResult {
    // Auto-detect user's timezone
    const timezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return "UTC";
        }
    }, []);

    // Query Convex for analytics data
    const queryResult = useQuery(api.analytics.getDoctorStats, {
        timeRange,
        timezone,
    });

    // Memoize the result to prevent unnecessary re-renders
    const result = useMemo((): UseDoctorAnalyticsResult => {
        // Loading state: query returns undefined
        if (queryResult === undefined) {
            return {
                data: null,
                isLoading: true,
                isEmpty: false,
            };
        }

        // Error/unauthorized: query returns null
        if (queryResult === null) {
            return {
                data: defaultData,
                isLoading: false,
                isEmpty: true,
            };
        }

        // Check if effectively empty (no clients)
        const isEmpty = queryResult.overview.activeClients === 0;

        return {
            data: queryResult,
            isLoading: false,
            isEmpty,
        };
    }, [queryResult]);

    return result;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Format relative time for last check-in display
 */
export function formatLastCheckIn(
    isoString: string | null,
    translations: {
        today: string;
        dayAgo: string;
        daysAgo: string;
        never: string;
    }
): string {
    if (!isoString) return translations.never;

    const checkInDate = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - checkInDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return translations.today;
    if (diffDays === 1) return translations.dayAgo;
    return `${diffDays} ${translations.daysAgo}`;
}

/**
 * Calculate percentages for the donut chart
 */
export function calculateProgressPercentages(buckets: ProgressBuckets): {
    onTrack: { percentage: number; count: number };
    needsSupport: { percentage: number; count: number };
    atRisk: { percentage: number; count: number };
    total: number;
} {
    const total = buckets.onTrack + buckets.needsSupport + buckets.atRisk;

    if (total === 0) {
        return {
            onTrack: { percentage: 0, count: 0 },
            needsSupport: { percentage: 0, count: 0 },
            atRisk: { percentage: 0, count: 0 },
            total: 0,
        };
    }

    return {
        onTrack: {
            percentage: Math.round((buckets.onTrack / total) * 100),
            count: buckets.onTrack,
        },
        needsSupport: {
            percentage: Math.round((buckets.needsSupport / total) * 100),
            count: buckets.needsSupport,
        },
        atRisk: {
            percentage: Math.round((buckets.atRisk / total) * 100),
            count: buckets.atRisk,
        },
        total,
    };
}
