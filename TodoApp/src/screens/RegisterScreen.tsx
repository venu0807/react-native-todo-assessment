import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';
import type {AuthStackScreenProps} from '../navigation/types';

export const RegisterScreen: React.FC<
  AuthStackScreenProps<'Register'>
> = () => {
  return (
    <View style={styles.container} testID="register-screen">
      <Text style={styles.title}>Register</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
