"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Cpu, Orbit, Radar, Waves } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { pipelineLogs, pipelineStages } from "@/lib/mock-data/voc";
import { formatCompactNumber } from "@/lib/utils";

const stageVariantMap = {
  running: "cyan",
  stable: "success",
  warning: "warning",
} as const;

export function PipelinesConsole() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="space-y-7">
      <section className="soft-glow hero-grid overflow-hidden rounded-[38px]">
        <div className="glass-card-solid relative rounded-[38px] p-7 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(91,140,255,0.26),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(34,211,238,0.18),transparent_22%),radial-gradient(circle_at_62%_78%,rgba(124,58,237,0.12),transparent_30%),linear-gradient(140deg,rgba(255,255,255,0.02),transparent)]" />
          <div className="absolute right-10 top-10 hidden h-56 w-56 rounded-full border border-[rgba(91,140,255,0.12)] bg-[radial-gradient(circle,rgba(91,140,255,0.12),transparent_66%)] blur-xl xl:block" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge variant="cyan" className="w-fit">
                Pipeline Runtime Monitor
              </Badge>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#a7c9ff]">
                <Orbit className="h-3.5 w-3.5" />
                Live orchestration for six-stage AI workflow
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[0.99] text-white md:text-[64px]">
                Six stages,
                <span className="text-gradient block">one visible runtime surface.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-8 text-muted">
                This page should feel like a real AI pipeline command deck, not a row of BI widgets. Each stage needs
                to communicate flow, stability, latency, and anomaly context at a glance.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <RuntimeChip label="Today's total flow" value="192.3k" icon={<Waves className="h-4 w-4" />} />
                <RuntimeChip label="Active warnings" value="01" icon={<AlertTriangle className="h-4 w-4" />} />
                <RuntimeChip label="Stage stability" value="83.3%" icon={<Radar className="h-4 w-4" />} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.94fr]">
              <div className="rounded-[32px] border border-[rgba(91,140,255,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted">Runtime heartbeat</div>
                    <div className="mt-2 text-3xl font-semibold text-white">5 stable / 1 warning</div>
                  </div>
                  <span className="status-pulse flex h-14 w-14 items-center justify-center rounded-3xl bg-[rgba(91,140,255,0.14)] text-[#9ec2ff]">
                    <Cpu className="h-6 w-6" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">
                  `marketing_analysis` is the only elevated stage right now. The rest of the chain is still processing
                  traffic with stable throughput and predictable latency.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-[22px] border border-[rgba(34,211,238,0.14)] bg-[rgba(34,211,238,0.08)] px-4 py-3 text-sm text-white">
                  <Orbit className="h-4 w-4 text-[#84efff]" />
                  Pulse feedback means the stage is currently handling live traffic.
                </div>
              </div>

              <div className="rounded-[32px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-muted">Escalation focus</div>
                <div className="mt-4 space-y-3">
                  {pipelineLogs.slice(0, 3).map((log) => (
                    <div key={`${log.time}-${log.stage}`} className="rounded-[20px] border border-white/8 bg-[rgba(7,11,20,0.32)] p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-white">{log.stage}</div>
                        <Badge variant={log.level === "ERROR" ? "danger" : log.level === "WARN" ? "warning" : "default"}>
                          {log.level}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted">{log.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden rounded-[36px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted">Pipeline rail</div>
                <h2 className="mt-2 text-[34px] font-semibold text-white">AI pipeline control graph</h2>
              </div>
              <Badge variant="cyan">live orchestration</Badge>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-6">
              {pipelineStages.map((stage, index) => (
                <div key={stage.key} className="relative">
                  {index < pipelineStages.length - 1 ? (
                    <div className="absolute left-[calc(100%-8px)] top-[70px] hidden h-[2px] w-8 bg-[linear-gradient(90deg,rgba(91,140,255,0.56),rgba(34,211,238,0.14))] xl:block" />
                  ) : null}
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                    <Card className="h-full rounded-[32px]">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted">Stage {index + 1}</div>
                          <span
                            className={`status-pulse h-3 w-3 rounded-full ${
                              stage.status === "stable"
                                ? "bg-[#10b981]"
                                : stage.status === "running"
                                  ? "bg-[#22d3ee]"
                                  : "bg-[#f59e0b]"
                            }`}
                          />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-white">{stage.title}</h3>
                        <div className="mt-4 flex items-center justify-between">
                          <Badge variant={stageVariantMap[stage.status]}>{stage.status}</Badge>
                          <span className="text-xs uppercase tracking-[0.18em] text-muted">{stage.avgLatency}</span>
                        </div>
                        <div className="mt-5 grid gap-3">
                          <PipelineMetric label="Today processed" value={formatCompactNumber(stage.processed)} />
                          <PipelineMetric label="Error rate" value={`${stage.errorRate}%`} />
                        </div>
                        <div className="mt-5 h-[84px] rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-2">
                          {mounted ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={60}>
                              <AreaChart data={stage.trend}>
                                <defs>
                                  <linearGradient id={`stage-${stage.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#5B8CFF" stopOpacity={0.36} />
                                    <stop offset="100%" stopColor="#5B8CFF" stopOpacity={0.02} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#8db5ff" strokeWidth={2} fill={`url(#stage-${stage.key})`} />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full rounded-[16px] bg-[rgba(255,255,255,0.03)]" />
                          )}
                        </div>
                        <p className="mt-4 text-xs leading-6 text-muted">{stage.lastIncident}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[34px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted">Runtime narrative</div>
                  <h2 className="mt-2 text-[28px] font-semibold text-white">Control summary</h2>
                </div>
                <Cpu className="h-5 w-5 text-[#8db5ff]" />
              </div>
              <div className="mt-6 rounded-[26px] border border-[rgba(91,140,255,0.16)] bg-[rgba(91,140,255,0.08)] p-5">
                <div className="text-sm font-medium text-white">Mainline processing remains stable while one stage is under watch</div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  From `pre_filter` to `sentiment_analysis`, the core chain is still flowing cleanly. The main concern
                  is the elevated error and fallback rate inside `marketing_analysis`.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <SummaryRow label="Pipeline uptime" value="99.82%" />
                <SummaryRow label="Retry queue" value="213 records" />
                <SummaryRow label="Auto remediation" value="Enabled" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[34px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted">Exception log</div>
                  <h2 className="mt-2 text-[28px] font-semibold text-white">Live anomaly panel</h2>
                </div>
                <Badge variant="warning">hot stream</Badge>
              </div>
              <div className="mt-6 space-y-3">
                {pipelineLogs.map((log) => (
                  <div key={`${log.time}-${log.message}`} className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <ArrowRight className="h-4 w-4 text-[#8db5ff]" />
                        {log.stage}
                      </div>
                      <Badge variant={log.level === "ERROR" ? "danger" : log.level === "WARN" ? "warning" : "default"}>
                        {log.level}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{log.time}</div>
                    <p className="mt-3 text-sm leading-7 text-white">{log.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function PipelineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
      <span className="text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function RuntimeChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
        <span className="text-[#8db5ff]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
