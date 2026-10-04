import React from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect, beforeEach, afterEach, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';

import authReducer from '../src/store/authSlice';
import {authApi} from '../src/api/authApi';
import {tasksApi} from '../src/api/tasksApi';
import {RootNavigator} from '../src/navigation/RootNavigator';
import {AuthNavigator} from '../src/navigation/AuthNavigator';
import {AppNavigator} from '../src/navigation/AppNavigator';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import HomeScreen from '../src/screens/HomeScreen';
import TaskFormScreen from '../src/screens/TaskFormScreen';
import TaskDetailScreen from '../src/screens/TaskDetailScreen';

import type {AuthState} from '../src/types';

const createTestStore = (initialAuthState: Partial<AuthState> = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [tasksApi.reducerPath]: tasksApi.reducer,
    },
    preloadedState: {
      auth: {
        token: null,
        user: null,
        isAuthenticated: false,
        ...initialAuthState,
      },
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(authApi.middleware, tasksApi.middleware),
  });
};

describe('Navigation & RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('RootNavigator Session Hydration & Routing', () => {
    it('renders loading spinner while checking AsyncStorage session', async () => {
      // Mock AsyncStorage to return an unresolved promise initially
      let resolveGetItem: ((value: any) => void) | undefined;
      const pendingPromise = new Promise<any>(resolve => {
        resolveGetItem = resolve;
      });
      (AsyncStorage.getItem as jest.Mock<any>).mockReturnValue(pendingPromise);

      const store = createTestStore();
      let testRenderer: renderer.ReactTestRenderer;

      act(() => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <RootNavigator />
          </Provider>,
        );
      });

      const spinner = testRenderer!.root.findByProps({
        testID: 'auth-loading-spinner',
      });
      expect(spinner).toBeDefined();

      // Resolve AsyncStorage to finish hydration
      await act(async () => {
        resolveGetItem?.(null);
        jest.runOnlyPendingTimers();
      });
    });

    it('navigates to AuthNavigator (LoginScreen) when no session is found', async () => {
      (AsyncStorage.getItem as jest.Mock<any>).mockResolvedValue(null);

      const store = createTestStore();
      let testRenderer: renderer.ReactTestRenderer;

      await act(async () => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <RootNavigator />
          </Provider>,
        );
        jest.runOnlyPendingTimers();
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('token');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
      expect(store.getState().auth.isAuthenticated).toBe(false);

      const loginScreen = testRenderer!.root.findByProps({
        testID: 'login-screen',
      });
      expect(loginScreen).toBeDefined();
    });

    it('navigates to AppNavigator (HomeScreen) when valid session is restored', async () => {
      const mockUser = {_id: 'u-1', email: 'test@domain.com'};
      (AsyncStorage.getItem as jest.Mock<any>).mockImplementation(((
        key: string,
      ) => {
        if (key === 'token') {
          return Promise.resolve('valid-token-123');
        }
        if (key === 'user') {
          return Promise.resolve(JSON.stringify(mockUser));
        }
        return Promise.resolve(null);
      }) as any);

      const store = createTestStore();
      let testRenderer: renderer.ReactTestRenderer;

      await act(async () => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <RootNavigator />
          </Provider>,
        );
        jest.runOnlyPendingTimers();
      });

      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.token).toBe('valid-token-123');
      expect(store.getState().auth.user).toEqual(mockUser);

      const homeScreen = testRenderer!.root.findByProps({
        testID: 'home-screen',
      });
      expect(homeScreen).toBeDefined();
    });

    it('handles malformed JSON in user storage gracefully by falling back to unauthenticated', async () => {
      (AsyncStorage.getItem as jest.Mock<any>).mockImplementation(((
        key: string,
      ) => {
        if (key === 'token') {
          return Promise.resolve('valid-token');
        }
        if (key === 'user') {
          return Promise.resolve('{invalid-json');
        }
        return Promise.resolve(null);
      }) as any);

      const store = createTestStore();
      let testRenderer: renderer.ReactTestRenderer;

      await act(async () => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <RootNavigator />
          </Provider>,
        );
        jest.runOnlyPendingTimers();
      });

      expect(store.getState().auth.isAuthenticated).toBe(false);
      const loginScreen = testRenderer!.root.findByProps({
        testID: 'login-screen',
      });
      expect(loginScreen).toBeDefined();
    });

    it('handles AsyncStorage error gracefully and presents AuthNavigator', async () => {
      (AsyncStorage.getItem as jest.Mock<any>).mockRejectedValue(
        new Error('Storage failure'),
      );

      const store = createTestStore();
      let testRenderer: renderer.ReactTestRenderer;

      await act(async () => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <RootNavigator />
          </Provider>,
        );
        jest.runOnlyPendingTimers();
      });

      expect(store.getState().auth.isAuthenticated).toBe(false);
      const loginScreen = testRenderer!.root.findByProps({
        testID: 'login-screen',
      });
      expect(loginScreen).toBeDefined();
    });
  });

  describe('Navigator Components & Stacks', () => {
    it('renders AuthNavigator inside NavigationContainer with LoginScreen initial route', async () => {
      let testRenderer: renderer.ReactTestRenderer;
      const store = createTestStore();

      await act(async () => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <NavigationContainer>
              <AuthNavigator />
            </NavigationContainer>
          </Provider>,
        );
        jest.runOnlyPendingTimers();
      });

      expect(
        testRenderer!.root.findByProps({testID: 'login-screen'}),
      ).toBeDefined();
    });

    it('renders AppNavigator inside NavigationContainer with HomeScreen initial route', async () => {
      let testRenderer: renderer.ReactTestRenderer;
      const store = createTestStore({
        token: 'token-123',
        user: {_id: 'u-1', email: 'test@domain.com'},
        isAuthenticated: true,
      });

      await act(async () => {
        testRenderer = renderer.create(
          <Provider store={store}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </Provider>,
        );
        jest.runOnlyPendingTimers();
      });

      expect(
        testRenderer!.root.findByProps({testID: 'home-screen'}),
      ).toBeDefined();
    });
  });

  describe('Screen Stubs', () => {
    it('renders LoginScreen stub correctly', () => {
      const store = createTestStore();
      const tree = renderer.create(
        <Provider store={store}>
          <LoginScreen route={{} as any} navigation={{} as any} />
        </Provider>,
      );
      expect(tree.root.findByProps({testID: 'login-screen'})).toBeDefined();
    });

    it('renders RegisterScreen stub correctly', () => {
      const store = createTestStore();
      const tree = renderer.create(
        <Provider store={store}>
          <RegisterScreen route={{} as any} navigation={{} as any} />
        </Provider>,
      );
      expect(tree.root.findByProps({testID: 'register-screen'})).toBeDefined();
    });

    it('renders HomeScreen stub correctly', () => {
      const store = createTestStore({
        token: 'token-123',
        user: {_id: 'u-1', email: 'test@domain.com'},
        isAuthenticated: true,
      });
      const tree = renderer.create(
        <Provider store={store}>
          <HomeScreen route={{} as any} navigation={{} as any} />
        </Provider>,
      );
      expect(tree.root.findByProps({testID: 'home-screen'})).toBeDefined();
    });

    it('renders TaskFormScreen stub correctly', () => {
      const store = createTestStore();
      const tree = renderer.create(
        <Provider store={store}>
          <TaskFormScreen route={{} as any} navigation={{} as any} />
        </Provider>,
      );
      expect(tree.root.findByProps({testID: 'task-form-screen'})).toBeDefined();
    });

    it('renders TaskDetailScreen stub correctly', () => {
      const tree = renderer.create(
        <TaskDetailScreen route={{} as any} navigation={{} as any} />,
      );
      expect(
        tree.root.findByProps({testID: 'task-detail-screen'}),
      ).toBeDefined();
    });
  });
});
