/**
 * Hook for fetching weekly activity statistics
 * Wraps Convex query for the dashboard
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";

// ============ TYPES ============
export interface WeeklyStats {
    messages: number;
    plans: number;
    checkins: number;
}

export interface UseWeeklyActivityResult {
    stats: WeeklyStats;
    chartData: number[];
    isLoading: boolean;
    isEmpty: boolean;
}

const defaultStats: WeeklyStats = {
    messages: 0,
    plans: 0,
    checkins: 0,
};

const defaultChartData = [0, 0, 0, 0, 0, 0, 0];

// ============ MAIN HOOK ============
export function useWeeklyActivity(): UseWeeklyActivityResult {
    const data = useQuery(api.weeklyActivity.getWeeklyActivity, {});

    const result = useMemo(() => {
        // Loading state
        if (data === undefined) {
            return {
                stats: defaultStats,
                chartData: defaultChartData,
                isLoading: true,
                isEmpty: false,
            };
        }

        // Null returned (unauthorized or error)
        if (data === null) {
            return {
                stats: defaultStats,
                chartData: defaultChartData,
                isLoading: false,
                isEmpty: true,
            };
        }

        // Check if empty
        const isEmpty =
            data.stats.messages === 0 &&
            data.stats.plans === 0 &&
            data.stats.checkins === 0;

        return {
            stats: data.stats,
            chartData: data.chartData,
            isLoading: false,
            isEmpty,
        };
    }, [data]);

    return result;
}
