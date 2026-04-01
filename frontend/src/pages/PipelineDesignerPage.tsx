import { useEffect, useMemo, useState } from "react";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Select";
import { apiGet, apiPut, Job, JobPipelineConfig, JobPipelineUpdatePayload } from "../lib/api";
import { PipelineNode, usePipelineStore } from "../store/pipelineStore";
import { toApiNodes, toStoreNodes } from "./pipelineDesigner.helpers";

type NoticeTone = "neutral" | "success" | "error";

const modelCatalog = ["qwen-max-v1", "deepseek-v3", "gpt-4.1-mini", "gpt-4.1", "claude-3.7-sonnet"];
const promptCatalog = ["v1", "v1.2", "v1.8", "v2.0", "v3.1"];

function noticeToneClass(tone: NoticeTone) {
  if (tone === "success") return "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
  if (tone === "error") return "border-rose-400/35 bg-rose-500/10 text-rose-100";
  return "border-white/10 bg-white/[0.02] text-textSecondary";
}

export function PipelineDesignerPage() {
  const { nodes, setNodes, toggleNode, setNodeModel, setNodePromptVersion, resetNodes } = usePipelineStore();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("请先选择作业并加载 pipeline 配置。");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("neutral");

  const activeJob = useMemo(() => jobs.find((job) => job.id === activeJobId) ?? null, [jobs, activeJobId]);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ value: String(job.id), label: `${job.name} (${job.code})` })),
    [jobs]
  );

  function pushNotice(message: string, tone: NoticeTone = "neutral") {
    setNotice(message);
    setNoticeTone(tone);
  }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const result = await apiGet<Job[]>("/jobs");
      setJobs(result);
      if (result.length === 0) {
        setActiveJobId(null);
        pushNotice("当前没有作业，请先在作业管理中创建作业。", "neutral");
        return;
      }
      setActiveJobId((current) => {
        if (current && result.some((item) => item.id === current)) return current;
        return result[0].id;
      });
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Failed to load jobs", "error");
    } finally {
      setJobsLoading(false);
    }
  }

  async function loadPipeline(jobId: number) {
    setPipelineLoading(true);
    try {
      const result = await apiGet<JobPipelineConfig>(`/jobs/${jobId}/pipeline`);
      setNodes(toStoreNodes(result.nodes));
      pushNotice(`已加载 ${activeJob?.name ?? `Job ${jobId}`} 的 pipeline 配置。`, "neutral");
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Failed to load pipeline", "error");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function savePipeline() {
    if (!activeJobId) return;
    const invalidNode = nodes.find((node) => !node.model.trim() || !node.promptVersion.trim());
    if (invalidNode) {
      pushNotice(`节点 ${invalidNode.key} 的模型或 Prompt 版本不能为空。`, "error");
      return;
    }

    setSaving(true);
    try {
      const payload: JobPipelineUpdatePayload = { nodes: toApiNodes(nodes) };
      await apiPut<JobPipelineConfig>(`/jobs/${activeJobId}/pipeline`, payload);
      pushNotice(`已保存 ${activeJob?.name ?? `Job ${activeJobId}`} 的 pipeline 配置。`, "success");
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Failed to save pipeline", "error");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    if (!activeJobId) return;
    void loadPipeline(activeJobId);
  }, [activeJobId]);

  return (
    <Panel title="分析链路配置" description="按作业独立配置 pipeline 节点启停、模型与 Prompt 版本。">
      <div className={["mb-4 rounded-xl border px-3 py-2 text-xs", noticeToneClass(noticeTone)].join(" ")}>{notice}</div>

      <div className="mb-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <div>
          <p className="mb-2 text-xs text-textSecondary">目标作业</p>
          <Select
            value={activeJobId ? String(activeJobId) : ""}
            onChange={(value) => setActiveJobId(Number(value))}
            options={jobOptions}
            placeholder={jobsLoading ? "加载作业中..." : "请选择作业"}
            ariaLabel="选择作业"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!activeJobId) return;
            void loadPipeline(activeJobId);
          }}
          disabled={!activeJobId || pipelineLoading}
          className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pipelineLoading ? "加载中..." : "重新加载"}
        </button>
        <button
          type="button"
          onClick={resetNodes}
          disabled={nodes.length === 0}
          className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          重置默认
        </button>
        <button
          type="button"
          onClick={() => void savePipeline()}
          disabled={!activeJobId || saving || pipelineLoading}
          className="rounded-xl border border-emerald-300/35 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存配置"}
        </button>
      </div>

      {activeJobId === null ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-textSecondary">
          暂无可配置作业。
        </div>
      ) : (
        <div className="space-y-3">
          {nodes.map((node, index) => {
            const modelOptions = Array.from(new Set([node.model, ...modelCatalog])).map((model) => ({
              value: model,
              label: model
            }));
            const promptOptions = Array.from(new Set([node.promptVersion, ...promptCatalog])).map((version) => ({
              value: version,
              label: version
            }));

            return (
              <div key={node.key} className="rounded-xl border border-white/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-textSecondary">节点 {index + 1}</p>
                    <p className="font-medium">{node.key}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNode(node.key)}
                    className={[
                      "rounded-full px-3 py-1 text-xs transition",
                      node.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-zinc-500/25 text-zinc-200"
                    ].join(" ")}
                  >
                    {node.enabled ? "已启用" : "已停用"}
                  </button>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 px-3 py-2">
                    <p className="mb-2 text-xs text-textSecondary">模型版本</p>
                    <Select
                      value={node.model}
                      onChange={(value) => setNodeModel(node.key, value)}
                      options={modelOptions}
                      ariaLabel={`${node.key}-model`}
                    />
                  </div>
                  <div className="rounded-lg border border-white/10 px-3 py-2">
                    <p className="mb-2 text-xs text-textSecondary">Prompt 版本</p>
                    <Select
                      value={node.promptVersion}
                      onChange={(value) => setNodePromptVersion(node.key, value)}
                      options={promptOptions}
                      ariaLabel={`${node.key}-prompt`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
