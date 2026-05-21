import { useCallback, useEffect, useMemo, useRef } from "react";
import { COLOR_KEYS } from "@/lib/constants";
import { dayOfWeek } from "@/lib/date";
import { sortEntries } from "@/lib/sort";
import type { UseEntries } from "@/hooks/useEntries";
import { EntryList } from "./EntryList";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineBody } from "./TimelineBody";
import { Toolbar } from "./Toolbar";
import "./GanttChart.css";

interface Props {
  entries: UseEntries;
  originDay: number;
  totalDays: number;
  today: number;
}

export function GanttChart({ entries, originDay, totalDays, today }: Props) {
  const sorted = useMemo(() => sortEntries(entries.entries), [entries.entries]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Offset (in days) from the timeline origin to the first Saturday on screen.
  const weekdayOffset = useMemo(() => {
    const od = dayOfWeek(originDay);
    return (6 - od + 7) % 7;
  }, [originDay]);

  /** Scroll horizontally so today sits ~80px right of the sticky entry list. */
  const scrollToToday = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      const root = getComputedStyle(document.documentElement);
      const rootFs = parseFloat(root.fontSize);
      const dayWidthPx =
        parseFloat(root.getPropertyValue("--day-width")) * rootFs;
      const listWidthPx =
        parseFloat(root.getPropertyValue("--entry-list-width")) * rootFs;
      const offsetDays = today - originDay;
      const target = Math.max(0, offsetDays * dayWidthPx - listWidthPx - 80);
      el.scrollTo({ left: target, behavior });
    },
    [today, originDay],
  );

  // Snap to today on first mount (no animation — feels jarring on load).
  useEffect(() => {
    scrollToToday("auto");
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEntry = async () => {
    // cycle through the 6 colours so each new entry gets a different one by default.
    const color = COLOR_KEYS[sorted.length % COLOR_KEYS.length];
    await entries.createEntry("", color);
  };

  return (
    <div className="gantt">
      <Toolbar
        onAddEntry={addEntry}
        onJumpToToday={() => scrollToToday("smooth")}
        entryCount={sorted.length}
      />
      <div
        className="gantt__scroll"
        ref={scrollRef}
        style={
          {
            "--total-days": totalDays,
            "--weekday-offset": weekdayOffset,
            "--today-offset": today - originDay,
            "--row-count": sorted.length,
          } as React.CSSProperties
        }
      >
        <div className="gantt__corner" />
        <TimelineHeader originDay={originDay} totalDays={totalDays} today={today} />
        <EntryList
          entries={sorted}
          onRename={entries.updateEntryName}
          onRecolor={entries.updateEntryColor}
          onDelete={entries.deleteEntry}
        />
        <TimelineBody
          entries={sorted}
          originDay={originDay}
          totalDays={totalDays}
          today={today}
          onCreatePeriod={entries.createPeriod}
          onUpdatePeriod={entries.updatePeriod}
          onDeletePeriod={entries.deletePeriod}
        />
      </div>
    </div>
  );
}
