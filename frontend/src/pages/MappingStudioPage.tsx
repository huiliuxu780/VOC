import { useEffect, useMemo, useState } from "react";
import { Panel } from "../components/ui/Panel";
import { apiGet, apiPost, DataSource } from "../lib/api";

type SchemaResponse = { datasource_id: number; fields: string[] };
type PreviewResponse = { datasource_id: number; preview: Record<string, string> };

const targetFields = ["source_id", "content_text", "user_id", "brand_name", "event_time"];

export function MappingStudioPage() {
  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const ds = await apiGet<DataSource[]>("/datasources");
        setDatasources(ds);
        if (ds.length > 0) {
          setSelectedId(ds[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载数据源失败");
      }
    }
    void init();
  }, []);

  useEffect(() => {
    async function loadSchema() {
      if (!selectedId) return;
      setLoading(true);
      setError(null);
      try {
        const schema = await apiGet<SchemaResponse>(`/datasources/${selectedId}/schema`);
        setSourceFields(schema.fields);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载字段结构失败");
      } finally {
        setLoading(false);
      }
    }
    void loadSchema();
  }, [selectedId]);

  const defaultSample = useMemo(
    () => ({
      raw_id: "A-10086",
      msg: "预约安装一直超时，客服无人处理",
      ext: { user: { uid: "u-001" }, order: { brand: "BrandX" } },
      event_time: "2026-03-31T10:30:00"
    }),
    []
  );

  async function runPreview() {
    try {
      const mappingRules = {
        source_id: "raw_id",
        content_text: "msg",
        user_id: "ext.user.uid",
        brand_name: "ext.order.brand",
        event_time: "event_time"
      };
      const result = await apiPost<PreviewResponse>(`/datasources/${selectedId}/mapping/preview`, {
        sample_payload: defaultSample,
        mapping_rules: mappingRules
      });
      setPreview(result.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "预览失败");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <Panel
        title="外部字段结构"
        description="支持 JSON Path 选择与样本定位"
        rightSlot={
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-xs"
          >
            {datasources.map((ds) => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
        }
      >
        {loading ? <p className="text-sm text-textSecondary">字段加载中...</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        <ul className="space-y-2 text-sm">
          {sourceFields.map((field) => (
            <li key={field} className="rounded-lg border border-white/10 px-3 py-2 text-textSecondary">{field}</li>
          ))}
        </ul>
      </Panel>
      <Panel title="Mapping 工作台" description="表达式编辑 + 实时预览 + 版本保存">
        <div className="space-y-3 text-sm">
          {targetFields.map((target, index) => (
            <div key={target} className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-textSecondary">内部字段</p>
              <p className="mb-2 font-medium">{target}</p>
              <input
                defaultValue={`concat(${sourceFields[index] ?? "msg"}, '_normalized')`}
                className="w-full rounded-lg border border-indigo-400/35 bg-black/20 px-3 py-2 text-textPrimary outline-none"
              />
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => void runPreview()} className="rounded-xl bg-accent-gradient px-4 py-2 font-semibold">预览转换结果</button>
          </div>
          {preview ? (
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-indigo-100">
              {JSON.stringify(preview, null, 2)}
            </pre>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
