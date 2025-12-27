/**
 * MealPlanCreatorFlow
 * Carousel-based navigation for meal plan creation (4 steps)
 */
import React, { useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Modal, Alert } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mealPlanColors, mealIcons } from '../constants';
import { useMealPlanDraft } from '../hooks/useMealPlanDraft';
import { PlanBasicInfoScreen } from './PlanBasicInfoScreen';
import { AddMealsScreen } from './AddMealsScreen';
import { ReviewPlanScreen } from './ReviewPlanScreen';
import { AssignPlanScreen } from './AssignPlanScreen';
import { AddCategorySheet } from '../components/AddCategorySheet';
import { EditCategorySheet } from '../components/EditCategorySheet';
import { t } from '../translations';
import type { ClientInfo, NumberOfMeals, PlanDuration, MealPreview, FoodCategory } from '../types';
import { isRTL } from '@/src/core/constants/translations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MealPlanCreatorFlowProps {
    visible: boolean;
    client: ClientInfo;
    onClose: () => void;
    onComplete: () => void;
}

export function MealPlanCreatorFlow({
    visible,
    client,
    onClose,
    onComplete,
}: MealPlanCreatorFlowProps) {
    const carouselRef = useRef<ICarouselInstance>(null);
    const insets = useSafeAreaInsets();
    const clientName = isRTL ? client.nameAr : client.name;

    // Use the meal plan draft hook
    const {
        state: planState,
        updateBasicInfo,
        toggleMealExpanded,
        addCategory,
        updateCategory,
        removeCategory,
    } = useMealPlanDraft(clientName);

    // Modal states
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showEditCategory, setShowEditCategory] = useState(false);
    const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);

    // Navigation helpers
    const goToStep = useCallback((step: number) => {
        carouselRef.current?.scrollTo({ index: step, animated: true });
    }, []);

    const goNext = useCallback(() => {
        carouselRef.current?.next({ animated: true });
    }, []);

    const goPrev = useCallback(() => {
        carouselRef.current?.prev({ animated: true });
    }, []);

    // Handlers
    const handleBasicInfoNext = useCallback((data: {
        planName: string;
        basedOn: string | null;
        calories: number;
        numberOfMeals: NumberOfMeals;
        duration: PlanDuration;
    }) => {
        updateBasicInfo(data);
        goNext();
    }, [updateBasicInfo, goNext]);

    // Add Meals screen handlers
    const handleAddCategory = useCallback((mealId: string) => {
        setSelectedMealId(mealId);
        setShowAddCategory(true);
    }, []);

    const handleEditCategory = useCallback((mealId: string, categoryId: string) => {
        const meal = planState.meals.find(m => m.id === mealId);
        const category = meal?.categories.find(c => c.id === categoryId);
        if (category) {
            setSelectedMealId(mealId);
            setSelectedCategory(category);
            setShowEditCategory(true);
        }
    }, [planState.meals]);

    const handleSaveNewCategory = useCallback((category: FoodCategory) => {
        if (selectedMealId) {
            addCategory(selectedMealId, category);
        }
        setShowAddCategory(false);
        setSelectedMealId(null);
    }, [selectedMealId, addCategory]);

    const handleSaveEditedCategory = useCallback((category: FoodCategory) => {
        if (selectedMealId) {
            updateCategory(selectedMealId, category);
        }
        setShowEditCategory(false);
        setSelectedMealId(null);
        setSelectedCategory(null);
    }, [selectedMealId, updateCategory]);

    const handleDeleteCategory = useCallback(() => {
        if (selectedMealId && selectedCategory) {
            removeCategory(selectedMealId, selectedCategory.id);
        }
        setShowEditCategory(false);
        setSelectedMealId(null);
        setSelectedCategory(null);
    }, [selectedMealId, selectedCategory, removeCategory]);

    // Validate before going to review
    const handleAddMealsNext = useCallback(() => {
        const hasAtLeastOneCategory = planState.meals.some(meal => meal.categories.length > 0);
        if (!hasAtLeastOneCategory) {
            Alert.alert('', t.atLeastOneMeal);
            return;
        }
        goNext();
    }, [planState.meals, goNext]);

    const handleAssign = useCallback(() => {
        // TODO: Submit to backend
        onComplete();
    }, [onComplete]);

    const handleSaveDraft = useCallback(() => {
        // TODO: Save draft
        onClose();
    }, [onClose]);

    // Get current meal name for modal
    const currentMealName = selectedMealId
        ? (() => {
            const meal = planState.meals.find(m => m.id === selectedMealId);
            return meal ? (isRTL ? meal.nameAr : meal.name) : '';
        })()
        : '';

    // Generate meal previews for review screen
    const getMealIconKey = (mealId: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
        if (mealId === 'breakfast') return 'breakfast';
        if (mealId === 'lunch') return 'lunch';
        if (mealId === 'dinner') return 'dinner';
        return 'snack';
    };

    const mealPreviews: MealPreview[] = planState.meals.map((meal) => {
        const iconKey = getMealIconKey(meal.id);
        return {
            id: meal.id,
            name: meal.name,
            nameAr: meal.nameAr,
            icon: meal.id === 'breakfast' ? 'sunny-outline' : meal.id === 'lunch' ? 'restaurant-outline' : 'apple-outline',
            iconBgColor: mealIcons[iconKey]?.bgLight || '#E5E7EB',
            iconColor: mealIcons[iconKey]?.color || '#6B7280',
            categoryCount: meal.categories.length,
            optionCount: meal.categories.length * 4,
        };
    });

    // Screen data for carousel
    const screens = [
        {
            key: 'basicInfo',
            component: (
                <PlanBasicInfoScreen
                    client={client}
                    onBack={onClose}
                    onNext={handleBasicInfoNext}
                />
            ),
        },
        {
            key: 'addMeals',
            component: (
                <AddMealsScreen
                    client={client}
                    meals={planState.meals}
                    onBack={goPrev}
                    onNext={handleAddMealsNext}
                    onToggleMeal={toggleMealExpanded}
                    onAddCategory={handleAddCategory}
                    onEditCategory={handleEditCategory}
                />
            ),
        },
        {
            key: 'review',
            component: (
                <ReviewPlanScreen
                    client={client}
                    planName={planState.planName}
                    calories={planState.calories}
                    numberOfMeals={planState.numberOfMeals}
                    duration={planState.duration}
                    mealPreviews={mealPreviews}
                    onBack={goPrev}
                    onNext={goNext}
                />
            ),
        },
        {
            key: 'assign',
            component: (
                <AssignPlanScreen
                    client={client}
                    planName={planState.planName}
                    onBack={goPrev}
                    onAssign={handleAssign}
                    onSaveDraft={handleSaveDraft}
                />
            ),
        },
    ];

    const renderItem = useCallback(({ item }: { item: typeof screens[0] }) => {
        return (
            <View style={styles.slideContainer}>
                {item.component}
            </View>
        );
    }, []);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Carousel
                    ref={carouselRef}
                    data={screens}
                    renderItem={renderItem}
                    width={SCREEN_WIDTH}
                    height={SCREEN_HEIGHT}
                    loop={false}
                    enabled={false}
                    defaultIndex={0}
                />

                {/* Add Category Modal */}
                <AddCategorySheet
                    visible={showAddCategory}
                    onClose={() => {
                        setShowAddCategory(false);
                        setSelectedMealId(null);
                    }}
                    onSave={handleSaveNewCategory}
                    mealName={currentMealName}
                />

                {/* Edit Category Modal */}
                <EditCategorySheet
                    visible={showEditCategory}
                    onClose={() => {
                        setShowEditCategory(false);
                        setSelectedMealId(null);
                        setSelectedCategory(null);
                    }}
                    onSave={handleSaveEditedCategory}
                    onDelete={handleDeleteCategory}
                    category={selectedCategory}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: mealPlanColors.backgroundLight,
    },
    slideContainer: {
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
});
