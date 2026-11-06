import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface StaffUser {
  _id: string;
  employeeId?: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  organizationId?: string;
  permissions?: string[];
  portal?: string;
}

interface StaffAuthState {
  staffUser: StaffUser | null;
  staffToken: string | null;
  isStaffAuthenticated: boolean;
}

const storedStaff = localStorage.getItem('staffUser');
const storedStaffToken = localStorage.getItem('staffToken');

const initialState: StaffAuthState = {
  staffUser: storedStaff ? JSON.parse(storedStaff) : null,
  staffToken: storedStaffToken,
  isStaffAuthenticated: !!storedStaffToken,
};

const staffAuthSlice = createSlice({
  name: 'staffAuth',
  initialState,
  reducers: {
    setStaffCredentials: (
      state,
      action: PayloadAction<{ user: StaffUser; token: string; refreshToken?: string }>
    ) => {
      state.staffUser = action.payload.user;
      state.staffToken = action.payload.token;
      state.isStaffAuthenticated = true;
      localStorage.setItem('staffUser', JSON.stringify(action.payload.user));
      localStorage.setItem('staffToken', action.payload.token);
      if (action.payload.refreshToken) {
        localStorage.setItem('staffRefreshToken', action.payload.refreshToken);
      }
    },
    staffLogout: (state) => {
      state.staffUser = null;
      state.staffToken = null;
      state.isStaffAuthenticated = false;
      localStorage.removeItem('staffUser');
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffRefreshToken');
    },
  },
});

export const { setStaffCredentials, staffLogout } = staffAuthSlice.actions;
export default staffAuthSlice.reducer;

