import React from 'react';
import renderer from 'react-test-renderer';
import {describe, it, expect, jest, beforeEach, afterEach} from '@jest/globals';
import {TaskCard} from '../TaskCard';
import {Task} from '../../types';
import {Colors} from '../../theme/colors';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  _id: 'task-123',
  userId: 'user-456',
  title: 'Complete SDD implementation',
  description: 'Detailed description of the task requirements',
  dateTime: new Date(2026, 9, 5, 10, 0).toISOString(),
  deadline: new Date(2026, 9, 6, 18, 0).toISOString(),
  priority: 'high',
  completed: false,
  category: 'Engineering',
  tags: ['work', 'sdd', 'react-native', 'extra-tag'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('TaskCard Component', () => {
  let defaultTask: Task;
  let mockOnPress: jest.Mock<() => void>;
  let mockOnComplete: jest.Mock<() => void>;
  let mockOnDelete: jest.Mock<() => void>;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    defaultTask = createMockTask();
    mockOnPress = jest.fn();
    mockOnComplete = jest.fn();
    mockOnDelete = jest.fn();
  });

  afterEach(() => {
    if (tree) {
      tree.unmount();
      tree = null;
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders task title and priority badge', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const titleNode = root.findByProps({testID: 'task-card-title'});
    expect(titleNode.props.children).toBe('Complete SDD implementation');

    const priorityBadge = root.findByProps({testID: 'task-card-priority'});
    expect(priorityBadge.props.priority).toBe('high');
  });

  it('renders title with line-through and checkmark when task is completed', () => {
    const completedTask = createMockTask({completed: true});
    tree = renderer.create(
      <TaskCard
        task={completedTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const titleNode = root.findByProps({testID: 'task-card-title'});
    expect(titleNode.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({textDecorationLine: 'line-through'}),
      ]),
    );

    const checkmarkNode = root.findByProps({testID: 'task-card-checkmark'});
    expect(checkmarkNode.props.children).toBe('✓');
  });

  it('does not render checkmark when task is not completed', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    expect(() => root.findByProps({testID: 'task-card-checkmark'})).toThrow();
  });

  it('renders description with numberOfLines={2} when description is present', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const descNode = root.findByProps({testID: 'task-card-description'});
    expect(descNode.props.children).toBe(defaultTask.description);
    expect(descNode.props.numberOfLines).toBe(2);
  });

  it('omits description when task has no description', () => {
    const noDescTask = createMockTask({description: undefined});
    tree = renderer.create(
      <TaskCard
        task={noDescTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    expect(() => root.findByProps({testID: 'task-card-description'})).toThrow();
  });

  it('renders at most 3 TagChips even when task has more tags', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const tag0 = root.findByProps({testID: 'task-card-tag-0'});
    const tag1 = root.findByProps({testID: 'task-card-tag-1'});
    const tag2 = root.findByProps({testID: 'task-card-tag-2'});

    expect(tag0.props.label).toBe('work');
    expect(tag1.props.label).toBe('sdd');
    expect(tag2.props.label).toBe('react-native');

    expect(() => root.findByProps({testID: 'task-card-tag-3'})).toThrow();
  });

  it('omits tags row when task has no tags', () => {
    const noTagsTask = createMockTask({tags: []});
    tree = renderer.create(
      <TaskCard
        task={noTagsTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    expect(() => root.findByProps({testID: 'task-card-tags'})).toThrow();
  });

  it('renders relative deadline and formats correctly', () => {
    const futureDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const futureTask = createMockTask({deadline: futureDate});

    tree = renderer.create(
      <TaskCard
        task={futureTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const deadlineNode = root.findByProps({testID: 'task-card-deadline'});
    expect(deadlineNode.props.children).toContain('Due in');
  });

  it('colors deadline text with danger color when overdue', () => {
    const pastDate = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const overdueTask = createMockTask({deadline: pastDate});

    tree = renderer.create(
      <TaskCard
        task={overdueTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const deadlineNode = root.findByProps({testID: 'task-card-deadline'});
    expect(deadlineNode.props.children).toContain('Overdue');
    expect(deadlineNode.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({color: Colors.danger})]),
    );
  });

  it('applies priority color to left border for high, medium, and low', () => {
    const highTask = createMockTask({priority: 'high'});
    tree = renderer.create(
      <TaskCard
        task={highTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const highCard = tree.root.findByProps({testID: 'task-card'});
    expect(highCard.props.style).toEqual(
      expect.arrayContaining([{borderLeftColor: Colors.danger}]),
    );
    tree.unmount();
    tree = null;

    const medTask = createMockTask({priority: 'medium'});
    tree = renderer.create(
      <TaskCard
        task={medTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const medCard = tree.root.findByProps({testID: 'task-card'});
    expect(medCard.props.style).toEqual(
      expect.arrayContaining([{borderLeftColor: Colors.warning}]),
    );
    tree.unmount();
    tree = null;

    const lowTask = createMockTask({priority: 'low'});
    tree = renderer.create(
      <TaskCard
        task={lowTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const lowCard = tree.root.findByProps({testID: 'task-card'});
    expect(lowCard.props.style).toEqual(
      expect.arrayContaining([{borderLeftColor: Colors.success}]),
    );
  });

  it('fires onPress callback when card body is pressed', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const body = root.findByProps({testID: 'task-card-body'});
    body.props.onPress();
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('fires onComplete callback when complete toggle button is pressed', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const completeBtn = root.findByProps({testID: 'task-card-complete'});
    completeBtn.props.onPress();
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('fires onDelete callback when delete button is pressed', () => {
    tree = renderer.create(
      <TaskCard
        task={defaultTask}
        onPress={mockOnPress}
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
      />,
    );
    const root = tree.root;

    const deleteBtn = root.findByProps({testID: 'task-card-delete'});
    deleteBtn.props.onPress();
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
