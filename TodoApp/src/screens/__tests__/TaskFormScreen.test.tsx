import React from 'react';
import {Alert, ActivityIndicator} from 'react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect, beforeEach, afterEach, jest} from '@jest/globals';

import {TaskFormScreen, CATEGORIES, PRIORITIES} from '../TaskFormScreen';
import authReducer from '../../store/authSlice';
import {Task} from '../../types';
import {formatDate} from '../../utils/dateHelpers';

// Mock Tasks API mutations
const mockCreateTaskUnwrap = jest
  .fn<() => Promise<any>>()
  .mockResolvedValue({});
const mockCreateTaskTrigger = jest.fn(() => ({unwrap: mockCreateTaskUnwrap}));
let mockCreateTaskState = {isLoading: false};

const mockUpdateTaskUnwrap = jest
  .fn<() => Promise<any>>()
  .mockResolvedValue({});
const mockUpdateTaskTrigger = jest.fn(() => ({unwrap: mockUpdateTaskUnwrap}));
let mockUpdateTaskState = {isLoading: false};

jest.mock('../../api/tasksApi', () => {
  const actual = jest.requireActual('../../api/tasksApi') as any;
  return {
    ...actual,
    useCreateTaskMutation: () => [mockCreateTaskTrigger, mockCreateTaskState],
    useUpdateTaskMutation: () => [mockUpdateTaskTrigger, mockUpdateTaskState],
  };
});

const createTestStore = (initialAuthState?: any) =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        token: 'test-token',
        user: {_id: 'u-1', email: 'test@example.com'},
        isAuthenticated: true,
        ...initialAuthState,
      },
    },
  });

