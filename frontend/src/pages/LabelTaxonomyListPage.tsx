import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { Select } from "../components/ui/Select";
import { apiGet } from "../lib/api";
import type { LabelTaxonomyRecord, TaxonomyStatus } from "../lib/api";
import { defaultVersionIdForTaxonomy, demoTaxonomies } from "./labelTaxonomy.fixtures";

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" }
];

function statusClass(status: TaxonomyStatus) {
  if (status === "published") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  if (status === "draft") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/[0.03] text-textSecondary";
}

export function LabelTaxonomyListPage() {
  const [items, setItems] = useState<LabelTaxonomyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("正在加载标签体系列表...");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function loadTaxonomies() {
      try {
        const rows = await apiGet<LabelTaxonomyRecord[]>("/label-taxonomies");
        if (!mounted) return;
        setItems(rows);
        setNotice(`已加载 ${rows.length} 套标签体系`);
      } catch {
        if (!mounted) return;
        setItems(demoTaxonomies);
        setNotice(`后端标签体系 API 尚未接通，当前展示本地演示数据（${demoTaxonomies.length} 套）`);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadTaxonomies();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return [item.name, item.code, item.owner ?? "", item.description ?? ""].some((field) => field.toLowerCase().includes(keyword));
    });
  }, [items, statusFilter, deferredSearch]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-textSecondary">{notice}</div>

      <Panel
        title="标签体系管理"
        description="管理多套标签树，统一版本与节点配置入口"
        rightSlot={
          <button
            type="button"
            onClick={() => navigate("/label-taxonomies/new")}
            className="cursor-pointer rounded-lg border border-indigo-400/40 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:border-indigo-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            创建标签体系
          </button>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[200px_1fr]">
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="按名称 / 编码 / Owner 检索..."
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60"
          />
        </div>

        {loading ? <p className="text-sm text-textSecondary">Loading taxonomies...</p> : null}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-textSecondary">
            暂无符合条件的标签体系
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-indigo-100">{item.name}</h4>
                <span className={["rounded-full border px-2 py-0.5 text-[11px]", statusClass(item.status)].join(" ")}>{item.status}</span>
              </div>
              <p className="mb-3 text-xs text-textSecondary">code: {item.code}</p>
              <p className="line-clamp-2 min-h-[2.5rem] text-xs text-textSecondary">{item.description ?? "暂无描述"}</p>
              <div className="mt-3 space-y-1 text-xs text-textSecondary">
                <p>Owner: {item.owner ?? "未指定"}</p>
                <p>业务范围: {item.businessScope.join(" / ")}</p>
                <p>品类范围: {item.categoryScope.join(" / ")}</p>
                <p>节点数: {item.nodeCount ?? 0}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => navigate(`/label-taxonomies/${item.id}/version/${defaultVersionIdForTaxonomy(item.id)}`)}
                  className="cursor-pointer rounded-md border border-indigo-400/45 bg-indigo-500/15 px-2.5 py-1 text-indigo-100 transition-colors hover:border-indigo-300/65"
                >
                  进入体系
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/label-taxonomies/${item.id}/edit`)}
                  className="cursor-pointer rounded-md border border-white/20 px-2.5 py-1 text-textSecondary transition-colors hover:border-white/35 hover:text-textPrimary"
                >
                  编辑
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
