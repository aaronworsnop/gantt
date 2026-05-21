import type { Entry, Period } from "@/lib/types";
import { EntryRow } from "./EntryRow";
import "./TimelineBody.css";

interface Props {
  entries: Entry[];
  originDay: number;
  totalDays: number;
  today: number;
  onCreatePeriod: (entryId: number, startDay: number, endDay: number) => Promise<Period[]>;
  onUpdatePeriod: (
    entryId: number,
    periodId: number,
    startDay: number,
    endDay: number,
  ) => void;
  onDeletePeriod: (entryId: number, periodId: number) => void;
}

export function TimelineBody({
  entries,
  originDay,
  totalDays,
  today,
  onCreatePeriod,
  onUpdatePeriod,
  onDeletePeriod,
}: Props) {
  const todayOffset = today - originDay;
  const todayVisible = todayOffset >= 0 && todayOffset < totalDays;

  return (
    <div className="timeline-body">
      {todayVisible && (
        <div
          className="timeline-body__today-line"
          style={{ left: `calc((${todayOffset} + 0.5) * var(--day-width))` }}
        />
      )}
      {entries.map((entry, i) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          rowIndex={i}
          originDay={originDay}
          totalDays={totalDays}
          onCreatePeriod={onCreatePeriod}
          onUpdatePeriod={onUpdatePeriod}
          onDeletePeriod={onDeletePeriod}
        />
      ))}
    </div>
  );
}
