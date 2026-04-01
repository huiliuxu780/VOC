import { describe, expect, it } from "vitest";
import { PromptRecord } from "../lib/api";
import { filterPrompts } from "./promptManagement.helpers";

const prompts: PromptRecord[] = [
  {
    id: 1,
    label_node_id: 3,
    name: "Install Failure",
    version: "v1.0",
    status: "draft",
    system_prompt: "sys",
    user_prompt_template: "user"
  },
  {
    id: 2,
    label_node_id: 8,
    name: "Billing Delay",
    version: "v2.1",
    status: "published",
    system_prompt: "sys2",
    user_prompt_template: "user2"
  }
];

describe("promptManagement helpers", () => {
  it("returns all prompts when search text is empty", () => {
    expect(filterPrompts(prompts, "   ")).toEqual(prompts);
  });

  it("filters by prompt name, version, or label node id", () => {
    expect(filterPrompts(prompts, "billing")).toEqual([prompts[1]]);
    expect(filterPrompts(prompts, "v1.0")).toEqual([prompts[0]]);
    expect(filterPrompts(prompts, "8")).toEqual([prompts[1]]);
  });
});
