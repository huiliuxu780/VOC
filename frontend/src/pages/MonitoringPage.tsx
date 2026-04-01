import { useEffect, useMemo, useState } from "react";
import { Panel } from "../components/ui/Panel";
import {
  apiGet,
  apiPost,
  MonitoringAlertRecord,
  MonitoringDashboardMetrics,
  MonitoringDatasourceMetric,
  MonitoringModelMetric
} from "../lib/api";

function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function severityClass(severity: string) {
  if (severity === "P1") return "text-rose-200 border-rose-400/40 bg-rose-500/10";
  if (severity === "P2") return "text-amber-200 border-amber-400/40 bg-amber-500/10";
  return "text-cyan-200 border-cyan-400/40 bg-cyan-500/10";
}

function fmtTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function alertMessage(alert: MonitoringAlertRecord) {
  const message = alert.detail?.message;
  return typeof message === "string" ? message : "No detail";
}

type AlertStatusFilter = "all" | "open" | "ack" | "resolved";
type AlertSeverityFilter = "all" | "P1" | "P2" | "P3";

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

  async function updateAlertStatus(alertId: number, action: "ack" | "resolve") {
    setActionBusyAlertId(alertId);
    try {
      const result = await apiPost<MonitoringAlertRecord>(`/monitoring/alerts/${alertId}/${action}`);
      setNotice(`Alert #${result.id} updated to ${result.status}`);
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

  const cards = useMemo(() => {
    if (!metrics) return [];
    return [
      { title: "Total Processed", value: metrics.total_processed.toLocaleString(), detail: "records" },
      { title: "Model Success Rate", value: percent(metrics.model_success_rate), detail: "overall" },
      { title: "Queue Backlog", value: metrics.queue_backlog.toLocaleString(), detail: "pending messages" },
      { title: "Open Alerts", value: metrics.open_alerts.toLocaleString(), detail: "active incidents" }
    ];
  }, [metrics]);

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
        description="filter and operate active alerts"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={alertStatusFilter}
              onChange={(e) => setAlertStatusFilter(e.target.value as AlertStatusFilter)}
              className="rounded-lg border border-white/15 bg-black/20 px-2 py-1"
            >
              <option value="all">status: all</option>
              <option value="open">status: open</option>
              <option value="ack">status: ack</option>
              <option value="resolved">status: resolved</option>
            </select>
            <select
              value={alertSeverityFilter}
              onChange={(e) => setAlertSeverityFilter(e.target.value as AlertSeverityFilter)}
              className="rounded-lg border border-white/15 bg-black/20 px-2 py-1"
            >
              <option value="all">severity: all</option>
              <option value="P1">severity: P1</option>
              <option value="P2">severity: P2</option>
              <option value="P3">severity: P3</option>
            </select>
          </div>
        }
      >
        <div className="space-y-2 text-xs">
          {alerts.length === 0 ? (
            <p className="text-textSecondary">No alerts for current filters.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-white/10 px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium text-indigo-100">{alert.type}</span>
                  <div className="flex items-center gap-2">
                    <span className={["rounded-full border px-2 py-0.5", severityClass(alert.severity)].join(" ")}>{alert.severity}</span>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-textSecondary">{alert.status}</span>
                  </div>
                </div>
                <p className="text-textSecondary">{alertMessage(alert)}</p>
                <p className="mt-1 text-[11px] text-textSecondary">created: {fmtTime(alert.created_at)}</p>
                <div className="mt-2 flex gap-2">
                  {(alert.status === "open" || alert.status === "ack") && (
                    <button
                      disabled={actionBusyAlertId === alert.id || alert.status === "ack"}
                      onClick={() => void updateAlertStatus(alert.id, "ack")}
                      className="cursor-pointer rounded-lg border border-cyan-400/40 px-2 py-1 text-[11px] text-cyan-200 transition-colors hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionBusyAlertId === alert.id ? "Updating..." : "Ack"}
                    </button>
                  )}
                  {(alert.status === "open" || alert.status === "ack") && (
                    <button
                      disabled={actionBusyAlertId === alert.id}
                      onClick={() => void updateAlertStatus(alert.id, "resolve")}
                      className="cursor-pointer rounded-lg border border-emerald-400/40 px-2 py-1 text-[11px] text-emerald-200 transition-colors hover:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionBusyAlertId === alert.id ? "Updating..." : "Resolve"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
