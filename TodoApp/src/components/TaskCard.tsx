import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {FadeInRight, Layout} from 'react-native-reanimated';
import {Task, Priority} from '../types';
import {Colors} from '../theme/colors';
import {getRelativeDeadline, isOverdue} from '../utils';
import {PriorityBadge} from './PriorityBadge';
import {TagChip} from './TagChip';

export interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onDelete,
  style,
  testID = 'task-card',
}) => {
  const priorityColor = PRIORITY_COLORS[task.priority] || Colors.success;
  const relativeDeadline = getRelativeDeadline(task.deadline);
  const overdue = isOverdue(task.deadline);

  return (
    <Animated.View
      entering={FadeInRight.duration(300)}
      layout={Layout.springify()}
      style={[styles.cardContainer, {borderLeftColor: priorityColor}, style]}
      testID={testID}
      accessibilityRole="none">
      {/* Complete/Incomplete circular toggle */}
      <TouchableOpacity
        onPress={onComplete}
        style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
        testID={`${testID}-complete`}
        accessibilityRole="checkbox"
        accessibilityState={{checked: task.completed}}
        accessibilityLabel={
          task.completed ? 'Mark task incomplete' : 'Mark task complete'
        }
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        {task.completed && (
          <Text style={styles.checkmark} testID={`${testID}-checkmark`}>
            ✓
          </Text>
        )}
      </TouchableOpacity>

      {/* Main card body clickable area */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={styles.mainContent}
        testID={`${testID}-body`}
        accessibilityRole="button"
        accessibilityLabel={`Task: ${task.title}`}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, task.completed && styles.titleCompleted]}
            numberOfLines={1}
            testID={`${testID}-title`}>
            {task.title}
          </Text>
          <PriorityBadge
            priority={task.priority}
            testID={`${testID}-priority`}
          />
        </View>

        {task.description ? (
          <Text
            style={styles.description}
            numberOfLines={2}
            testID={`${testID}-description`}>
            {task.description}
          </Text>
        ) : null}

        {task.tags && task.tags.length > 0 ? (
          <View style={styles.tagsRow} testID={`${testID}-tags`}>
            {task.tags.slice(0, 3).map((tag, index) => (
              <TagChip
                key={`${tag}-${index}`}
                label={tag}
                style={styles.tagItem}
                testID={`${testID}-tag-${index}`}
              />
            ))}
          </View>
        ) : null}

        {relativeDeadline ? (
          <View
            style={styles.deadlineRow}
            testID={`${testID}-deadline-container`}>
            <Text
              style={[
                styles.deadlineText,
                overdue && styles.overdueDeadlineText,
              ]}
              testID={`${testID}-deadline`}>
              {relativeDeadline}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Delete action button */}
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteButton}
        testID={`${testID}-delete`}
        accessibilityRole="button"
        accessibilityLabel="Delete task"
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={styles.deleteIcon} testID={`${testID}-delete-icon`}>
          ✕
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  description: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
    lineHeight: 17,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 2,
  },
  tagItem: {
    marginRight: 6,
    marginBottom: 2,
  },
  deadlineRow: {
    marginTop: 4,
  },
  deadlineText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  overdueDeadlineText: {
    color: Colors.danger,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '700',
  },
});

export default TaskCard;
