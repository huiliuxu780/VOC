import { Panel } from "../components/ui/Panel";

const tags = [
  { level: "L1", name: "产品问题", children: 12 },
  { level: "L2", name: "安装问题", children: 6 },
  { level: "L3", name: "安装失败", children: 3 },
  { level: "L4", name: "预约安装超时", children: 0 }
];

export function LabelManagementPage() {
  return (
    <Panel title="标签层级管理" description="支持 1~4 级标签树、排序、启停与版本治理。">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.name} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-3">
              <div>
                <p className="text-xs text-textSecondary">{tag.level}</p>
                <p className="text-sm font-medium">{tag.name}</p>
              </div>
              <span className="text-xs text-textSecondary">子节点 {tag.children}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <h4 className="mb-4 text-sm font-semibold">标签详情</h4>
          <div className="space-y-3 text-sm text-textSecondary">
            <p>标签编码：L4-INSTALL-TIMEOUT</p>
            <p>适用数据源：电商评论、客服热线</p>
            <p>是否参与 LLM 打标：是</p>
            <p>默认 Prompt 版本：v3.1</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
