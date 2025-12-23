/**
 * Meal Plans Feature
 * Exports all screens, components, hooks, and types
 */

// Screens
export { CreatePlanSheet } from './screens/CreatePlanSheet';
export { PlanBasicInfoScreen } from './screens/PlanBasicInfoScreen';
export { AddMealsScreen } from './screens/AddMealsScreen';
export { ReviewPlanScreen } from './screens/ReviewPlanScreen';
export { AssignPlanScreen } from './screens/AssignPlanScreen';
export { MealPlanCreatorFlow } from './screens/MealPlanCreatorFlow';

// Components
export { ProgressSteps } from './components/ProgressSteps';
export { ClientCard } from './components/ClientCard';
export { BottomCTA } from './components/BottomCTA';
export { CaloriesSlider } from './components/CaloriesSlider';
export { MealSection } from './components/MealSection';
export { MacroDonutChart } from './components/MacroDonutChart';
export { AddCategorySheet } from './components/AddCategorySheet';
export { EditCategorySheet } from './components/EditCategorySheet';

// Hooks
export { useMealPlanDraft } from './hooks/useMealPlanDraft';

// Types
export * from './types';

// Constants
export * from './constants';

// Translations
export { t as mealPlanTranslations } from './translations';
