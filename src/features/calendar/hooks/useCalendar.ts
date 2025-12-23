import { useState, useMemo, useCallback } from 'react';
import { CalendarView, DayInfo } from '../types';
import {
    getWeekDays,
    isToday,
    getPreviousPeriod,
    getNextPeriod
} from '../utils/time';
import { getDayName } from '../translations';

interface UseCalendarReturn {
    // State
    currentView: CalendarView;
    currentDate: Date;
    weekDays: DayInfo[];
    displayMonth: string;
    displayYear: number;

    // Actions
    setView: (view: CalendarView) => void;
    goToPrevious: () => void;
    goToNext: () => void;
    goToToday: () => void;
    selectDate: (date: Date) => void;
}

export const useCalendar = (): UseCalendarReturn => {
    const [currentView, setCurrentView] = useState<CalendarView>('week');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Calculate week days based on current date
    const weekDays = useMemo((): DayInfo[] => {
        const days = getWeekDays(currentDate);
        return days.map((date, index) => ({
            date,
            dayName: getDayName(date.getDay()),
            dayNumber: date.getDate(),
            isToday: isToday(date),
            isSelected: date.getDate() === currentDate.getDate() &&
                date.getMonth() === currentDate.getMonth(),
        }));
    }, [currentDate]);

    // Get display month and year
    const displayMonth = useMemo(() => {
        // For week view, use the middle day's month
        const referenceDate = currentView === 'week'
            ? weekDays[3]?.date || currentDate
            : currentDate;
        return referenceDate.toLocaleDateString('en-US', { month: 'long' });
    }, [currentDate, currentView, weekDays]);

    const displayYear = useMemo(() => {
        const referenceDate = currentView === 'week'
            ? weekDays[3]?.date || currentDate
            : currentDate;
        return referenceDate.getFullYear();
    }, [currentDate, currentView, weekDays]);

    // Navigation actions
    const goToPrevious = useCallback(() => {
        setCurrentDate(prev => getPreviousPeriod(prev, currentView));
    }, [currentView]);

    const goToNext = useCallback(() => {
        setCurrentDate(prev => getNextPeriod(prev, currentView));
    }, [currentView]);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const selectDate = useCallback((date: Date) => {
        setCurrentDate(date);
    }, []);

    const setView = useCallback((view: CalendarView) => {
        setCurrentView(view);
    }, []);

    return {
        currentView,
        currentDate,
        weekDays,
        displayMonth,
        displayYear,
        setView,
        goToPrevious,
        goToNext,
        goToToday,
        selectDate,
    };
};

export default useCalendar;
