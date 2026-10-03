import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';
import type {AppStackScreenProps} from '../navigation/types';

export const TaskFormScreen: React.FC<AppStackScreenProps<'TaskForm'>> = () => {
  return (
    <View style={styles.container} testID="task-form-screen">
      <Text style={styles.title}>Task Form</Text>
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

export default TaskFormScreen;
