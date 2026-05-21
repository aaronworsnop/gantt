import { useEffect, useRef, useState } from "react";
import { COLOR_KEYS, COLOR_LABELS } from "@/lib/constants";
import type { ColorKey } from "@/lib/types";
import "./ColorPicker.css";

interface Props {
  value: ColorKey;
  onChange: (next: ColorKey) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="color-picker" ref={rootRef}>
      <button
        type="button"
        className="color-picker__swatch"
        style={{ background: `var(--color-${value})` }}
        title={`${COLOR_LABELS[value]} — click to change`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Change colour"
      />
      {open && (
        <div className="color-picker__menu" role="listbox">
          {COLOR_KEYS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-picker__option ${c === value ? "is-selected" : ""}`}
              style={{ background: `var(--color-${c})` }}
              title={COLOR_LABELS[c]}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              aria-label={COLOR_LABELS[c]}
              aria-selected={c === value}
            />
          ))}
        </div>
      )}
    </div>
  );
}
