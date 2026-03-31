"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronRight, Command, Search, ShieldCheck } from "lucide-react";
import { navItems } from "@/lib/constants/design-tokens";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const activeItem = navItems.find((item) => pathname.startsWith(item.href)) ?? navItems[0];

  return (
    <div className="relative min-h-screen">
      <aside className="glass-card-solid fixed inset-y-5 left-5 z-30 hidden w-[276px] flex-col rounded-[32px] px-5 py-6 lg:flex">
        <div className="soft-glow rounded-[28px] p-5">
          <div className="glass-card rounded-[24px] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(91,140,255,0.18),rgba(34,211,238,0.18))] text-[#8db5ff]">
                <Command className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted">VOC Platform</p>
                <h1 className="mt-1 text-lg font-semibold text-white">Intelligence Console</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              Multi-channel customer voice data processing and AI intelligence operations.
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "panel-hover group flex items-center gap-3 rounded-2xl border px-4 py-3.5",
                  isActive
                    ? "border-[rgba(91,140,255,0.35)] bg-[linear-gradient(135deg,rgba(91,140,255,0.16),rgba(124,58,237,0.14))] shadow-[0_18px_44px_rgba(8,17,34,0.56)]"
                    : "border-transparent bg-transparent hover:bg-[rgba(255,255,255,0.03)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                    isActive
                      ? "border-[rgba(120,180,255,0.28)] bg-[rgba(91,140,255,0.14)] text-[#a7c4ff]"
                      : "border-transparent bg-[rgba(255,255,255,0.03)] text-muted group-hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="truncate text-xs text-muted">{item.caption}</div>
                </div>
                <ChevronRight className={cn("h-4 w-4", isActive ? "text-[#8db5ff]" : "text-muted")} />
              </Link>
            );
          })}
        </nav>

        <div className="glass-card mt-6 rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Realtime Guard</p>
              <h3 className="mt-2 text-sm font-semibold text-white">System health 99.82%</h3>
            </div>
            <span className="status-pulse h-3 w-3 rounded-full bg-[#10b981]" />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[rgba(16,185,129,0.16)] bg-[rgba(16,185,129,0.08)] px-3 py-2 text-xs text-[rgba(215,255,244,0.88)]">
            <ShieldCheck className="h-4 w-4" />
            All pipelines are operating within SLA.
          </div>
        </div>
      </aside>

      <div className="lg:pl-[316px]">
        <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(7,11,20,0.72)] px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted">
                  <span>VOC Intelligence Console</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{activeItem.label}</span>
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-[30px]">{activeItem.pageTitle}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-2xl border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-2.5 md:flex">
                  <Search className="h-4 w-4 text-muted" />
                  <span className="text-sm text-muted">Global semantic query</span>
                </div>
                <div className="rounded-2xl border border-[rgba(91,140,255,0.18)] bg-[rgba(91,140,255,0.08)] px-3 py-2 text-xs uppercase tracking-[0.24em] text-[#b7ccff]">
                  AI-ready Workspace
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
                      isActive
                        ? "border-[rgba(91,140,255,0.28)] bg-[rgba(91,140,255,0.12)] text-white"
                        : "border-white/8 bg-[rgba(255,255,255,0.03)] text-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <button className="panel-hover floating fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-full border border-[rgba(91,140,255,0.24)] bg-[linear-gradient(135deg,rgba(11,24,44,0.92),rgba(17,25,40,0.92))] px-4 py-3 shadow-[0_18px_36px_rgba(8,17,34,0.66)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(91,140,255,0.18),rgba(34,211,238,0.18))] text-[#9dbdff]">
          <Bot className="h-5 w-5" />
        </span>
        <span className="text-left">
          <span className="block text-xs uppercase tracking-[0.24em] text-muted">AI Copilot</span>
          <span className="block text-sm font-medium text-white">Ask the console</span>
        </span>
      </button>
    </div>
  );
}
