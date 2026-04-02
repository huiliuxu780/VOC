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

export async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE"
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

export type PipelineNodeConfig = {
  key: string;
  enabled: boolean;
  model: string;
  prompt_version: string;
};

export type JobPipelineConfig = {
  job_id: number;
  nodes: PipelineNodeConfig[];
};

export type JobPipelineUpdatePayload = {
  nodes: PipelineNodeConfig[];
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

export type MonitoringAlertHistoryItem = {
  action: string;
  from_status?: string | null;
  to_status?: string;
  actor?: string;
  at?: string;
};

export type MonitoringAlertDetail = {
  message?: string;
  history?: MonitoringAlertHistoryItem[];
  [key: string]: unknown;
};

export type MonitoringAlertRecord = {
  id: number;
  severity: string;
  type: string;
  status: string;
  detail?: MonitoringAlertDetail;
  created_at?: string;
};

export type MonitoringTrendPoint = {
  t: string;
  run: number;
};

export type PromptRecord = {
  id: number;
  label_node_id: number;
  name: string;
  version: string;
  status: string;
  system_prompt: string;
  user_prompt_template: string;
};

export type PromptUpsertPayload = {
  label_node_id: number;
  name: string;
  version: string;
  status?: string;
  system_prompt: string;
  user_prompt_template: string;
};

export type PromptTestResponse = {
  prompt_id: number;
  prompt_name: string;
  prompt_version: string;
  input: Record<string, unknown>;
  output: {
    label: string;
    score: number;
    reason: string;
  };
};

export type LabelRecord = {
  id: number;
  category_id: number;
  parent_id: number | null;
  level: number;
  name: string;
  code: string;
  is_leaf: boolean;
  llm_enabled: boolean;
  default_prompt_version: string;
};

export type LabelUpsertPayload = {
  category_id: number;
  parent_id: number | null;
  level: number;
  name: string;
  code: string;
  is_leaf: boolean;
  llm_enabled: boolean;
  default_prompt_version: string;
};

export type TaxonomyStatus = "draft" | "published" | "archived";

export type LabelTaxonomyRecord = {
  id: string;
  name: string;
  code: string;
  description?: string;
  businessScope: string[];
  categoryScope: string[];
  owner?: string;
  status: TaxonomyStatus;
  currentVersionId?: string;
  nodeCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type LabelTaxonomyVersionRecord = {
  id: string;
  taxonomyId: string;
  version: string;
  status: TaxonomyStatus;
  changeLog?: string;
  nodeCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type LabelNodeRecord = {
  id: string;
  taxonomyVersionId: string;
  parentId: string | null;
  name: string;
  code: string;
  level: number;
  pathNames: string[];
  pathIds: string[];
  isLeaf: boolean;
  llmEnabled: boolean;
  sortOrder: number;
  status: "enabled" | "disabled";
  categoryScope?: string[];
  businessScope?: string[];
  remark?: string;
  hasConfig?: boolean;
  hasExamples?: boolean;
  configStatus?: "empty" | "draft" | "published" | "invalid";
  createdAt: string;
  updatedAt: string;
};

export type LabelNodeConfigRecord = {
  id: string;
  labelNodeId: string;
  version: string;
  promptName?: string;
  definition?: string;
  decisionRule?: string;
  excludeRule?: string;
  taggingRule?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  outputSchema?: string;
  postProcessRule?: string;
  fallbackStrategy?: string;
  riskNote?: string;
  remark?: string;
  modelName?: string;
  temperature?: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type LabelNodeConfigUpsertPayload = {
  version: string;
  promptName: string;
  definition: string;
  decisionRule: string;
  excludeRule: string;
  taggingRule: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema: string;
  postProcessRule: string;
  fallbackStrategy: string;
  riskNote: string;
  remark: string;
  modelName: string;
  temperature: number;
  status: "draft" | "published";
};

export type LabelNodeExampleRecord = {
  id: string;
  labelNodeId: string;
  exampleType: "positive" | "negative" | "boundary" | "counter";
  content: string;
  expectedLabel: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type LabelNodeExampleCreatePayload = {
  exampleType: "positive" | "negative" | "boundary" | "counter";
  content: string;
  expectedLabel: string;
  note: string;
};

export type LabelNodeTestPayload = {
  contentText: string;
};

export type LabelNodeTestResult = {
  nodeId: string;
  rawOutput: string;
  parsedOutput: Record<string, unknown>;
  hitLabel: string;
  confidence: number;
  latency: number;
  errorMessage?: string | null;
};
