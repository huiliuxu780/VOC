import { LabelRecord } from "../lib/api";

export type LevelFilter = "all" | "1" | "2" | "3" | "4";

export type HighlightPart = {
  text: string;
  matched: boolean;
};

export function getScrollBehaviorForReducedMotion(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

export function filterLabels(labels: LabelRecord[], searchText: string, levelFilter: LevelFilter): LabelRecord[] {
  const keyword = searchText.trim().toLowerCase();
  return labels.filter((item) => {
    const hitLevel = levelFilter === "all" || item.level === Number(levelFilter);
    if (!hitLevel) return false;
    if (!keyword) return true;
    return item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword);
  });
}

export function splitHighlightParts(text: string, searchText: string): HighlightPart[] {
  const keyword = searchText.trim().toLowerCase();
  if (!keyword) return [{ text, matched: false }];

  const lowerText = text.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(keyword, cursor);
    if (matchIndex === -1) {
      parts.push({ text: text.slice(cursor), matched: false });
      break;
    }

    if (matchIndex > cursor) {
      parts.push({ text: text.slice(cursor, matchIndex), matched: false });
    }

    const endIndex = matchIndex + keyword.length;
    parts.push({ text: text.slice(matchIndex, endIndex), matched: true });
    cursor = endIndex;
  }

  return parts.length > 0 ? parts : [{ text, matched: false }];
}
