// Meals feature - meal plans management
export { default as DietCategoriesGrid } from './components/DietCategoriesGrid';
export { default as DietPlansList } from './components/DietPlansList';
export { default as DietDetailsView } from './components/DietDetailsView';
export { default as AssignClientModal } from './components/AssignClientModal';
export { default as EditDietScreen } from './components/EditDietScreen';
export { default as CreateCategoryModal } from './components/CreateCategoryModal';

// Hooks
export { useDoctorPlans, usePlanMutations as useDoctorPlansMutations, isDietPlanRecommended } from './hooks/useDoctorPlans';
export type { DoctorPlanItem, DraftPlanItem, AssignmentClient, DietProgramItem } from './hooks/useDoctorPlans';
export { useDietCategories } from './hooks/useDietCategories';
export type { DietCategory } from './hooks/useDietCategories';
export { useDietsByType } from './hooks/useDietsByType';
export type { DietPlan, DietType } from './hooks/useDietsByType';
export { useDietDetails } from './hooks/useDietDetails';
export { usePlanMutations } from './hooks/usePlanMutations';
export type { DietPlanType, CreateDietPlanArgs, UpdateDietPlanArgs } from './hooks/usePlanMutations';
