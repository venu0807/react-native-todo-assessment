import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import type {AppStackScreenProps} from '../navigation/types';
import type {Priority, TaskFormData} from '../types';
import {useCreateTaskMutation, useUpdateTaskMutation} from '../api/tasksApi';
import {formatDate} from '../utils/dateHelpers';
import {TagChip} from '../components/TagChip';

export const CATEGORIES = [
  'General',
  'Work',
  'Personal',
  'Health',
  'Study',
  'Shopping',
] as const;

export const PRIORITIES: Array<{
  value: Priority;
  label: string;
  icon: string;
  color: string;
}> = [
  {value: 'low', label: 'Low', icon: '🟢', color: Colors.success},
  {value: 'medium', label: 'Medium', icon: '🟡', color: Colors.warning},
  {value: 'high', label: 'High', icon: '🔴', color: Colors.danger},
];

export const TaskFormScreen: React.FC<AppStackScreenProps<'TaskForm'>> = ({
  navigation,
  route,
}) => {
  const existingTask = route.params?.task;
  const isEdit = Boolean(existingTask);

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(
    existingTask?.description || '',
  );
  const [dateTime, setDateTime] = useState<Date>(
    existingTask?.dateTime ? new Date(existingTask.dateTime) : new Date(),
  );
  const [deadline, setDeadline] = useState<Date>(
    existingTask?.deadline
      ? new Date(existingTask.deadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const [priority, setPriority] = useState<Priority>(
    existingTask?.priority || 'medium',
  );
  const [category, setCategory] = useState<string>(
    existingTask?.category || 'General',
  );
  const [tagsInput, setTagsInput] = useState(
    (existingTask?.tags || []).join(', '),
  );

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'dateTime' | 'deadline'>(
    'dateTime',
  );
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>(
    Platform.OS === 'ios' ? 'datetime' : 'date',
  );

  const [createTask, {isLoading: isCreating}] = useCreateTaskMutation();
  const [updateTask, {isLoading: isUpdating}] = useUpdateTaskMutation();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    navigation?.setOptions?.({
      title: isEdit ? 'Edit Task' : 'New Task',
    });
  }, [isEdit, navigation]);

  const openPicker = (target: 'dateTime' | 'deadline') => {
    setPickerTarget(target);
    setTempDate(target === 'dateTime' ? dateTime : deadline);
    setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
    setShowDatePicker(true);
  };

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        if (pickerTarget === 'dateTime') {
          setDateTime(selectedDate);
        } else {
          setDeadline(selectedDate);
        }
      }
      setShowDatePicker(false);
    }
  };

  const handleConfirmPicker = () => {
    if (pickerTarget === 'dateTime') {
      setDateTime(tempDate);
    } else {
      setDeadline(tempDate);
    }
    setShowDatePicker(false);
  };

  const handleCancelPicker = () => {
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Please enter a task title.');
      return;
    }

    if (trimmedTitle.length > 100) {
      Alert.alert('Validation Error', 'Title cannot exceed 100 characters.');
      return;
    }

    if (description.length > 500) {
      Alert.alert(
        'Validation Error',
        'Description cannot exceed 500 characters.',
      );
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate.getTime() <= Date.now()) {
      Alert.alert('Validation Error', 'Deadline must be in the future.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map(tag => tag.trim().replace(/^#/, ''))
      .filter(tag => tag.length > 0);

    const payload: TaskFormData = {
      title: trimmedTitle,
      description: description.trim(),
      dateTime: dateTime.toISOString(),
      deadline: deadlineDate.toISOString(),
      priority,
      category,
      tags: parsedTags,
    };

    try {
      if (isEdit && existingTask) {
        await updateTask({id: existingTask._id, data: payload}).unwrap();
      } else {
        await createTask(payload).unwrap();
      }
      navigation.goBack();
    } catch (err: any) {
      const serverMsg =
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to save task';
      Alert.alert('Error', serverMsg);
    }
  };

  const currentPreviewTags = tagsInput
    .split(',')
    .map(tag => tag.trim().replace(/^#/, ''))
    .filter(tag => tag.length > 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="task-form-screen">
        <View style={styles.header}>
          <Text style={styles.headerTitle} testID="form-header-title">
            {isEdit ? 'Edit Task' : 'Create Task'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update the details for this task'
              : 'Fill in the information to schedule your task'}
          </Text>
        </View>

        {/* Title Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>
          <TextInput
            testID="title-input"
            style={styles.input}
            placeholder="Enter task title"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!isLoading}
          />
        </View>

        {/* Description Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
          <TextInput
            testID="description-input"
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter task description (optional)"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {/* Date & Time Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity
            testID="datetime-selector"
            style={styles.dateTimeSelector}
            onPress={() => openPicker('dateTime')}
            disabled={isLoading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select Date and Time">
            <Text style={styles.selectorIcon}>📅</Text>
            <View style={styles.selectorTextContainer}>
              <Text style={styles.selectorValue} testID="datetime-value">
                {formatDate(dateTime)}
              </Text>
              <Text style={styles.selectorHint}>Tap to change date & time</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Deadline Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Deadline <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity
            testID="deadline-selector"
            style={styles.dateTimeSelector}
            onPress={() => openPicker('deadline')}
            disabled={isLoading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Select Deadline">
            <Text style={styles.selectorIcon}>⏰</Text>
            <View style={styles.selectorTextContainer}>
              <Text style={styles.selectorValue} testID="deadline-value">
                {formatDate(deadline)}
              </Text>
              <Text style={styles.selectorHint}>Tap to change deadline</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Priority Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow} testID="priority-selector">
            {PRIORITIES.map(p => {
              const isSelected = priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  testID={`priority-option-${p.value}`}
                  style={[
                    styles.priorityOption,
                    isSelected && {
                      borderColor: p.color,
                      backgroundColor: `${p.color}22`,
                    },
                  ]}
                  onPress={() => setPriority(p.value)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{selected: isSelected}}
                  accessibilityLabel={`Priority ${p.label}`}>
                  <Text style={styles.priorityIcon}>{p.icon}</Text>
                  <Text
                    style={[
                      styles.priorityLabel,
                      isSelected && {color: p.color, fontWeight: '700'},
                    ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
            testID="category-selector">
            {CATEGORIES.map(cat => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  testID={`category-chip-${cat}`}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{selected: isSelected}}
                  accessibilityLabel={`Category ${cat}`}>
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tags Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            testID="tags-input"
            style={styles.input}
            placeholder="e.g. frontend, urgent, review"
            placeholderTextColor={Colors.textMuted}
            value={tagsInput}
            onChangeText={setTagsInput}
            autoCapitalize="none"
            editable={!isLoading}
          />
          {currentPreviewTags.length > 0 && (
            <View
              style={styles.tagsPreviewRow}
              testID="tags-preview-container">
              {currentPreviewTags.map(tag => (
                <TagChip
                  key={tag}
                  label={tag}
                  style={styles.previewTag}
                  testID={`preview-tag-${tag}`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          testID="submit-button"
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? 'Update Task' : 'Create Task'}>
          {isLoading ? (
            <ActivityIndicator
              testID="submit-loading-indicator"
              color={Colors.white}
              size="small"
            />
          ) : (
            <Text style={styles.submitButtonText} testID="submit-button-text">
              {isEdit ? 'Update Task' : 'Create Task'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={handleCancelPicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard} testID="date-picker-modal">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {pickerTarget === 'dateTime'
                    ? 'Select Date & Time'
                    : 'Select Deadline'}
                </Text>
              </View>

              {Platform.OS === 'android' && (
                <View style={styles.androidModeSwitch}>
                  <TouchableOpacity
                    testID="picker-mode-date"
                    style={[
                      styles.modeButton,
                      pickerMode === 'date' && styles.modeButtonActive,
                    ]}
                    onPress={() => setPickerMode('date')}>
                    <Text
                      style={[
                        styles.modeButtonText,
                        pickerMode === 'date' && styles.modeButtonTextActive,
                      ]}>
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="picker-mode-time"
                    style={[
                      styles.modeButton,
                      pickerMode === 'time' && styles.modeButtonActive,
                    ]}
                    onPress={() => setPickerMode('time')}>
                    <Text
                      style={[
                        styles.modeButtonText,
                        pickerMode === 'time' && styles.modeButtonTextActive,
                      ]}>
                      Time
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  testID="date-time-picker"
                  value={tempDate}
                  mode={pickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handlePickerChange}
                  minimumDate={
                    pickerTarget === 'deadline' ? new Date() : undefined
                  }
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  testID="date-picker-cancel-button"
                  style={styles.modalCancelButton}
                  onPress={handleCancelPicker}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="date-picker-confirm-button"
                  style={styles.modalConfirmButton}
                  onPress={handleConfirmPicker}>
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    ...Typography.small,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  requiredStar: {
    color: Colors.accent,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  dateTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  selectorHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  categoryScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tagsPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  previewTag: {
    marginRight: 2,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: Colors.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 380,
    padding: 20,
  },
  modalHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  androidModeSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardElevated,
  },
  modeButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  modeButtonText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: Colors.white,
  },
  pickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TaskFormScreen;
