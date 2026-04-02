import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { apiGet } from "../lib/api";
import type { LabelNodeConfigRecord, LabelNodeRecord, LabelTaxonomyRecord, LabelTaxonomyVersionRecord } from "../lib/api";
import { defaultVersionIdForTaxonomy, getDemoNodeConfig, getDemoNodesByVersion, getDemoTaxonomyById, getDemoVersionById } from "./labelTaxonomy.fixtures";

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
  const [taxonomy, setTaxonomy] = useState<LabelTaxonomyRecord | null>(null);
  const [version, setVersion] = useState<LabelTaxonomyVersionRecord | null>(null);
  const [nodes, setNodes] = useState<LabelNodeRecord[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<NodeTab>("basic");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("正在加载标签体系详情...");

  const resolvedVersionId = versionId ?? defaultVersionIdForTaxonomy(taxonomyId);

  useEffect(() => {
    let mounted = true;
    async function loadDetail() {
      try {
        const [taxonomyRow, versionRow, treeRows] = await Promise.all([
          apiGet<LabelTaxonomyRecord>(`/label-taxonomies/${taxonomyId}`),
          apiGet<LabelTaxonomyVersionRecord>(`/label-taxonomies/${taxonomyId}/versions/${resolvedVersionId}`),
          apiGet<LabelNodeRecord[]>(`/label-taxonomies/${taxonomyId}/versions/${resolvedVersionId}/tree`)
        ]);
        if (!mounted) return;
        setTaxonomy(taxonomyRow);
        setVersion(versionRow);
        setNodes(treeRows);
        const defaultNodeId = nodeId ?? treeRows[0]?.id ?? null;
        setSelectedNodeId(defaultNodeId);
        setNotice(`已加载体系 ${taxonomyRow.name} / 版本 ${versionRow.version}`);
      } catch {
        if (!mounted) return;
        const fallbackTaxonomy = getDemoTaxonomyById(taxonomyId);
        const fallbackVersion = getDemoVersionById(resolvedVersionId);
        const fallbackNodes = getDemoNodesByVersion(resolvedVersionId);
        setTaxonomy(fallbackTaxonomy);
        setVersion(fallbackVersion);
        setNodes(fallbackNodes);
        const defaultNodeId = nodeId ?? fallbackNodes[0]?.id ?? null;
        setSelectedNodeId(defaultNodeId);
        setNotice("后端标签体系 API 尚未接通，当前展示详情页结构与演示数据。");
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <Panel
        title={taxonomy?.name ?? "标签体系详情"}
        description={`${taxonomy?.code ?? "-"} · 版本 ${version?.version ?? "-"} · 选中节点路径：${selectedNodePath}`}
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-indigo-400/45 px-3 py-1 text-xs text-indigo-100 transition-colors hover:border-indigo-300/65"
            >
              保存体系草稿
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-emerald-400/45 px-3 py-1 text-xs text-emerald-100 transition-colors hover:border-emerald-300/65"
            >
              发布当前版本
            </button>
            <button
              type="button"
              onClick={() => navigate("/label-taxonomies")}
              className="cursor-pointer rounded-lg border border-white/20 px-3 py-1 text-xs text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary"
            >
              返回体系列表
            </button>
          </div>
        }
      >
        {loading ? <p className="text-sm text-textSecondary">Loading taxonomy detail...</p> : null}

        {!loading ? (
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <section className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-3 space-y-2">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="检索节点名称 / code..."
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
                />
                <p className="text-xs text-textSecondary">节点总数：{nodes.length} · 当前展示：{filteredNodes.length}</p>
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
                    节点：{selectedNode.name} ({selectedNode.code}) · 层级 L{selectedNode.level} · 状态 {selectedNode.status}
                  </div>

                  <TabsList>
                    <TabsTrigger value="basic">基础信息</TabsTrigger>
                    <TabsTrigger value="rule-prompt">规则与 Prompt</TabsTrigger>
                    <TabsTrigger value="examples">示例管理</TabsTrigger>
                    <TabsTrigger value="testing">测试与调试</TabsTrigger>
                    <TabsTrigger value="versions">版本记录</TabsTrigger>
                    <TabsTrigger value="mapping">映射与扩展</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-xs text-textSecondary">
                        <span>节点名称</span>
                        <input
                          defaultValue={selectedNode.name}
                          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-textSecondary">
                        <span>节点编码</span>
                        <input
                          defaultValue={selectedNode.code}
                          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-indigo-300/60"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-textSecondary">发布态建议只读，需通过“复制新版本”再编辑。</p>
                  </TabsContent>

                  <TabsContent value="rule-prompt" className="space-y-3">
                    <label className="space-y-1 text-xs text-textSecondary">
                      <span>定义</span>
                      <Textarea rows={3} defaultValue={selectedNodeConfig?.definition ?? "请填写节点定义..."} />
                    </label>
                    <label className="space-y-1 text-xs text-textSecondary">
                      <span>判定规则</span>
                      <Textarea rows={3} defaultValue={selectedNodeConfig?.decisionRule ?? "请填写判定规则..."} />
                    </label>
                    <label className="space-y-1 text-xs text-textSecondary">
                      <span>System Prompt</span>
                      <Textarea rows={4} defaultValue={selectedNodeConfig?.systemPrompt ?? "你是 VOC 标签判定专家..."} />
                    </label>
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-3">
                    <p className="text-sm text-textSecondary">示例管理（P0）：正例 / 负例 / 边界例分组列表，支持后续从测试结果转存。</p>
                    <div className="rounded-lg border border-dashed border-white/20 p-4 text-xs text-textSecondary">示例列表占位区</div>
                  </TabsContent>

                  <TabsContent value="testing" className="space-y-3">
                    <label className="space-y-1 text-xs text-textSecondary">
                      <span>测试输入</span>
                      <Textarea rows={4} defaultValue="预约安装已延期两次，无人联系处理。" />
                    </label>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-textSecondary">
                      结果字段预留：rawOutput / parsedOutput / hitLabel / confidence / latency / errorMessage
                    </div>
                  </TabsContent>

                  <TabsContent value="versions" className="space-y-3">
                    <p className="text-sm text-textSecondary">节点配置快照列表占位（P0 先支持查看，差异高亮在后续迭代）。</p>
                  </TabsContent>

                  <TabsContent value="mapping" className="space-y-3">
                    <p className="text-sm text-textSecondary">映射与扩展（可选）：用于外部系统字段映射与老标签兼容。</p>
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="text-sm text-textSecondary">当前版本暂无节点，请先导入或创建节点。</p>
              )}
            </section>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
