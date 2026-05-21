import type { ColorKey, Entry } from "@/lib/types";
import { ColorPicker } from "./ColorPicker";
import { EditableText } from "./EditableText";
import "./EntryList.css";

interface Props {
  entries: Entry[];
  onRename: (id: number, name: string) => void;
  onRecolor: (id: number, color: ColorKey) => void;
  onDelete: (id: number) => void;
}

export function EntryList({ entries, onRename, onRecolor, onDelete }: Props) {
  return (
    <aside className="entry-list">
      {entries.length === 0 && (
        <div className="entry-list__empty">
          Click <strong>New entry</strong> above to start.
        </div>
      )}
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="entry-list__row"
          style={{ transform: `translateY(calc(${i} * var(--row-height)))` }}
        >
          <ColorPicker
            value={entry.color}
            onChange={(c) => onRecolor(entry.id, c)}
          />
          <EditableText
            value={entry.name}
            placeholder="Untitled entry"
            onCommit={(n) => onRename(entry.id, n)}
            className="entry-list__name"
          />
          <button
            type="button"
            className="entry-list__delete"
            title="Delete entry"
            onClick={() => {
              if (confirm(`Delete "${entry.name || "Untitled entry"}"?`))
                onDelete(entry.id);
            }}
            aria-label="Delete entry"
          >
            ×
          </button>
        </div>
      ))}
    </aside>
  );
}
