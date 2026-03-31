import { BarChart3, Database, Layers3, LayoutDashboard, Network, ScrollText, Settings2, Tag } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/datasources", label: "数据源接入", icon: Database },
  { to: "/mapping", label: "Mapping 配置", icon: Network },
  { to: "/labels", label: "标签层级管理", icon: Tag },
  { to: "/prompts", label: "Prompt 管理", icon: ScrollText },
  { to: "/jobs", label: "作业任务管理", icon: Layers3 },
  { to: "/pipeline", label: "分析链路配置", icon: BarChart3 },
  { to: "/monitoring", label: "监控中心", icon: Settings2 }
];

export function Sidebar() {
  return (
    <aside className="border-r border-white/10 bg-[#07090D]/95 p-4">
      <div className="mb-8 rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 p-4">
        <p className="text-xs text-indigo-200/80">VOC Platform</p>
        <h2 className="mt-1 text-sm font-semibold">智能打标控制台</h2>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                  isActive
                    ? "border-indigo-400/45 bg-indigo-500/20 text-indigo-100 shadow-glow"
                    : "border-transparent text-textSecondary hover:border-white/10 hover:bg-white/[0.03] hover:text-textPrimary"
                ].join(" ")
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
