import React from 'react';
import {Alert, ActivityIndicator} from 'react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect, beforeEach, afterEach, jest} from '@jest/globals';

import {TaskDetailScreen} from '../TaskDetailScreen';
import authReducer from '../../store/authSlice';
import {Colors} from '../../theme/colors';
import {Task} from '../../types';
import {PriorityBadge} from '../../components/PriorityBadge';
import {TagChip} from '../../components/TagChip';
import {formatDate, getRelativeDeadline} from '../../utils';

// Mock Tasks API
let mockTasksData: Task[] = [];
let mockIsLoading = false;

const mockUpdateTaskUnwrap = jest
  .fn<() => Promise<any>>()
  .mockResolvedValue({});
const mockUpdateTaskTrigger = jest.fn(() => ({unwrap: mockUpdateTaskUnwrap}));
let mockUpdateTaskState = {isLoading: false};

const mockDeleteTaskUnwrap = jest
  .fn<() => Promise<any>>()
  .mockResolvedValue({});
const mockDeleteTaskTrigger = jest.fn(() => ({unwrap: mockDeleteTaskUnwrap}));
let mockDeleteTaskState = {isLoading: false};

jest.mock('../../api/tasksApi', () => {
  const actual = jest.requireActual('../../api/tasksApi') as any;
  return {
    ...actual,
    useGetTasksQuery: () => ({
      data: mockTasksData,
      isLoading: mockIsLoading,
    }),
    useUpdateTaskMutation: () => [mockUpdateTaskTrigger, mockUpdateTaskState],
    useDeleteTaskMutation: () => [mockDeleteTaskTrigger, mockDeleteTaskState],
  };
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  _id: 'task-test-1',
  userId: 'user-123',
  title: 'Test Task Title',
  description: 'Detailed description for testing task details screen.',
  dateTime: new Date(2026, 9, 10, 10, 0).toISOString(),
  deadline: new Date(2026, 9, 11, 18, 0).toISOString(),
  priority: 'high',
  completed: false,
  category: 'Work',
  tags: ['testing', 'frontend'],
  createdAt: new Date(2026, 9, 1, 9, 0).toISOString(),
  updatedAt: new Date(2026, 9, 1, 9, 0).toISOString(),
  ...overrides,
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

describe('TaskDetailScreen', () => {
  let alertSpy: any;
  let mockNav: any;
  let currentTree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockIsLoading = false;
    mockTasksData = [];
    mockUpdateTaskState = {isLoading: false};
    mockDeleteTaskState = {isLoading: false};
    mockUpdateTaskUnwrap.mockResolvedValue({});
    mockDeleteTaskUnwrap.mockResolvedValue({});
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
    taskId = 'task-test-1',
    nav = mockNav,
  ): renderer.ReactTestRenderer => {
    const store = createTestStore();
    const route = {
      key: 'TaskDetail-key',
      name: 'TaskDetail' as const,
      params: {taskId},
    };

    act(() => {
      currentTree = renderer.create(
        <Provider store={store}>
          <TaskDetailScreen navigation={nav as any} route={route as any} />
        </Provider>,
      );
    });
    return currentTree!;
  };

  describe('Loading and Lookup States', () => {
    it('shows centered ActivityIndicator when tasks query is loading', () => {
      mockIsLoading = true;
      mockTasksData = [];
      const tree = renderComponent();

      const spinner = tree.root.findByProps({testID: 'loading-indicator'});
      expect(spinner).toBeDefined();
      expect(spinner.type).toBe(ActivityIndicator);

      // Detail content should not be rendered
      expect(tree.root.findAllByProps({testID: 'task-title'}).length).toBe(0);
      expect(
        tree.root.findAllByProps({testID: 'metadata-table'}).length,
      ).toBe(0);
    });

    it('shows centered ActivityIndicator when task is not yet found in cache', () => {
      mockIsLoading = false;
      mockTasksData = [createMockTask({_id: 'other-task'})];
      const tree = renderComponent('non-existent-task-id');

      const spinner = tree.root.findByProps({testID: 'loading-indicator'});
      expect(spinner).toBeDefined();
      expect(tree.root.findAllByProps({testID: 'task-title'}).length).toBe(0);
    });

    it('shows centered ActivityIndicator when deletion mutation is in flight', () => {
      mockIsLoading = false;
      mockTasksData = [createMockTask({_id: 'task-test-1'})];
      mockDeleteTaskState = {isLoading: true};

      const tree = renderComponent('task-test-1');
      const spinner = tree.root.findByProps({testID: 'loading-indicator'});
      expect(spinner).toBeDefined();
      expect(tree.root.findAllByProps({testID: 'task-title'}).length).toBe(0);
    });
  });

  describe('Task Details and Metadata Display', () => {
    it('displays task title and sets header title via setOptions', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          title: 'Design System Architecture',
        }),
      ];
      const tree = renderComponent('task-test-1');

      const titleElement = tree.root.findByProps({testID: 'task-title'});
      expect(titleElement.props.children).toBe('Design System Architecture');
      expect(mockNav.setOptions).toHaveBeenCalledWith({
        title: 'Design System Architecture',
      });
    });

    it('renders PriorityBadge with corresponding priority', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          priority: 'high',
        }),
      ];
      const tree = renderComponent('task-test-1');

      const badge = tree.root.findByType(PriorityBadge);
      expect(badge.props.priority).toBe('high');
    });

    it('displays full description text when present', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          description: 'A comprehensive multi-line description of the task.',
        }),
      ];
      const tree = renderComponent('task-test-1');

      const desc = tree.root.findByProps({testID: 'task-description'});
      expect(desc.props.children).toBe(
        'A comprehensive multi-line description of the task.',
      );
    });

    it('does not display description section when description is empty', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          description: '',
        }),
      ];
      const tree = renderComponent('task-test-1');

      expect(
        tree.root.findAllByProps({testID: 'task-description-section'}).length,
      ).toBe(0);
    });

    it('renders metadata table with Category, Date & Time, Deadline, and Created Date', () => {
      const task = createMockTask({
        _id: 'task-test-1',
        category: 'Personal',
        dateTime: '2026-10-15T14:30:00.000Z',
        deadline: '2026-10-20T18:00:00.000Z',
        createdAt: '2026-10-01T08:00:00.000Z',
      });
      mockTasksData = [task];
      const tree = renderComponent('task-test-1');

      const catValue = tree.root.findByProps({
        testID: 'info-row-category-value',
      });
      expect(catValue.props.children).toBe('Personal');

      const dtValue = tree.root.findByProps({
        testID: 'info-row-datetime-value',
      });
      expect(dtValue.props.children).toBe(formatDate(task.dateTime));

      const deadlineValue = tree.root.findByProps({
        testID: 'info-row-deadline-value',
      });
      const expectedDeadline = `${formatDate(task.deadline)} (${getRelativeDeadline(
        task.deadline,
      )})`;
      expect(deadlineValue.props.children).toBe(expectedDeadline);

      const createdValue = tree.root.findByProps({
        testID: 'info-row-created-value',
      });
      expect(createdValue.props.children).toBe(formatDate(task.createdAt));
    });

    it('highlights deadline in Colors.danger when deadline is overdue', () => {
      // Overdue deadline in past
      const overdueDate = new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString();
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          deadline: overdueDate,
        }),
      ];
      const tree = renderComponent('task-test-1');

      const deadlineValue = tree.root.findByProps({
        testID: 'info-row-deadline-value',
      });
      const flatStyle = [deadlineValue.props.style].flat().reduce((acc, s) => ({...acc, ...s}), {});
      expect(flatStyle.color).toBe(Colors.danger);
    });

    it('does not highlight deadline in Colors.danger when deadline is in the future', () => {
      // Future deadline in 5 days
      const futureDate = new Date(Date.now() + 3600 * 24 * 5 * 1000).toISOString();
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          deadline: futureDate,
        }),
      ];
      const tree = renderComponent('task-test-1');

      const deadlineValue = tree.root.findByProps({
        testID: 'info-row-deadline-value',
      });
      const flatStyle = [deadlineValue.props.style].flat().reduce((acc, s) => ({...acc, ...s}), {});
      expect(flatStyle.color).toBe(Colors.text);
    });

    it('renders TagChip for each tag in task.tags', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          tags: ['react-native', 'typescript', 'testing'],
        }),
      ];
      const tree = renderComponent('task-test-1');

      const tagChips = tree.root.findAllByType(TagChip);
      expect(tagChips.length).toBe(3);
      expect(tagChips[0].props.label).toBe('react-native');
      expect(tagChips[1].props.label).toBe('typescript');
      expect(tagChips[2].props.label).toBe('testing');
    });

    it('does not render tags section when tags array is empty', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          tags: [],
        }),
      ];
      const tree = renderComponent('task-test-1');

      expect(
        tree.root.findAllByProps({testID: 'tags-section'}).length,
      ).toBe(0);
    });
  });

  describe('Completion Status Banner and Title Strike-through', () => {
    it('displays green completed banner and strike-through title when completed', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          completed: true,
        }),
      ];
      const tree = renderComponent('task-test-1');

      const banner = tree.root.findByProps({testID: 'completed-banner'});
      expect(banner).toBeDefined();

      const bannerText = tree.root.findByProps({
        testID: 'completed-banner-text',
      });
      expect(bannerText.props.children).toBe('✓ Completed');

      const title = tree.root.findByProps({testID: 'task-title'});
      const flatTitleStyle = [title.props.style].flat().reduce((acc, s) => ({...acc, ...s}), {});
      expect(flatTitleStyle.textDecorationLine).toBe('line-through');

      const toggleButtonText = tree.root.findByProps({
        testID: 'toggle-complete-button-text',
      });
      expect(toggleButtonText.props.children).toBe('↩ Mark Incomplete');
    });

    it('does not display completed banner and title has no strike-through when incomplete', () => {
      mockTasksData = [
        createMockTask({
          _id: 'task-test-1',
          completed: false,
        }),
      ];
      const tree = renderComponent('task-test-1');

      expect(
        tree.root.findAllByProps({testID: 'completed-banner'}).length,
      ).toBe(0);

      const title = tree.root.findByProps({testID: 'task-title'});
      const flatTitleStyle = [title.props.style].flat().reduce((acc, s) => ({...acc, ...s}), {});
      expect(flatTitleStyle.textDecorationLine).toBeUndefined();

      const toggleButtonText = tree.root.findByProps({
        testID: 'toggle-complete-button-text',
      });
      expect(toggleButtonText.props.children).toBe('✓ Mark Complete');
    });
  });

  describe('Interactive Action: Edit Task', () => {
    it('navigates to TaskForm with task object when Edit Task button is pressed', () => {
      const task = createMockTask({
        _id: 'task-test-1',
        title: 'Edit Me',
      });
      mockTasksData = [task];
      const tree = renderComponent('task-test-1');

      const editBtn = tree.root.findByProps({testID: 'edit-task-button'});
      act(() => {
        editBtn.props.onPress();
      });

      expect(mockNav.navigate).toHaveBeenCalledWith('TaskForm', {task});
    });
  });

  describe('Interactive Action: Complete / Undo Toggle', () => {
    it('triggers updateTask with completed: true when incomplete task is toggled', async () => {
      const task = createMockTask({
        _id: 'task-test-1',
        completed: false,
      });
      mockTasksData = [task];
      const tree = renderComponent('task-test-1');

      const toggleBtn = tree.root.findByProps({
        testID: 'toggle-complete-button',
      });
      await act(async () => {
        toggleBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(mockUpdateTaskTrigger).toHaveBeenCalledWith({
        id: 'task-test-1',
        data: {completed: true},
      });
    });

    it('triggers updateTask with completed: false when completed task is toggled', async () => {
      const task = createMockTask({
        _id: 'task-test-1',
        completed: true,
      });
      mockTasksData = [task];
      const tree = renderComponent('task-test-1');

      const toggleBtn = tree.root.findByProps({
        testID: 'toggle-complete-button',
      });
      await act(async () => {
        toggleBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(mockUpdateTaskTrigger).toHaveBeenCalledWith({
        id: 'task-test-1',
        data: {completed: false},
      });
    });

    it('shows Alert when updateTask fails with error', async () => {
      const task = createMockTask({_id: 'task-test-1', completed: false});
      mockTasksData = [task];
      mockUpdateTaskUnwrap.mockRejectedValueOnce({
        message: 'Network update failure',
      });

      const tree = renderComponent('task-test-1');
      const toggleBtn = tree.root.findByProps({
        testID: 'toggle-complete-button',
      });

      await act(async () => {
        toggleBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledWith('Error', 'Network update failure');
    });

    it('renders ActivityIndicator inside toggle button while update is in flight', () => {
      mockTasksData = [createMockTask({_id: 'task-test-1'})];
      mockUpdateTaskState = {isLoading: true};

      const tree = renderComponent('task-test-1');
      const spinner = tree.root.findByProps({
        testID: 'toggle-loading-indicator',
      });
      expect(spinner).toBeDefined();
    });
  });

  describe('Interactive Action: Delete Flow', () => {
    it('prompts Alert.alert confirmation when Delete Task button is pressed', () => {
      mockTasksData = [createMockTask({_id: 'task-test-1'})];
      const tree = renderComponent('task-test-1');

      const deleteBtn = tree.root.findByProps({testID: 'delete-task-button'});
      act(() => {
        deleteBtn.props.onPress();
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete Task',
        'This cannot be undone.',
        expect.any(Array),
      );
    });

    it('cancels deletion when Cancel is selected in the alert', () => {
      mockTasksData = [createMockTask({_id: 'task-test-1'})];
      const tree = renderComponent('task-test-1');

      const deleteBtn = tree.root.findByProps({testID: 'delete-task-button'});
      act(() => {
        deleteBtn.props.onPress();
      });

      const buttons = alertSpy.mock.calls[0][2];
      const cancelBtn = buttons.find((b: any) => b.text === 'Cancel');
      expect(cancelBtn).toBeDefined();

      act(() => {
        cancelBtn.onPress?.();
      });

      expect(mockDeleteTaskTrigger).not.toHaveBeenCalled();
      expect(mockNav.goBack).not.toHaveBeenCalled();
    });

    it('calls deleteTask and navigates back when Delete is confirmed in the alert', async () => {
      mockTasksData = [createMockTask({_id: 'task-delete-id'})];
      const tree = renderComponent('task-delete-id');

      const deleteBtn = tree.root.findByProps({testID: 'delete-task-button'});
      act(() => {
        deleteBtn.props.onPress();
      });

      const buttons = alertSpy.mock.calls[0][2];
      const confirmBtn = buttons.find((b: any) => b.text === 'Delete');
      expect(confirmBtn).toBeDefined();

      await act(async () => {
        await confirmBtn.onPress?.();
        jest.runOnlyPendingTimers();
      });

      expect(mockDeleteTaskTrigger).toHaveBeenCalledWith('task-delete-id');
      expect(mockNav.goBack).toHaveBeenCalledTimes(1);
    });

    it('shows Alert and does not navigate back if deleteTask fails', async () => {
      mockTasksData = [createMockTask({_id: 'task-delete-err'})];
      mockDeleteTaskUnwrap.mockRejectedValueOnce({
        data: {message: 'Server delete error'},
      });
      const tree = renderComponent('task-delete-err');

      const deleteBtn = tree.root.findByProps({testID: 'delete-task-button'});
      act(() => {
        deleteBtn.props.onPress();
      });

      const buttons = alertSpy.mock.calls[0][2];
      const confirmBtn = buttons.find((b: any) => b.text === 'Delete');

      await act(async () => {
        await confirmBtn.onPress?.();
        jest.runOnlyPendingTimers();
      });

      expect(mockDeleteTaskTrigger).toHaveBeenCalledWith('task-delete-err');
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Server delete error');
      expect(mockNav.goBack).not.toHaveBeenCalled();
    });
  });
});
