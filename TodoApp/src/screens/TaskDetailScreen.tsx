import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';
import type {AppStackScreenProps} from '../navigation/types';

export const TaskDetailScreen: React.FC<
  AppStackScreenProps<'TaskDetail'>
> = () => {
  return (
    <View style={styles.container} testID="task-detail-screen">
      <Text style={styles.title}>Task Detail</Text>
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

export default TaskDetailScreen;
