import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Admin state (separate from user)
interface AdminAuthState {
  admin: User | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
}

// User storage (for regular users only)
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

// Admin storage (separate from users)
const storedAdmin = localStorage.getItem('admin');
const storedAdminToken = localStorage.getItem('adminToken');

const initialState: AuthState & AdminAuthState = {
  // User state
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  // Admin state (separate)
  admin: storedAdmin ? JSON.parse(storedAdmin) : null,
  adminToken: storedAdminToken,
  isAdminAuthenticated: !!storedAdminToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // For regular users only
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      // Only set user credentials if NOT admin
      if (action.payload.user.role !== 'admin') {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      }
    },
    // For admin only (separate storage)
    setAdminCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.admin = action.payload.user;
      state.adminToken = action.payload.token;
      state.isAdminAuthenticated = true;
      localStorage.setItem('admin', JSON.stringify(action.payload.user));
      localStorage.setItem('adminToken', action.payload.token);
    },
    // Logout regular user
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    // Logout admin only
    adminLogout: (state) => {
      state.admin = null;
      state.adminToken = null;
      state.isAdminAuthenticated = false;
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
    },
  },
});

export const { setCredentials, setAdminCredentials, logout, adminLogout } = authSlice.actions;
export default authSlice.reducer;
