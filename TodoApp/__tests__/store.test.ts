import {store, RootState} from '../src/store';
import {describe, it, expect, beforeEach, jest} from '@jest/globals';
import authReducer, {
  setCredentials,
  logout,
  restoreSession,
} from '../src/store/authSlice';
import {authApi} from '../src/api/authApi';
import {tasksApi} from '../src/api/tasksApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '../src/types';

describe('Auth Slice', () => {
  const dummyUser: User = {
    _id: 'user-123',
    email: 'test@example.com',
  };

  const dummyToken = 'jwt-token-xyz';

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(AsyncStorage, 'removeItem')
      .mockImplementation(() => Promise.resolve());
  });

  it('should have correct initial state', () => {
    const state = authReducer(undefined, {type: '@@INIT'});
    expect(state).toEqual({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('should handle setCredentials and persist to AsyncStorage', () => {
    const prevState = {
      token: null,
      user: null,
      isAuthenticated: false,
    };

    const nextState = authReducer(
      prevState,
      setCredentials({token: dummyToken, user: dummyUser}),
    );

    expect(nextState).toEqual({
      token: dummyToken,
      user: dummyUser,
      isAuthenticated: true,
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', dummyToken);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(dummyUser),
    );
  });

  it('should handle logout and remove from AsyncStorage', () => {
    const prevState = {
      token: dummyToken,
      user: dummyUser,
      isAuthenticated: true,
    };

    const nextState = authReducer(prevState, logout());

    expect(nextState).toEqual({
      token: null,
      user: null,
      isAuthenticated: false,
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('should handle restoreSession without writing to AsyncStorage', () => {
    const prevState = {
      token: null,
      user: null,
      isAuthenticated: false,
    };

    const nextState = authReducer(
      prevState,
      restoreSession({token: dummyToken, user: dummyUser}),
    );

    expect(nextState).toEqual({
      token: dummyToken,
      user: dummyUser,
      isAuthenticated: true,
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should handle restoreSession with null values', () => {
    const prevState = {
      token: dummyToken,
      user: dummyUser,
      isAuthenticated: true,
    };

    const nextState = authReducer(
      prevState,
      restoreSession({token: null, user: null}),
    );

    expect(nextState).toEqual({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  });
});

describe('Redux Store & API Slices', () => {
  it('should configure store with auth, authApi, and tasksApi reducers', () => {
    const state: RootState = store.getState();

    expect(state.auth).toBeDefined();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state[authApi.reducerPath]).toBeDefined();
    expect(state[tasksApi.reducerPath]).toBeDefined();
  });

  it('should have correct endpoints registered in authApi', () => {
    expect(authApi.reducerPath).toBe('authApi');
    expect(authApi.endpoints.login).toBeDefined();
    expect(authApi.endpoints.register).toBeDefined();
  });

  it('should have correct endpoints and tagTypes registered in tasksApi', () => {
    expect(tasksApi.reducerPath).toBe('tasksApi');
    expect(tasksApi.endpoints.getTasks).toBeDefined();
    expect(tasksApi.endpoints.createTask).toBeDefined();
    expect(tasksApi.endpoints.updateTask).toBeDefined();
    expect(tasksApi.endpoints.deleteTask).toBeDefined();
  });
});
