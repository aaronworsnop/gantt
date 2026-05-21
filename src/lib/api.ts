import { invoke } from "@tauri-apps/api/core";
import type { ColorKey, Entry, Period } from "./types";

export const api = {
  listEntries: () => invoke<Entry[]>("list_entries"),
  createEntry: (name: string, color: ColorKey) =>
    invoke<Entry>("create_entry", { name, color }),
  updateEntry: (id: number, patch: { name?: string; color?: ColorKey }) =>
    invoke<void>("update_entry", {
      id,
      name: patch.name ?? null,
      color: patch.color ?? null,
    }),
  deleteEntry: (id: number) => invoke<void>("delete_entry", { id }),

  // create/update return the full post-merge period list for the entry so the
  // frontend can drop any optimistic state and replace it with the canonical
  // (coalesced) set in one shot.
  createPeriod: (entryId: number, startDay: number, endDay: number) =>
    invoke<Period[]>("create_period", {
      entryId,
      startDay,
      endDay,
    }),
  updatePeriod: (id: number, startDay: number, endDay: number) =>
    invoke<Period[]>("update_period", { id, startDay, endDay }),
  deletePeriod: (id: number) => invoke<void>("delete_period", { id }),
};
