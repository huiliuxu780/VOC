import { useEffect, useMemo, useState } from "react";
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
  RunFailureDetailResponse,
  RunFailureSummary
} from "../lib/api";

type TriggerResponse = { run_id: string; status: string };
type FailureSortField = "record_id" | "category" | "node" | "error_type";
type FailureSortOrder = "asc" | "desc";

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

function downloadFailuresCsv(runId: string, rows: PagedRunFailures["items"]) {
  const header = ["record_id", "category", "node", "error_type", "detail"];
  const lines = rows.map((row) =>
    [row.record_id, row.category, row.node, row.error_type, row.detail]
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

  const [runFilter, setRunFilter] = useState<string>("all");
  const [failureCategoryFilter, setFailureCategoryFilter] = useState<string>("all");
  const [failureNodeFilter, setFailureNodeFilter] = useState<string>("all");
  const [failurePage, setFailurePage] = useState<number>(1);
  const [failurePageSize] = useState<number>(5);
  const [failureSortBy, setFailureSortBy] = useState<FailureSortField>("record_id");
  const [failureSortOrder, setFailureSortOrder] = useState<FailureSortOrder>("asc");

  const [notice, setNotice] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function loadJobs() {
    try {
      const result = await apiGet<Job[]>("/jobs");
      setJobs(result);
      if (result.length > 0 && activeJobId === null) {
        await loadRuns(result[0].id, runFilter);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load jobs");
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
      setNotice(err instanceof Error ? err.message : "Failed to load runs");
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
      setNotice(err instanceof Error ? err.message : "Failed to load run details");
    }
  }

  async function openFailureDrawer(recordId: string, showLoading = true) {
    if (!selectedRunId) return;
    if (showLoading) setFailureDrawerLoading(true);
    try {
      const detail = await apiGet<RunFailureDetailResponse>(`/jobs/runs/${selectedRunId}/failures/${recordId}`);
      setSelectedFailure(detail);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load failure detail");
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
      setNotice(`Exported ${result.items.length} failure records`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function trigger(jobId: number) {
    setBusy(true);
    try {
      const result = await apiPost<TriggerResponse>(`/jobs/${jobId}/trigger`);
      setNotice(`Triggered run: ${result.run_id}`);
      await loadRuns(jobId, runFilter);
      setFailurePage(1);
      setSelectedRunId(result.run_id);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Trigger failed");
    } finally {
      setBusy(false);
    }
  }

  async function retry(runId: string) {
    if (!activeJobId) return;
    setBusy(true);
    try {
      const result = await apiPost<RetryResult>(`/jobs/runs/${runId}/retry`);
      setNotice(`Retry queued: ${result.old_run_id} -> ${result.new_run_id}`);
      await loadRuns(activeJobId, runFilter);
      setFailurePage(1);
      setSelectedRunId(result.new_run_id);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  async function retrySingleFailure(recordId: string) {
    if (!selectedRunId) return;
    setBusy(true);
    try {
      const result = await apiPost<RetrySingleFailureResult>(`/jobs/runs/${selectedRunId}/failures/${recordId}/retry`);
      setNotice(`Single retry queued: ${result.record_id} -> ${result.retry_run_id}`);
      if (activeJobId) {
        await loadRuns(activeJobId, runFilter);
      }
      await loadRunDetails(selectedRunId);
      if (selectedFailure?.record_id === recordId) {
        await openFailureDrawer(recordId, false);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Single retry failed");
    } finally {
      setBusy(false);
    }
  }

  function selectRun(runId: string) {
    setSelectedRunId(runId);
    setFailurePage(1);
    setFailureCategoryFilter("all");
    setFailureNodeFilter("all");
    setSelectedFailure(null);
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
      setSelectedFailure(null);
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

  const selectedRun = useMemo(
    () => runs.find((run) => run.run_id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const maxNodeCount = useMemo(() => Math.max(1, ...nodeStats.map((item) => item.count)), [nodeStats]);
  const availableNodeFilters = useMemo(() => ["all", ...new Set(nodeStats.map((item) => item.node))], [nodeStats]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(failureTotal / failurePageSize)), [failureTotal, failurePageSize]);

  return (
    <div className="space-y-6">
      <Panel title="Job Management" description="Trigger jobs, inspect runs, and retry failures.">
        <div className="mb-4 text-xs text-textSecondary">{notice || "Runs auto-refresh every 5 seconds."}</div>
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
                  disabled={busy}
                  onClick={() => void loadRuns(job.id, runFilter)}
                  className="rounded-lg border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
                >
                  Runs
                </button>
                <button
                  disabled={busy}
                  onClick={() => void trigger(job.id)}
                  className="rounded-lg border border-indigo-400/40 px-2 py-1 text-xs text-indigo-200 disabled:opacity-50"
                >
                  Trigger
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
                    "rounded-full border px-2 py-1 text-xs",
                    runFilter === filter.key
                      ? "border-indigo-400/45 bg-indigo-500/20 text-indigo-100"
                      : "border-white/15 text-textSecondary"
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
                <button onClick={() => selectRun(run.run_id)} className="text-left font-medium text-indigo-200 underline-offset-2 hover:underline">
                  {run.run_id}
                </button>
                <span className={["rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs", statusClass(run.status)].join(" ")}>{run.status}</span>
                <p className="text-emerald-300">Success {run.success_count}</p>
                <p className="text-rose-300">Failed {run.failed_count}</p>
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => selectRun(run.run_id)} className="rounded-lg border border-white/15 px-2 py-1 text-xs disabled:opacity-50">
                    Details
                  </button>
                  <button disabled={busy} onClick={() => void retry(run.run_id)} className="rounded-lg border border-amber-400/40 px-2 py-1 text-xs text-amber-200 disabled:opacity-50">
                    Retry
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
                  <button onClick={() => void exportFailures(selectedRun.run_id)} className="rounded-lg border border-white/15 px-2 py-1 text-xs">
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
                    failures.map((item) => (
                      <div key={`${item.record_id}-${item.error_type}`} className="rounded-lg border border-white/10 p-2">
                        <p className="text-xs text-indigo-200">{item.record_id} / {item.node}</p>
                        <p className="text-xs text-textSecondary">{item.category} · {item.error_type}</p>
                        <p className="mt-1 text-xs">{item.detail}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            disabled={busy}
                            onClick={() => void openFailureDrawer(item.record_id)}
                            className="rounded-lg border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
                          >
                            View IO
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => void retrySingleFailure(item.record_id)}
                            className="rounded-lg border border-amber-400/40 px-2 py-1 text-xs text-amber-200 disabled:opacity-50"
                          >
                            Retry Item
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-textSecondary">
                  <span>Page {failurePage} / {totalPages} · Total {failureTotal}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={failurePage <= 1}
                      onClick={() => setFailurePage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-white/15 px-2 py-1 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      disabled={failurePage >= totalPages}
                      onClick={() => setFailurePage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-lg border border-white/15 px-2 py-1 disabled:opacity-50"
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

      {selectedFailure ? (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm">
          <aside className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-white/10 bg-[#07090D] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Failure Detail Drawer</h3>
              <button className="rounded-lg border border-white/15 px-2 py-1 text-xs" onClick={() => setSelectedFailure(null)}>
                Close
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-white/10 p-2">
                <p className="text-indigo-200">{selectedFailure.record_id}</p>
                <p className="text-textSecondary">{selectedFailure.category} · {selectedFailure.error_type}</p>
                <p className="mt-1">{selectedFailure.detail}</p>
                <p className="mt-1 text-textSecondary">
                  Retry status: {selectedFailure.retry_status ?? "none"}
                  {selectedFailure.retry_run_id ? ` (${selectedFailure.retry_run_id})` : ""}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="mb-1 text-textSecondary">Node Timeline</p>
                <div className="space-y-2">
                  {selectedFailure.stage_timeline.map((stage) => (
                    <div key={stage.stage_name} className="rounded border border-white/10 p-2">
                      <p>{stage.stage_name} · {stage.status} · {stage.duration_ms}ms</p>
                    </div>
                  ))}
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
            {failureDrawerLoading ? <p className="mt-3 text-xs text-textSecondary">Loading...</p> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
