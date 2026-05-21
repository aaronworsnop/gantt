import { useMemo } from "react";
import { GanttChart } from "./components/GanttChart";
import { useEntries } from "./hooks/useEntries";
import { TIMELINE_DAYS_AFTER, TIMELINE_DAYS_BEFORE } from "./lib/constants";
import { todayDay } from "./lib/date";
import "./App.css";

export default function App() {
  const entries = useEntries();

  const { originDay, totalDays, today } = useMemo(() => {
    const today = todayDay();
    return {
      today,
      originDay: today - TIMELINE_DAYS_BEFORE,
      totalDays: TIMELINE_DAYS_BEFORE + TIMELINE_DAYS_AFTER,
    };
  }, []);

  return (
    <div className="app">
      {entries.error && <div className="app__error">{entries.error}</div>}
      <GanttChart
        entries={entries}
        originDay={originDay}
        totalDays={totalDays}
        today={today}
      />
    </div>
  );
}
