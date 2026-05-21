import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ColorKey, Entry } from "@/lib/types";

interface State {
  entries: Entry[];
  loading: boolean;
  error: string | null;
}

/**
 * Single source of truth for entries + periods. All mutations are optimistic
 * with a refresh-on-error fallback so the UI never feels laggy.
 */
export function useEntries() {
  const [state, setState] = useState<State>({
    entries: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const entries = await api.listEntries();
      setState({ entries, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e) }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patchEntries = useCallback(
    (fn: (entries: Entry[]) => Entry[]) =>
      setState((s) => ({ ...s, entries: fn(s.entries) })),
    [],
  );

  // ---- entry mutations ----
  const createEntry = useCallback(
    async (name: string, color: ColorKey) => {
      const e = await api.createEntry(name, color);
      patchEntries((es) => [...es, e]);
      return e;
    },
    [patchEntries],
  );

  const updateEntryName = useCallback(
    async (id: number, name: string) => {
      patchEntries((es) => es.map((e) => (e.id === id ? { ...e, name } : e)));
      try {
        await api.updateEntry(id, { name });
      } catch {
        void refresh();
      }
    },
    [patchEntries, refresh],
  );

  const updateEntryColor = useCallback(
    async (id: number, color: ColorKey) => {
      patchEntries((es) => es.map((e) => (e.id === id ? { ...e, color } : e)));
      try {
        await api.updateEntry(id, { color });
      } catch {
        void refresh();
      }
    },
    [patchEntries, refresh],
  );

  const deleteEntry = useCallback(
    async (id: number) => {
      patchEntries((es) => es.filter((e) => e.id !== id));
      try {
        await api.deleteEntry(id);
      } catch {
        void refresh();
      }
    },
    [patchEntries, refresh],
  );

  // ---- period mutations ----
  // create/update both return the coalesced period list for the entry; we use
  // that to overwrite the entry's local periods so any merge done server-side
  // is reflected immediately.
  const createPeriod = useCallback(
    async (entryId: number, startDay: number, endDay: number) => {
      const periods = await api.createPeriod(entryId, startDay, endDay);
      patchEntries((es) =>
        es.map((e) => (e.id === entryId ? { ...e, periods } : e)),
      );
      return periods;
    },
    [patchEntries],
  );

  const updatePeriod = useCallback(
    async (entryId: number, periodId: number, startDay: number, endDay: number) => {
      const [s, e] = startDay <= endDay ? [startDay, endDay] : [endDay, startDay];
      // Optimistic: shift the affected period locally so the bar stays in place
      // while the backend round-trips. The response will replace the whole
      // period list (post-merge).
      patchEntries((es) =>
        es.map((entry) =>
          entry.id !== entryId
            ? entry
            : {
                ...entry,
                periods: entry.periods.map((p) =>
                  p.id === periodId ? { ...p, start_day: s, end_day: e } : p,
                ),
              },
        ),
      );
      try {
        const periods = await api.updatePeriod(periodId, s, e);
        patchEntries((es) =>
          es.map((entry) => (entry.id === entryId ? { ...entry, periods } : entry)),
        );
      } catch {
        void refresh();
      }
    },
    [patchEntries, refresh],
  );

  const deletePeriod = useCallback(
    async (entryId: number, periodId: number) => {
      patchEntries((es) =>
        es.map((entry) =>
          entry.id !== entryId
            ? entry
            : { ...entry, periods: entry.periods.filter((p) => p.id !== periodId) },
        ),
      );
      try {
        await api.deletePeriod(periodId);
      } catch {
        void refresh();
      }
    },
    [patchEntries, refresh],
  );

  return {
    ...state,
    refresh,
    createEntry,
    updateEntryName,
    updateEntryColor,
    deleteEntry,
    createPeriod,
    updatePeriod,
    deletePeriod,
  };
}

export type UseEntries = ReturnType<typeof useEntries>;
