import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import type {AuthStackScreenProps} from '../navigation/types';
import {useRegisterMutation} from '../api/authApi';
import {useAppDispatch} from '../store';
import {setCredentials} from '../store/authSlice';

export const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const [register, {isLoading}] = useRegisterMutation();

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || !confirmPassword) {
      const validationMsg = 'Please fill in all fields.';
      setError(validationMsg);
      Alert.alert('Validation Error', validationMsg);
      return;
    }

    if (password !== confirmPassword) {
      const validationMsg = 'Passwords do not match.';
      setError(validationMsg);
      Alert.alert('Validation Error', validationMsg);
      return;
    }

    if (password.length < 6) {
      const validationMsg = 'Password must be at least 6 characters long.';
      setError(validationMsg);
      Alert.alert('Validation Error', validationMsg);
      return;
    }

    setError(null);
    try {
      const result = await register({
        email: trimmedEmail.toLowerCase(),
        password,
      }).unwrap();
      dispatch(setCredentials(result));
    } catch (err: any) {
      const serverMsg =
        err?.data?.message ?? err?.error ?? 'Registration failed';
      setError(serverMsg);
      Alert.alert('Registration Failed', serverMsg);
    }
  };

  const handleNavigateToLogin = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="register-screen">
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start organizing tasks</Text>

          {error ? (
            <View
              style={styles.errorContainer}
              testID="register-error-container">
              <Text style={styles.errorText} testID="register-error-text">
                {error}
              </Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="register-email-input"
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (error) {
                  setError(null);
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              testID="register-password-input"
              style={styles.input}
              placeholder="Enter password (min 6 characters)"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (error) {
                  setError(null);
                }
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              testID="register-confirm-password-input"
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (error) {
                  setError(null);
                }
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            testID="register-button"
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator
                testID="register-loading-indicator"
                color={Colors.white}
                size="small"
              />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              testID="navigate-login-button"
              onPress={handleNavigateToLogin}
              disabled={isLoading}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...Typography.small,
    color: Colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  linkText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '600',
  },
});

export default RegisterScreen;
