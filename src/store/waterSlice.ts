import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WaterLog {
    id: number;
    amount: number;
    time: string;
    percentage: number;
}

export interface WaterState {
    intake: number;
    goal: number;
    logs: WaterLog[];
    lastResetDate: string;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialState: WaterState = {
    intake: 0,
    goal: 8, // Default 8 cups
    logs: [],
    lastResetDate: getTodayDate(),
};

const waterSlice = createSlice({
    name: 'water',
    initialState,
    reducers: {
        // Add water intake
        addWater: (state, action: PayloadAction<number>) => {
            const amount = action.payload;

            // Reset if it's a new day
            const today = getTodayDate();
            if (state.lastResetDate !== today) {
                state.intake = 0;
                state.logs = [];
                state.lastResetDate = today;
            }

            state.intake += amount;

            const newLog: WaterLog = {
                id: Date.now(),
                amount: amount,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                percentage: Math.min((state.intake / state.goal) * 100, 100),
            };

            state.logs.unshift(newLog);
        },

        // Set daily goal
        setGoal: (state, action: PayloadAction<number>) => {
            state.goal = Math.max(1, Math.min(20, action.payload));
        },

        // Undo last entry
        undoLast: (state) => {
            if (state.logs.length > 0) {
                const lastLog = state.logs[0];
                state.intake = Math.max(0, state.intake - lastLog.amount);
                state.logs.shift();
            }
        },

        // Reset daily intake
        resetDaily: (state) => {
            state.intake = 0;
            state.logs = [];
            state.lastResetDate = getTodayDate();
        },

        // Check and reset if it's a new day (call on app/component load)
        checkAndResetDaily: (state) => {
            const today = getTodayDate();
            if (state.lastResetDate !== today) {
                state.intake = 0;
                state.logs = [];
                state.lastResetDate = today;
            }
        },
    },
});

export const { addWater, setGoal, undoLast, resetDaily, checkAndResetDaily } = waterSlice.actions;

// Selectors
export const selectWaterIntake = (state: { water: WaterState }) => state.water.intake;
export const selectWaterGoal = (state: { water: WaterState }) => state.water.goal;
export const selectWaterLogs = (state: { water: WaterState }) => state.water.logs;
export const selectWaterPercentage = (state: { water: WaterState }) =>
    Math.min((state.water.intake / state.water.goal) * 100, 100);

export default waterSlice.reducer;
