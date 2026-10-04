import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import type {AppStackScreenProps} from '../navigation/types';
import {
  useGetTasksQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from '../api/tasksApi';
import {formatDate, getRelativeDeadline, isOverdue} from '../utils';
import {PriorityBadge} from '../components/PriorityBadge';
import {TagChip} from '../components/TagChip';

export interface InfoRowProps {
  label: string;
  value: string;
  isDanger?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  isDanger = false,
  testID,
  style,
  valueStyle,
}) => {
  return (
    <View style={[styles.infoRow, style]} testID={testID}>
      <Text
        style={styles.infoLabel}
        testID={testID ? `${testID}-label` : undefined}>
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          isDanger && styles.dangerValue,
          valueStyle,
        ]}
        testID={testID ? `${testID}-value` : undefined}>
        {value}
      </Text>
    </View>
  );
};

export const TaskDetailScreen: React.FC<
  AppStackScreenProps<'TaskDetail'>
> = ({navigation, route}) => {
  const taskId = route.params?.taskId;

  const {data: tasks = [], isLoading: isTasksLoading} = useGetTasksQuery();
  const [updateTask, {isLoading: isUpdating}] = useUpdateTaskMutation();
  const [deleteTask, {isLoading: isDeleting}] = useDeleteTaskMutation();

  const task = tasks.find(t => t._id === taskId);

  useEffect(() => {
    navigation?.setOptions?.({
      title: task?.title || 'Task Detail',
    });
  }, [navigation, task?.title]);

  if (isTasksLoading || isDeleting || !task) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered]}
        testID="task-detail-screen">
        <ActivityIndicator
          size="large"
          color={Colors.accent}
          testID="loading-indicator"
        />
      </SafeAreaView>
    );
  }

  const relativeDeadline = getRelativeDeadline(task.deadline);
  const formattedDeadline = formatDate(task.deadline);
  const deadlineText = relativeDeadline
    ? `${formattedDeadline} (${relativeDeadline})`
    : formattedDeadline;
  const overdue = isOverdue(task.deadline);

  const handleToggleComplete = async () => {
    try {
      const res = updateTask({
        id: task._id,
        data: {completed: !task.completed},
      });
      if (res && typeof res.unwrap === 'function') {
        await res.unwrap();
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.data?.message ||
          error?.message ||
          'Failed to update task completion.',
      );
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'This cannot be undone.',
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
              const res = deleteTask(task._id);
              if (res && typeof res.unwrap === 'function') {
                await res.unwrap();
              }
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.data?.message ||
                  error?.message ||
                  'Failed to delete task.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="task-detail-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        testID="task-detail-scroll-view">
        {/* Completed Status Banner */}
        {task.completed && (
          <View style={styles.completedBanner} testID="completed-banner">
            <Text
              style={styles.completedBannerText}
              testID="completed-banner-text">
              ✓ Completed
            </Text>
          </View>
        )}

        {/* Title and Priority Badge */}
        <View style={styles.headerSection} testID="task-header-section">
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, task.completed && styles.titleCompleted]}
              testID="task-title">
              {task.title}
            </Text>
            <PriorityBadge
              priority={task.priority}
              testID="task-priority-badge"
            />
          </View>
        </View>

        {/* Description Section */}
        {task.description ? (
          <View
            style={styles.section}
            testID="task-description-section">
            <Text style={styles.sectionLabel} testID="description-label">
              Description
            </Text>
            <Text style={styles.descriptionText} testID="task-description">
              {task.description}
            </Text>
          </View>
        ) : null}

        {/* Metadata Table */}
        <View style={styles.metaCard} testID="metadata-table">
          <InfoRow
            label="Category"
            value={task.category || 'General'}
            testID="info-row-category"
          />
          <InfoRow
            label="Date & Time"
            value={formatDate(task.dateTime)}
            testID="info-row-datetime"
          />
          <InfoRow
            label="Deadline"
            value={deadlineText}
            isDanger={overdue}
            testID="info-row-deadline"
          />
          <InfoRow
            label="Created"
            value={formatDate(task.createdAt)}
            testID="info-row-created"
            style={styles.lastInfoRow}
          />
        </View>

        {/* Tags Section */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.section} testID="tags-section">
            <Text style={styles.sectionLabel} testID="tags-label">
              Tags
            </Text>
            <View style={styles.tagsContainer} testID="tags-container">
              {task.tags.map((tag, index) => (
                <TagChip
                  key={`${tag}-${index}`}
                  label={tag}
                  style={styles.tagChip}
                  testID={`tag-chip-${tag}`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer} testID="actions-container">
          {/* Edit Task */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('TaskForm', {task})}
            activeOpacity={0.8}
            testID="edit-task-button"
            accessibilityRole="button"
            accessibilityLabel="Edit Task">
            <Text style={styles.editButtonText} testID="edit-task-button-text">
              ✏️ Edit Task
            </Text>
          </TouchableOpacity>

          {/* Complete / Undo Toggle */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              task.completed ? styles.incompleteButton : styles.completeButton,
              isUpdating && styles.buttonDisabled,
            ]}
            onPress={handleToggleComplete}
            disabled={isUpdating}
            activeOpacity={0.8}
            testID="toggle-complete-button"
            accessibilityRole="button"
            accessibilityLabel={
              task.completed ? 'Mark task incomplete' : 'Mark task complete'
            }>
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color={Colors.white}
                testID="toggle-loading-indicator"
              />
            ) : (
              <Text
                style={[
                  styles.toggleButtonText,
                  task.completed
                    ? styles.incompleteButtonText
                    : styles.completeButtonText,
                ]}
                testID="toggle-complete-button-text">
                {task.completed ? '↩ Mark Incomplete' : '✓ Mark Complete'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Delete Task */}
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
            onPress={handleDeleteTask}
            disabled={isDeleting}
            activeOpacity={0.8}
            testID="delete-task-button"
            accessibilityRole="button"
            accessibilityLabel="Delete Task">
            <Text
              style={styles.deleteButtonText}
              testID="delete-task-button-text">
              🗑 Delete Task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  completedBanner: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBannerText: {
    ...Typography.body,
    color: Colors.success,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  metaCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    ...Typography.small,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 16,
  },
  dangerValue: {
    color: Colors.danger,
    fontWeight: '700',
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: Colors.success,
  },
  incompleteButton: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  incompleteButtonText: {
    color: Colors.accentSoft,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default TaskDetailScreen;
