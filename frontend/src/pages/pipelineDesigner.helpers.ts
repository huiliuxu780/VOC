import { JobPipelineConfig, JobPipelineUpdatePayload } from "../lib/api";
import { PipelineNode } from "../store/pipelineStore";

export function toStoreNodes(nodes: JobPipelineConfig["nodes"]): PipelineNode[] {
  return nodes.map((node) => ({
    key: node.key,
    enabled: node.enabled,
    model: node.model,
    promptVersion: node.prompt_version
  }));
}

export function toApiNodes(nodes: PipelineNode[]): JobPipelineUpdatePayload["nodes"] {
  return nodes.map((node) => ({
    key: node.key,
    enabled: node.enabled,
    model: node.model,
    prompt_version: node.promptVersion
  }));
}
