import { useMemo } from "react";
import {
  formatDayNum,
  formatMonth,
  formatWeekday,
  isFirstOfMonth,
  isWeekend,
} from "@/lib/date";
import "./TimelineHeader.css";

interface Props {
  originDay: number;
  totalDays: number;
  today: number;
}

interface MonthSpan {
  startIndex: number;
  span: number;
  label: string;
}

export function TimelineHeader({ originDay, totalDays, today }: Props) {
  const months: MonthSpan[] = useMemo(() => {
    const out: MonthSpan[] = [];
    let cursor = 0;
    while (cursor < totalDays) {
      const day = originDay + cursor;
      // walk to next month boundary
      let end = cursor + 1;
      while (end < totalDays && !isFirstOfMonth(originDay + end)) end++;
      out.push({ startIndex: cursor, span: end - cursor, label: formatMonth(day) });
      cursor = end;
    }
    return out;
  }, [originDay, totalDays]);

  return (
    <header className="timeline-header">
      <div className="timeline-header__months">
        {months.map((m) => (
          <div
            key={m.startIndex}
            className="timeline-header__month"
            style={{
              left: `calc(${m.startIndex} * var(--day-width))`,
              width: `calc(${m.span} * var(--day-width))`,
            }}
          >
            <span>{m.label}</span>
          </div>
        ))}
      </div>
      <div className="timeline-header__days">
        {Array.from({ length: totalDays }, (_, i) => {
          const day = originDay + i;
          const isToday = day === today;
          return (
            <div
              key={i}
              className={[
                "timeline-header__day",
                isWeekend(day) ? "is-weekend" : "",
                isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `calc(${i} * var(--day-width))` }}
            >
              <span className="timeline-header__weekday">{formatWeekday(day)}</span>
              <span className="timeline-header__daynum">{formatDayNum(day)}</span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
