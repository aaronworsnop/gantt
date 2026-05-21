/**
 * Day index = whole days since 1970-01-01 in UTC. Using UTC integer days
 * avoids any DST/timezone math. Convert to a local Date only for display.
 */

const MS_PER_DAY = 86_400_000;

export function todayDay(): number {
  const now = new Date();
  return dateToDay(now);
}

export function dateToDay(d: Date): number {
  return Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY,
  );
}

export function dayToDate(day: number): Date {
  return new Date(day * MS_PER_DAY);
}

export function dayOfWeek(day: number): number {
  // 0 = Sunday, 6 = Saturday. 1970-01-01 was a Thursday (4).
  return (((day % 7) + 7 + 4) % 7);
}

export function isWeekend(day: number): boolean {
  const d = dayOfWeek(day);
  return d === 0 || d === 6;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export function formatMonth(day: number): string {
  const d = dayToDate(day);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatDayNum(day: number): string {
  return String(dayToDate(day).getUTCDate());
}

export function formatWeekday(day: number): string {
  return WEEKDAY_NAMES[dayOfWeek(day)];
}

export function isFirstOfMonth(day: number): boolean {
  return dayToDate(day).getUTCDate() === 1;
}
