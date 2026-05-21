export type ColorKey =
  | "tomato"
  | "tangerine"
  | "banana"
  | "sage"
  | "blueberry"
  | "grape";

export interface Period {
  id: number;
  entry_id: number;
  start_day: number;
  end_day: number;
}

export interface Entry {
  id: number;
  name: string;
  color: ColorKey;
  created_at: number;
  periods: Period[];
}
