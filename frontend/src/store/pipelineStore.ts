import { create } from "zustand";

export type PipelineNode = {
  key: string;
  enabled: boolean;
  model: string;
  promptVersion: string;
};

type PipelineState = {
  nodes: PipelineNode[];
  setNodes: (nodes: PipelineNode[]) => void;
  toggleNode: (key: string) => void;
  setNodeModel: (key: string, model: string) => void;
  setNodePromptVersion: (key: string, promptVersion: string) => void;
  resetNodes: () => void;
};

const seed: PipelineNode[] = [
  { key: "pre_filter", enabled: true, model: "qwen-max-v1", promptVersion: "v1.2" },
  { key: "relevance_analysis", enabled: true, model: "deepseek-v3", promptVersion: "v2.0" },
  { key: "label_classify", enabled: true, model: "gpt-4.1-mini", promptVersion: "v3.1" },
  { key: "sentiment_analysis", enabled: true, model: "gpt-4.1-mini", promptVersion: "v1.8" }
];

function mapNode(
  node: Partial<PipelineNode> & { key?: string; promptVersion?: string; prompt_version?: string }
): PipelineNode | null {
  const key = typeof node.key === "string" ? node.key.trim() : "";
  if (!key) return null;
  const model = typeof node.model === "string" && node.model.trim() ? node.model.trim() : "gpt-4.1-mini";
  const rawPrompt =
    typeof node.promptVersion === "string"
      ? node.promptVersion
      : typeof node.prompt_version === "string"
        ? node.prompt_version
        : "v1";
  const promptVersion = rawPrompt.trim() || "v1";
  return {
    key,
    enabled: typeof node.enabled === "boolean" ? node.enabled : true,
    model,
    promptVersion
  };
}

function normalizeNodes(nodes: PipelineNode[]) {
  const mapped = nodes
    .map((node) => mapNode(node))
    .filter((node): node is PipelineNode => node !== null);
  return mapped.length > 0 ? mapped : seed;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  nodes: seed,
  setNodes: (nodes) =>
    set(() => ({
      nodes: normalizeNodes(nodes)
    })),
  toggleNode: (key) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.key === key ? { ...node, enabled: !node.enabled } : node))
    })),
  setNodeModel: (key, model) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.key === key ? { ...node, model } : node))
    })),
  setNodePromptVersion: (key, promptVersion) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.key === key ? { ...node, promptVersion } : node))
    })),
  resetNodes: () =>
    set(() => ({
      nodes: seed
    }))
}));
