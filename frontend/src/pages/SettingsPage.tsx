import { Panel } from "../components/ui/Panel";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <Panel title="系统设置" description="用于维护全局配置与平台策略（当前为占位页）">
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-textSecondary">
          设置模块将在后续迭代补充，目前保留路由与导航入口。
        </div>
      </Panel>
    </div>
  );
}
