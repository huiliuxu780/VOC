import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { apiGet } from "../lib/api";
import type { LabelNodeConfigRecord, LabelNodeRecord, LabelTaxonomyRecord, LabelTaxonomyVersionRecord } from "../lib/api";
import {
  defaultVersionIdForTaxonomy,
  demoTaxonomies,
  getDemoNodeConfig,
  getDemoNodesByVersion,
  getDemoTaxonomyById,
  getDemoVersionById,
  getDemoVersionsByTaxonomy
} from "./labelTaxonomy.fixtures";

type NodeTab = "basic" | "rule-prompt" | "examples" | "testing" | "versions" | "mapping";

function configStatusClass(status: LabelNodeRecord["configStatus"]) {
  if (status === "published") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  if (status === "draft") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  if (status === "invalid") return "border-rose-400/40 bg-rose-500/10 text-rose-100";
  return "border-white/15 bg-white/[0.03] text-textSecondary";
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
  const selectedNodeConfig: LabelNodeConfigRecord | null = useMemo(
    () => (selectedNode ? getDemoNodeConfig(selectedNode.id) : null),
    [selectedNode]
  );
  const selectedNodePath = selectedNode?.pathNames.join(" / ") ?? "-";

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
                      <label className="space-y-1 text-xs text-textSecondary">
                        <span>Definition</span>
                        <Textarea rows={3} defaultValue={selectedNodeConfig?.definition ?? "Fill node definition..."} />
                      </label>
                      <label className="space-y-1 text-xs text-textSecondary">
                        <span>Decision Rule</span>
                        <Textarea rows={3} defaultValue={selectedNodeConfig?.decisionRule ?? "Fill decision rule..."} />
                      </label>
                      <label className="space-y-1 text-xs text-textSecondary">
                        <span>System Prompt</span>
                        <Textarea rows={4} defaultValue={selectedNodeConfig?.systemPrompt ?? "You are VOC label classification expert..."} />
                      </label>
                    </TabsContent>

                    <TabsContent value="examples" className="space-y-3">
                      <p className="text-sm text-textSecondary">Examples tab placeholder for P0. Positive/negative/boundary groups will land next iteration.</p>
                      <div className="rounded-lg border border-dashed border-white/20 p-4 text-xs text-textSecondary">Examples list placeholder</div>
                    </TabsContent>

                    <TabsContent value="testing" className="space-y-3">
                      <label className="space-y-1 text-xs text-textSecondary">
                        <span>Testing Input</span>
                        <Textarea rows={4} defaultValue="Appointment delayed twice and nobody follows up." />
                      </label>
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-textSecondary">
                        Result placeholder: rawOutput / parsedOutput / hitLabel / confidence / latency / errorMessage
                      </div>
                    </TabsContent>

                    <TabsContent value="versions" className="space-y-3">
                      <p className="text-sm text-textSecondary">Node version snapshots placeholder (P0 read-only, diff in later iteration).</p>
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
