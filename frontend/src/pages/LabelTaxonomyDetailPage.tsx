import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import type {
  LabelNodeConfigVersionDiffRecord,
  LabelNodeConfigVersionRecord,
  LabelNodeConfigRecord,
  LabelNodeConfigUpsertPayload,
  LabelNodeExampleCreatePayload,
  LabelNodeExampleRecord,
  LabelNodeExampleUpdatePayload,
  LabelNodeRecord,
  LabelNodeTestRecordPage,
  LabelNodeTestRecord,
  LabelNodeTestResult,
  LabelTaxonomyRecord,
  LabelTaxonomyVersionRecord
} from "../lib/api";
import {
  defaultVersionIdForTaxonomy,
  demoTaxonomies,
  getDemoNodeConfig,
  getDemoNodesByVersion,
  getDemoTaxonomyById,
  getDemoVersionById,
  getDemoVersionsByTaxonomy
} from "./labelTaxonomy.fixtures";
import { TaxonomyNodeConfigEditorSection } from "./TaxonomyNodeConfigEditorSection";
import { TaxonomyNodeExamplesSection } from "./TaxonomyNodeExamplesSection";

type NodeTab = "basic" | "rule-prompt" | "examples" | "testing" | "versions" | "mapping";
type TestRecordQueryOptions = {
  offset?: number;
  hitLabel?: string;
  q?: string;
};

const emptyConfigPayload: LabelNodeConfigUpsertPayload = {
  version: "v1.0",
  promptName: "",
  definition: "",
  decisionRule: "",
  excludeRule: "",
  taggingRule: "",
  systemPrompt: "",
  userPromptTemplate: "",
  outputSchema: "",
  postProcessRule: "",
  fallbackStrategy: "",
  riskNote: "",
  remark: "",
  modelName: "gpt-4.1-mini",
  temperature: 0.1,
  status: "draft"
};

const emptyExampleDraft: LabelNodeExampleCreatePayload = {
  exampleType: "positive",
  content: "",
  expectedLabel: "",
  note: ""
};

const TEST_RECORDS_PAGE_LIMIT = 10;

function configStatusClass(status: LabelNodeRecord["configStatus"]) {
  if (status === "published") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  if (status === "draft") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  if (status === "invalid") return "border-rose-400/40 bg-rose-500/10 text-rose-100";
  return "border-white/15 bg-white/[0.03] text-textSecondary";
}

function toConfigPayload(record: LabelNodeConfigRecord | null): LabelNodeConfigUpsertPayload {
  if (!record) return emptyConfigPayload;
  return {
    version: record.version ?? "v1.0",
    promptName: record.promptName ?? "",
    definition: record.definition ?? "",
    decisionRule: record.decisionRule ?? "",
    excludeRule: record.excludeRule ?? "",
    taggingRule: record.taggingRule ?? "",
    systemPrompt: record.systemPrompt ?? "",
    userPromptTemplate: record.userPromptTemplate ?? "",
    outputSchema: record.outputSchema ?? "",
    postProcessRule: record.postProcessRule ?? "",
    fallbackStrategy: record.fallbackStrategy ?? "",
    riskNote: record.riskNote ?? "",
    remark: record.remark ?? "",
    modelName: record.modelName ?? "gpt-4.1-mini",
    temperature: record.temperature ?? 0.1,
    status: record.status ?? "draft"
  };
}

