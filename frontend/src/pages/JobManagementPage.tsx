import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "../components/ui/Panel";
import {
  apiGet,
  apiPost,
  FailureNodeStat,
  Job,
  JobRun,
  JobStage,
  PagedRunFailures,
  RetryResult,
  RetrySingleFailureResult,
  RunFailure,
  RunFailureDetailResponse,
  RunFailureSummary
} from "../lib/api";

type TriggerResponse = { run_id: string; status: string };
type FailureSortField = "record_id" | "category" | "node" | "error_type";
type FailureSortOrder = "asc" | "desc";
type NoticeTone = "neutral" | "success" | "error";

function fmtTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  if (status === "success") return "text-emerald-300";
  if (status === "running") return "text-cyan-300";
  if (status === "partial_success") return "text-amber-300";
  if (status === "failed") return "text-rose-300";
  return "text-textSecondary";
}

function retryStatusLabel(status?: string | null) {
  if (!status) return "not_retried";
  return status;
}

function retryStatusClass(status?: string | null) {
  if (status === "success") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  if (status === "running") return "border-cyan-400/40 bg-cyan-500/10 text-cyan-200";
  if (status === "queued") return "border-amber-400/40 bg-amber-500/10 text-amber-200";
  if (status === "failed") return "border-rose-400/40 bg-rose-500/10 text-rose-200";
  return "border-white/15 bg-white/[0.03] text-textSecondary";
}

function noticeToneClass(tone: NoticeTone) {
  if (tone === "success") return "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
  if (tone === "error") return "border-rose-400/35 bg-rose-500/10 text-rose-100";
  return "border-white/10 bg-white/[0.02] text-textSecondary";
}

