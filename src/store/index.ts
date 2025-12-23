import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userReducer from './userSlice';
import mealsReducer from './mealsSlice';
import waterReducer from './waterSlice';

// Persist configuration
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['user', 'meals', 'water'], // All reducers will be persisted
};

// Combine all reducers
const rootReducer = combineReducers({
    user: userReducer,
    meals: mealsReducer,
    water: waterReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist actions
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

// Create persistor
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type { RootState } from './types';
