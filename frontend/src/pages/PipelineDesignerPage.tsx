import { usePipelineStore } from "../store/pipelineStore";
import { Panel } from "../components/ui/Panel";

export function PipelineDesignerPage() {
  const { nodes, toggleNode } = usePipelineStore();

  return (
    <Panel title="分析链路配置" description="按作业独立配置 pipeline 节点启停、模型与 Prompt 版本。">
      <div className="space-y-3">
        {nodes.map((node, index) => (
          <div key={node.key} className="rounded-xl border border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-textSecondary">节点 {index + 1}</p>
                <p className="font-medium">{node.key}</p>
              </div>
              <button
                onClick={() => toggleNode(node.key)}
                className={[
                  "rounded-full px-3 py-1 text-xs",
                  node.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-zinc-500/25 text-zinc-200"
                ].join(" ")}
              >
                {node.enabled ? "已启用" : "已停用"}
              </button>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-white/10 px-3 py-2">
                <p className="text-xs text-textSecondary">模型版本</p>
                <p>{node.model}</p>
              </div>
              <div className="rounded-lg border border-white/10 px-3 py-2">
                <p className="text-xs text-textSecondary">Prompt 版本</p>
                <p>{node.promptVersion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
