import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Select";
import {
  apiGet,
  apiPost,
  MonitoringAlertHistoryItem,
  MonitoringAlertRecord,
  MonitoringDashboardMetrics,
  MonitoringDatasourceMetric,
  MonitoringModelMetric
} from "../lib/api";

type AlertStatusFilter = "all" | "open" | "ack" | "resolved";
type AlertSeverityFilter = "all" | "P1" | "P2" | "P3";
type AlertAction = "ack" | "resolve" | "reopen";

function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function severityClass(severity: string) {
  if (severity === "P1") return "text-rose-200 border-rose-400/40 bg-rose-500/10";
  if (severity === "P2") return "text-amber-200 border-amber-400/40 bg-amber-500/10";
  return "text-cyan-200 border-cyan-400/40 bg-cyan-500/10";
}

function statusClass(status: string) {
  if (status === "open") return "text-rose-100 border-rose-400/35 bg-rose-500/10";
  if (status === "ack") return "text-cyan-100 border-cyan-400/35 bg-cyan-500/10";
  if (status === "resolved") return "text-emerald-100 border-emerald-400/35 bg-emerald-500/10";
  return "text-textSecondary border-white/15 bg-white/[0.03]";
}

function fmtTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function alertMessage(alert: MonitoringAlertRecord) {
  const message = alert.detail?.message;
  return typeof message === "string" ? message : "No detail";
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHistoryItem(value: unknown): value is MonitoringAlertHistoryItem {
  if (!isObjectLike(value)) return false;
  return typeof value.action === "string";
}

function parseHistory(alert: MonitoringAlertRecord): MonitoringAlertHistoryItem[] {
  const value = alert.detail?.history;
  if (!Array.isArray(value)) return [];
  return value.filter(isHistoryItem);
}

function stringifyDetailValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatDetailKey(rawKey: string): string {
  return rawKey.replace(/_/g, " ");
}

function detailPairs(alert: MonitoringAlertRecord): Array<{ key: string; value: string }> {
  const source = alert.detail;
  if (!source || !isObjectLike(source)) return [];
  return Object.entries(source)
    .filter(([key]) => key !== "message" && key !== "history")
    .map(([key, value]) => ({ key: formatDetailKey(key), value: stringifyDetailValue(value) }));
}

export function MonitoringPage() {
  const [metrics, setMetrics] = useState<MonitoringDashboardMetrics | null>(null);
  const [datasources, setDatasources] = useState<MonitoringDatasourceMetric[]>([]);
  const [models, setModels] = useState<MonitoringModelMetric[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlertRecord[]>([]);
  const [notice, setNotice] = useState("Monitoring data refreshes every 8 seconds.");
  const [loading, setLoading] = useState(true);
  const [alertStatusFilter, setAlertStatusFilter] = useState<AlertStatusFilter>("all");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<AlertSeverityFilter>("all");
  const [actionBusyAlertId, setActionBusyAlertId] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MonitoringAlertRecord | null>(null);
  const [alertDrawerLoading, setAlertDrawerLoading] = useState(false);
  const [drawerAlertId, setDrawerAlertId] = useState<number | null>(null);
  const closeDrawerButtonRef = useRef<HTMLButtonElement | null>(null);

  const isDrawerOpen = Boolean(selectedAlert) || (alertDrawerLoading && drawerAlertId !== null);

  function closeAlertDrawer() {
    setSelectedAlert(null);
    setAlertDrawerLoading(false);
    setDrawerAlertId(null);
  }

  async function loadMonitoring() {
    try {
      const [dashboardResult, datasourceResult, modelResult, alertResult] = await Promise.all([
        apiGet<MonitoringDashboardMetrics>("/monitoring/dashboard"),
        apiGet<MonitoringDatasourceMetric[]>("/monitoring/datasources"),
        apiGet<MonitoringModelMetric[]>("/monitoring/models"),
        apiGet<MonitoringAlertRecord[]>(
          `/monitoring/alerts?status=${encodeURIComponent(alertStatusFilter)}&severity=${encodeURIComponent(alertSeverityFilter)}`
        )
      ]);
      setMetrics(dashboardResult);
      setDatasources(datasourceResult);
      setModels(modelResult);
      setAlerts(alertResult);
      setNotice("Monitoring data refreshes every 8 seconds.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  }

  async function openAlertDrawer(alertId: number) {
    setDrawerAlertId(alertId);
    setAlertDrawerLoading(true);
    try {
      const result = await apiGet<MonitoringAlertRecord>(`/monitoring/alerts/${alertId}`);
      setSelectedAlert(result);
    } catch (error) {
      const fallback = alerts.find((alert) => alert.id === alertId) ?? null;
      setSelectedAlert(fallback);
      setNotice(error instanceof Error ? error.message : "Failed to load alert detail");
    } finally {
      setAlertDrawerLoading(false);
    }
  }

  async function updateAlertStatus(alertId: number, action: AlertAction) {
    setActionBusyAlertId(alertId);
    try {
      const result = await apiPost<MonitoringAlertRecord>(`/monitoring/alerts/${alertId}/${action}?actor=codex_ui`);
      setNotice(`Alert #${result.id} updated to ${result.status}`);
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(result);
      }
      await loadMonitoring();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to update alert");
    } finally {
      setActionBusyAlertId(null);
    }
  }

  useEffect(() => {
    void loadMonitoring();
    const timer = setInterval(() => {
      void loadMonitoring();
    }, 8000);
    return () => clearInterval(timer);
  }, [alertStatusFilter, alertSeverityFilter]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAlertDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (isDrawerOpen) closeDrawerButtonRef.current?.focus();
  }, [isDrawerOpen]);

  const cards = useMemo(() => {
    if (!metrics) return [];
    return [
      { title: "Total Processed", value: metrics.total_processed.toLocaleString(), detail: "records" },
      { title: "Model Success Rate", value: percent(metrics.model_success_rate), detail: "overall" },
      { title: "Queue Backlog", value: metrics.queue_backlog.toLocaleString(), detail: "pending messages" },
      { title: "Open Alerts", value: metrics.open_alerts.toLocaleString(), detail: "active incidents" }
    ];
  }, [metrics]);

  const selectedHistory = useMemo(() => {
    if (!selectedAlert) return [];
    return [...parseHistory(selectedAlert)].reverse();
  }, [selectedAlert]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(loading && cards.length === 0
          ? [
              { title: "Total Processed", value: "--", detail: "records" },
              { title: "Model Success Rate", value: "--", detail: "overall" },
              { title: "Queue Backlog", value: "--", detail: "pending messages" },
              { title: "Open Alerts", value: "--", detail: "active incidents" }
            ]
          : cards
        ).map((card) => (
          <Panel key={card.title} title={card.title} description={card.detail}>
            <p className="text-3xl font-semibold text-indigo-200">{card.value}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Datasource Metrics" description="success rate and latency">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-textSecondary">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3 font-medium">Datasource</th>
                  <th className="py-2 pr-3 font-medium">Success</th>
                  <th className="py-2 font-medium">Latency (ms)</th>
                </tr>
              </thead>
              <tbody>
                {datasources.map((row) => (
                  <tr key={row.datasource} className="border-b border-white/5">
                    <td className="py-2 pr-3">{row.datasource}</td>
                    <td className="py-2 pr-3 text-emerald-200">{percent(row.success_rate)}</td>
                    <td className="py-2">{row.latency_ms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Model Metrics" description="calls, latency, error rate">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-textSecondary">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3 font-medium">Model</th>
                  <th className="py-2 pr-3 font-medium">Calls</th>
                  <th className="py-2 pr-3 font-medium">Avg Latency</th>
                  <th className="py-2 font-medium">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {models.map((row) => (
                  <tr key={row.model} className="border-b border-white/5">
                    <td className="py-2 pr-3">{row.model}</td>
                    <td className="py-2 pr-3">{row.calls.toLocaleString()}</td>
                    <td className="py-2 pr-3">{row.avg_latency_ms} ms</td>
                    <td className="py-2 text-amber-200">{percent(row.error_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel
        title="Alert Queue"
        description="filter, operate, and trace alert lifecycle"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Select
              value={alertStatusFilter}
              onChange={(value) => setAlertStatusFilter(value as AlertStatusFilter)}
              className="w-[160px]"
              triggerClassName="py-1 text-xs"
              options={[
                { value: "all", label: "status: all" },
                { value: "open", label: "status: open" },
                { value: "ack", label: "status: ack" },
                { value: "resolved", label: "status: resolved" }
              ]}
            />
            <Select
              value={alertSeverityFilter}
              onChange={(value) => setAlertSeverityFilter(value as AlertSeverityFilter)}
              className="w-[170px]"
              triggerClassName="py-1 text-xs"
              options={[
                { value: "all", label: "severity: all" },
                { value: "P1", label: "severity: P1" },
                { value: "P2", label: "severity: P2" },
                { value: "P3", label: "severity: P3" }
              ]}
            />
          </div>
        }
      >
        <div className="space-y-2 text-xs">
          {alerts.length === 0 ? (
            <p className="text-textSecondary">No alerts for current filters.</p>
          ) : (
            alerts.map((alert) => {
              const historyCount = parseHistory(alert).length;
              const busy = actionBusyAlertId === alert.id;
              return (
                <div key={alert.id} className="rounded-lg border border-white/10 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium text-indigo-100">{alert.type}</span>
                    <div className="flex items-center gap-2">
                      <span className={["rounded-full border px-2 py-0.5", severityClass(alert.severity)].join(" ")}>{alert.severity}</span>
                      <span className={["rounded-full border px-2 py-0.5", statusClass(alert.status)].join(" ")}>{alert.status}</span>
                    </div>
                  </div>
                  <p className="text-textSecondary">{alertMessage(alert)}</p>
                  <p className="mt-1 text-[11px] text-textSecondary">created: {fmtTime(alert.created_at)}</p>
                  <p className="mt-1 text-[11px] text-textSecondary">history events: {historyCount}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => void openAlertDrawer(alert.id)}
                      className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-[11px] transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    >
                      Trace
                    </button>
                    {alert.status === "open" ? (
                      <button
                        disabled={busy}
                        onClick={() => void updateAlertStatus(alert.id, "ack")}
                        className="cursor-pointer rounded-lg border border-cyan-400/40 px-2 py-1 text-[11px] text-cyan-200 transition-colors hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                      >
                        {busy ? "Updating..." : "Ack"}
                      </button>
                    ) : null}
                    {alert.status === "open" || alert.status === "ack" ? (
                      <button
                        disabled={busy}
                        onClick={() => void updateAlertStatus(alert.id, "resolve")}
                        className="cursor-pointer rounded-lg border border-emerald-400/40 px-2 py-1 text-[11px] text-emerald-200 transition-colors hover:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                      >
                        {busy ? "Updating..." : "Resolve"}
                      </button>
                    ) : null}
                    {alert.status === "resolved" ? (
                      <button
                        disabled={busy}
                        onClick={() => void updateAlertStatus(alert.id, "reopen")}
                        className="cursor-pointer rounded-lg border border-amber-400/40 px-2 py-1 text-[11px] text-amber-200 transition-colors hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                      >
                        {busy ? "Updating..." : "Reopen"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAlertDrawer();
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-trace-title"
            className="absolute inset-x-0 bottom-0 h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#07090D] p-4 md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-w-lg md:rounded-none md:border-l md:border-t-0"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 id="alert-trace-title" className="text-sm font-semibold">
                Alert Trace
              </h3>
              <button
                ref={closeDrawerButtonRef}
                className="cursor-pointer rounded-lg border border-white/15 px-2 py-1 text-xs transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                onClick={closeAlertDrawer}
              >
                Close
              </button>
            </div>

            {selectedAlert ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-white/10 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-indigo-100">{selectedAlert.type}</p>
                    <div className="flex items-center gap-2">
                      <span className={["rounded-full border px-2 py-0.5", severityClass(selectedAlert.severity)].join(" ")}>
                        {selectedAlert.severity}
                      </span>
                      <span className={["rounded-full border px-2 py-0.5", statusClass(selectedAlert.status)].join(" ")}>
                        {selectedAlert.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-textSecondary">{alertMessage(selectedAlert)}</p>
                  <p className="mt-1 text-[11px] text-textSecondary">created: {fmtTime(selectedAlert.created_at)}</p>
                </div>

                <div className="rounded-lg border border-white/10 p-2">
                  <p className="mb-2 text-[11px] text-textSecondary">Status Timeline</p>
                  {selectedHistory.length === 0 ? (
                    <p className="text-[11px] text-textSecondary">No lifecycle records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedHistory.map((item, index) => (
                        <div key={`${item.action}-${item.at ?? index}`} className="rounded border border-white/10 bg-white/[0.02] p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-2 py-0.5 text-indigo-100">
                              {item.action}
                            </span>
                            <span className="text-[11px] text-textSecondary">{fmtTime(item.at)}</span>
                          </div>
                          <p className="text-[11px] text-textSecondary">
                            {item.from_status ?? "none"} -&gt; {item.to_status ?? "-"} | actor: {item.actor ?? "unknown"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-white/10 p-2">
                  <p className="mb-2 text-[11px] text-textSecondary">Context</p>
                  {detailPairs(selectedAlert).length === 0 ? (
                    <p className="text-[11px] text-textSecondary">No extra detail fields.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailPairs(selectedAlert).map((item) => (
                        <div key={item.key} className="grid grid-cols-[1fr_1.2fr] gap-2 rounded border border-white/10 px-2 py-1">
                          <span className="text-[11px] text-textSecondary">{item.key}</span>
                          <span className="text-[11px]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-textSecondary">Preparing alert trace for #{drawerAlertId}...</p>
            )}

            {alertDrawerLoading ? <p className="mt-3 text-xs text-cyan-200">Loading alert details...</p> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
