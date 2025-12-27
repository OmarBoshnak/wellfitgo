// Doctor feature - doctor dashboard, client management, appointments
// Components
export { default as DoctorHeader } from './components/HomeScreen/DoctorHeader';
export { StatsGrid } from './components/HomeScreen/StatsGrid';
export { ClientsAttentionSection } from './components/HomeScreen/ClientsAttentionSection';
export { AppointmentsSection } from './components/HomeScreen/AppointmentsSection';
export { RecentActivitySection } from './components/HomeScreen/RecentActivitySection';
export { WeeklyActivitySection } from './components/HomeScreen/WeeklyActivitySection';
export { NotificationPanel } from './components/HomeScreen/NotificationPanel';

// Hooks
export { useClients } from './hooks/useClients';
export { useClientsNeedingAttention } from './hooks/useClientsNeedingAttention';
export { useTodaysAppointments } from './hooks/useTodaysAppointments';
export { useRecentActivity } from './hooks/useRecentActivity';
export { useWeeklyActivity } from './hooks/useWeeklyActivity';
export { usePhoneCall } from './hooks/usePhoneCall';