function downloadFailuresCsv(runId: string, rows: PagedRunFailures["items"]) {
  const header = ["record_id", "category", "node", "error_type", "detail", "retry_status", "retry_run_id"];
  const lines = rows.map((row) =>
    [row.record_id, row.category, row.node, row.error_type, row.detail, row.retry_status ?? "", row.retry_run_id ?? ""]
      .map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `run-${runId}-failures.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildFallbackDetail(failure: RunFailure, stages: JobStage[]): RunFailureDetailResponse {
  return {
    ...failure,
    stage_timeline: stages.map((stage) => ({
      stage_name: stage.stage_name,
      status: stage.status,
      duration_ms: stage.duration_ms,
      input_payload: stage.stage_name === failure.node ? failure.input_payload ?? {} : { record_id: failure.record_id },
      output_payload: stage.stage_name === failure.node ? failure.output_payload ?? {} : { status: stage.status }
    }))
  };
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPayloadRecord(value: unknown): Record<string, unknown> {
  if (isObjectLike(value)) return value;
  if (Array.isArray(value)) return { $array: value };
  if (value === undefined) return {};
  return { $value: value };
}

function stringifyDiffValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildTopLevelDiffRows(inputPayload: unknown, outputPayload: unknown) {
  const input = toPayloadRecord(inputPayload);
  const output = toPayloadRecord(outputPayload);
  const keys = Array.from(new Set([...Object.keys(input), ...Object.keys(output)])).sort();
  return keys.map((key) => {
    const inputText = stringifyDiffValue(input[key]);
    const outputText = stringifyDiffValue(output[key]);
    return {
      key,
      inputText,
      outputText,
      changed: inputText !== outputText
    };
  });
}

const runFilters = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "success", label: "Success" },
  { key: "partial_success", label: "Partial" },
  { key: "failed", label: "Failed" }
];

export function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string>("");

  const [stages, setStages] = useState<JobStage[]>([]);
  const [failures, setFailures] = useState<PagedRunFailures["items"]>([]);
  const [failureTotal, setFailureTotal] = useState<number>(0);
  const [failureSummary, setFailureSummary] = useState<RunFailureSummary | null>(null);
  const [nodeStats, setNodeStats] = useState<FailureNodeStat[]>([]);
  const [selectedFailure, setSelectedFailure] = useState<RunFailureDetailResponse | null>(null);
  const [failureDrawerLoading, setFailureDrawerLoading] = useState(false);
  const [drawerRecordId, setDrawerRecordId] = useState<string>("");

  const [runFilter, setRunFilter] = useState<string>("all");
  const [failureCategoryFilter, setFailureCategoryFilter] = useState<string>("all");
  const [failureNodeFilter, setFailureNodeFilter] = useState<string>("all");
  const [failurePage, setFailurePage] = useState<number>(1);
  const [failurePageSize] = useState<number>(5);
  const [failureSortBy, setFailureSortBy] = useState<FailureSortField>("record_id");
  const [failureSortOrder, setFailureSortOrder] = useState<FailureSortOrder>("asc");

  const [notice, setNotice] = useState<string>("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("neutral");
  const [triggeringJobId, setTriggeringJobId] = useState<number | null>(null);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [retryingRecordId, setRetryingRecordId] = useState<string | null>(null);
  const [showChangedOnly, setShowChangedOnly] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  function pushNotice(message: string, tone: NoticeTone = "neutral") {
    setNotice(message);
    setNoticeTone(tone);
  }

  function closeDrawer() {
    setSelectedFailure(null);
    setFailureDrawerLoading(false);
    setDrawerRecordId("");
    setShowChangedOnly(false);
  }

  async function loadJobs() {
    try {
      const result = await apiGet<Job[]>("/jobs");
      setJobs(result);
      if (result.length > 0 && activeJobId === null) {
        await loadRuns(result[0].id, runFilter);
      }
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Failed to load jobs", "error");
    }
  }

  async function loadRuns(jobId: number, filter = runFilter) {
    try {
      setActiveJobId(jobId);
      const runResult = await apiGet<JobRun[]>(`/jobs/${jobId}/runs?status=${filter}`);
      setRuns(runResult);
      setSelectedRunId((prev) => {
        const hasCurrent = runResult.some((run) => run.run_id === prev);
        if (hasCurrent) return prev;
        return runResult[0]?.run_id ?? "";
      });
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Failed to load runs", "error");
    }
  }

  async function loadRunDetails(runId: string) {
    try {
      const offset = (failurePage - 1) * failurePageSize;
      const [stageResult, failureResult, summaryResult, nodeStatsResult] = await Promise.all([
        apiGet<JobStage[]>(`/jobs/runs/${runId}/stages`),
        apiGet<PagedRunFailures>(
          `/jobs/runs/${runId}/failures?category=${encodeURIComponent(failureCategoryFilter)}&node=${encodeURIComponent(failureNodeFilter)}&offset=${offset}&limit=${failurePageSize}&sort_by=${failureSortBy}&sort_order=${failureSortOrder}`
        ),
        apiGet<RunFailureSummary>(`/jobs/runs/${runId}/failure-summary`),
        apiGet<FailureNodeStat[]>(`/jobs/runs/${runId}/failure-node-stats`)
      ]);
      setStages(stageResult);
      setFailures(failureResult.items);
      setFailureTotal(failureResult.total);
      setFailureSummary(summaryResult);
      setNodeStats(nodeStatsResult);
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Failed to load run details", "error");
    }
  }

  async function openFailureDrawer(recordId: string, showLoading = true) {
    if (!selectedRunId) return;
    setDrawerRecordId(recordId);
    if (showLoading) setFailureDrawerLoading(true);
    try {
      const detail = await apiGet<RunFailureDetailResponse>(`/jobs/runs/${selectedRunId}/failures/${recordId}`);
      setSelectedFailure(detail);
    } catch (err) {
      const fallback = failures.find((item) => item.record_id === recordId);
      if (fallback) {
        setSelectedFailure(buildFallbackDetail(fallback, stages));
        pushNotice("Detail endpoint unavailable. Showing fallback snapshot.", "neutral");
      } else {
        pushNotice(err instanceof Error ? err.message : "Failed to load failure detail", "error");
      }
    } finally {
      if (showLoading) setFailureDrawerLoading(false);
    }
  }

  async function exportFailures(runId: string) {
    try {
      const result = await apiGet<PagedRunFailures>(
        `/jobs/runs/${runId}/failures?category=${encodeURIComponent(failureCategoryFilter)}&node=${encodeURIComponent(failureNodeFilter)}&offset=0&limit=5000&sort_by=${failureSortBy}&sort_order=${failureSortOrder}`
      );
      downloadFailuresCsv(runId, result.items);
      pushNotice(`Exported ${result.items.length} failure records`, "success");
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Export failed", "error");
    }
  }

  async function trigger(jobId: number) {
    setTriggeringJobId(jobId);
    try {
      const result = await apiPost<TriggerResponse>(`/jobs/${jobId}/trigger`);
      pushNotice(`Triggered run: ${result.run_id}`, "success");
      await loadRuns(jobId, runFilter);
      setFailurePage(1);
      setSelectedRunId(result.run_id);
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Trigger failed", "error");
    } finally {
      setTriggeringJobId(null);
    }
  }

  async function retry(runId: string) {
    if (!activeJobId) return;
    setRetryingRunId(runId);
    try {
      const result = await apiPost<RetryResult>(`/jobs/runs/${runId}/retry`);
      pushNotice(`Retry queued: ${result.old_run_id} -> ${result.new_run_id}`, "success");
      await loadRuns(activeJobId, runFilter);
      setFailurePage(1);
      setSelectedRunId(result.new_run_id);
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Retry failed", "error");
    } finally {
      setRetryingRunId(null);
    }
  }

  async function retrySingleFailure(recordId: string) {
    if (!selectedRunId) return;
    setRetryingRecordId(recordId);
    try {
      const result = await apiPost<RetrySingleFailureResult>(`/jobs/runs/${selectedRunId}/failures/${recordId}/retry`);
      setFailures((prev) =>
        prev.map((item) =>
          item.record_id === recordId ? { ...item, retry_status: "queued", retry_run_id: result.retry_run_id } : item
        )
      );
      setSelectedFailure((prev) =>
        prev && prev.record_id === recordId ? { ...prev, retry_status: "queued", retry_run_id: result.retry_run_id } : prev
      );
      pushNotice(`Single retry queued: ${result.record_id} -> ${result.retry_run_id}`, "success");
      if (activeJobId) {
        await loadRuns(activeJobId, runFilter);
      }
      await loadRunDetails(selectedRunId);
      if (selectedFailure?.record_id === recordId) {
        await openFailureDrawer(recordId, false);
      }
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "Single retry failed", "error");
    } finally {
      setRetryingRecordId(null);
    }
  }

  function selectRun(runId: string) {
    setSelectedRunId(runId);
    setFailurePage(1);
    setFailureCategoryFilter("all");
    setFailureNodeFilter("all");
    closeDrawer();
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    if (!activeJobId) return;
    void loadRuns(activeJobId, runFilter);
  }, [runFilter]);

  useEffect(() => {
    if (!selectedRunId) {
      setStages([]);
      setFailures([]);
      setFailureTotal(0);
      setFailureSummary(null);
      setNodeStats([]);
      closeDrawer();
      return;
    }
    void loadRunDetails(selectedRunId);
  }, [selectedRunId, failureCategoryFilter, failureNodeFilter, failurePage, failureSortBy, failureSortOrder]);

  useEffect(() => {
    if (!activeJobId) return;
    const timer = setInterval(() => {
      void loadRuns(activeJobId, runFilter);
      if (selectedRunId) {
        void loadRunDetails(selectedRunId);
        if (selectedFailure?.record_id) {
          void openFailureDrawer(selectedFailure.record_id, false);
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeJobId, runFilter, selectedRunId, selectedFailure?.record_id]);

  useEffect(() => {
    if (!selectedFailure && !failureDrawerLoading) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedFailure, failureDrawerLoading]);

  useEffect(() => {
    if (selectedFailure || failureDrawerLoading) {
      closeButtonRef.current?.focus();
    }
  }, [selectedFailure, failureDrawerLoading]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.run_id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const maxNodeCount = useMemo(() => Math.max(1, ...nodeStats.map((item) => item.count)), [nodeStats]);
  const availableNodeFilters = useMemo(() => ["all", ...new Set(nodeStats.map((item) => item.node))], [nodeStats]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(failureTotal / failurePageSize)), [failureTotal, failurePageSize]);
  const isDrawerOpen = Boolean(selectedFailure) || (failureDrawerLoading && Boolean(drawerRecordId));

  return (
    <div className="space-y-6">
      <Panel title="Job Management" description="Trigger jobs, inspect runs, and retry failures.">
        <div className={["mb-4 rounded-xl border px-3 py-2 text-xs", noticeToneClass(noticeTone)].join(" ")}>
          {notice || "Runs auto-refresh every 5 seconds."}
        </div>
        <div className="space-y-2 text-sm">
          {jobs.map((job) => (
            <div key={job.code} className="grid grid-cols-[1.3fr_1fr_1fr_1.2fr] items-center gap-3 rounded-xl border border-white/10 p-3">
              <div>
                <p className="font-medium">{job.code}</p>
                <p className="text-xs text-textSecondary">{job.name}</p>
              </div>
              <p className="text-textSecondary">{job.job_type}</p>
              <span className="w-fit rounded-full border border-white/15 bg-white/[0.03] px-2 py-1 text-xs">
                {job.enabled ? "Enabled" : "Disabled"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => void loadRuns(job.id, runFilter)}
                  className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-xs transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  Runs
                </button>
                <button
                  disabled={triggeringJobId === job.id}
                  onClick={() => void trigger(job.id)}
                  className="cursor-pointer rounded-lg border border-indigo-400/40 px-2 py-1 text-xs text-indigo-200 transition-colors hover:border-indigo-300/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  {triggeringJobId === job.id ? "Triggering..." : "Trigger"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Run Records"
          description={activeJobId ? `Current job: ${activeJobId}` : "Select a job"}
          rightSlot={
            <div className="flex flex-wrap gap-2">
              {runFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setRunFilter(filter.key)}
                  className={[
                    "cursor-pointer rounded-full border px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                    runFilter === filter.key
                      ? "border-indigo-400/45 bg-indigo-500/20 text-indigo-100"
                      : "border-white/15 text-textSecondary hover:border-white/25"
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="space-y-2 text-sm">
            {runs.map((run) => (
              <div key={run.run_id} className="grid grid-cols-[1.2fr_0.8fr_0.9fr_0.9fr_1.3fr] items-center gap-3 rounded-xl border border-white/10 p-3">
                <button
                  onClick={() => selectRun(run.run_id)}
                  className="cursor-pointer text-left font-medium text-indigo-200 underline-offset-2 transition-colors hover:text-indigo-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  {run.run_id}
                </button>
                <span className={["rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs", statusClass(run.status)].join(" ")}>{run.status}</span>
                <p className="text-emerald-300">Success {run.success_count}</p>
                <p className="text-rose-300">Failed {run.failed_count}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectRun(run.run_id)}
                    className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-xs transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                  >
                    Details
                  </button>
                  <button
                    disabled={retryingRunId === run.run_id}
                    onClick={() => void retry(run.run_id)}
                    className="cursor-pointer rounded-lg border border-amber-400/40 px-2 py-1 text-xs text-amber-200 transition-colors hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                  >
                    {retryingRunId === run.run_id ? "Retrying..." : "Retry"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Run Details" description={selectedRun ? `run_id: ${selectedRun.run_id}` : "Select run"}>
          {selectedRun ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-white/10 p-3 text-xs text-textSecondary">
                <p>Status: <span className={statusClass(selectedRun.status)}>{selectedRun.status}</span></p>
                <p>Start: {fmtTime(selectedRun.started_at)}</p>
                <p>End: {fmtTime(selectedRun.ended_at)}</p>
              </div>

              {failureSummary ? (
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="mb-2 text-xs text-textSecondary">Failure categories ({failureSummary.total})</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(failureSummary.by_category).map(([key, count]) => (
                      <span key={key} className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-1 text-xs">
                        {key}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/10 p-3">
                <p className="mb-2 text-xs text-textSecondary">Failure by node</p>
                <div className="space-y-2">
                  {nodeStats.length === 0 ? (
                    <p className="text-xs text-textSecondary">No node failures</p>
                  ) : (
                    nodeStats.map((item) => (
                      <div key={item.node} className="grid grid-cols-[110px_1fr_40px] items-center gap-2 text-xs">
                        <span className="text-textSecondary">{item.node}</span>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-accent-gradient" style={{ width: `${(item.count / maxNodeCount) * 100}%` }} />
                        </div>
                        <span className="text-indigo-200">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {stages.map((stage) => (
                <div key={stage.stage_name} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{stage.stage_name}</p>
                    <span className={statusClass(stage.status)}>{stage.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-textSecondary">Duration {stage.duration_ms}ms</p>
                </div>
              ))}

              <div className="rounded-xl border border-white/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-textSecondary">Failure details</p>
                  <button
                    onClick={() => void exportFailures(selectedRun.run_id)}
                    className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-xs transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                  >
                    Export CSV
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={failureCategoryFilter}
                    onChange={(e) => {
                      setFailureCategoryFilter(e.target.value);
                      setFailurePage(1);
                    }}
                    className="rounded-lg border border-white/15 bg-black/20 px-2 py-1"
                  >
                    <option value="all">Category: all</option>
                    <option value="system_error">system_error</option>
                    <option value="model_error">model_error</option>
                    <option value="business_error">business_error</option>
                    <option value="transient_error">transient_error</option>
                  </select>
                  <select
                    value={failureNodeFilter}
                    onChange={(e) => {
                      setFailureNodeFilter(e.target.value);
                      setFailurePage(1);
                    }}
                    className="rounded-lg border border-white/15 bg-black/20 px-2 py-1"
                  >
                    {availableNodeFilters.map((node) => (
                      <option key={node} value={node}>
                        Node: {node}
                      </option>
                    ))}
                  </select>
                  <select
                    value={failureSortBy}
                    onChange={(e) => {
                      setFailureSortBy(e.target.value as FailureSortField);
                      setFailurePage(1);
                    }}
                    className="rounded-lg border border-white/15 bg-black/20 px-2 py-1"
                  >
                    <option value="record_id">Sort: record_id</option>
                    <option value="category">Sort: category</option>
                    <option value="node">Sort: node</option>
                    <option value="error_type">Sort: error_type</option>
                  </select>
                  <select
                    value={failureSortOrder}
                    onChange={(e) => {
                      setFailureSortOrder(e.target.value as FailureSortOrder);
                      setFailurePage(1);
                    }}
                    className="rounded-lg border border-white/15 bg-black/20 px-2 py-1"
                  >
                    <option value="asc">Order: asc</option>
                    <option value="desc">Order: desc</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {failures.length === 0 ? (
                    <p className="text-xs text-textSecondary">No failures in current filter</p>
                  ) : (
                    failures.map((item) => {
                      const waitingRetry = item.retry_status === "queued" || item.retry_status === "running";
                      return (
                        <div key={`${item.record_id}-${item.error_type}`} className="rounded-lg border border-white/10 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-xs text-indigo-200">{item.record_id} / {item.node}</p>
                            <span className={["rounded-full border px-2 py-0.5 text-[11px]", retryStatusClass(item.retry_status)].join(" ")}>
                              {retryStatusLabel(item.retry_status)}
                            </span>
                          </div>
                        <p className="text-xs text-textSecondary">{item.category} | {item.error_type}</p>
                        <p className="mt-1 text-xs">{item.detail}</p>
                        {item.retry_run_id ? (
                          <p className="mt-1 text-[11px] text-textSecondary">retry run: {item.retry_run_id}</p>
                        ) : null}
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => void openFailureDrawer(item.record_id)}
                            className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-xs transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                          >
                            View IO
                          </button>
                          <button
                            disabled={retryingRecordId === item.record_id || waitingRetry}
                            onClick={() => void retrySingleFailure(item.record_id)}
                            className="cursor-pointer rounded-lg border border-amber-400/40 px-2 py-1 text-xs text-amber-200 transition-colors hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                          >
                            {retryingRecordId === item.record_id ? "Retrying..." : waitingRetry ? "Queued..." : "Retry Item"}
                          </button>
                        </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-textSecondary">
                  <span>Page {failurePage} / {totalPages} | Total {failureTotal}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={failurePage <= 1}
                      onClick={() => setFailurePage((p) => Math.max(1, p - 1))}
                      className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      disabled={failurePage >= totalPages}
                      onClick={() => setFailurePage((p) => Math.min(totalPages, p + 1))}
                      className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-textSecondary">Select a run to inspect details.</p>
          )}
        </Panel>
      </div>

      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDrawer();
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="failure-drawer-title"
            className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-white/10 bg-[#07090D] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="failure-drawer-title" className="text-sm font-semibold">
                Failure Detail Drawer
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChangedOnly((value) => !value)}
                  className={[
                    "cursor-pointer rounded-lg border px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                    showChangedOnly
                      ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                      : "border-white/15 text-textSecondary hover:border-white/25"
                  ].join(" ")}
                >
                  {showChangedOnly ? "Show All Fields" : "Only Changed"}
                </button>
                <button
                  ref={closeButtonRef}
                  className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-xs transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                  onClick={closeDrawer}
                >
                  Close
                </button>
              </div>
            </div>
            {selectedFailure ? (
              <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-white/10 p-2">
                <p className="text-indigo-200">{selectedFailure.record_id}</p>
                <p className="text-textSecondary">{selectedFailure.category} | {selectedFailure.error_type}</p>
                <p className="mt-1">{selectedFailure.detail}</p>
                <p className="mt-1 text-textSecondary">
                  Retry status: {retryStatusLabel(selectedFailure.retry_status)}
                  {selectedFailure.retry_run_id ? ` (${selectedFailure.retry_run_id})` : ""}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="mb-1 text-textSecondary">Node Timeline</p>
                <div className="space-y-2">
                  {selectedFailure.stage_timeline.map((stage) => {
                    const diffRows = buildTopLevelDiffRows(stage.input_payload, stage.output_payload);
                    const changedCount = diffRows.filter((row) => row.changed).length;
                    const visibleRows = showChangedOnly ? diffRows.filter((row) => row.changed) : diffRows;
                    return (
                      <details
                        key={stage.stage_name}
                        open={stage.stage_name === selectedFailure.node}
                        className="rounded border border-white/10 bg-white/[0.02] p-2"
                      >
                        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[11px]">
                          <span className="font-medium text-indigo-100">{stage.stage_name}</span>
                          <span className={statusClass(stage.status)}>{stage.status}</span>
                          <span className="text-textSecondary">{stage.duration_ms}ms</span>
                          <span
                            className={[
                              "rounded-full border px-2 py-0.5",
                              changedCount > 0
                                ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            ].join(" ")}
                          >
                            {changedCount > 0 ? `${changedCount} changed` : "no change"}
                          </span>
                        </summary>

                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          <div className="rounded border border-white/10 p-2">
                            <p className="mb-1 text-[11px] text-textSecondary">Input</p>
                            <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(stage.input_payload ?? {}, null, 2)}</pre>
                          </div>
                          <div className="rounded border border-white/10 p-2">
                            <p className="mb-1 text-[11px] text-textSecondary">Output</p>
                            <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(stage.output_payload ?? {}, null, 2)}</pre>
                          </div>
                        </div>

                        <div className="mt-2 rounded border border-white/10 p-2">
                          <p className="mb-1 text-[11px] text-textSecondary">Top-level diff</p>
                          {visibleRows.length === 0 ? (
                            <p className="text-[11px] text-textSecondary">No changed fields.</p>
                          ) : (
                            <div className="space-y-1">
                              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-2 text-[11px] text-textSecondary">
                                <span>field</span>
                                <span>input</span>
                                <span>output</span>
                              </div>
                              {visibleRows.map((row) => (
                                <div
                                  key={`${stage.stage_name}-${row.key}`}
                                  className={[
                                    "grid grid-cols-[1fr_1fr_1fr] gap-2 rounded px-2 py-1 text-[11px]",
                                    row.changed ? "bg-amber-500/10 text-amber-100" : "bg-white/[0.02] text-textSecondary"
                                  ].join(" ")}
                                >
                                  <span className="truncate font-medium">{row.key}</span>
                                  <span className="truncate">{row.inputText || "(empty)"}</span>
                                  <span className="truncate">{row.outputText || "(empty)"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="mb-1 text-textSecondary">Input Payload</p>
                <pre className="overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(selectedFailure.input_payload ?? {}, null, 2)}</pre>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="mb-1 text-textSecondary">Output Payload</p>
                <pre className="overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(selectedFailure.output_payload ?? {}, null, 2)}</pre>
              </div>
              </div>
            ) : (
              <p className="text-xs text-textSecondary">Preparing detail view for {drawerRecordId}...</p>
            )}
            {failureDrawerLoading ? <p className="mb-3 text-xs text-cyan-200">Loading failure details...</p> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
