import {Priority, Task} from '../types';

export type TaskFilter = 'all' | 'active' | 'completed';

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface UrgencyBreakdown {
  priorityWeight: number;
  deadlineUrgency: number;
  dateTimeProximity: number;
  totalScore: number;
}

/**
 * Returns numeric weight for task priority:
 * - high: 3
 * - medium: 2
 * - low: 1
 */
export function getPriorityWeight(priority: Priority | string): number {
  return PRIORITY_WEIGHTS[priority as Priority] ?? 1;
}

/**
 * Calculates deadline urgency score:
 * - If overdue or due now (hours <= 0): 10
 * - Otherwise: min(10, 10 / (hoursUntilDeadline + 1))
 */
export function getDeadlineUrgency(
  deadline: string | Date | undefined | null,
  now: Date = new Date(),
): number {
  if (!deadline) {
    return 0;
  }
  const deadlineDate =
    typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(deadlineDate.getTime())) {
    return 0;
  }

  const hoursUntilDeadline =
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDeadline <= 0) {
    return 10;
  }
  return Math.min(10, 10 / (hoursUntilDeadline + 1));
}

/**
 * Calculates date-time proximity score:
 * - If now or in past (hours <= 0): 5
 * - Otherwise: min(5, 5 / (hoursUntilDateTime + 1))
 */
export function getDateTimeProximity(
  dateTime: string | Date | undefined | null,
  now: Date = new Date(),
): number {
  if (!dateTime) {
    return 0;
  }
  const dtDate = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(dtDate.getTime())) {
    return 0;
  }

  const hoursUntilDateTime =
    (dtDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDateTime <= 0) {
    return 5;
  }
  return Math.min(5, 5 / (hoursUntilDateTime + 1));
}

/**
 * Calculates score breakdown for a task:
 * priorityWeight + deadlineUrgency + dateTimeProximity
 */
export function getUrgencyScoreBreakdown(
  task: Task,
  now: Date = new Date(),
): UrgencyBreakdown {
  const priorityWeight = getPriorityWeight(task.priority);
  const deadlineUrgency = getDeadlineUrgency(task.deadline, now);
  const dateTimeProximity = getDateTimeProximity(task.dateTime, now);
  const totalScore = priorityWeight + deadlineUrgency + dateTimeProximity;

  return {
    priorityWeight,
    deadlineUrgency,
    dateTimeProximity,
    totalScore,
  };
}

/**
 * Computes composite urgency score for a task.
 */
export function calculateUrgencyScore(
  task: Task,
  now: Date = new Date(),
): number {
  return getUrgencyScoreBreakdown(task, now).totalScore;
}

export const calculateTaskScore = calculateUrgencyScore;

/**
 * Filters and sorts tasks descending by composite urgency score.
 * Pure non-mutating function that returns a new array.
 */
export function sortTasks(
  tasks: Task[],
  filter: TaskFilter = 'all',
  now: Date = new Date(),
): Task[] {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  let filtered = tasks;
  if (filter === 'active') {
    filtered = tasks.filter(task => !task.completed);
  } else if (filter === 'completed') {
    filtered = tasks.filter(task => task.completed);
  }

  return [...filtered].sort((a, b) => {
    const scoreA = calculateUrgencyScore(a, now);
    const scoreB = calculateUrgencyScore(b, now);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tie breaker 1: earlier deadline first
    const deadlineA = new Date(a.deadline).getTime();
    const deadlineB = new Date(b.deadline).getTime();
    if (!isNaN(deadlineA) && !isNaN(deadlineB) && deadlineA !== deadlineB) {
      return deadlineA - deadlineB;
    }

    // Tie breaker 2: stable deterministic fallback by _id or title
    return (a._id || a.title || '').localeCompare(b._id || b.title || '');
  });
}
