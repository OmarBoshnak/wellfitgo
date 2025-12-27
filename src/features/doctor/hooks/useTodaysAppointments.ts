/**
 * Custom hook for fetching today's appointments
 * Wraps Convex query and transforms data for UI consumption
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isRTL } from "@/src/core/i18n";
import { useMemo, useState, useEffect } from "react";

// ============ TYPES ============
export interface AppointmentDisplay {
    id: string;
    time: string;
    type: "video" | "phone";
    clientName: string;
    clientId: string;
    avatar: string;
    duration: string;
    status: "upcoming" | "starting_soon" | "in_progress";
    reason?: string;
    rawStartTime: string;
    clientPhone?: string; // For phone calls
}

export interface UseTodaysAppointmentsResult {
    appointments: AppointmentDisplay[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    totalToday: number;
    nextAppointment: AppointmentDisplay | null;
    refetch: () => void;
}

// ============ TRANSLATIONS ============
const appointmentTranslations = {
    minutes: isRTL ? "{x} دقيقة" : "{x} min",
};

// ============ HELPER FUNCTIONS ============

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 */
function formatTime12Hour(time24: string): string {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? (isRTL ? "م" : "PM") : (isRTL ? "ص" : "AM");
    const hour12 = hours % 12 || 12;

    if (isRTL) {
        // Arabic numerals
        const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
        const toArabic = (n: number) =>
            String(n).split("").map(d => arabicNumerals[parseInt(d)]).join("");
        return `${toArabic(hour12)}:${toArabic(minutes).padStart(2, arabicNumerals[0])} ${period}`;
    }

    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Format duration in minutes for display
 */
function formatDuration(minutes: number): string {
    if (isRTL) {
        const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
        const toArabic = (n: number) =>
            String(n).split("").map(d => arabicNumerals[parseInt(d)]).join("");
        return `${toArabic(minutes)} دقيقة`;
    }
    return `${minutes} min`;
}

/**
 * Calculate current status based on time
 */
function calculateStatus(
    startTime: string,
    endTime: string,
    date: string
): "upcoming" | "starting_soon" | "in_progress" {
    const now = new Date();
    const [year, month, day] = date.split("-").map(Number);
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startDate = new Date(year, month - 1, day, startH, startM);
    const endDate = new Date(year, month - 1, day, endH, endM);

    if (now >= startDate && now < endDate) {
        return "in_progress";
    }

    const minutesUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
    if (minutesUntilStart <= 15 && minutesUntilStart > 0) {
        return "starting_soon";
    }

    return "upcoming";
}

// ============ MAIN HOOK ============
export function useTodaysAppointments(limit?: number): UseTodaysAppointmentsResult {
    // Get today's date in YYYY-MM-DD format
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    // Trigger for status recalculation
    const [tick, setTick] = useState(0);

    // Update status every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Call Convex query
    const rawData = useQuery(api.calendar.getTodaysAppointments, {
        date: today,
        limit: limit ?? 10,
    });

    // Transform data with recalculated status
    const appointments = useMemo(() => {
        if (!rawData) return [];

        return rawData.map((apt): AppointmentDisplay => ({
            id: apt.id,
            time: formatTime12Hour(apt.startTime),
            type: apt.type === "call" ? "phone" : apt.type as "video" | "phone",
            clientName: apt.clientName,
            clientId: apt.clientId,
            avatar: apt.clientAvatar || "https://via.placeholder.com/100",
            duration: formatDuration(apt.duration),
            status: calculateStatus(apt.startTime, apt.endTime, apt.date),
            reason: apt.reason,
            rawStartTime: apt.startTime,
            clientPhone: apt.clientPhone ?? undefined,
        }));
    }, [rawData, tick]); // tick dependency triggers recalculation

    // Sort by status priority, then by time
    const sortedAppointments = useMemo(() => {
        const statusPriority = { in_progress: 0, starting_soon: 1, upcoming: 2 };
        return [...appointments].sort((a, b) => {
            const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
            if (priorityDiff !== 0) return priorityDiff;
            return a.rawStartTime.localeCompare(b.rawStartTime);
        });
    }, [appointments]);

    // Handle loading state
    if (rawData === undefined) {
        return {
            appointments: [],
            isLoading: true,
            isEmpty: false,
            totalToday: 0,
            nextAppointment: null,
            refetch: () => { },
        };
    }

    // Find next appointment (first starting_soon or upcoming)
    const nextAppointment = sortedAppointments.find(
        apt => apt.status === "starting_soon" || apt.status === "upcoming"
    ) || null;

    return {
        appointments: sortedAppointments,
        isLoading: false,
        isEmpty: sortedAppointments.length === 0,
        totalToday: sortedAppointments.length,
        nextAppointment,
        refetch: () => { },
    };
}
