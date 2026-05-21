import type { ColorKey } from "./types";

export const COLOR_KEYS: ColorKey[] = [
  "tomato",
  "tangerine",
  "banana",
  "sage",
  "blueberry",
  "grape",
];

export const COLOR_LABELS: Record<ColorKey, string> = {
  tomato: "Tomato",
  tangerine: "Tangerine",
  banana: "Banana",
  sage: "Sage",
  blueberry: "Blueberry",
  grape: "Grape",
};

/** How many days before/after today the timeline spans. */
export const TIMELINE_DAYS_BEFORE = 60;
export const TIMELINE_DAYS_AFTER = 365;
