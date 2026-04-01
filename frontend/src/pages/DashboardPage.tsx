import { useEffect, useMemo, useState } from "react";
import { Activity, Cpu, Database, Siren } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "../components/ui/KpiCard";
import { Panel } from "../components/ui/Panel";
import {
  apiGet,
  MonitoringAlertRecord,
  MonitoringDashboardMetrics,
  MonitoringDatasourceMetric,
  MonitoringModelMetric,
  MonitoringTrendPoint
} from "../lib/api";

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function healthBadge(status: "healthy" | "watch", label: string) {
  if (status === "healthy") return <b className="text-emerald-300">{label}</b>;
  return <b className="text-amber-300">{label}</b>;
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<MonitoringDashboardMetrics | null>(null);
  const [trend, setTrend] = useState<MonitoringTrendPoint[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlertRecord[]>([]);
  const [datasources, setDatasources] = useState<MonitoringDatasourceMetric[]>([]);
  const [models, setModels] = useState<MonitoringModelMetric[]>([]);
  const [notice, setNotice] = useState("Dashboard refreshes every 8 seconds.");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const [dashboardResult, trendResult, alertResult, datasourceResult, modelResult] = await Promise.all([
        apiGet<MonitoringDashboardMetrics>("/monitoring/dashboard"),
        apiGet<MonitoringTrendPoint[]>("/monitoring/trend"),
        apiGet<MonitoringAlertRecord[]>("/monitoring/alerts"),
        apiGet<MonitoringDatasourceMetric[]>("/monitoring/datasources"),
        apiGet<MonitoringModelMetric[]>("/monitoring/models")
      ]);
      setMetrics(dashboardResult);
      setTrend(trendResult);
      setAlerts(alertResult);
      setDatasources(datasourceResult);
      setModels(modelResult);
      setNotice("Dashboard refreshes every 8 seconds.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    const timer = setInterval(() => {
      void loadDashboard();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const cards = useMemo(() => {
    if (!metrics) {
      return [
        { label: "Total Processed", value: "--", trend: "records" },
        { label: "Model Success Rate", value: "--", trend: "error rate --" },
        { label: "Queue Backlog", value: "--", trend: "pending queue" },
        { label: "Open Alerts", value: "--", trend: "P1/P2/P3" }
      ];
    }
    return [
      { label: "Total Processed", value: metrics.total_processed.toLocaleString(), trend: "records" },
      {
        label: "Model Success Rate",
        value: percent(metrics.model_success_rate),
        trend: `error rate ${percent(1 - metrics.model_success_rate)}`
      },
      { label: "Queue Backlog", value: metrics.queue_backlog.toLocaleString(), trend: "pending queue" },
      { label: "Open Alerts", value: metrics.open_alerts.toLocaleString(), trend: "active incidents" }
    ];
  }, [metrics]);

  const datasourceHealthy = useMemo(
    () => datasources.length > 0 && datasources.every((item) => item.success_rate >= 0.97),
    [datasources]
  );
  const modelHealthy = useMemo(
    () => models.length > 0 && models.every((item) => item.error_rate <= 0.03),
    [models]
  );
  const hasP1Open = useMemo(
    () => alerts.some((alert) => alert.severity === "P1" && alert.status === "open"),
    [alerts]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">
        {loading ? "Loading dashboard..." : notice}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.label} label={card.label} value={card.value} trend={card.trend} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Platform Throughput Trend"
          description="Hourly run throughput from monitoring API"
          rightSlot={<Activity size={16} className="text-indigo-300" />}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="t" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(255,255,255,0.12)" }} />
                <Line dataKey="run" stroke="#7B6DFF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="System Health" description="Core path and service states">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-white/10 p-3">
              <span className="inline-flex items-center gap-2">
                <Database size={14} /> Data Ingestion
              </span>
              {healthBadge(datasourceHealthy ? "healthy" : "watch", datasourceHealthy ? "Healthy" : "Watch")}
            </li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 p-3">
              <span className="inline-flex items-center gap-2">
                <Cpu size={14} /> Model Service
              </span>
              {healthBadge(modelHealthy ? "healthy" : "watch", modelHealthy ? "Stable" : "Watch")}
            </li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 p-3">
              <span className="inline-flex items-center gap-2">
                <Siren size={14} /> Alert Center
              </span>
              {healthBadge(hasP1Open ? "watch" : "healthy", hasP1Open ? "Watch" : "Healthy")}
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
