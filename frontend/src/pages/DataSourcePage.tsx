import { useEffect, useState } from "react";
import { Panel } from "../components/ui/Panel";
import { apiGet, apiPost, DataSource } from "../lib/api";

type ConnectionResult = {
  datasource_id: number;
  status: string;
  latency_ms: number;
};

export function DataSourcePage() {
  const [rows, setRows] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTest, setLastTest] = useState<string>("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<DataSource[]>("/datasources");
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function testConnection(id: number) {
    try {
      const result = await apiPost<ConnectionResult>(`/datasources/${id}/test-connection`);
      setLastTest(`数据源 ${result.datasource_id} 测试成功，延迟 ${result.latency_ms}ms`);
    } catch (err) {
      setLastTest(err instanceof Error ? err.message : "连接测试失败");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-6">
      <Panel title="数据源接入" description="统一管理输入/输出数据源，支持 HTTP、Excel、Kafka。">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs text-textSecondary">{lastTest || "可直接调用后端连接测试接口验证配置。"}</div>
          <button onClick={loadData} className="rounded-xl border border-white/15 px-4 py-2 text-sm">刷新</button>
        </div>
        {loading ? <p className="text-sm text-textSecondary">加载中...</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-textSecondary">
              <tr>
                <th className="px-3 py-3">名称</th>
                <th className="px-3 py-3">类型</th>
                <th className="px-3 py-3">业务方</th>
                <th className="px-3 py-3">状态</th>
                <th className="px-3 py-3">编码</th>
                <th className="px-3 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-3 py-3">{row.name}</td>
                  <td className="px-3 py-3 text-textSecondary">{row.source_type}</td>
                  <td className="px-3 py-3 text-textSecondary">{row.owner}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-xs">{row.enabled ? "启用" : "停用"}</span>
                  </td>
                  <td className="px-3 py-3 text-textSecondary">{row.code}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => void testConnection(row.id)} className="rounded-lg border border-indigo-400/40 px-2 py-1 text-xs text-indigo-200">
                      测试连接
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