function diffValueToText(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value || "-";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function hasInvalidCompareSelection(fromVersionId: string, toVersionId: string): boolean {
  return Boolean(fromVersionId && toVersionId && fromVersionId === toVersionId);
}

export function LabelTaxonomyDetailPage() {
  const navigate = useNavigate();
  const { taxonomyId = "", versionId, nodeId } = useParams<{ taxonomyId: string; versionId: string; nodeId?: string }>();

  const [taxonomyOptions, setTaxonomyOptions] = useState<LabelTaxonomyRecord[]>([]);
  const [versionOptions, setVersionOptions] = useState<LabelTaxonomyVersionRecord[]>([]);
  const [taxonomy, setTaxonomy] = useState<LabelTaxonomyRecord | null>(null);
  const [version, setVersion] = useState<LabelTaxonomyVersionRecord | null>(null);
  const [nodes, setNodes] = useState<LabelNodeRecord[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState<NodeTab>("basic");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("Loading taxonomy detail...");

  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<LabelNodeConfigRecord | null>(null);
  const [configDraft, setConfigDraft] = useState<LabelNodeConfigUpsertPayload>(emptyConfigPayload);

  const [examplesLoading, setExamplesLoading] = useState(false);
  const [exampleSaving, setExampleSaving] = useState(false);
  const [examples, setExamples] = useState<LabelNodeExampleRecord[]>([]);
  const [exampleDraft, setExampleDraft] = useState<LabelNodeExampleCreatePayload>(emptyExampleDraft);
  const [editingExampleId, setEditingExampleId] = useState<string | null>(null);
  const [editingExampleDraft, setEditingExampleDraft] = useState<LabelNodeExampleUpdatePayload>(emptyExampleDraft);

  const [testInput, setTestInput] = useState("Appointment delayed twice and nobody follows up.");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<LabelNodeTestResult | null>(null);
  const [testRecordsLoading, setTestRecordsLoading] = useState(false);
  const [testRecords, setTestRecords] = useState<LabelNodeTestRecord[]>([]);
  const [testRecordOffset, setTestRecordOffset] = useState(0);
  const [testRecordTotal, setTestRecordTotal] = useState(0);
  const [testRecordHasMore, setTestRecordHasMore] = useState(false);
  const [testRecordHitLabel, setTestRecordHitLabel] = useState("all");
  const [testRecordKeyword, setTestRecordKeyword] = useState("");

  const [configVersionsLoading, setConfigVersionsLoading] = useState(false);
  const [configVersions, setConfigVersions] = useState<LabelNodeConfigVersionRecord[]>([]);
  const [compareFromVersionId, setCompareFromVersionId] = useState("");
  const [compareToVersionId, setCompareToVersionId] = useState("");
  const [versionDiffLoading, setVersionDiffLoading] = useState(false);
  const [versionDiff, setVersionDiff] = useState<LabelNodeConfigVersionDiffRecord | null>(null);
  const [versionDiffError, setVersionDiffError] = useState("");

  const resolvedVersionId = versionId ?? defaultVersionIdForTaxonomy(taxonomyId);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      try {
        const [taxonomyRows, taxonomyRow, versionRows, versionRow, treeRows] = await Promise.all([
          apiGet<LabelTaxonomyRecord[]>("/label-taxonomies"),
          apiGet<LabelTaxonomyRecord>(`/label-taxonomies/${taxonomyId}`),
          apiGet<LabelTaxonomyVersionRecord[]>(`/label-taxonomies/${taxonomyId}/versions`),
          apiGet<LabelTaxonomyVersionRecord>(`/label-taxonomies/${taxonomyId}/versions/${resolvedVersionId}`),
          apiGet<LabelNodeRecord[]>(`/label-taxonomies/${taxonomyId}/versions/${resolvedVersionId}/tree`)
        ]);
        if (!mounted) return;
        setTaxonomyOptions(taxonomyRows);
        setVersionOptions(versionRows);
        setTaxonomy(taxonomyRow);
        setVersion(versionRow);
        setNodes(treeRows);
        const defaultNodeId = nodeId ?? treeRows[0]?.id ?? null;
        setSelectedNodeId(defaultNodeId);
        setNotice(`Loaded taxonomy ${taxonomyRow.name} / version ${versionRow.version}`);
      } catch {
        if (!mounted) return;
        const fallbackTaxonomy = getDemoTaxonomyById(taxonomyId);
        const fallbackVersion = getDemoVersionById(resolvedVersionId);
        const fallbackNodes = getDemoNodesByVersion(resolvedVersionId);
        setTaxonomyOptions(demoTaxonomies);
        setVersionOptions(getDemoVersionsByTaxonomy(taxonomyId));
        setTaxonomy(fallbackTaxonomy);
        setVersion(fallbackVersion);
        setNodes(fallbackNodes);
        const defaultNodeId = nodeId ?? fallbackNodes[0]?.id ?? null;
        setSelectedNodeId(defaultNodeId);
        setNotice("Backend taxonomy APIs are unavailable. Showing demo data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!taxonomyId) return;
    void loadDetail();
    return () => {
      mounted = false;
    };
  }, [taxonomyId, resolvedVersionId, nodeId]);

  useEffect(() => {
    if (!nodeId) return;
    setSelectedNodeId(nodeId);
  }, [nodeId]);

  const filteredNodes = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return nodes;
    return nodes.filter((item) => [item.name, item.code, item.pathNames.join("/")].some((field) => field.toLowerCase().includes(keyword)));
  }, [nodes, searchText]);

  const selectedNode = useMemo(() => nodes.find((item) => item.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedNodePath = selectedNode?.pathNames.join(" / ") ?? "-";

  const testRecordHitLabelOptions = useMemo(() => {
    const options = new Set<string>(["UNMATCHED"]);
    if (selectedNode?.code) options.add(selectedNode.code);
    for (const item of testRecords) options.add(item.hitLabel);
    return [
      { value: "all", label: "all labels" },
      ...Array.from(options)
        .sort()
        .map((value) => ({ value, label: value }))
    ];
  }, [selectedNode?.code, testRecords]);

  function buildTestRecordPath(nodeId: string, options?: TestRecordQueryOptions) {
    const nextOffset = options?.offset ?? testRecordOffset;
    const nextHitLabel = options?.hitLabel ?? testRecordHitLabel;
    const nextKeyword = options?.q ?? testRecordKeyword;
    const query = new URLSearchParams({
      offset: String(nextOffset),
      limit: String(TEST_RECORDS_PAGE_LIMIT)
    });
    if (nextHitLabel && nextHitLabel !== "all") query.set("hitLabel", nextHitLabel);
    if (nextKeyword.trim()) query.set("q", nextKeyword.trim());
    return `/label-nodes/${nodeId}/test-records?${query.toString()}`;
  }

  async function loadConfigVersionDiff(nodeId: string, fromVersionId: string, toVersionId: string) {
    if (!fromVersionId || !toVersionId || fromVersionId === toVersionId) {
      setVersionDiff(null);
      setVersionDiffError("");
      return;
    }
    setVersionDiffLoading(true);
    setVersionDiffError("");
    try {
      const query = new URLSearchParams({
        fromVersionId,
        toVersionId
      });
      const diff = await apiGet<LabelNodeConfigVersionDiffRecord>(`/label-nodes/${nodeId}/config/versions/compare?${query.toString()}`);
      setVersionDiff(diff);
    } catch {
      setVersionDiff(null);
      setVersionDiffError("Failed to load version diff. Please retry.");
    } finally {
      setVersionDiffLoading(false);
    }
  }

  async function applyVersionCompareDefaults(nodeId: string, rows: LabelNodeConfigVersionRecord[]) {
    setConfigVersions(rows);
    if (rows.length < 2) {
      setCompareFromVersionId("");
      setCompareToVersionId("");
      setVersionDiff(null);
      setVersionDiffError("");
      return;
    }
    const nextToVersionId = rows[0].id;
    const nextFromVersionId = rows.find((item) => item.id !== nextToVersionId)?.id ?? "";
    setCompareFromVersionId(nextFromVersionId);
    setCompareToVersionId(nextToVersionId);
    await loadConfigVersionDiff(nodeId, nextFromVersionId, nextToVersionId);
  }

  async function loadConfigVersions(nodeId: string) {
    setConfigVersionsLoading(true);
    try {
      const rows = await apiGet<LabelNodeConfigVersionRecord[]>(`/label-nodes/${nodeId}/config/versions`);
      await applyVersionCompareDefaults(nodeId, rows);
    } catch {
      setConfigVersions([]);
      setCompareFromVersionId("");
      setCompareToVersionId("");
      setVersionDiff(null);
      setVersionDiffError("");
    } finally {
      setConfigVersionsLoading(false);
    }
  }

  async function loadTestRecords(nodeId: string, options?: TestRecordQueryOptions) {
    const nextOffset = options?.offset ?? testRecordOffset;
    const nextHitLabel = options?.hitLabel ?? testRecordHitLabel;
    const nextKeyword = options?.q ?? testRecordKeyword;
    setTestRecordHitLabel(nextHitLabel);
    setTestRecordKeyword(nextKeyword);
    setTestRecordsLoading(true);
    try {
      const page = await apiGet<LabelNodeTestRecordPage>(buildTestRecordPath(nodeId, options));
      setTestRecords(page.items);
      setTestRecordOffset(page.offset);
      setTestRecordTotal(page.total);
      setTestRecordHasMore(page.hasMore);
    } catch {
      setTestRecords([]);
      setTestRecordOffset(nextOffset);
      setTestRecordTotal(0);
      setTestRecordHasMore(false);
    } finally {
      setTestRecordsLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedNodeId) {
      setNodeConfig(null);
      setConfigDraft(emptyConfigPayload);
      setExamples([]);
      setConfigVersions([]);
      setCompareFromVersionId("");
      setCompareToVersionId("");
      setVersionDiff(null);
      setVersionDiffError("");
      setTestRecords([]);
      setTestRecordOffset(0);
      setTestRecordTotal(0);
      setTestRecordHasMore(false);
      setTestRecordHitLabel("all");
      setTestRecordKeyword("");
      setTestResult(null);
      setEditingExampleId(null);
      setEditingExampleDraft(emptyExampleDraft);
      return;
    }
    const currentNodeId = selectedNodeId;

    let mounted = true;
    async function loadNodeDetails() {
      setConfigLoading(true);
      setExamplesLoading(true);
      setConfigVersionsLoading(true);
      setTestRecordsLoading(true);
      setTestRecordOffset(0);
      setTestRecordTotal(0);
      setTestRecordHasMore(false);
      setTestRecordHitLabel("all");
      setTestRecordKeyword("");
      try {
        const [config, exampleRows, versionRows, testRecordRows] = await Promise.all([
          apiGet<LabelNodeConfigRecord>(`/label-nodes/${currentNodeId}/config`),
          apiGet<LabelNodeExampleRecord[]>(`/label-nodes/${currentNodeId}/examples`),
          apiGet<LabelNodeConfigVersionRecord[]>(`/label-nodes/${currentNodeId}/config/versions`),
          apiGet<LabelNodeTestRecordPage>(buildTestRecordPath(currentNodeId, { offset: 0, hitLabel: "all", q: "" }))
        ]);
        if (!mounted) return;
        setNodeConfig(config);
        setConfigDraft(toConfigPayload(config));
        setExamples(exampleRows);
        await applyVersionCompareDefaults(currentNodeId, versionRows);
        setTestRecords(testRecordRows.items);
        setTestRecordOffset(testRecordRows.offset);
        setTestRecordTotal(testRecordRows.total);
        setTestRecordHasMore(testRecordRows.hasMore);
      } catch {
        if (!mounted) return;
        const fallbackConfig = getDemoNodeConfig(currentNodeId);
        setNodeConfig(fallbackConfig);
        setConfigDraft(toConfigPayload(fallbackConfig));
        setExamples([]);
        setConfigVersions([]);
        setCompareFromVersionId("");
        setCompareToVersionId("");
        setVersionDiff(null);
        setVersionDiffError("");
        setTestRecords([]);
        setTestRecordOffset(0);
        setTestRecordTotal(0);
        setTestRecordHasMore(false);
      } finally {
        if (mounted) {
          setConfigLoading(false);
          setExamplesLoading(false);
          setConfigVersionsLoading(false);
          setTestRecordsLoading(false);
          setTestResult(null);
          setEditingExampleId(null);
          setEditingExampleDraft(emptyExampleDraft);
        }
      }
    }
    void loadNodeDetails();
    return () => {
      mounted = false;
    };
  }, [selectedNodeId]);

  function selectNode(nextNodeId: string) {
    setSelectedNodeId(nextNodeId);
    if (!taxonomyId || !resolvedVersionId) return;
    navigate(`/label-taxonomies/${taxonomyId}/version/${resolvedVersionId}/node/${nextNodeId}`);
  }

  function switchTaxonomy(nextTaxonomyId: string) {
    const nextTaxonomy = taxonomyOptions.find((item) => item.id === nextTaxonomyId) ?? null;
    const nextVersionId = nextTaxonomy?.currentVersionId ?? defaultVersionIdForTaxonomy(nextTaxonomyId);
    navigate(`/label-taxonomies/${nextTaxonomyId}/version/${nextVersionId}`);
  }

  function switchVersion(nextVersionId: string) {
    if (!taxonomyId) return;
    navigate(`/label-taxonomies/${taxonomyId}/version/${nextVersionId}`);
  }

  async function saveConfig(nextStatus?: LabelNodeConfigUpsertPayload["status"]) {
    if (!selectedNodeId) return;
    const payload = {
      ...configDraft,
      status: nextStatus ?? configDraft.status
    };
    setConfigSaving(true);
    try {
      const updated = await apiPut<LabelNodeConfigRecord>(`/label-nodes/${selectedNodeId}/config`, payload);
      setNodeConfig(updated);
      setConfigDraft(toConfigPayload(updated));
      setNodes((prev) =>
        prev.map((item) =>
          item.id === selectedNodeId
            ? {
                ...item,
                hasConfig: true,
                configStatus: updated.status
              }
            : item
        )
      );
      await loadConfigVersions(selectedNodeId);
      setNotice(`Saved node config for ${selectedNodeId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save node config");
    } finally {
      setConfigSaving(false);
    }
  }

  async function addExample() {
    if (!selectedNodeId) return;
    if (!exampleDraft.content.trim()) {
      setNotice("Example content is required.");
      return;
    }
    setExampleSaving(true);
    try {
      const created = await apiPost<LabelNodeExampleRecord>(`/label-nodes/${selectedNodeId}/examples`, {
        ...exampleDraft,
        content: exampleDraft.content.trim(),
        expectedLabel: exampleDraft.expectedLabel.trim(),
        note: exampleDraft.note.trim()
      });
      setExamples((prev) => [created, ...prev]);
      setNodes((prev) =>
        prev.map((item) =>
          item.id === selectedNodeId
            ? {
                ...item,
                hasExamples: true
              }
            : item
        )
      );
      setExampleDraft(emptyExampleDraft);
      setNotice(`Added example to node ${selectedNodeId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to add example");
    } finally {
      setExampleSaving(false);
    }
  }

  function startEditExample(item: LabelNodeExampleRecord) {
    setEditingExampleId(item.id);
    setEditingExampleDraft({
      exampleType: item.exampleType,
      content: item.content,
      expectedLabel: item.expectedLabel,
      note: item.note
    });
  }

  function cancelEditExample() {
    setEditingExampleId(null);
    setEditingExampleDraft(emptyExampleDraft);
  }

  async function saveEditedExample(exampleId: string) {
    if (!selectedNodeId) return;
    if (!editingExampleDraft.content.trim()) {
      setNotice("Example content is required.");
      return;
    }
    setExampleSaving(true);
    try {
      const updated = await apiPut<LabelNodeExampleRecord>(`/label-nodes/${selectedNodeId}/examples/${exampleId}`, {
        ...editingExampleDraft,
        content: editingExampleDraft.content.trim(),
        expectedLabel: editingExampleDraft.expectedLabel.trim(),
        note: editingExampleDraft.note.trim()
      });
      setExamples((prev) => prev.map((item) => (item.id === exampleId ? updated : item)));
      cancelEditExample();
      setNotice(`Updated example ${exampleId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to update example");
    } finally {
      setExampleSaving(false);
    }
  }

  async function removeExample(exampleId: string) {
    if (!selectedNodeId) return;
    setExampleSaving(true);
    try {
      await apiDelete<{ status: string; exampleId: string }>(`/label-nodes/${selectedNodeId}/examples/${exampleId}`);
      let remainingCount = 0;
      setExamples((prev) => {
        const remaining = prev.filter((item) => item.id !== exampleId);
        remainingCount = remaining.length;
        return remaining;
      });
      setNodes((prev) =>
        prev.map((item) =>
          item.id === selectedNodeId
            ? {
                ...item,
                hasExamples: remainingCount > 0
              }
            : item
        )
      );
      if (editingExampleId === exampleId) cancelEditExample();
      setNotice(`Deleted example ${exampleId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to delete example");
    } finally {
      setExampleSaving(false);
    }
  }

  async function runNodeTest() {
    if (!selectedNodeId) return;
    if (!testInput.trim()) {
      setNotice("Testing input is required.");
      return;
    }
    setTestRunning(true);
    try {
      const result = await apiPost<LabelNodeTestResult>(`/label-nodes/${selectedNodeId}/test`, { contentText: testInput.trim() });
      setTestResult(result);
      await loadTestRecords(selectedNodeId, { offset: 0 });
      setNotice(`Test completed: ${result.hitLabel} (${Math.round(result.confidence * 100)}%)`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Node test failed");
    } finally {
      setTestRunning(false);
    }
  }

  async function compareSelectedVersions() {
    if (!selectedNodeId) return;
    await loadConfigVersionDiff(selectedNodeId, compareFromVersionId, compareToVersionId);
  }

  async function applyTestRecordFilters() {
    if (!selectedNodeId) return;
    await loadTestRecords(selectedNodeId, {
      offset: 0,
      hitLabel: testRecordHitLabel,
      q: testRecordKeyword
    });
  }

  async function resetTestRecordFilters() {
    if (!selectedNodeId) return;
    await loadTestRecords(selectedNodeId, { offset: 0, hitLabel: "all", q: "" });
  }

  async function goToPreviousTestRecordPage() {
    if (!selectedNodeId) return;
    const nextOffset = Math.max(0, testRecordOffset - TEST_RECORDS_PAGE_LIMIT);
    await loadTestRecords(selectedNodeId, { offset: nextOffset });
  }

  async function goToNextTestRecordPage() {
    if (!selectedNodeId || !testRecordHasMore) return;
    const nextOffset = testRecordOffset + TEST_RECORDS_PAGE_LIMIT;
    await loadTestRecords(selectedNodeId, { offset: nextOffset });
  }

  const compareSelectionInvalid = hasInvalidCompareSelection(compareFromVersionId, compareToVersionId);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <Panel
        title={taxonomy?.name ?? "Label Taxonomy Detail"}
        description={`${taxonomy?.code ?? "-"} | version ${version?.version ?? "-"} | selected path: ${selectedNodePath}`}
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-indigo-400/45 px-3 py-1 text-xs text-indigo-100 transition-colors hover:border-indigo-300/65"
            >
              Save Draft
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-emerald-400/45 px-3 py-1 text-xs text-emerald-100 transition-colors hover:border-emerald-300/65"
            >
              Publish Version
            </button>
            <button
              type="button"
              onClick={() => navigate("/label-taxonomies")}
              className="cursor-pointer rounded-lg border border-white/20 px-3 py-1 text-xs text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary"
            >
              Back To List
            </button>
          </div>
        }
      >
        {loading ? <p className="text-sm text-textSecondary">Loading taxonomy detail...</p> : null}

        {!loading ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Taxonomy Switcher</span>
                <Select
                  value={taxonomyId}
                  onChange={switchTaxonomy}
                  options={taxonomyOptions.map((item) => ({
                    value: item.id,
                    label: `${item.name} (${item.code})`
                  }))}
                />
              </label>
              <label className="space-y-1 text-xs text-textSecondary">
                <span>Version Switcher</span>
                <Select
                  value={resolvedVersionId}
                  onChange={switchVersion}
                  options={versionOptions.map((item) => ({
                    value: item.id,
                    label: `${item.version} [${item.status}]`
                  }))}
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <section className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-3 space-y-2">
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search node name / code..."
                    className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
                  />
                  <p className="text-xs text-textSecondary">
                    Node count: {nodes.length} | Showing: {filteredNodes.length}
                  </p>
                </div>

                <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
                  {filteredNodes.map((item) => {
                    const active = selectedNodeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectNode(item.id)}
                        className={[
                          "w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                          active ? "border-indigo-400/45 bg-indigo-500/15" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                        ].join(" ")}
                        style={{ marginLeft: `${Math.max(0, item.level - 1) * 10}px`, width: `calc(100% - ${Math.max(0, item.level - 1) * 10}px)` }}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-indigo-100">{item.name}</p>
                          <span className={["rounded-full border px-2 py-0.5 text-[11px]", configStatusClass(item.configStatus)].join(" ")}>
                            {item.configStatus ?? "empty"}
                          </span>
                        </div>
                        <p className="text-xs text-textSecondary">{item.code}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                {selectedNode ? (
                  <Tabs value={selectedTab} onValueChange={(nextValue) => setSelectedTab(nextValue as NodeTab)}>
                    <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">
                      Node: {selectedNode.name} ({selectedNode.code}) | Level L{selectedNode.level} | Status {selectedNode.status}
                    </div>

                    <TabsList>
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="rule-prompt">Rule & Prompt</TabsTrigger>
                      <TabsTrigger value="examples">Examples</TabsTrigger>
                      <TabsTrigger value="testing">Testing</TabsTrigger>
                      <TabsTrigger value="versions">Versions</TabsTrigger>
                      <TabsTrigger value="mapping">Mapping</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1 text-xs text-textSecondary">
                          <span>Node Name</span>
                          <input
                            defaultValue={selectedNode.name}
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                          />
                        </label>
                        <label className="space-y-1 text-xs text-textSecondary">
                          <span>Node Code</span>
                          <input
                            defaultValue={selectedNode.code}
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                          />
                        </label>
                      </div>
                    </TabsContent>

                    <TabsContent value="rule-prompt" className="space-y-3">
                      <TaxonomyNodeConfigEditorSection
                        configLoading={configLoading}
                        configSaving={configSaving}
                        configDraft={configDraft}
                        currentStatus={nodeConfig?.status ?? configDraft.status}
                        onConfigDraftChange={setConfigDraft}
                        onSaveConfig={(status) => void saveConfig(status)}
                      />
                    </TabsContent>

                    <TabsContent value="examples" className="space-y-3">
                      <TaxonomyNodeExamplesSection
                        examplesLoading={examplesLoading}
                        exampleSaving={exampleSaving}
                        examples={examples}
                        exampleDraft={exampleDraft}
                        editingExampleId={editingExampleId}
                        editingExampleDraft={editingExampleDraft}
                        onExampleDraftChange={setExampleDraft}
                        onEditingExampleDraftChange={setEditingExampleDraft}
                        onAddExample={() => void addExample()}
                        onStartEditExample={startEditExample}
                        onCancelEditExample={cancelEditExample}
                        onSaveEditedExample={(exampleId) => void saveEditedExample(exampleId)}
                        onRemoveExample={(exampleId) => void removeExample(exampleId)}
                      />
                    </TabsContent>

                    <TabsContent value="testing" className="space-y-3">
                      <div className="grid gap-3 xl:grid-cols-2">
                        <section className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-textSecondary">Debug Console</p>
                            <p className="text-[11px] text-textSecondary">Run one-shot inference and inspect model outputs before release.</p>
                          </div>
                          <label className="space-y-1 text-xs text-textSecondary">
                            <span>Testing Input</span>
                            <Textarea rows={4} value={testInput} onChange={(event) => setTestInput(event.target.value)} />
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={testRunning}
                              onClick={() => void runNodeTest()}
                              className="cursor-pointer rounded-lg border border-cyan-400/45 px-3 py-1.5 text-xs text-cyan-100 transition-colors hover:border-cyan-300/65 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {testRunning ? "Running..." : "Run Test"}
                            </button>
                          </div>

                          {testResult ? (
                            <div className="space-y-2 rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-textSecondary">
                              <p>
                                hitLabel: <span className="text-textPrimary">{testResult.hitLabel}</span>
                              </p>
                              <p>
                                confidence: <span className="text-textPrimary">{testResult.confidence}</span> | latency:{" "}
                                <span className="text-textPrimary">{testResult.latency}ms</span>
                              </p>
                              <p>
                                errorMessage: <span className="text-textPrimary">{testResult.errorMessage ?? "-"}</span>
                              </p>
                              <div>
                                <p className="mb-1">parsedOutput:</p>
                                <pre className="overflow-auto rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textPrimary">
                                  {JSON.stringify(testResult.parsedOutput, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="mb-1">rawOutput:</p>
                                <pre className="overflow-auto rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textPrimary">
                                  {testResult.rawOutput}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-white/20 p-3 text-xs text-textSecondary">
                              Run test to view rawOutput / parsedOutput / hitLabel / confidence / latency / errorMessage.
                            </div>
                          )}
                        </section>

                        <section className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-textSecondary">Record Explorer</p>
                            <p className="text-[11px] text-textSecondary">Filter and paginate historical test records for quick regression checks.</p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <p className="mb-2 text-xs text-textSecondary">Record Filters</p>
                            <div className="grid gap-2 md:grid-cols-[180px_1fr_auto_auto]">
                              <Select value={testRecordHitLabel} onChange={setTestRecordHitLabel} options={testRecordHitLabelOptions} />
                              <input
                                value={testRecordKeyword}
                                onChange={(event) => setTestRecordKeyword(event.target.value)}
                                placeholder="Search input / label / output..."
                                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
                              />
                              <button
                                type="button"
                                disabled={testRecordsLoading}
                                onClick={() => void applyTestRecordFilters()}
                                className="cursor-pointer rounded-lg border border-indigo-400/45 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                disabled={testRecordsLoading}
                                onClick={() => void resetTestRecordFilters()}
                                className="cursor-pointer rounded-lg border border-white/20 px-3 py-1.5 text-xs text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reset
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-textSecondary">Recent Test Records</p>
                              <p className="text-[11px] text-textSecondary">
                                Showing {testRecordTotal === 0 ? 0 : testRecordOffset + 1}-{testRecordOffset + testRecords.length} / {testRecordTotal}
                              </p>
                            </div>
                            {testRecordsLoading ? <p className="text-xs text-textSecondary">Loading test records...</p> : null}
                            {!testRecordsLoading && testRecords.length === 0 ? (
                              <p className="text-xs text-textSecondary">No test records yet.</p>
                            ) : null}
                            <div className="space-y-2">
                              {testRecords.map((record) => (
                                <article key={record.id} className="rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textSecondary">
                                  <p>
                                    <span className="text-textPrimary">{record.hitLabel}</span> | confidence {record.confidence} | latency {record.latency}ms
                                  </p>
                                  <p>input: {record.inputText}</p>
                                  <p>at: {record.createdAt}</p>
                                </article>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={testRecordsLoading || testRecordOffset <= 0}
                                onClick={() => void goToPreviousTestRecordPage()}
                                className="cursor-pointer rounded-md border border-white/20 px-2.5 py-1 text-[11px] text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                disabled={testRecordsLoading || !testRecordHasMore}
                                onClick={() => void goToNextTestRecordPage()}
                                className="cursor-pointer rounded-md border border-indigo-400/45 px-2.5 py-1 text-[11px] text-indigo-100 transition-colors hover:border-indigo-300/65 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    <TabsContent value="versions" className="space-y-3">
                      {configVersionsLoading ? <p className="text-xs text-textSecondary">Loading config versions...</p> : null}
                      {!configVersionsLoading && configVersions.length === 0 ? (
                        <p className="text-sm text-textSecondary">No config versions yet.</p>
                      ) : null}
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
                        <section className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-textSecondary">Compare Workspace</p>
                            <p className="text-[11px] text-textSecondary">Validate field-level changes before promoting a config version.</p>
                          </div>
                          {configVersions.length >= 2 ? (
                            <>
                              <p className="text-xs text-textSecondary">Compare Config Versions</p>
                              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                <label className="space-y-1 text-xs text-textSecondary">
                                  <span>From</span>
                                  <Select
                                    value={compareFromVersionId}
                                    onChange={setCompareFromVersionId}
                                    ariaLabel="Compare from version"
                                    options={configVersions.map((item) => ({
                                      value: item.id,
                                      label: `${item.configVersion} | ${item.status}`
                                    }))}
                                  />
                                </label>
                                <label className="space-y-1 text-xs text-textSecondary">
                                  <span>To</span>
                                  <Select
                                    value={compareToVersionId}
                                    onChange={setCompareToVersionId}
                                    ariaLabel="Compare to version"
                                    options={configVersions.map((item) => ({
                                      value: item.id,
                                      label: `${item.configVersion} | ${item.status}`
                                    }))}
                                  />
                                </label>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    disabled={versionDiffLoading || !compareFromVersionId || !compareToVersionId || compareSelectionInvalid}
                                    onClick={() => void compareSelectedVersions()}
                                    className="cursor-pointer rounded-lg border border-cyan-400/45 px-3 py-1.5 text-xs text-cyan-100 transition-colors hover:border-cyan-300/65 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Compare
                                  </button>
                                </div>
                              </div>
                              {versionDiffLoading ? <p className="text-xs text-textSecondary">Loading version diff...</p> : null}
                              {!versionDiffLoading && compareSelectionInvalid ? (
                                <p className="text-xs text-amber-200">Please select two different versions to compare.</p>
                              ) : null}
                              {!versionDiffLoading && versionDiffError ? <p className="text-xs text-rose-200">{versionDiffError}</p> : null}
                              {!versionDiffLoading && versionDiff && versionDiff.changes.length === 0 ? (
                                <p className="text-xs text-textSecondary">No field differences found.</p>
                              ) : null}
                              {!versionDiffLoading && versionDiff && versionDiff.changes.length > 0 ? (
                                <div className="space-y-1">
                                  {versionDiff.changes.map((item) => (
                                    <article key={item.field} className="rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textSecondary">
                                      <p className="text-textPrimary">{item.field}</p>
                                      <p>from: {diffValueToText(item.fromValue)}</p>
                                      <p>to: {diffValueToText(item.toValue)}</p>
                                    </article>
                                  ))}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <p className="text-xs text-textSecondary">At least 2 config versions are required before compare is available.</p>
                          )}
                        </section>

                        <section className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-textSecondary">Version Timeline</p>
                            <p className="text-[11px] text-textSecondary">Browse snapshot history with status and payload details.</p>
                          </div>
                          <div className="space-y-2">
                            {configVersions.map((versionRow) => (
                              <article key={versionRow.id} className="rounded-md border border-white/10 bg-black/20 p-3 text-xs text-textSecondary">
                                <p>
                                  version: <span className="text-textPrimary">{versionRow.configVersion}</span> | status:{" "}
                                  <span className="text-textPrimary">{versionRow.status}</span>
                                </p>
                                <p>createdAt: {versionRow.createdAt}</p>
                                <pre className="mt-2 overflow-auto rounded-md border border-white/10 bg-black/25 p-2 text-[11px] text-textPrimary">
                                  {JSON.stringify(versionRow.snapshot, null, 2)}
                                </pre>
                              </article>
                            ))}
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    <TabsContent value="mapping" className="space-y-3">
                      <p className="text-sm text-textSecondary">Mapping and extension placeholder for external system compatibility.</p>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <p className="text-sm text-textSecondary">No node found under current version. Create or import nodes first.</p>
                )}
              </section>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
