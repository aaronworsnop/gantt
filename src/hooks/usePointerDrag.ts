import { useCallback, useRef } from "react";

export interface DragInfo {
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  event: PointerEvent;
}

export interface DragHandlers {
  /** Called on every pointermove after capture. */
  onMove?: (info: DragInfo) => void;
  /** Called once on pointerup (or pointercancel). */
  onEnd?: (info: DragInfo) => void;
  /** Called once on pointerdown right before capture (for setting up state). */
  onStart?: (info: DragInfo) => void;
}

/**
 * Returns a pointerdown handler that uses pointer capture to track a drag.
 * Independent of any DOM coordinate math — consumers translate dx/dy into
 * their own units (e.g. days = round(dx / dayWidthPx)).
 */
export function usePointerDrag(handlers: DragHandlers) {
  const stateRef = useRef<{ startX: number; startY: number } | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  return useCallback((e: React.PointerEvent) => {
    // Only respond to primary button.
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    stateRef.current = { startX: e.clientX, startY: e.clientY };

    const baseInfo = (ev: PointerEvent): DragInfo => {
      const s = stateRef.current!;
      return {
        startX: s.startX,
        startY: s.startY,
        dx: ev.clientX - s.startX,
        dy: ev.clientY - s.startY,
        event: ev,
      };
    };

    handlersRef.current.onStart?.(baseInfo(e.nativeEvent));

    const move = (ev: PointerEvent) => {
      if (!stateRef.current) return;
      handlersRef.current.onMove?.(baseInfo(ev));
    };
    const end = (ev: PointerEvent) => {
      if (!stateRef.current) return;
      handlersRef.current.onEnd?.(baseInfo(ev));
      stateRef.current = null;
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  }, []);
}
