import React from 'react';
import {Alert, ActivityIndicator} from 'react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import renderer, {act} from 'react-test-renderer';
import {describe, it, expect, beforeEach, afterEach, jest} from '@jest/globals';

import {HomeScreen} from '../HomeScreen';
import authReducer from '../../store/authSlice';
import {Colors} from '../../theme/colors';
import {Task} from '../../types';
import {TaskCard} from '../../components/TaskCard';
import {FAB} from '../../components/FAB';

// Mock Tasks API
let mockTasksData: Task[] = [];
let mockIsLoading = false;
let mockRefetch = jest.fn();

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
      refetch: mockRefetch,
    }),
    useUpdateTaskMutation: () => [mockUpdateTaskTrigger, mockUpdateTaskState],
    useDeleteTaskMutation: () => [mockDeleteTaskTrigger, mockDeleteTaskState],
  };
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  _id: 'task-1',
  userId: 'user-123',
  title: 'Task 1',
  description: 'Description 1',
  dateTime: new Date(2026, 9, 10, 10, 0).toISOString(),
  deadline: new Date(2026, 9, 11, 18, 0).toISOString(),
  priority: 'medium',
  completed: false,
  category: 'General',
  tags: ['tag1'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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

describe('HomeScreen', () => {
  let alertSpy: any;
  let mockNav: any;
  let currentTree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockIsLoading = false;
    mockTasksData = [];
    mockRefetch = jest.fn();
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

  const renderComponent = (store = createTestStore(), nav = mockNav) => {
    act(() => {
      currentTree = renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={nav} route={{} as any} />
        </Provider>,
      );
      jest.runOnlyPendingTimers();
    });
    return currentTree!;
  };

  describe('Loading State', () => {
    it('renders centered ActivityIndicator with Colors.accent while initial fetch is loading', () => {
      mockIsLoading = true;
      const tree = renderComponent();

      const spinner = tree.root.findByProps({testID: 'loading-indicator'});
      expect(spinner).toBeDefined();
      expect(spinner.type).toBe(ActivityIndicator);
      expect(spinner.props.color).toBe(Colors.accent);
      expect(spinner.props.size).toBe('large');

      // Verify task list and FAB are not displayed while loading
      expect(tree.root.findAllByProps({testID: 'task-list'}).length).toBe(0);
      expect(tree.root.findAllByProps({testID: 'fab'}).length).toBe(0);
      expect(tree.root.findAllByProps({testID: 'filter-tabs'}).length).toBe(0);
    });
  });

  describe('Header & Counter', () => {
    it('renders header with total task count and logout action', () => {
      mockTasksData = [
        createMockTask({_id: 't-1', title: 'Task 1'}),
        createMockTask({_id: 't-2', title: 'Task 2'}),
      ];
      const tree = renderComponent();

      const headerTitle = tree.root.findByProps({testID: 'home-title'});
      expect(headerTitle.props.children).toBe('My Tasks (2)');

      const logoutBtn = tree.root.findByProps({testID: 'logout-button'});
      expect(logoutBtn).toBeDefined();
    });

    it('renders "My Tasks (0)" when tasks list is empty', () => {
      mockTasksData = [];
      const tree = renderComponent();

      const headerTitle = tree.root.findByProps({testID: 'home-title'});
      expect(headerTitle.props.children).toBe('My Tasks (0)');
    });

    it('keeps total task count in header even when active filter is selected', () => {
      mockTasksData = [
        createMockTask({_id: 't-1', completed: false}),
        createMockTask({_id: 't-2', completed: true}),
      ];
      const tree = renderComponent();

      // Switch to 'completed' filter
      const completedTab = tree.root.findByProps({
        testID: 'filter-tabs-completed',
      });
      act(() => {
        completedTab.props.onPress();
        jest.runOnlyPendingTimers();
      });

      // Total count in header still reflects total tasks (2)
      const headerTitle = tree.root.findByProps({testID: 'home-title'});
      expect(headerTitle.props.children).toBe('My Tasks (2)');
    });
  });

  describe('Composite Sorting & List Display', () => {
    it('renders tasks in sorted order based on composite urgency score', () => {
      const pastDeadline = new Date(Date.now() - 3600000).toISOString();
      const futureDeadline = new Date(Date.now() + 100 * 3600000).toISOString();

      // Urgent task: High priority + past deadline
      const urgentTask = createMockTask({
        _id: 'urgent-1',
        title: 'Urgent Server Crash',
        priority: 'high',
        deadline: pastDeadline,
        dateTime: pastDeadline,
        completed: false,
      });

      // Normal task: Low priority + future deadline
      const lowTask = createMockTask({
        _id: 'low-1',
        title: 'Optional Reading',
        priority: 'low',
        deadline: futureDeadline,
        dateTime: futureDeadline,
        completed: false,
      });

      // Data is provided in reverse order
      mockTasksData = [lowTask, urgentTask];
      const tree = renderComponent();

      const cards = tree.root.findAllByType(TaskCard);
      expect(cards.length).toBe(2);
      // Urgent task should be sorted first
      expect(cards[0].props.task._id).toBe('urgent-1');
      expect(cards[1].props.task._id).toBe('low-1');
    });
  });

  describe('Filter Switching', () => {
    it('defaults to "all" filter and displays both active and completed tasks', () => {
      mockTasksData = [
        createMockTask({_id: 't-1', completed: false}),
        createMockTask({_id: 't-2', completed: true}),
      ];
      const tree = renderComponent();

      const cards = tree.root.findAllByType(TaskCard);
      expect(cards.length).toBe(2);
    });

    it('switches to "active" filter and displays only incomplete tasks', () => {
      mockTasksData = [
        createMockTask({_id: 't-1', title: 'Active Task', completed: false}),
        createMockTask({
          _id: 't-2',
          title: 'Done Task',
          completed: true,
        }),
      ];
      const tree = renderComponent();

      const activeTab = tree.root.findByProps({testID: 'filter-tabs-active'});
      act(() => {
        activeTab.props.onPress();
        jest.runOnlyPendingTimers();
      });

      const cards = tree.root.findAllByType(TaskCard);
      expect(cards.length).toBe(1);
      expect(cards[0].props.task.title).toBe('Active Task');
    });

    it('switches to "completed" filter and displays only completed tasks', () => {
      mockTasksData = [
        createMockTask({_id: 't-1', title: 'Active Task', completed: false}),
        createMockTask({
          _id: 't-2',
          title: 'Done Task',
          completed: true,
        }),
      ];
      const tree = renderComponent();

      const completedTab = tree.root.findByProps({
        testID: 'filter-tabs-completed',
      });
      act(() => {
        completedTab.props.onPress();
        jest.runOnlyPendingTimers();
      });

      const cards = tree.root.findAllByType(TaskCard);
      expect(cards.length).toBe(1);
      expect(cards[0].props.task.title).toBe('Done Task');
    });

    it('switches back to "all" filter and restores full list', () => {
      mockTasksData = [
        createMockTask({_id: 't-1', completed: false}),
        createMockTask({_id: 't-2', completed: true}),
      ];
      const tree = renderComponent();

      // Switch to completed
      act(() => {
        tree.root
          .findByProps({testID: 'filter-tabs-completed'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });
      expect(tree.root.findAllByType(TaskCard).length).toBe(1);

      // Switch back to all
      act(() => {
        tree.root.findByProps({testID: 'filter-tabs-all'}).props.onPress();
        jest.runOnlyPendingTimers();
      });
      expect(tree.root.findAllByType(TaskCard).length).toBe(2);
    });
  });

  describe('Empty States', () => {
    it('renders default empty state when there are no tasks', () => {
      mockTasksData = [];
      const tree = renderComponent();

      const emptyContainer = tree.root.findByProps({testID: 'empty-state'});
      expect(emptyContainer).toBeDefined();

      const emptyTitle = tree.root.findByProps({
        testID: 'empty-state-title',
      });
      expect(emptyTitle.props.children).toBe('No Tasks Yet');

      const emptyIcon = tree.root.findByProps({testID: 'empty-state-icon'});
      expect(emptyIcon.props.children).toBe('📝');
    });

    it('renders "No Active Tasks" empty state when all tasks are completed in active view', () => {
      mockTasksData = [createMockTask({_id: 't-1', completed: true})];
      const tree = renderComponent();

      // Switch to active filter
      act(() => {
        tree.root.findByProps({testID: 'filter-tabs-active'}).props.onPress();
        jest.runOnlyPendingTimers();
      });

      const emptyTitle = tree.root.findByProps({
        testID: 'empty-state-title',
      });
      expect(emptyTitle.props.children).toBe('No Active Tasks');

      const emptyIcon = tree.root.findByProps({testID: 'empty-state-icon'});
      expect(emptyIcon.props.children).toBe('✨');
    });

    it('renders "No Completed Tasks" empty state when there are no completed tasks', () => {
      mockTasksData = [createMockTask({_id: 't-1', completed: false})];
      const tree = renderComponent();

      // Switch to completed filter
      act(() => {
        tree.root
          .findByProps({testID: 'filter-tabs-completed'})
          .props.onPress();
        jest.runOnlyPendingTimers();
      });

      const emptyTitle = tree.root.findByProps({
        testID: 'empty-state-title',
      });
      expect(emptyTitle.props.children).toBe('No Completed Tasks');

      const emptyIcon = tree.root.findByProps({testID: 'empty-state-icon'});
      expect(emptyIcon.props.children).toBe('🎯');
    });
  });

  describe('Pull to Refresh', () => {
    it('provides pull-to-refresh and calls refetch on refresh trigger', () => {
      mockTasksData = [createMockTask({_id: 't-1'})];
      const tree = renderComponent();

      const flatList = tree.root.findByProps({testID: 'task-list'});
      expect(flatList.props.refreshing).toBe(false);

      act(() => {
        flatList.props.onRefresh();
        jest.runOnlyPendingTimers();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Interactions & Mutations', () => {
    it('navigates to TaskDetail with taskId when card is pressed', () => {
      mockTasksData = [createMockTask({_id: 'target-task-id'})];
      const tree = renderComponent();

      const card = tree.root.findByType(TaskCard);
      act(() => {
        card.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(mockNav.navigate).toHaveBeenCalledWith('TaskDetail', {
        taskId: 'target-task-id',
      });
    });

    it('triggers updateTask mutation when toggling incomplete task to completed', async () => {
      mockTasksData = [createMockTask({_id: 't-1', completed: false})];
      const tree = renderComponent();

      const card = tree.root.findByType(TaskCard);
      await act(async () => {
        card.props.onComplete();
        jest.runOnlyPendingTimers();
      });

      expect(mockUpdateTaskTrigger).toHaveBeenCalledWith({
        id: 't-1',
        data: {completed: true},
      });
    });

    it('triggers updateTask mutation when toggling completed task to incomplete', async () => {
      mockTasksData = [createMockTask({_id: 't-2', completed: true})];
      const tree = renderComponent();

      const card = tree.root.findByType(TaskCard);
      await act(async () => {
        card.props.onComplete();
        jest.runOnlyPendingTimers();
      });

      expect(mockUpdateTaskTrigger).toHaveBeenCalledWith({
        id: 't-2',
        data: {completed: false},
      });
    });

    it('shows confirmation Alert when delete is triggered on a card and aborts if Cancelled', () => {
      mockTasksData = [
        createMockTask({_id: 't-delete-1', title: 'Task to Delete'}),
      ];
      const tree = renderComponent();

      const card = tree.root.findByType(TaskCard);
      act(() => {
        card.props.onDelete();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(
        'Delete Task',
        'Are you sure you want to delete "Task to Delete"?',
        expect.any(Array),
      );

      const buttons = alertSpy.mock.calls[0][2];
      const cancelBtn = buttons.find((b: any) => b.text === 'Cancel');
      expect(cancelBtn).toBeDefined();

      // Trigger cancel
      act(() => {
        cancelBtn.onPress?.();
        jest.runOnlyPendingTimers();
      });

      expect(mockDeleteTaskTrigger).not.toHaveBeenCalled();
    });

    it('calls deleteTask mutation when delete is confirmed in Alert', async () => {
      mockTasksData = [
        createMockTask({_id: 't-delete-confirm', title: 'Delete Me'}),
      ];
      const tree = renderComponent();

      const card = tree.root.findByType(TaskCard);
      act(() => {
        card.props.onDelete();
        jest.runOnlyPendingTimers();
      });

      const buttons = alertSpy.mock.calls[0][2];
      const deleteBtn = buttons.find((b: any) => b.text === 'Delete');
      expect(deleteBtn).toBeDefined();

      await act(async () => {
        deleteBtn.onPress?.();
        jest.runOnlyPendingTimers();
      });

      expect(mockDeleteTaskTrigger).toHaveBeenCalledWith('t-delete-confirm');
    });
  });

  describe('Floating Action Button (FAB)', () => {
    it('renders FAB and navigates to TaskForm on press', () => {
      mockTasksData = [createMockTask()];
      const tree = renderComponent();

      const fab = tree.root.findByType(FAB);
      expect(fab).toBeDefined();

      act(() => {
        fab.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(mockNav.navigate).toHaveBeenCalledWith('TaskForm', {});
    });
  });

  describe('Logout Flow', () => {
    it('prompts confirmation Alert on logout press and does nothing if cancelled', () => {
      const store = createTestStore();
      const tree = renderComponent(store);

      const logoutBtn = tree.root.findByProps({testID: 'logout-button'});
      act(() => {
        logoutBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(
        'Logout',
        'Are you sure you want to log out?',
        expect.any(Array),
      );

      const buttons = alertSpy.mock.calls[0][2];
      const cancelBtn = buttons.find((b: any) => b.text === 'Cancel');
      expect(cancelBtn).toBeDefined();

      act(() => {
        cancelBtn.onPress?.();
        jest.runOnlyPendingTimers();
      });

      // Still authenticated
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.token).toBe('test-token');
    });

    it('dispatches logout and clears session when logout is confirmed', () => {
      const store = createTestStore();
      const tree = renderComponent(store);

      const logoutBtn = tree.root.findByProps({testID: 'logout-button'});
      act(() => {
        logoutBtn.props.onPress();
        jest.runOnlyPendingTimers();
      });

      const buttons = alertSpy.mock.calls[0][2];
      const confirmLogoutBtn = buttons.find((b: any) => b.text === 'Logout');
      expect(confirmLogoutBtn).toBeDefined();

      act(() => {
        confirmLogoutBtn.onPress?.();
        jest.runOnlyPendingTimers();
      });

      // Session cleared in Redux
      expect(store.getState().auth.isAuthenticated).toBe(false);
      expect(store.getState().auth.token).toBeNull();
      expect(store.getState().auth.user).toBeNull();
    });
  });
});
