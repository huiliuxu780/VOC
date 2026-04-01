import { beforeEach, describe, expect, it } from "vitest";
import { usePipelineStore } from "./pipelineStore";

const baseNodes = [
  { key: "pre_filter", enabled: true, model: "qwen-max-v1", promptVersion: "v1.2" },
  { key: "relevance_analysis", enabled: true, model: "deepseek-v3", promptVersion: "v2.0" },
  { key: "label_classify", enabled: true, model: "gpt-4.1-mini", promptVersion: "v3.1" },
  { key: "sentiment_analysis", enabled: true, model: "gpt-4.1-mini", promptVersion: "v1.8" }
];

describe("pipelineStore", () => {
  beforeEach(() => {
    usePipelineStore.getState().resetNodes();
  });

  it("toggles node enabled status", () => {
    usePipelineStore.getState().toggleNode("pre_filter");
    expect(usePipelineStore.getState().nodes[0]?.enabled).toBe(false);
  });

  it("updates model and prompt version", () => {
    usePipelineStore.getState().setNodeModel("label_classify", "deepseek-v3");
    usePipelineStore.getState().setNodePromptVersion("label_classify", "v9.0");

    const node = usePipelineStore.getState().nodes.find((item) => item.key === "label_classify");
    expect(node?.model).toBe("deepseek-v3");
    expect(node?.promptVersion).toBe("v9.0");
  });

  it("normalizes invalid setNodes input and falls back to seed", () => {
    usePipelineStore.getState().setNodes([
      { key: "", enabled: true, model: "abc", promptVersion: "v1" },
      { key: "   ", enabled: false, model: "xyz", promptVersion: "v2" }
    ]);

    expect(usePipelineStore.getState().nodes).toEqual(baseNodes);
  });
});
