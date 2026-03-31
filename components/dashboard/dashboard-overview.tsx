"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Cpu,
  Radar,
  ShieldAlert,
  Sparkles,
  Waves,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  channelDistribution,
  dashboardKpis,
  dashboardTrend,
  engineStates,
  riskAlerts,
  topLabelDistribution,
} from "@/lib/mock-data/voc";
import { formatCompactNumber } from "@/lib/utils";

export function DashboardOverview() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="space-y-7">
      <section className="grid gap-6 xl:grid-cols-[1.24fr_0.76fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="soft-glow hero-grid overflow-hidden rounded-[38px]"
        >
          <div className="glass-card-solid relative min-h-[470px] rounded-[38px] p-7 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_24%,rgba(91,140,255,0.28),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(34,211,238,0.18),transparent_22%),radial-gradient(circle_at_64%_72%,rgba(124,58,237,0.14),transparent_30%),linear-gradient(140deg,rgba(255,255,255,0.02),transparent)]" />
            <div className="absolute left-[-60px] top-[-50px] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(91,140,255,0.3),transparent_72%)] blur-3xl" />
            <div className="absolute right-[-20px] top-10 h-64 w-64 rounded-full border border-[rgba(91,140,255,0.1)] bg-[radial-gradient(circle,rgba(91,140,255,0.18),transparent_68%)] blur-2xl" />
            <div className="absolute bottom-4 right-6 hidden h-48 w-48 rounded-full border border-[rgba(34,211,238,0.1)] bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_72%)] xl:block" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="max-w-3xl">
                <Badge variant="cyan" className="w-fit">
                  VOC Intelligence Console
                </Badge>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#a7c9ff]">
                  <Waves className="h-3.5 w-3.5" />
                  Realtime customer signal orchestration
                </div>
                <h1 className="mt-6 text-4xl font-semibold leading-[0.98] text-white md:text-[68px]">
                  Customer voice becomes
                  <span className="text-gradient block">an executive-grade operating surface.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-[15px] leading-8 text-muted">
                  A premium VOC command center for multi-channel feedback, intelligent labeling, sentiment scoring,
                  and risk escalation. The goal is not to look like a dashboard template, but a high-end data
                  intelligence product.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="primary" size="lg">
                    Open command view
                  </Button>
                  <Button variant="secondary" size="lg">
                    Inspect risk clusters
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
                <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,17,31,0.76),rgba(8,14,27,0.58))] p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-muted">Signal bandwidth</div>
                      <div className="mt-2 text-2xl font-semibold text-white">YTS / NPS / KAFKA_NPS / ECOMMERCE / SOCIAL</div>
                    </div>
                    <Radar className="h-5 w-5 text-[#8db5ff]" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {channelDistribution.map((item) => (
                      <span
                        key={item.name}
                        className="rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white"
                        style={{
                          borderColor: `${item.color}44`,
                          backgroundColor: `${item.color}18`,
                        }}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[30px] border border-[rgba(244,63,94,0.18)] bg-[linear-gradient(135deg,rgba(244,63,94,0.14),rgba(255,255,255,0.03))] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted">Risk focus</div>
                      <ShieldAlert className="h-4 w-4 text-[#ff91a9]" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-white">3 clusters</div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      No cooling, installation delay, and logistics damage are the current top risk signals.
                    </p>
                  </div>
                  <div className="rounded-[30px] border border-[rgba(91,140,255,0.18)] bg-[linear-gradient(135deg,rgba(91,140,255,0.14),rgba(34,211,238,0.08))] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted">Automation loop</div>
                      <Bot className="h-4 w-4 text-[#9bc2ff]" />
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-white">96.0%</div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Core channels are already running in a stable automated classification loop.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6">
          <Card variant="focus" className="overflow-hidden rounded-[34px]">
            <CardContent className="relative p-6">
              <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(91,140,255,0.48),transparent)]" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted">Realtime Engine Status</div>
                  <div className="mt-3 text-[32px] font-semibold text-white">4 / 4 sub-engines active</div>
                </div>
                <span className="status-pulse flex h-14 w-14 items-center justify-center rounded-3xl bg-[rgba(16,185,129,0.14)] text-[#7bf0c2]">
                  <Cpu className="h-7 w-7" />
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {engineStates.map((engine) => (
                  <div
                    key={engine.name}
                    className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-white">{engine.name}</div>
                      <Badge variant={engine.status === "degraded" ? "warning" : engine.status === "optimizing" ? "cyan" : "success"}>
                        {engine.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {engine.throughput} / {engine.latency}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[34px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-muted">Control cues</div>
                  <div className="mt-3 text-[28px] font-semibold text-white">Console focus signals</div>
                </div>
                <Sparkles className="h-5 w-5 text-[#8db5ff]" />
              </div>
              <div className="mt-6 grid gap-3">
                <ConsoleSignal label="High-risk ticket growth" value="+12.6%" tone="danger" />
                <ConsoleSignal label="Install-delay recall" value="95.2%" tone="cyan" />
                <ConsoleSignal label="Marketing parse anomaly" value="2.6%" tone="warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr_1fr_1fr]">
        <Card className="rounded-[32px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-muted">Core signal</div>
                <div className="mt-2 text-sm text-muted">Total normalized customer voices</div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#8db5ff]" />
            </div>
            <div className="mt-8 text-5xl font-semibold text-white">
              <AnimatedNumber value={dashboardKpis[0].value} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-[#9cd4ff]">{dashboardKpis[0].delta}</span>
              <span className="text-muted">{dashboardKpis[0].detail}</span>
            </div>
          </CardContent>
        </Card>

        {dashboardKpis.slice(1).map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
          >
            <Card className="h-full rounded-[32px]">
              <CardContent className="p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-muted">{item.title}</div>
                <div className="mt-6 text-4xl font-semibold text-white">
                  <AnimatedNumber value={item.value} suffix={item.suffix} decimals={item.decimals} />
                </div>
                <div className="mt-4 text-sm text-[#9cd4ff]">{item.delta}</div>
                <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.34fr_0.66fr]">
        <Card className="rounded-[34px]">
          <CardContent className="p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted">Trend console</div>
                <h2 className="mt-2 text-[34px] font-semibold text-white">7-day voice load and negative pressure</h2>
              </div>
              <div className="rounded-full border border-[rgba(91,140,255,0.18)] bg-[rgba(91,140,255,0.08)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#bdd0ff]">
                automation {dashboardTrend.at(-1)?.automation ?? 0}%
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.34fr]">
              <div className="h-[372px] rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                    <AreaChart data={dashboardTrend}>
                      <defs>
                        <linearGradient id="dashboard-total" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5B8CFF" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#5B8CFF" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="dashboard-negative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "rgba(229,238,255,0.58)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(229,238,255,0.44)" }} />
                      <Area type="monotone" dataKey="total" stroke="#8db5ff" strokeWidth={2.3} fill="url(#dashboard-total)" />
                      <Area type="monotone" dataKey="negative" stroke="#f97393" strokeWidth={1.9} fill="url(#dashboard-negative)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-[22px] bg-[rgba(255,255,255,0.03)]" />
                )}
              </div>

              <div className="grid gap-4">
                {dashboardTrend.slice(-3).map((day) => (
                  <div key={day.day} className="rounded-[26px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{day.day}</div>
                    <div className="mt-3 text-[28px] font-semibold text-white">{formatCompactNumber(day.total)}</div>
                    <div className="mt-2 text-sm text-muted">Negative {formatCompactNumber(day.negative)}</div>
                    <div className="mt-1 text-sm text-[#90d9ff]">Automation {day.automation}%</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[34px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted">Alert wall</div>
                <h2 className="mt-2 text-[28px] font-semibold text-white">Risk alert list</h2>
              </div>
              <Badge variant="danger">hot</Badge>
            </div>
            <div className="mt-6 space-y-4">
              {riskAlerts.map((alert) => (
                <div key={alert.title} className="rounded-[26px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#ff7f97]" />
                        <h3 className="text-sm font-semibold text-white">{alert.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">{alert.description}</p>
                    </div>
                    <Badge variant={alert.severity === "critical" ? "danger" : alert.severity === "high" ? "warning" : "default"}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
                    <span>{alert.channel}</span>
                    <span>{alert.count} voices</span>
                    <span>{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.86fr_0.76fr_0.38fr]">
        <Card className="rounded-[34px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted">Channel radar</div>
                <h2 className="mt-2 text-[28px] font-semibold text-white">Channel mix</h2>
              </div>
              <Activity className="h-5 w-5 text-[#8dd8ff]" />
            </div>
            <div className="mt-6 grid items-center gap-4 lg:grid-cols-[0.94fr_1.06fr]">
              <div className="h-[260px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                    <PieChart>
                      <Pie data={channelDistribution} dataKey="value" innerRadius={74} outerRadius={106} paddingAngle={4}>
                        {channelDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-full bg-[rgba(255,255,255,0.03)]" />
                )}
              </div>
              <div className="space-y-3">
                {channelDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-[22px] border border-white/8 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-white">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[34px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted">Taxonomy pressure</div>
                <h2 className="mt-2 text-[28px] font-semibold text-white">Top label distribution</h2>
              </div>
              <Sparkles className="h-5 w-5 text-[#8db5ff]" />
            </div>
            <div className="mt-6 h-[320px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                  <BarChart data={topLabelDistribution} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(229,238,255,0.64)" }}
                      width={92}
                    />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                      {topLabelDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[24px] bg-[rgba(255,255,255,0.03)]" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[34px]">
          <CardContent className="p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Engine pulse</div>
            <h2 className="mt-2 text-[28px] font-semibold text-white">Runtime</h2>
            <div className="mt-6 space-y-3">
              {engineStates.map((engine) => (
                <div key={engine.name} className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="text-sm font-medium text-white">{engine.name}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted">{engine.throughput}</span>
                    <Badge variant={engine.status === "online" ? "success" : engine.status === "optimizing" ? "cyan" : "warning"}>
                      {engine.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ConsoleSignal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "danger" | "cyan" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[rgba(244,63,94,0.16)] bg-[rgba(244,63,94,0.08)]"
      : tone === "warning"
        ? "border-[rgba(245,158,11,0.16)] bg-[rgba(245,158,11,0.08)]"
        : "border-[rgba(34,211,238,0.16)] bg-[rgba(34,211,238,0.08)]";

  return (
    <div className={`rounded-[24px] border px-4 py-3 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
