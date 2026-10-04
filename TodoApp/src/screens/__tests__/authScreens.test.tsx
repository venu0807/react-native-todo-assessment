import React from 'react';
import {Alert} from 'react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect, beforeEach, afterEach, jest} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from '../../store/authSlice';
import LoginScreen from '../LoginScreen';
import RegisterScreen from '../RegisterScreen';

const mockLoginUnwrap = jest.fn<() => Promise<any>>();
const mockLoginTrigger = jest.fn(() => ({unwrap: mockLoginUnwrap}));
let mockLoginState = {isLoading: false};

const mockRegisterUnwrap = jest.fn<() => Promise<any>>();
const mockRegisterTrigger = jest.fn(() => ({unwrap: mockRegisterUnwrap}));
let mockRegisterState = {isLoading: false};

jest.mock('../../api/authApi', () => {
  const actual = jest.requireActual('../../api/authApi') as any;
  return {
    ...actual,
    useLoginMutation: () => [mockLoginTrigger, mockLoginState],
    useRegisterMutation: () => [mockRegisterTrigger, mockRegisterState],
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  dispatch: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  getId: jest.fn(),
  getState: jest.fn(),
  getParent: jest.fn(),
  setOptions: jest.fn(),
});

describe('Auth Screens', () => {
  let alertSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoginState = {isLoading: false};
    mockRegisterState = {isLoading: false};
    alertSpy = jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('LoginScreen', () => {
    it('renders email input, password input, submit button, and register link', () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      expect(root.findByProps({testID: 'login-screen'})).toBeDefined();
      expect(root.findByProps({testID: 'email-input'})).toBeDefined();
      expect(root.findByProps({testID: 'password-input'})).toBeDefined();
      expect(root.findByProps({testID: 'login-button'})).toBeDefined();
      expect(
        root.findByProps({testID: 'navigate-register-button'}),
      ).toBeDefined();

      const emailInput = root.findByProps({testID: 'email-input'});
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');

      const passwordInput = root.findByProps({testID: 'password-input'});
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('validates blank email and password and shows alert without calling login mutation', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      const submitBtn = root.findByProps({testID: 'login-button'});

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        expect.stringContaining('Please enter both email and password'),
      );
      expect(mockLoginTrigger).not.toHaveBeenCalled();

      // Error message should also appear in the UI
      const errorText = root.findByProps({testID: 'login-error-text'});
      expect(errorText.props.children).toContain(
        'Please enter both email and password',
      );
    });

    it('validates whitespace-only email as blank', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'email-input'});
      const passwordInput = root.findByProps({testID: 'password-input'});
      const submitBtn = root.findByProps({testID: 'login-button'});

      act(() => {
        emailInput.props.onChangeText('   ');
        passwordInput.props.onChangeText('password123');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        expect.any(String),
      );
      expect(mockLoginTrigger).not.toHaveBeenCalled();
    });

    it('successfully calls login mutation and dispatches setCredentials on valid submission', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();
      const authPayload = {
        token: 'mock-jwt-token-xyz',
        user: {
          _id: 'usr-101',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2026-10-04T00:00:00.000Z',
          updatedAt: '2026-10-04T00:00:00.000Z',
        },
      };
      mockLoginUnwrap.mockResolvedValueOnce(authPayload);

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'email-input'});
      const passwordInput = root.findByProps({testID: 'password-input'});
      const submitBtn = root.findByProps({testID: 'login-button'});

      act(() => {
        emailInput.props.onChangeText('  Test@Example.COM  ');
        passwordInput.props.onChangeText('SecurePass123!');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(mockLoginTrigger).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      expect(mockLoginUnwrap).toHaveBeenCalledTimes(1);

      // Verify Redux state updated via setCredentials
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.token).toBe('mock-jwt-token-xyz');
      expect(store.getState().auth.user).toEqual(authPayload.user);

      // Verify AsyncStorage calls triggered by setCredentials
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'token',
        'mock-jwt-token-xyz',
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(authPayload.user),
      );
    });

    it('handles login API failure and displays error alert and UI banner', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();
      mockLoginUnwrap.mockRejectedValueOnce({
        data: {message: 'Invalid email or password'},
      });

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'email-input'});
      const passwordInput = root.findByProps({testID: 'password-input'});
      const submitBtn = root.findByProps({testID: 'login-button'});

      act(() => {
        emailInput.props.onChangeText('wrong@user.com');
        passwordInput.props.onChangeText('wrongpass');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid email or password',
      );
      expect(store.getState().auth.isAuthenticated).toBe(false);

      const errorText = root.findByProps({testID: 'login-error-text'});
      expect(errorText.props.children).toBe('Invalid email or password');
    });

    it('displays ActivityIndicator when login is loading', () => {
      mockLoginState = {isLoading: true};
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      expect(
        root.findByProps({testID: 'login-loading-indicator'}),
      ).toBeDefined();

      const button = root.findByProps({testID: 'login-button'});
      expect(button.props.disabled).toBe(true);
    });

    it('navigates to Register screen when register link is clicked', () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <LoginScreen navigation={mockNavigation as any} route={{} as any} />
          </Provider>,
        );
      });

      const root = tree!.root;
      const registerLink = root.findByProps({
        testID: 'navigate-register-button',
      });

      act(() => {
        registerLink.props.onPress();
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('RegisterScreen', () => {
    it('renders email, password, confirm password inputs, submit button, and login link', () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      expect(root.findByProps({testID: 'register-screen'})).toBeDefined();
      expect(root.findByProps({testID: 'register-email-input'})).toBeDefined();
      expect(
        root.findByProps({testID: 'register-password-input'}),
      ).toBeDefined();
      expect(
        root.findByProps({testID: 'register-confirm-password-input'}),
      ).toBeDefined();
      expect(root.findByProps({testID: 'register-button'})).toBeDefined();
      expect(root.findByProps({testID: 'navigate-login-button'})).toBeDefined();

      const emailInput = root.findByProps({testID: 'register-email-input'});
      expect(emailInput.props.keyboardType).toBe('email-address');

      const passInput = root.findByProps({testID: 'register-password-input'});
      expect(passInput.props.secureTextEntry).toBe(true);

      const confirmInput = root.findByProps({
        testID: 'register-confirm-password-input',
      });
      expect(confirmInput.props.secureTextEntry).toBe(true);
    });

    it('validates blank fields on submission', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const submitBtn = root.findByProps({testID: 'register-button'});

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please fill in all fields.',
      );
      expect(mockRegisterTrigger).not.toHaveBeenCalled();

      const errorText = root.findByProps({testID: 'register-error-text'});
      expect(errorText.props.children).toBe('Please fill in all fields.');
    });

    it('validates password matching when passwords do not match', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'register-email-input'});
      const passwordInput = root.findByProps({
        testID: 'register-password-input',
      });
      const confirmInput = root.findByProps({
        testID: 'register-confirm-password-input',
      });
      const submitBtn = root.findByProps({testID: 'register-button'});

      act(() => {
        emailInput.props.onChangeText('alice@example.com');
        passwordInput.props.onChangeText('password123');
        confirmInput.props.onChangeText('differentpassword');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Passwords do not match.',
      );
      expect(mockRegisterTrigger).not.toHaveBeenCalled();

      const errorText = root.findByProps({testID: 'register-error-text'});
      expect(errorText.props.children).toBe('Passwords do not match.');
    });

    it('validates minimum password length when password is less than 6 characters', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'register-email-input'});
      const passwordInput = root.findByProps({
        testID: 'register-password-input',
      });
      const confirmInput = root.findByProps({
        testID: 'register-confirm-password-input',
      });
      const submitBtn = root.findByProps({testID: 'register-button'});

      act(() => {
        emailInput.props.onChangeText('alice@example.com');
        passwordInput.props.onChangeText('12345');
        confirmInput.props.onChangeText('12345');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Password must be at least 6 characters long.',
      );
      expect(mockRegisterTrigger).not.toHaveBeenCalled();

      const errorText = root.findByProps({testID: 'register-error-text'});
      expect(errorText.props.children).toBe(
        'Password must be at least 6 characters long.',
      );
    });

    it('successfully calls register mutation and dispatches setCredentials on valid input', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();
      const authPayload = {
        token: 'new-user-token-abc',
        user: {
          _id: 'usr-202',
          email: 'newuser@example.com',
          name: 'New User',
          createdAt: '2026-10-04T00:00:00.000Z',
          updatedAt: '2026-10-04T00:00:00.000Z',
        },
      };
      mockRegisterUnwrap.mockResolvedValueOnce(authPayload);

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'register-email-input'});
      const passwordInput = root.findByProps({
        testID: 'register-password-input',
      });
      const confirmInput = root.findByProps({
        testID: 'register-confirm-password-input',
      });
      const submitBtn = root.findByProps({testID: 'register-button'});

      act(() => {
        emailInput.props.onChangeText('  NewUser@example.com ');
        passwordInput.props.onChangeText('SecureSecret123');
        confirmInput.props.onChangeText('SecureSecret123');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(mockRegisterTrigger).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecureSecret123',
      });
      expect(mockRegisterUnwrap).toHaveBeenCalledTimes(1);

      // Verify Redux state updated
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.token).toBe('new-user-token-abc');
      expect(store.getState().auth.user).toEqual(authPayload.user);

      // Verify AsyncStorage updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'token',
        'new-user-token-abc',
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(authPayload.user),
      );
    });

    it('handles register API failure and displays error alert and UI banner', async () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();
      mockRegisterUnwrap.mockRejectedValueOnce({
        data: {message: 'Email already exists'},
      });

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const emailInput = root.findByProps({testID: 'register-email-input'});
      const passwordInput = root.findByProps({
        testID: 'register-password-input',
      });
      const confirmInput = root.findByProps({
        testID: 'register-confirm-password-input',
      });
      const submitBtn = root.findByProps({testID: 'register-button'});

      act(() => {
        emailInput.props.onChangeText('existing@example.com');
        passwordInput.props.onChangeText('Password123');
        confirmInput.props.onChangeText('Password123');
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Registration Failed',
        'Email already exists',
      );
      expect(store.getState().auth.isAuthenticated).toBe(false);

      const errorText = root.findByProps({testID: 'register-error-text'});
      expect(errorText.props.children).toBe('Email already exists');
    });

    it('displays ActivityIndicator when registration is loading', () => {
      mockRegisterState = {isLoading: true};
      const store = createTestStore();
      const mockNavigation = createMockNavigation();

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      expect(
        root.findByProps({testID: 'register-loading-indicator'}),
      ).toBeDefined();

      const button = root.findByProps({testID: 'register-button'});
      expect(button.props.disabled).toBe(true);
    });

    it('navigates back to Login screen via goBack if canGoBack is true', () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();
      mockNavigation.canGoBack.mockReturnValue(true);

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const loginLink = root.findByProps({testID: 'navigate-login-button'});

      act(() => {
        loginLink.props.onPress();
      });

      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('navigates to Login screen via navigate if canGoBack is false', () => {
      const store = createTestStore();
      const mockNavigation = createMockNavigation();
      mockNavigation.canGoBack.mockReturnValue(false);

      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Provider store={store}>
            <RegisterScreen
              navigation={mockNavigation as any}
              route={{} as any}
            />
          </Provider>,
        );
      });

      const root = tree!.root;
      const loginLink = root.findByProps({testID: 'navigate-login-button'});

      act(() => {
        loginLink.props.onPress();
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
});
