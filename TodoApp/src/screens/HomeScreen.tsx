import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import type {AppStackScreenProps} from '../navigation/types';
import type {Task} from '../types';
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from '../api/tasksApi';
import {useAppDispatch} from '../store';
import {logout} from '../store/authSlice';
import {sortTasks} from '../utils';
import {FilterTabs, FilterType} from '../components/FilterTabs';
import {TaskCard} from '../components/TaskCard';
import {FAB} from '../components/FAB';

export const HomeScreen: React.FC<AppStackScreenProps<'Home'>> = ({
  navigation,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const dispatch = useAppDispatch();

  const {data: tasks = [], isLoading, refetch} = useGetTasksQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  useEffect(() => {
    navigation?.setOptions?.({
      headerShown: false,
      title: `My Tasks (${tasks.length})`,
    });
  }, [navigation, tasks.length]);

  const displayedTasks = useMemo(() => {
    return sortTasks(tasks, filter);
  }, [tasks, filter]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const handleToggleComplete = async (item: Task) => {
    try {
      const res = updateTask({
        id: item._id,
        data: {completed: !item.completed},
      });
      if (res && typeof res.unwrap === 'function') {
        await res.unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleDeleteTask = (item: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${item.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = deleteTask(item._id);
              if (res && typeof res.unwrap === 'function') {
                await res.unwrap();
              }
            } catch (error) {
              console.error('Failed to delete task:', error);
            }
          },
        },
      ],
    );
  };

  const renderEmptyState = () => {
    let emptyIcon = '📝';
    let emptyTitle = 'No Tasks Yet';
    let emptySubtitle =
      'Ready to organize your day? Tap + to create your first task.';

    if (filter === 'active') {
      emptyIcon = '✨';
      emptyTitle = 'No Active Tasks';
      emptySubtitle =
        "You're all caught up! Enjoy your day or create a new task.";
    } else if (filter === 'completed') {
      emptyIcon = '🎯';
      emptyTitle = 'No Completed Tasks';
      emptySubtitle = 'Complete some tasks to see them listed here!';
    }

    return (
      <View style={styles.emptyContainer} testID="empty-state">
        <Text style={styles.emptyIcon} testID="empty-state-icon">
          {emptyIcon}
        </Text>
        <Text style={styles.emptyTitle} testID="empty-state-title">
          {emptyTitle}
        </Text>
        <Text style={styles.emptySubtitle} testID="empty-state-text">
          {emptySubtitle}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered]}
        testID="home-screen">
        <ActivityIndicator
          size="large"
          color={Colors.accent}
          testID="loading-indicator"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header with Task Count & Logout Action */}
      <View style={styles.header} testID="home-header">
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} testID="home-title">
            {`My Tasks (${tasks.length})`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
          accessibilityRole="button"
          accessibilityLabel="Logout">
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <FilterTabs active={filter} onChange={setFilter} testID="filter-tabs" />

      {/* Task List */}
      <FlatList
        data={displayedTasks}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <TaskCard
            key={item._id}
            testID={`task-card-${item._id}`}
            task={item}
            onPress={() =>
              navigation.navigate('TaskDetail', {taskId: item._id})
            }
            onComplete={() => handleToggleComplete(item)}
            onDelete={() => handleDeleteTask(item)}
          />
        )}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          displayedTasks.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        testID="task-list"
      />

      {/* Floating Action Button */}
      <FAB onPress={() => navigation.navigate('TaskForm', {})} testID="fab" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: '700',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutButtonText: {
    ...Typography.small,
    color: Colors.accentSoft,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HomeScreen;
