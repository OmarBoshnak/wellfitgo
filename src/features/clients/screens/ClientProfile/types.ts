import { t } from './translations';

export type TabType = 'overview' | 'meal-plan' | 'progress' | 'messages' | 'notes' | 'settings';

export type SectionType =
    | 'header'
    | 'stats'
    | 'actions'
    | 'tabs'
    | 'weekHeader'
    | 'weekCards'
    | 'chart'
    | 'activity'
    | 'placeholder';

export interface SectionItem {
    id: string;
    type: SectionType;
}

export interface Tab {
    id: TabType;
    label: string;
}

export const TABS: Tab[] = [
    { id: 'overview', label: t.overview },
    { id: 'meal-plan', label: t.mealPlan },
    { id: 'notes', label: t.notes },
    { id: 'settings', label: t.settings },
];

export type ChartPeriod = '1M' | '3M' | '6M' | '1Y' | 'All';

export const CHART_PERIODS: ChartPeriod[] = ['1M', '3M', '6M', '1Y', 'All'];
