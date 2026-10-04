const MONTH_NAMES = [
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

/**
 * Formats an ISO string or Date object into a readable string: "Oct 5, 10:00 AM".
 */
export function formatDate(iso: string | Date | undefined | null): string {
  if (!iso) {
    return '';
  }
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Checks whether the deadline is in the past compared to reference now time.
 */
export function isOverdue(
  iso: string | Date | undefined | null,
  now: Date = new Date(),
): boolean {
  if (!iso) {
    return false;
  }
  const targetDate = typeof iso === 'string' ? new Date(iso) : iso;
  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    return false;
  }
  return targetDate.getTime() < now.getTime();
}

/**
 * Calculates relative time string to deadline:
 * Examples: "Due today", "Due tomorrow", "Due in 3d", "Overdue 1d", "Overdue today"
 */
export function getRelativeDeadline(
  iso: string | Date | undefined | null,
  now: Date = new Date(),
): string {
  if (!iso) {
    return '';
  }
  const targetDate = typeof iso === 'string' ? new Date(iso) : iso;
  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfTarget = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  ).getTime();

  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round((startOfTarget - startOfToday) / msPerDay);

  if (dayDiff > 1) {
    return `Due in ${dayDiff}d`;
  }
  if (dayDiff === 1) {
    return 'Due tomorrow';
  }
  if (dayDiff === 0) {
    if (targetDate.getTime() < now.getTime()) {
      return 'Overdue today';
    }
    return 'Due today';
  }
  if (dayDiff === -1) {
    return 'Overdue 1d';
  }
  return `Overdue ${Math.abs(dayDiff)}d`;
}
