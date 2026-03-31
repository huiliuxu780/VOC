import { create } from "zustand";

type PipelineNode = {
  key: string;
  enabled: boolean;
  model: string;
  promptVersion: string;
};

type PipelineState = {
  nodes: PipelineNode[];
  toggleNode: (key: string) => void;
};

const seed: PipelineNode[] = [
  { key: "pre_filter", enabled: true, model: "qwen-max-v1", promptVersion: "v1.2" },
  { key: "relevance_analysis", enabled: true, model: "deepseek-v3", promptVersion: "v2.0" },
  { key: "label_classify", enabled: true, model: "gpt-4.1-mini", promptVersion: "v3.1" },
  { key: "sentiment_analysis", enabled: true, model: "gpt-4.1-mini", promptVersion: "v1.8" }
];

export const usePipelineStore = create<PipelineState>((set) => ({
  nodes: seed,
  toggleNode: (key) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.key === key ? { ...node, enabled: !node.enabled } : node))
    }))
}));
