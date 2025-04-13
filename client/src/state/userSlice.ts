import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Manager, Tenant } from '@/types/prismaTypes';

export interface UserState {
  user: {
    id?: string;
    supabaseId?: string;
    email?: string;
    role?: string;
    name?: string;
    phoneNumber?: string;
    properties?: any[];
    favorites?: any[];
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Tenant | Manager | null>) => {
      if (action.payload) {
        state.user = {
          ...action.payload,
        };
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    rehydrationComplete: (state) => {
      state.loading = false;
    },
  },
});

export const { setUser, clearUser, setLoading, rehydrationComplete } =
  userSlice.actions;

export default userSlice.reducer;
