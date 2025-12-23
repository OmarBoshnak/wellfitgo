import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { UserState, RootState, WeightEntry } from './types';

const initialState: UserState = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    age: '',
    height: '',
    heightUnit: 'cm',
    currentWeight: '',
    targetWeight: '',
    startWeight: 0,
    goal: '',
    medicalConditions: '',
    weightHistory: [],
    isOnboarded: false,
};

interface HealthData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: 'male' | 'female' | '';
    age: string;
    height: string;
    heightUnit: 'cm' | 'ft';
    currentWeight: string;
    targetWeight: string;
    goal: 'loss' | 'maintain' | 'gain' | '';
    medicalConditions: string;
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setHealthData: (state, action: PayloadAction<HealthData>) => {
            const data = action.payload;
            state.firstName = data.firstName;
            state.lastName = data.lastName;
            state.phoneNumber = data.phoneNumber;
            state.gender = data.gender;
            state.age = data.age;
            state.height = data.height;
            state.heightUnit = data.heightUnit;
            state.currentWeight = data.currentWeight;
            state.targetWeight = data.targetWeight;
            state.goal = data.goal;
            state.medicalConditions = data.medicalConditions;
            state.isOnboarded = true;

            // Initialize weight history with current weight as the first entry
            if (data.currentWeight) {
                const weight = parseFloat(data.currentWeight);
                state.startWeight = weight;
                state.weightHistory = [{
                    id: `weight_${Date.now()}`,
                    date: new Date().toISOString(),
                    value: weight,
                }];
            }
        },
        addWeightEntry: (state, action: PayloadAction<number>) => {
            const newEntry: WeightEntry = {
                id: `weight_${Date.now()}`,
                date: new Date().toISOString(),
                value: action.payload,
            };
            state.weightHistory.push(newEntry);
            // Update current weight string as well
            state.currentWeight = action.payload.toString();
        },
        updateCurrentWeight: (state, action: PayloadAction<string>) => {
            state.currentWeight = action.payload;
        },
        updateTargetWeight: (state, action: PayloadAction<string>) => {
            state.targetWeight = action.payload;
        },
        resetUser: () => initialState,
    },
});

// Selectors
const selectUser = (state: RootState) => state.user;
const selectWeightHistory = (state: RootState) => state.user.weightHistory;
const selectStartWeight = (state: RootState) => state.user.startWeight;
const selectTargetWeight = (state: RootState) => parseFloat(state.user.targetWeight) || 0;
const selectGoal = (state: RootState) => state.user.goal;

// Get the current weight (last entry) or fallback to startWeight
export const selectCurrentWeight = createSelector(
    [selectWeightHistory, selectStartWeight, selectUser],
    (history, startWeight, user) => {
        if (history.length > 0) {
            return history[history.length - 1].value;
        }
        // Fallback to currentWeight string from user state or startWeight
        const fromUser = parseFloat(user.currentWeight);
        return !isNaN(fromUser) ? fromUser : startWeight || 0;
    }
);

// Get the previous weight (second to last entry) or fallback to current
export const selectPreviousWeight = createSelector(
    [selectWeightHistory, selectCurrentWeight],
    (history, currentWeight) => {
        if (history.length > 1) {
            return history[history.length - 2].value;
        }
        // If only one or no entries, return current weight (no change)
        return currentWeight;
    }
);

// Weight change from previous to current (positive = lost weight)
export const selectWeightChange = createSelector(
    [selectPreviousWeight, selectCurrentWeight],
    (previousWeight, currentWeight) => {
        return previousWeight - currentWeight;
    }
);

// Get weekly data for the chart (last 6 entries as numbers)
export const selectWeeklyData = createSelector(
    [selectWeightHistory, selectStartWeight, selectUser],
    (history, startWeight, user) => {
        if (history.length === 0) {
            // If no history, return startWeight as single entry
            const fallback = parseFloat(user.currentWeight) || startWeight || 70;
            return [fallback];
        }
        // Return last 6 entries' values
        const recentHistory = history.slice(-6);
        return recentHistory.map(entry => entry.value);
    }
);

// Calculate progress percentage towards target
export const selectProgress = createSelector(
    [selectStartWeight, selectCurrentWeight, selectTargetWeight, selectGoal],
    (startWeight, currentWeight, targetWeight, goal) => {
        if (!startWeight || !targetWeight) return 0;

        if (goal === 'loss') {
            const totalToLose = startWeight - targetWeight;
            if (totalToLose <= 0) return 0;
            const alreadyLost = startWeight - currentWeight;
            return Math.min(Math.max(Math.round((alreadyLost / totalToLose) * 100), 0), 100);
        } else if (goal === 'gain') {
            const totalToGain = targetWeight - startWeight;
            if (totalToGain <= 0) return 0;
            const alreadyGained = currentWeight - startWeight;
            return Math.min(Math.max(Math.round((alreadyGained / totalToGain) * 100), 0), 100);
        }
        // For maintain goal
        return 100;
    }
);

// Total progress in kg (positive = lost weight for loss goal)
export const selectTotalProgress = createSelector(
    [selectStartWeight, selectCurrentWeight],
    (startWeight, currentWeight) => {
        return startWeight - currentWeight;
    }
);

export const { setHealthData, addWeightEntry, updateCurrentWeight, updateTargetWeight, resetUser } = userSlice.actions;
export default userSlice.reducer;
