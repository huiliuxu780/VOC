import { LabelRecord } from "../lib/api";

export type LevelFilter = "all" | "1" | "2" | "3" | "4";

export function filterLabels(labels: LabelRecord[], searchText: string, levelFilter: LevelFilter): LabelRecord[] {
  const keyword = searchText.trim().toLowerCase();
  return labels.filter((item) => {
    const hitLevel = levelFilter === "all" || item.level === Number(levelFilter);
    if (!hitLevel) return false;
    if (!keyword) return true;
    return item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword);
  });
}
