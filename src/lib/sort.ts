import type { Entry } from "./types";

/** Returns the earliest period's start_day; null if the entry has no periods. */
function earliestStart(e: Entry): number | null {
  if (e.periods.length === 0) return null;
  let min = e.periods[0].start_day;
  for (let i = 1; i < e.periods.length; i++) {
    if (e.periods[i].start_day < min) min = e.periods[i].start_day;
  }
  return min;
}

/** Among periods sharing the min start, return the smallest end_day. */
function earliestEndAtStart(e: Entry, start: number): number {
  let min = Number.POSITIVE_INFINITY;
  for (const p of e.periods) {
    if (p.start_day === start && p.end_day < min) min = p.end_day;
  }
  return min;
}

/**
 * Sort entries by:
 *  1. earliest period start_day ascending
 *  2. earliest period end_day (among those with min start) ascending (shorter first)
 *  3. created_at ascending (stable fallback for entries with no periods)
 *
 * Entries with no periods sort to the bottom.
 */
export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const sa = earliestStart(a);
    const sb = earliestStart(b);
    if (sa === null && sb === null) return a.created_at - b.created_at;
    if (sa === null) return 1;
    if (sb === null) return -1;
    if (sa !== sb) return sa - sb;
    const ea = earliestEndAtStart(a, sa);
    const eb = earliestEndAtStart(b, sb);
    if (ea !== eb) return ea - eb;
    return a.created_at - b.created_at;
  });
}
