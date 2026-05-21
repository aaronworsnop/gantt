import { useRef, useState } from "react";
import { usePointerDrag } from "@/hooks/usePointerDrag";
import type { ColorKey, Period as PeriodT } from "@/lib/types";
import "./Period.css";

interface Props {
  period: PeriodT;
  color: ColorKey;
  originDay: number;
  totalDays: number;
  onUpdate: (startDay: number, endDay: number) => void;
  onDelete: () => void;
}

type Edge = "left" | "right" | "body";

interface DragState {
  edge: Edge;
  origStart: number;
  origEnd: number;
}

export function Period({
  period,
  color,
  originDay,
  totalDays,
  onUpdate,
  onDelete,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [tempBounds, setTempBounds] = useState<{ s: number; e: number } | null>(null);
  const tempBoundsRef = useRef(tempBounds);
  tempBoundsRef.current = tempBounds;

  /** dx in pixels → integer day delta, using the parent row's actual width. */
  const dxToDays = (dx: number): number => {
    const row = rootRef.current?.parentElement;
    if (!row) return 0;
    const dayPx = row.getBoundingClientRect().width / totalDays;
    return Math.round(dx / dayPx);
  };

  const beginDrag = (edge: Edge) => {
    dragRef.current = {
      edge,
      origStart: period.start_day,
      origEnd: period.end_day,
    };
    setTempBounds({ s: period.start_day, e: period.end_day });
  };

  const updateDrag = (dx: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const days = dxToDays(dx);
    if (drag.edge === "left") {
      const s = Math.min(drag.origStart + days, drag.origEnd);
      setTempBounds({ s, e: drag.origEnd });
    } else if (drag.edge === "right") {
      const e = Math.max(drag.origEnd + days, drag.origStart);
      setTempBounds({ s: drag.origStart, e });
    } else {
      // body drag: shift both ends by the same delta.
      setTempBounds({ s: drag.origStart + days, e: drag.origEnd + days });
    }
  };

  const endDrag = () => {
    const t = tempBoundsRef.current;
    const drag = dragRef.current;
    dragRef.current = null;
    setTempBounds(null);
    if (drag && t && (t.s !== drag.origStart || t.e !== drag.origEnd)) {
      onUpdate(t.s, t.e);
    }
  };

  const onLeftDown = usePointerDrag({
    onStart: () => beginDrag("left"),
    onMove: ({ dx }) => updateDrag(dx),
    onEnd: endDrag,
  });

  const onRightDown = usePointerDrag({
    onStart: () => beginDrag("right"),
    onMove: ({ dx }) => updateDrag(dx),
    onEnd: endDrag,
  });

  const onBodyDown = usePointerDrag({
    onStart: () => beginDrag("body"),
    onMove: ({ dx }) => updateDrag(dx),
    onEnd: endDrag,
  });

  const startCol = (tempBounds ? tempBounds.s : period.start_day) - originDay;
  const endCol = (tempBounds ? tempBounds.e : period.end_day) - originDay;
  const span = endCol - startCol + 1;
  const dragMode = tempBounds ? dragRef.current?.edge : undefined;

  // Wrap handle handlers to stop propagation so they don't also start a body
  // drag on the parent .period element.
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={rootRef}
      className={`period period--color-${color}`}
      data-dragging={dragMode}
      style={{
        left: `calc(${startCol} * var(--day-width))`,
        width: `calc(${span} * var(--day-width))`,
      }}
      onPointerDown={(e) => {
        // The row uses event delegation to start "create-drag" on its own
        // background; stop propagation so clicking a period never bubbles up
        // and starts a phantom create-drag.
        e.stopPropagation();
        onBodyDown(e);
      }}
    >
      <span
        className="period__handle period__handle--left"
        onPointerDown={(e) => {
          stop(e);
          onLeftDown(e);
        }}
        title="Drag to change start"
      />
      {/* Single-day periods are too narrow for any text, so leave the label
          empty — the span still acts as the flex spacer between handles. */}
      <span className="period__label">{span > 1 ? `${span} days` : ""}</span>
      <span
        className="period__handle period__handle--right"
        onPointerDown={(e) => {
          stop(e);
          onRightDown(e);
        }}
        title="Drag to change end"
      />
      <button
        type="button"
        className="period__delete"
        title="Delete period"
        onPointerDown={stop}
        onClick={onDelete}
        aria-label="Delete period"
      >
        ×
      </button>
    </div>
  );
}
