import "./Toolbar.css";

interface Props {
  onAddEntry: () => void;
  onJumpToToday: () => void;
  entryCount: number;
}

export function Toolbar({ onAddEntry, onJumpToToday, entryCount }: Props) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__title">Gantt</span>
        <span className="toolbar__meta">
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div className="toolbar__actions">
        <button
          type="button"
          className="toolbar__icon-btn"
          onClick={onJumpToToday}
          title="Jump to today"
          aria-label="Jump to today"
        >
          <TodayIcon />
        </button>
        <button type="button" className="toolbar__btn" onClick={onAddEntry}>
          <span className="toolbar__btn-icon">+</span>
          New entry
        </button>
      </div>
    </header>
  );
}

function TodayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
