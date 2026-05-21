import { useEffect, useRef, useState } from "react";
import "./EditableText.css";

interface Props {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
  className?: string;
}

export function EditableText({ value, placeholder, onCommit, className }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next !== value) onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`editable-text editable-text--editing ${className ?? ""}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-text ${className ?? ""}`}
      onClick={() => setEditing(true)}
      title="Click to rename"
    >
      {value ? (
        <span>{value}</span>
      ) : (
        <span className="editable-text__placeholder">{placeholder ?? "Untitled"}</span>
      )}
    </button>
  );
}
