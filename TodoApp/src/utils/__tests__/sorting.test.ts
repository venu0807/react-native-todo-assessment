import {describe, it, expect} from '@jest/globals';
import {Task} from '../../types';
import {
  calculateTaskScore,
  calculateUrgencyScore,
  getDeadlineUrgency,
  getDateTimeProximity,
  getPriorityWeight,
  getUrgencyScoreBreakdown,
  PRIORITY_WEIGHTS,
  sortTasks,
} from '../sorting';

describe('sorting utility', () => {
  const BASE_NOW = new Date('2026-10-05T12:00:00.000Z');

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    _id: 'task-1',
    userId: 'user-1',
    title: 'Test Task',
    description: 'A task for unit testing',
    dateTime: '2026-10-05T14:00:00.000Z',
    deadline: '2026-10-05T16:00:00.000Z',
    priority: 'medium',
    completed: false,
    category: 'Work',
    tags: ['test'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  });

  describe('priorityWeight', () => {
    it('defines correct weights in PRIORITY_WEIGHTS constant', () => {
      expect(PRIORITY_WEIGHTS.high).toBe(3);
      expect(PRIORITY_WEIGHTS.medium).toBe(2);
      expect(PRIORITY_WEIGHTS.low).toBe(1);
    });

    it('returns 3 for high priority', () => {
      expect(getPriorityWeight('high')).toBe(3);
    });

    it('returns 2 for medium priority', () => {
      expect(getPriorityWeight('medium')).toBe(2);
    });

    it('returns 1 for low priority', () => {
      expect(getPriorityWeight('low')).toBe(1);
    });

    it('falls back to 1 for unknown priority', () => {
      expect(getPriorityWeight('urgent')).toBe(1);
      expect(getPriorityWeight('')).toBe(1);
    });
  });

  describe('deadlineUrgency', () => {
    it('returns 10 when deadline is overdue (in the past)', () => {
      const pastDeadline = new Date(
        BASE_NOW.getTime() - 2 * 60 * 60 * 1000,
      ).toISOString(); // -2 hours
      expect(getDeadlineUrgency(pastDeadline, BASE_NOW)).toBe(10);
    });

    it('returns 10 when deadline is right now (hours === 0)', () => {
      expect(getDeadlineUrgency(BASE_NOW.toISOString(), BASE_NOW)).toBe(10);
    });

    it('returns correct urgency score for future deadlines: min(10, 10 / (hours + 1))', () => {
      // 1 hour away: 10 / (1 + 1) = 5
      const in1h = new Date(
        BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDeadlineUrgency(in1h, BASE_NOW)).toBeCloseTo(5, 5);

      // 3 hours away: 10 / (3 + 1) = 2.5
      const in3h = new Date(
        BASE_NOW.getTime() + 3 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDeadlineUrgency(in3h, BASE_NOW)).toBeCloseTo(2.5, 5);

      // 9 hours away: 10 / (9 + 1) = 1.0
      const in9h = new Date(
        BASE_NOW.getTime() + 9 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDeadlineUrgency(in9h, BASE_NOW)).toBeCloseTo(1.0, 5);

      // 24 hours away: 10 / (24 + 1) = 0.4
      const in24h = new Date(
        BASE_NOW.getTime() + 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDeadlineUrgency(in24h, BASE_NOW)).toBeCloseTo(0.4, 5);
    });

    it('ensures closer deadlines produce higher urgency scores than distant ones', () => {
      const in2h = new Date(
        BASE_NOW.getTime() + 2 * 60 * 60 * 1000,
      ).toISOString();
      const in8h = new Date(
        BASE_NOW.getTime() + 8 * 60 * 60 * 1000,
      ).toISOString();
      const urgency2h = getDeadlineUrgency(in2h, BASE_NOW);
      const urgency8h = getDeadlineUrgency(in8h, BASE_NOW);

      expect(urgency2h).toBeGreaterThan(urgency8h);
    });

    it('handles Date object input', () => {
      const in1h = new Date(BASE_NOW.getTime() + 1 * 60 * 60 * 1000);
      expect(getDeadlineUrgency(in1h, BASE_NOW)).toBeCloseTo(5, 5);
    });

    it('returns 0 for undefined, null, or invalid deadlines', () => {
      expect(getDeadlineUrgency(undefined, BASE_NOW)).toBe(0);
      expect(getDeadlineUrgency(null, BASE_NOW)).toBe(0);
      expect(getDeadlineUrgency('invalid-date', BASE_NOW)).toBe(0);
    });
  });

  describe('dateTimeProximity', () => {
    it('returns 5 when dateTime is in the past', () => {
      const pastDateTime = new Date(
        BASE_NOW.getTime() - 1 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDateTimeProximity(pastDateTime, BASE_NOW)).toBe(5);
    });

    it('returns 5 when dateTime is right now (hours === 0)', () => {
      expect(getDateTimeProximity(BASE_NOW.toISOString(), BASE_NOW)).toBe(5);
    });

    it('returns correct proximity score for future dateTimes: min(5, 5 / (hours + 1))', () => {
      // 1 hour away: 5 / (1 + 1) = 2.5
      const in1h = new Date(
        BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDateTimeProximity(in1h, BASE_NOW)).toBeCloseTo(2.5, 5);

      // 4 hours away: 5 / (4 + 1) = 1.0
      const in4h = new Date(
        BASE_NOW.getTime() + 4 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDateTimeProximity(in4h, BASE_NOW)).toBeCloseTo(1.0, 5);

      // 9 hours away: 5 / (9 + 1) = 0.5
      const in9h = new Date(
        BASE_NOW.getTime() + 9 * 60 * 60 * 1000,
      ).toISOString();
      expect(getDateTimeProximity(in9h, BASE_NOW)).toBeCloseTo(0.5, 5);
    });

    it('returns 0 for undefined, null, or invalid dateTimes', () => {
      expect(getDateTimeProximity(undefined, BASE_NOW)).toBe(0);
      expect(getDateTimeProximity(null, BASE_NOW)).toBe(0);
      expect(getDateTimeProximity('not-a-date', BASE_NOW)).toBe(0);
    });
  });

  describe('composite urgency score', () => {
    it('computes breakdown matching priorityWeight + deadlineUrgency + dateTimeProximity', () => {
      // Priority: high (3)
      // Deadline: 1h away -> 10 / (1 + 1) = 5
      // DateTime: 1h away -> 5 / (1 + 1) = 2.5
      // Total = 3 + 5 + 2.5 = 10.5
      const task = createMockTask({
        priority: 'high',
        deadline: new Date(
          BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
        ).toISOString(),
      });

      const breakdown = getUrgencyScoreBreakdown(task, BASE_NOW);
      expect(breakdown.priorityWeight).toBe(3);
      expect(breakdown.deadlineUrgency).toBeCloseTo(5, 5);
      expect(breakdown.dateTimeProximity).toBeCloseTo(2.5, 5);
      expect(breakdown.totalScore).toBeCloseTo(10.5, 5);

      expect(calculateUrgencyScore(task, BASE_NOW)).toBeCloseTo(10.5, 5);
      expect(calculateTaskScore(task, BASE_NOW)).toBeCloseTo(10.5, 5);
    });

    it('gives maximum score (18) for high priority, overdue deadline, and past dateTime', () => {
      const overdueTask = createMockTask({
        priority: 'high',
        deadline: new Date(
          BASE_NOW.getTime() - 3 * 60 * 60 * 1000,
        ).toISOString(), // 10
        dateTime: new Date(
          BASE_NOW.getTime() - 2 * 60 * 60 * 1000,
        ).toISOString(), // 5
      });

      expect(calculateUrgencyScore(overdueTask, BASE_NOW)).toBe(18); // 3 + 10 + 5
    });

    it('ranks high priority task higher than medium and low priority with same dates', () => {
      const deadline = new Date(
        BASE_NOW.getTime() + 4 * 60 * 60 * 1000,
      ).toISOString();
      const dateTime = new Date(
        BASE_NOW.getTime() + 2 * 60 * 60 * 1000,
      ).toISOString();

      const highTask = createMockTask({priority: 'high', deadline, dateTime});
      const mediumTask = createMockTask({
        priority: 'medium',
        deadline,
        dateTime,
      });
      const lowTask = createMockTask({priority: 'low', deadline, dateTime});

      const highScore = calculateUrgencyScore(highTask, BASE_NOW);
      const mediumScore = calculateUrgencyScore(mediumTask, BASE_NOW);
      const lowScore = calculateUrgencyScore(lowTask, BASE_NOW);

      expect(highScore).toBeGreaterThan(mediumScore);
      expect(mediumScore).toBeGreaterThan(lowScore);
      expect(highScore - mediumScore).toBeCloseTo(1, 5);
      expect(mediumScore - lowScore).toBeCloseTo(1, 5);
    });

    it('ranks task with closer deadline higher than distant deadline when priority and dateTime are equal', () => {
      const nearDeadlineTask = createMockTask({
        priority: 'medium',
        deadline: new Date(
          BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 2 * 60 * 60 * 1000,
        ).toISOString(),
      });
      const farDeadlineTask = createMockTask({
        priority: 'medium',
        deadline: new Date(
          BASE_NOW.getTime() + 10 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 2 * 60 * 60 * 1000,
        ).toISOString(),
      });

      expect(calculateUrgencyScore(nearDeadlineTask, BASE_NOW)).toBeGreaterThan(
        calculateUrgencyScore(farDeadlineTask, BASE_NOW),
      );
    });

    it('ranks task with closer dateTime higher than distant dateTime when priority and deadline are equal', () => {
      const nearDateTimeTask = createMockTask({
        priority: 'medium',
        deadline: new Date(
          BASE_NOW.getTime() + 8 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
        ).toISOString(),
      });
      const farDateTimeTask = createMockTask({
        priority: 'medium',
        deadline: new Date(
          BASE_NOW.getTime() + 8 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 12 * 60 * 60 * 1000,
        ).toISOString(),
      });

      expect(calculateUrgencyScore(nearDateTimeTask, BASE_NOW)).toBeGreaterThan(
        calculateUrgencyScore(farDateTimeTask, BASE_NOW),
      );
    });
  });

  describe('sortTasks', () => {
    const tasks: Task[] = [
      createMockTask({
        _id: 'task-active-low-far',
        title: 'Active Low Far',
        priority: 'low',
        completed: false,
        deadline: new Date(
          BASE_NOW.getTime() + 48 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      createMockTask({
        _id: 'task-completed-high-overdue',
        title: 'Completed High Overdue',
        priority: 'high',
        completed: true,
        deadline: new Date(
          BASE_NOW.getTime() - 2 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() - 4 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      createMockTask({
        _id: 'task-active-high-overdue',
        title: 'Active High Overdue',
        priority: 'high',
        completed: false,
        deadline: new Date(
          BASE_NOW.getTime() - 1 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() - 2 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      createMockTask({
        _id: 'task-active-medium-near',
        title: 'Active Medium Near',
        priority: 'medium',
        completed: false,
        deadline: new Date(
          BASE_NOW.getTime() + 2 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 1 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      createMockTask({
        _id: 'task-completed-low-far',
        title: 'Completed Low Far',
        priority: 'low',
        completed: true,
        deadline: new Date(
          BASE_NOW.getTime() + 72 * 60 * 60 * 1000,
        ).toISOString(),
        dateTime: new Date(
          BASE_NOW.getTime() + 48 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    ];

    describe('filtering', () => {
      it('returns all tasks when filter is "all"', () => {
        const sorted = sortTasks(tasks, 'all', BASE_NOW);
        expect(sorted).toHaveLength(5);
        expect(sorted.map(t => t._id)).toContain('task-active-high-overdue');
        expect(sorted.map(t => t._id)).toContain('task-completed-high-overdue');
      });

      it('defaults to filter "all" when filter argument is omitted', () => {
        const sorted = sortTasks(tasks, undefined, BASE_NOW);
        expect(sorted).toHaveLength(5);
      });

      it('filters out completed tasks when filter is "active"', () => {
        const sorted = sortTasks(tasks, 'active', BASE_NOW);
        expect(sorted).toHaveLength(3);
        sorted.forEach(t => {
          expect(t.completed).toBe(false);
        });
      });

      it('filters out active tasks when filter is "completed"', () => {
        const sorted = sortTasks(tasks, 'completed', BASE_NOW);
        expect(sorted).toHaveLength(2);
        sorted.forEach(t => {
          expect(t.completed).toBe(true);
        });
      });

      it('handles empty task list gracefully', () => {
        expect(sortTasks([], 'all', BASE_NOW)).toEqual([]);
        expect(sortTasks([], 'active', BASE_NOW)).toEqual([]);
        expect(sortTasks([], 'completed', BASE_NOW)).toEqual([]);
      });

      it('handles null or invalid task input gracefully', () => {
        // @ts-expect-error test invalid runtime input
        expect(sortTasks(null, 'all', BASE_NOW)).toEqual([]);
        // @ts-expect-error test invalid runtime input
        expect(sortTasks(undefined, 'all', BASE_NOW)).toEqual([]);
      });
    });

    describe('immutability and pure function contract', () => {
      it('does not mutate the original tasks array', () => {
        const tasksCopy = tasks.map(t => ({...t}));
        const originalFirstId = tasks[0]._id;

        const result = sortTasks(tasks, 'all', BASE_NOW);

        expect(tasks[0]._id).toBe(originalFirstId);
        expect(tasks).toEqual(tasksCopy);
        expect(result).not.toBe(tasks);
      });
    });

    describe('sorting order', () => {
      it('sorts descending by composite score (highest urgency first)', () => {
        const sorted = sortTasks(tasks, 'all', BASE_NOW);

        for (let i = 0; i < sorted.length - 1; i++) {
          const scoreCurrent = calculateUrgencyScore(sorted[i], BASE_NOW);
          const scoreNext = calculateUrgencyScore(sorted[i + 1], BASE_NOW);
          expect(scoreCurrent).toBeGreaterThanOrEqual(scoreNext);
        }
      });

      it('places overdue high-priority tasks first', () => {
        const sorted = sortTasks(tasks, 'all', BASE_NOW);
        const topTask = sorted[0];

        // Active high overdue and completed high overdue both have score 18
        expect(calculateUrgencyScore(topTask, BASE_NOW)).toBe(18);
        expect(topTask.priority).toBe('high');
      });

      it('resolves equal-score ties by earlier deadline first', () => {
        const task1 = createMockTask({
          _id: 'task-tie-earlier-deadline',
          title: 'Tie Earlier',
          priority: 'high',
          deadline: '2026-10-04T10:00:00.000Z', // earlier overdue
          dateTime: '2026-10-04T08:00:00.000Z',
        });
        const task2 = createMockTask({
          _id: 'task-tie-later-deadline',
          title: 'Tie Later',
          priority: 'high',
          deadline: '2026-10-05T08:00:00.000Z', // later overdue
          dateTime: '2026-10-04T08:00:00.000Z',
        });

        // Both score 18 (both deadlines & dateTimes are overdue relative to BASE_NOW)
        expect(calculateUrgencyScore(task1, BASE_NOW)).toBe(18);
        expect(calculateUrgencyScore(task2, BASE_NOW)).toBe(18);

        const sorted = sortTasks([task2, task1], 'all', BASE_NOW);
        expect(sorted[0]._id).toBe('task-tie-earlier-deadline');
        expect(sorted[1]._id).toBe('task-tie-later-deadline');
      });

      it('resolves exact ties deterministically with fallback to id/title', () => {
        const identical1 = createMockTask({
          _id: 'task-a',
          title: 'Same Title',
          priority: 'medium',
          deadline: BASE_NOW.toISOString(),
          dateTime: BASE_NOW.toISOString(),
        });
        const identical2 = createMockTask({
          _id: 'task-b',
          title: 'Same Title',
          priority: 'medium',
          deadline: BASE_NOW.toISOString(),
          dateTime: BASE_NOW.toISOString(),
        });

        const sorted = sortTasks([identical2, identical1], 'all', BASE_NOW);
        expect(sorted[0]._id).toBe('task-a');
        expect(sorted[1]._id).toBe('task-b');
      });

      it('runs successfully with default system date when now is omitted', () => {
        const sorted = sortTasks(tasks, 'all');
        expect(sorted).toHaveLength(5);
        expect(Array.isArray(sorted)).toBe(true);
      });
    });
  });
});
