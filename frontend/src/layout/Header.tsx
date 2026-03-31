import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#07090D]/85 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-textSecondary">VOC / 平台总控</p>
          <h1 className="text-base font-semibold tracking-wide text-textPrimary">AI-Native Labeling Console</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex w-64 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-textSecondary">
            <Search size={14} />
            <input
              className="w-full bg-transparent text-textPrimary outline-none placeholder:text-textSecondary"
              placeholder="搜索任务、标签、Prompt..."
            />
          </label>
          <button className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-textSecondary hover:text-textPrimary">
            <Bell size={16} />
          </button>
          <div className="rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3 py-2 text-xs font-medium text-indigo-200">
            ENV: DEV
          </div>
        </div>
      </div>
    </header>
  );
}
