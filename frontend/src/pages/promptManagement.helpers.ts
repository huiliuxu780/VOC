import { PromptRecord } from "../lib/api";

export function filterPrompts(prompts: PromptRecord[], searchText: string): PromptRecord[] {
  const keyword = searchText.trim().toLowerCase();
  if (!keyword) return prompts;
  return prompts.filter(
    (item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.version.toLowerCase().includes(keyword) ||
      String(item.label_node_id).includes(keyword)
  );
}
