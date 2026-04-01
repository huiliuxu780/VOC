import { describe, expect, it } from "vitest";
import { toApiNodes, toStoreNodes } from "./pipelineDesigner.helpers";

describe("pipelineDesigner helpers", () => {
  it("maps API nodes to store nodes", () => {
    const result = toStoreNodes([
      {
        key: "label_classify",
        enabled: true,
        model: "gpt-4.1-mini",
        prompt_version: "v3.1"
      }
    ]);

    expect(result).toEqual([
      {
        key: "label_classify",
        enabled: true,
        model: "gpt-4.1-mini",
        promptVersion: "v3.1"
      }
    ]);
  });

  it("maps store nodes to API payload nodes", () => {
    const result = toApiNodes([
      {
        key: "sentiment_analysis",
        enabled: false,
        model: "deepseek-v3",
        promptVersion: "v2.0"
      }
    ]);

    expect(result).toEqual([
      {
        key: "sentiment_analysis",
        enabled: false,
        model: "deepseek-v3",
        prompt_version: "v2.0"
      }
    ]);
  });
});
