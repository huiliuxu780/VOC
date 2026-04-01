import { describe, expect, it } from "vitest";
import { LabelRecord } from "../lib/api";
import { filterLabels } from "./labelManagement.helpers";

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
});
