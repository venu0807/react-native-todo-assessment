import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AuthState, User} from '../types';

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{token: string; user: User}>,
    ) => {
      const {token, user} = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      AsyncStorage.setItem('token', token).catch(error => {
        console.error('Failed to persist token to AsyncStorage:', error);
      });
      AsyncStorage.setItem('user', JSON.stringify(user)).catch(error => {
        console.error('Failed to persist user to AsyncStorage:', error);
      });
    },
    logout: state => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      AsyncStorage.removeItem('token').catch(error => {
        console.error('Failed to remove token from AsyncStorage:', error);
      });
      AsyncStorage.removeItem('user').catch(error => {
        console.error('Failed to remove user from AsyncStorage:', error);
      });
    },
    restoreSession: (
      state,
      action: PayloadAction<{token: string | null; user: User | null}>,
    ) => {
      const {token, user} = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = Boolean(token && user);
    },
  },
});

export const {setCredentials, logout, restoreSession} = authSlice.actions;
export default authSlice.reducer;