const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  _id: 'task-existing-1',
  userId: 'user-123',
  title: 'Existing Task Title',
  description: 'Existing Description Text',
  dateTime: new Date(Date.now() + 3600000).toISOString(),
  deadline: new Date(Date.now() + 86400000).toISOString(),
  priority: 'high',
  completed: false,
  category: 'Work',
  tags: ['work', 'urgent'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('TaskFormScreen', () => {
  let alertSpy: any;
  let mockNav: any;
  let currentTree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockCreateTaskState = {isLoading: false};
    mockUpdateTaskState = {isLoading: false};
    mockCreateTaskUnwrap.mockResolvedValue({});
    mockUpdateTaskUnwrap.mockResolvedValue({});
    mockNav = createMockNavigation();
    alertSpy = jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    if (currentTree) {
      currentTree.unmount();
      currentTree = null;
    }
    alertSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const renderComponent = (
    routeParams?: {task?: Task},
    store = createTestStore(),
    nav = mockNav,
  ) => {
    act(() => {
      currentTree = renderer.create(
        <Provider store={store}>
          <TaskFormScreen
            navigation={nav}
            route={{params: routeParams} as any}
          />
        </Provider>,
      );
      jest.runOnlyPendingTimers();
    });
    return currentTree!;
  };

  describe('Create Mode Rendering', () => {
    it('renders all default form fields in create mode', () => {
      const tree = renderComponent();

      // Header title
      const headerTitle = tree.root.findByProps({testID: 'form-header-title'});
      expect(headerTitle.props.children).toBe('Create Task');
      expect(mockNav.setOptions).toHaveBeenCalledWith({title: 'New Task'});

      // Title input
      const titleInput = tree.root.findByProps({testID: 'title-input'});
      expect(titleInput.props.value).toBe('');
      expect(titleInput.props.maxLength).toBe(100);

      // Description input
      const descInput = tree.root.findByProps({testID: 'description-input'});
      expect(descInput.props.value).toBe('');
      expect(descInput.props.maxLength).toBe(500);

      // Date & Time display
      const datetimeValue = tree.root.findByProps({testID: 'datetime-value'});
      expect(datetimeValue.props.children).toBeTruthy();

      // Deadline display
      const deadlineValue = tree.root.findByProps({testID: 'deadline-value'});
      expect(deadlineValue.props.children).toBeTruthy();

      // Priority selector defaults to medium
      const mediumOption = tree.root.findByProps({
        testID: 'priority-option-medium',
      });
      expect(mediumOption.props.accessibilityState.selected).toBe(true);

      // Category selector defaults to General
      const generalChip = tree.root.findByProps({
        testID: 'category-chip-General',
      });
      expect(generalChip.props.accessibilityState.selected).toBe(true);

      // Tags input
      const tagsInput = tree.root.findByProps({testID: 'tags-input'});
      expect(tagsInput.props.value).toBe('');

      // Submit button text
      const submitText = tree.root.findByProps({
        testID: 'submit-button-text',
      });
      expect(submitText.props.children).toBe('Create Task');
    });

    it('renders all priority options and allows selection', () => {
      const tree = renderComponent();

      for (const p of PRIORITIES) {
        const option = tree.root.findByProps({
          testID: `priority-option-${p.value}`,
        });
        expect(option).toBeDefined();
      }

      // Select 'high'
      act(() => {
        tree.root
          .findByProps({testID: 'priority-option-high'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      const highOption = tree.root.findByProps({
        testID: 'priority-option-high',
      });
      expect(highOption.props.accessibilityState.selected).toBe(true);
    });

    it('renders all category chips and allows selection', () => {
      const tree = renderComponent();

      for (const cat of CATEGORIES) {
        const chip = tree.root.findByProps({testID: `category-chip-${cat}`});
        expect(chip).toBeDefined();
      }

      // Select 'Shopping'
      act(() => {
        tree.root
          .findByProps({testID: 'category-chip-Shopping'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      const shoppingChip = tree.root.findByProps({
        testID: 'category-chip-Shopping',
      });
      expect(shoppingChip.props.accessibilityState.selected).toBe(true);
    });

    it('displays tag preview chips when typing tags', () => {
      const tree = renderComponent();
      const tagsInput = tree.root.findByProps({testID: 'tags-input'});

      act(() => {
        tagsInput.props.onChangeText('react, #native, mobile');
        jest.runOnlyPendingTimers();
      });

      expect(
        tree.root.findByProps({testID: 'preview-tag-react'}),
      ).toBeDefined();
      expect(
        tree.root.findByProps({testID: 'preview-tag-native'}),
      ).toBeDefined();
      expect(
        tree.root.findByProps({testID: 'preview-tag-mobile'}),
      ).toBeDefined();
    });
  });

  describe('Edit Mode Pre-filling', () => {
    it('pre-fills all form fields from existingTask', () => {
      const mockTask = createMockTask({
        title: 'Complete Redux Migration',
        description: 'Ensure full slice coverage and middleware typing',
        priority: 'low',
        category: 'Study',
        tags: ['redux', 'typescript'],
      });

      const tree = renderComponent({task: mockTask});

      // Header title
      const headerTitle = tree.root.findByProps({testID: 'form-header-title'});
      expect(headerTitle.props.children).toBe('Edit Task');
      expect(mockNav.setOptions).toHaveBeenCalledWith({title: 'Edit Task'});

      // Title input pre-filled
      const titleInput = tree.root.findByProps({testID: 'title-input'});
      expect(titleInput.props.value).toBe('Complete Redux Migration');

      // Description input pre-filled
      const descInput = tree.root.findByProps({testID: 'description-input'});
      expect(descInput.props.value).toBe(
        'Ensure full slice coverage and middleware typing',
      );

      // Priority pre-filled
      const lowOption = tree.root.findByProps({
        testID: 'priority-option-low',
      });
      expect(lowOption.props.accessibilityState.selected).toBe(true);

      // Category pre-filled
      const studyChip = tree.root.findByProps({testID: 'category-chip-Study'});
      expect(studyChip.props.accessibilityState.selected).toBe(true);

      // Tags input pre-filled
      const tagsInput = tree.root.findByProps({testID: 'tags-input'});
      expect(tagsInput.props.value).toBe('redux, typescript');

      // Submit button text
      const submitText = tree.root.findByProps({
        testID: 'submit-button-text',
      });
      expect(submitText.props.children).toBe('Update Task');
    });

    it('handles existingTask with empty optional fields cleanly', () => {
      const mockTask = createMockTask({
        description: undefined,
        tags: [],
      });

      const tree = renderComponent({task: mockTask});

      const descInput = tree.root.findByProps({testID: 'description-input'});
      expect(descInput.props.value).toBe('');

      const tagsInput = tree.root.findByProps({testID: 'tags-input'});
      expect(tagsInput.props.value).toBe('');
    });
  });

  describe('Validation', () => {
    it('alerts validation error when title is empty on submit', async () => {
      const tree = renderComponent();

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter a task title.',
      );
      expect(mockCreateTaskTrigger).not.toHaveBeenCalled();
      expect(mockNav.goBack).not.toHaveBeenCalled();
    });

    it('alerts validation error when title consists only of whitespace', async () => {
      const tree = renderComponent();

      const titleInput = tree.root.findByProps({testID: 'title-input'});
      act(() => {
        titleInput.props.onChangeText('     ');
        jest.runOnlyPendingTimers();
      });

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter a task title.',
      );
      expect(mockCreateTaskTrigger).not.toHaveBeenCalled();
    });

    it('alerts validation error when deadline is in the past', async () => {
      const mockPastTask = createMockTask({
        title: 'Valid Title',
        deadline: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
      });

      const tree = renderComponent({task: mockPastTask});

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Validation Error',
        'Deadline must be in the future.',
      );
      expect(mockUpdateTaskTrigger).not.toHaveBeenCalled();
      expect(mockNav.goBack).not.toHaveBeenCalled();
    });
  });

  describe('Date & Time Picker Interaction', () => {
    it('opens date picker modal on datetime-selector press and updates dateTime on confirm', () => {
      const tree = renderComponent();

      // Modal closed initially
      expect(
        tree.root.findAllByProps({testID: 'date-picker-modal'}).length,
      ).toBe(0);

      // Press datetime selector
      act(() => {
        tree.root
          .findByProps({testID: 'datetime-selector'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      // Modal is visible
      expect(
        tree.root.findByProps({testID: 'date-picker-modal'}),
      ).toBeDefined();

      const picker = tree.root.findByProps({testID: 'date-time-picker'});
      expect(picker).toBeDefined();

      // Change date
      const futureDate = new Date(Date.now() + 100000);
      act(() => {
        picker.props.onChange({type: 'set'}, futureDate);
        jest.runOnlyPendingTimers();
      });

      // Confirm picker
      act(() => {
        tree.root
          .findByProps({testID: 'date-picker-confirm-button'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      // Modal closed
      expect(
        tree.root.findAllByProps({testID: 'date-picker-modal'}).length,
      ).toBe(0);

      // Form display updated
      const display = tree.root.findByProps({testID: 'datetime-value'});
      expect(display.props.children).toBe(formatDate(futureDate));
    });

    it('cancels date picker modal without updating state', () => {
      const tree = renderComponent();
      const initialValue = tree.root.findByProps({
        testID: 'deadline-value',
      }).props.children;

      act(() => {
        tree.root
          .findByProps({testID: 'deadline-selector'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      const picker = tree.root.findByProps({testID: 'date-time-picker'});
      act(() => {
        picker.props.onChange(
          {type: 'set'},
          new Date(Date.now() + 500000000),
        );
        jest.runOnlyPendingTimers();
      });

      // Cancel
      act(() => {
        tree.root
          .findByProps({testID: 'date-picker-cancel-button'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      // Modal closed
      expect(
        tree.root.findAllByProps({testID: 'date-picker-modal'}).length,
      ).toBe(0);

      // Deadline value unchanged
      const currentValue = tree.root.findByProps({
        testID: 'deadline-value',
      }).props.children;
      expect(currentValue).toBe(initialValue);
    });
  });

  describe('Creation Mutation & Navigation', () => {
    it('successfully creates task and navigates back', async () => {
      const tree = renderComponent();

      act(() => {
        tree.root
          .findByProps({testID: 'title-input'})
          .props.onChangeText('Build New Feature');
        tree.root
          .findByProps({testID: 'description-input'})
          .props.onChangeText('Comprehensive implementation details');
        tree.root
          .findByProps({testID: 'priority-option-high'})
          .props.onPress();
        tree.root
          .findByProps({testID: 'category-chip-Work'})
          .props.onPress();
        tree.root
          .findByProps({testID: 'tags-input'})
          .props.onChangeText('frontend,  #mobile, release');
        jest.runOnlyPendingTimers();
      });

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(mockCreateTaskTrigger).toHaveBeenCalledTimes(1);
      expect(mockCreateTaskTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Build New Feature',
          description: 'Comprehensive implementation details',
          priority: 'high',
          category: 'Work',
          tags: ['frontend', 'mobile', 'release'],
        }),
      );
      expect(mockNav.goBack).toHaveBeenCalledTimes(1);
    });

    it('shows Alert when creation mutation fails', async () => {
      mockCreateTaskUnwrap.mockRejectedValueOnce({
        data: {message: 'Server database error'},
      });

      const tree = renderComponent();

      act(() => {
        tree.root
          .findByProps({testID: 'title-input'})
          .props.onChangeText('Failed Task');
        jest.runOnlyPendingTimers();
      });

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Server database error',
      );
      expect(mockNav.goBack).not.toHaveBeenCalled();
    });
  });

  describe('Update Mutation & Navigation', () => {
    it('successfully updates existing task and navigates back', async () => {
      const mockTask = createMockTask({
        _id: 'task-789',
        title: 'Initial Title',
        description: 'Initial Description',
        priority: 'low',
        category: 'Personal',
        tags: ['oldTag'],
      });

      const tree = renderComponent({task: mockTask});

      act(() => {
        tree.root
          .findByProps({testID: 'title-input'})
          .props.onChangeText('Updated Task Title');
        tree.root
          .findByProps({testID: 'priority-option-medium'})
          .props.onPress();
        tree.root
          .findByProps({testID: 'category-chip-Health'})
          .props.onPress();
        tree.root
          .findByProps({testID: 'tags-input'})
          .props.onChangeText('health, #fitness');
        jest.runOnlyPendingTimers();
      });

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(mockUpdateTaskTrigger).toHaveBeenCalledTimes(1);
      expect(mockUpdateTaskTrigger).toHaveBeenCalledWith({
        id: 'task-789',
        data: expect.objectContaining({
          title: 'Updated Task Title',
          description: 'Initial Description',
          priority: 'medium',
          category: 'Health',
          tags: ['health', 'fitness'],
        }),
      });
      expect(mockNav.goBack).toHaveBeenCalledTimes(1);
    });

    it('shows Alert when update mutation fails', async () => {
      mockUpdateTaskUnwrap.mockRejectedValueOnce({
        error: 'Network request failed',
      });

      const mockTask = createMockTask();
      const tree = renderComponent({task: mockTask});

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      await act(async () => {
        submitBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Network request failed',
      );
      expect(mockNav.goBack).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('displays ActivityIndicator and disables submit button when mutation is in flight', () => {
      mockCreateTaskState = {isLoading: true};
      const tree = renderComponent();

      const spinner = tree.root.findByProps({
        testID: 'submit-loading-indicator',
      });
      expect(spinner).toBeDefined();
      expect(spinner.type).toBe(ActivityIndicator);

      const submitBtn = tree.root.findByProps({testID: 'submit-button'});
      expect(submitBtn.props.disabled).toBe(true);
    });
  });
});
