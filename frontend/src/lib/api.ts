const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined
  });
  return parseResponse<T>(response);
}

export type DataSource = {
  id: number;
  name: string;
  code: string;
  source_type: string;
  owner: string;
  enabled: boolean;
};

export type Job = {
  id: number;
  name: string;
  code: string;
  job_type: string;
  datasource_id: number;
  schedule_expr: string;
  output_type: string;
  enabled: boolean;
};

export type JobRun = {
  run_id: string;
  status: string;
  success_count: number;
  failed_count: number;
  started_at?: string | null;
  ended_at?: string | null;
};

export type JobStage = {
  stage_name: string;
  status: string;
  duration_ms: number;
};

export type RetryResult = {
  old_run_id: string;
  new_run_id: string;
  status: string;
};

export type RunFailure = {
  record_id: string;
  error_type: string;
  category: string;
  node: string;
  detail: string;
  input_payload?: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  retry_status?: string;
  retry_run_id?: string | null;
};

export type RunFailureSummary = {
  total: number;
  by_category: Record<string, number>;
};

export type FailureNodeStat = {
  node: string;
  count: number;
};

export type PagedRunFailures = {
  items: RunFailure[];
  total: number;
  offset: number;
  limit: number;
};

export type RetrySingleFailureResult = {
  run_id: string;
  record_id: string;
  retry_run_id: string;
  status: string;
};

export type RunFailureDetailResponse = RunFailure & {
  stage_timeline: Array<{
    stage_name: string;
    status: string;
    duration_ms: number;
    input_payload: Record<string, unknown>;
    output_payload: Record<string, unknown>;
  }>;
};

export type MonitoringDashboardMetrics = {
  total_processed: number;
  model_success_rate: number;
  queue_backlog: number;
  open_alerts: number;
};

export type MonitoringDatasourceMetric = {
  datasource: string;
  success_rate: number;
  latency_ms: number;
};

export type MonitoringModelMetric = {
  model: string;
  calls: number;
  avg_latency_ms: number;
  error_rate: number;
};

export type MonitoringAlertRecord = {
  severity: string;
  type: string;
  status: string;
};

export type MonitoringTrendPoint = {
  t: string;
  run: number;
};
