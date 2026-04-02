import { describe, expect, it } from "vitest";
import { LabelRecord } from "../lib/api";
import { filterLabels, getScrollBehaviorForReducedMotion, splitHighlightParts } from "./labelManagement.helpers";

const labels: LabelRecord[] = [
  {
    id: 1,
    category_id: 1,
    parent_id: null,
    level: 1,
    name: "Root Service",
    code: "L1_ROOT",
    is_leaf: false,
    llm_enabled: true,
    default_prompt_version: "v1"
  },
  {
    id: 2,
    category_id: 1,
    parent_id: 1,
    level: 2,
    name: "Install Delay",
    code: "L2_INSTALL_DELAY",
    is_leaf: true,
    llm_enabled: true,
    default_prompt_version: "v2"
  }
];

describe("labelManagement helpers", () => {
  it("filters by level", () => {
    expect(filterLabels(labels, "", "1")).toEqual([labels[0]]);
    expect(filterLabels(labels, "", "2")).toEqual([labels[1]]);
    expect(filterLabels(labels, "", "all")).toEqual(labels);
  });

  it("filters by name or code within selected level", () => {
    expect(filterLabels(labels, "install", "all")).toEqual([labels[1]]);
    expect(filterLabels(labels, "l1_root", "1")).toEqual([labels[0]]);
    expect(filterLabels(labels, "l1_root", "2")).toEqual([]);
  });

  it("splits highlight parts with case-insensitive matching", () => {
    expect(splitHighlightParts("Install Delay", "inst")).toEqual([
      { text: "Inst", matched: true },
      { text: "all Delay", matched: false }
    ]);

    expect(splitHighlightParts("ALPHA-beta-alpha", "alpha")).toEqual([
      { text: "ALPHA", matched: true },
      { text: "-beta-", matched: false },
      { text: "alpha", matched: true }
    ]);
  });

  it("returns plain text part when search keyword is empty or not found", () => {
    expect(splitHighlightParts("Root Service", "")).toEqual([{ text: "Root Service", matched: false }]);
    expect(splitHighlightParts("Root Service", "xyz")).toEqual([{ text: "Root Service", matched: false }]);
  });

  it("maps reduced-motion preference to scroll behavior", () => {
    expect(getScrollBehaviorForReducedMotion(false)).toBe("smooth");
    expect(getScrollBehaviorForReducedMotion(true)).toBe("auto");
  });
});
