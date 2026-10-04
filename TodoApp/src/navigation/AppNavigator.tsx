import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {AppStackParamList} from './types';
import HomeScreen from '../screens/HomeScreen';
import TaskFormScreen from '../screens/TaskFormScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import {Colors} from '../theme/colors';

const Stack = createStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.card,
        },
        headerTintColor: Colors.text,
        cardStyle: {
          backgroundColor: Colors.background,
        },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'My Tasks', headerShown: false}}
      />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{title: 'Task'}}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{title: 'Task Details'}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
