import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import staffAuthReducer from './staffAuthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    staffAuth: staffAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
