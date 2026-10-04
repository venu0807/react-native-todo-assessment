import {describe, it, expect} from '@jest/globals';
import {formatDate, getRelativeDeadline, isOverdue} from '../dateHelpers';

describe('dateHelpers utility', () => {
  describe('formatDate', () => {
    it('formats a date into readable "Mon Day, H:MM AM/PM" format', () => {
      const date = new Date(2026, 9, 5, 10, 0); // Oct 5, 2026 at 10:00 AM local
      expect(formatDate(date.toISOString())).toBe('Oct 5, 10:00 AM');
    });

    it('formats midnight correctly as 12:00 AM', () => {
      const midnight = new Date(2026, 9, 5, 0, 0);
      expect(formatDate(midnight.toISOString())).toBe('Oct 5, 12:00 AM');
    });

    it('formats noon correctly as 12:00 PM', () => {
      const noon = new Date(2026, 9, 5, 12, 0);
      expect(formatDate(noon.toISOString())).toBe('Oct 5, 12:00 PM');
    });

    it('formats evening times with PM and padding', () => {
      const night = new Date(2026, 9, 5, 23, 45);
      expect(formatDate(night.toISOString())).toBe('Oct 5, 11:45 PM');
    });

    it('pads single-digit minutes with leading zero', () => {
      const padded = new Date(2026, 9, 5, 9, 5);
      expect(formatDate(padded.toISOString())).toBe('Oct 5, 9:05 AM');
    });

    it('accepts Date objects directly', () => {
      const date = new Date(2026, 9, 5, 14, 30);
      expect(formatDate(date)).toBe('Oct 5, 2:30 PM');
    });

    it('formats dates across different months correctly', () => {
      const expectedMonths = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      expectedMonths.forEach((expectedMonth, monthIndex) => {
        const d = new Date(2026, monthIndex, 15, 10, 0);
        expect(formatDate(d)).toBe(`${expectedMonth} 15, 10:00 AM`);
      });
    });

    it('returns empty string for empty, null, or undefined values', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('returns "Invalid date" for malformed strings', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
      expect(formatDate('2026-99-99')).toBe('Invalid date');
    });
  });

  describe('isOverdue', () => {
    const referenceNow = new Date(2026, 9, 5, 12, 0, 0);

    it('returns true when deadline is in the past', () => {
      const past = new Date(2026, 9, 5, 11, 0, 0);
      expect(isOverdue(past.toISOString(), referenceNow)).toBe(true);
    });

    it('returns false when deadline is in the future', () => {
      const future = new Date(2026, 9, 5, 13, 0, 0);
      expect(isOverdue(future.toISOString(), referenceNow)).toBe(false);
    });

    it('returns false when deadline is at exact reference time', () => {
      expect(isOverdue(referenceNow.toISOString(), referenceNow)).toBe(false);
    });

    it('returns false for empty or invalid input', () => {
      expect(isOverdue('', referenceNow)).toBe(false);
      expect(isOverdue(null, referenceNow)).toBe(false);
      expect(isOverdue(undefined, referenceNow)).toBe(false);
      expect(isOverdue('invalid', referenceNow)).toBe(false);
    });
  });

  describe('getRelativeDeadline', () => {
    // Reference time: Monday Oct 5, 2026 at 12:00 PM
    const referenceNow = new Date(2026, 9, 5, 12, 0, 0);

    it('returns "Due today" when deadline is later on the same day', () => {
      const laterToday = new Date(2026, 9, 5, 18, 0, 0);
      expect(getRelativeDeadline(laterToday.toISOString(), referenceNow)).toBe(
        'Due today',
      );
    });

    it('returns "Overdue today" when deadline was earlier on the same day', () => {
      const earlierToday = new Date(2026, 9, 5, 9, 0, 0);
      expect(
        getRelativeDeadline(earlierToday.toISOString(), referenceNow),
      ).toBe('Overdue today');
    });

    it('returns "Due tomorrow" when deadline is next day', () => {
      const tomorrow = new Date(2026, 9, 6, 14, 0, 0);
      expect(getRelativeDeadline(tomorrow.toISOString(), referenceNow)).toBe(
        'Due tomorrow',
      );
    });

    it('returns "Due in 3d" when deadline is 3 days in the future', () => {
      const in3Days = new Date(2026, 9, 8, 12, 0, 0);
      expect(getRelativeDeadline(in3Days.toISOString(), referenceNow)).toBe(
        'Due in 3d',
      );
    });

    it('returns "Due in 7d" when deadline is one week away', () => {
      const in7Days = new Date(2026, 9, 12, 12, 0, 0);
      expect(getRelativeDeadline(in7Days.toISOString(), referenceNow)).toBe(
        'Due in 7d',
      );
    });

    it('returns "Overdue 1d" when deadline was yesterday', () => {
      const yesterday = new Date(2026, 9, 4, 15, 0, 0);
      expect(getRelativeDeadline(yesterday.toISOString(), referenceNow)).toBe(
        'Overdue 1d',
      );
    });

    it('returns "Overdue 2d" when deadline was 2 days ago', () => {
      const twoDaysAgo = new Date(2026, 9, 3, 10, 0, 0);
      expect(getRelativeDeadline(twoDaysAgo.toISOString(), referenceNow)).toBe(
        'Overdue 2d',
      );
    });

    it('returns "Overdue 5d" when deadline was 5 days ago', () => {
      const fiveDaysAgo = new Date(2026, 8, 30, 12, 0, 0);
      expect(getRelativeDeadline(fiveDaysAgo.toISOString(), referenceNow)).toBe(
        'Overdue 5d',
      );
    });

    it('handles month transitions correctly (e.g., Oct 31 to Nov 1)', () => {
      const oct31 = new Date(2026, 9, 31, 12, 0, 0);
      const nov1 = new Date(2026, 10, 1, 12, 0, 0);
      expect(getRelativeDeadline(nov1.toISOString(), oct31)).toBe(
        'Due tomorrow',
      );
      expect(getRelativeDeadline(oct31.toISOString(), nov1)).toBe('Overdue 1d');
    });

    it('handles year transitions correctly (e.g., Dec 31 to Jan 1)', () => {
      const dec31 = new Date(2026, 11, 31, 12, 0, 0);
      const jan1 = new Date(2027, 0, 1, 12, 0, 0);
      expect(getRelativeDeadline(jan1.toISOString(), dec31)).toBe(
        'Due tomorrow',
      );
      expect(getRelativeDeadline(dec31.toISOString(), jan1)).toBe('Overdue 1d');
    });

    it('accepts Date objects directly', () => {
      const tomorrow = new Date(2026, 9, 6, 10, 0, 0);
      expect(getRelativeDeadline(tomorrow, referenceNow)).toBe('Due tomorrow');
    });

    it('returns empty string for empty, null, or undefined values', () => {
      expect(getRelativeDeadline('', referenceNow)).toBe('');
      expect(getRelativeDeadline(null, referenceNow)).toBe('');
      expect(getRelativeDeadline(undefined, referenceNow)).toBe('');
    });

    it('returns "Invalid date" for malformed strings', () => {
      expect(getRelativeDeadline('not-a-date', referenceNow)).toBe(
        'Invalid date',
      );
    });

    it('works with default system clock when reference date is omitted', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const result = getRelativeDeadline(futureDate.toISOString());
      expect(result).toMatch(/^Due in \dd$/);
    });
  });
});
