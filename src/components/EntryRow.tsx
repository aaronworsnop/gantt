import { useRef, useState } from "react";
import { usePointerDrag } from "@/hooks/usePointerDrag";
import type { Entry, Period as PeriodT } from "@/lib/types";
import { Period } from "./Period";
import "./EntryRow.css";

interface Props {
  entry: Entry;
  rowIndex: number;
  originDay: number;
  totalDays: number;
  onCreatePeriod: (entryId: number, startDay: number, endDay: number) => Promise<PeriodT[]>;
  onUpdatePeriod: (
    entryId: number,
    periodId: number,
    startDay: number,
    endDay: number,
  ) => void;
  onDeletePeriod: (entryId: number, periodId: number) => void;
}

interface Ghost {
  startCol: number;
  endCol: number;
}

export function EntryRow({
  entry,
  rowIndex,
  originDay,
  totalDays,
  onCreatePeriod,
  onUpdatePeriod,
  onDeletePeriod,
}: Props) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const startColRef = useRef(0);

  /** Convert a clientX into a day-column index (0..totalDays-1, clamped). */
  const clientXToCol = (clientX: number): number => {
    const el = rowRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const dayPx = rect.width / totalDays;
    const col = Math.floor((clientX - rect.left) / dayPx);
    return Math.max(0, Math.min(totalDays - 1, col));
  };

  // Read the latest ghost from a ref so onEnd always sees the final value.
  const ghostRef = useRef(ghost);
  ghostRef.current = ghost;

  const onPointerDownBg = usePointerDrag({
    onStart: ({ event }) => {
      const col = clientXToCol(event.clientX);
      startColRef.current = col;
      setGhost({ startCol: col, endCol: col });
    },
    onMove: ({ event }) => {
      const col = clientXToCol(event.clientX);
      const s = Math.min(startColRef.current, col);
      const e = Math.max(startColRef.current, col);
      setGhost({ startCol: s, endCol: e });
    },
    onEnd: () => {
      const g = ghostRef.current;
      if (g) {
        void onCreatePeriod(entry.id, originDay + g.startCol, originDay + g.endCol);
      }
      setGhost(null);
    },
  });

  // Only start a create-drag when the pointer is on the row background, not a period.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onPointerDownBg(e);
  };

  return (
    <div
      ref={rowRef}
      className="entry-row"
      style={{ transform: `translateY(calc(${rowIndex} * var(--row-height)))` }}
      onPointerDown={handlePointerDown}
    >
      {entry.periods.map((p) => (
        <Period
          key={p.id}
          period={p}
          color={entry.color}
          originDay={originDay}
          totalDays={totalDays}
          onUpdate={(s, e) => onUpdatePeriod(entry.id, p.id, s, e)}
          onDelete={() => onDeletePeriod(entry.id, p.id)}
        />
      ))}
      {ghost && (
        <div
          className={`period period--ghost period--color-${entry.color}`}
          style={{
            left: `calc(${ghost.startCol} * var(--day-width))`,
            width: `calc(${ghost.endCol - ghost.startCol + 1} * var(--day-width))`,
          }}
        />
      )}
    </div>
  );
}
