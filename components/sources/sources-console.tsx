"use client";

import { useMemo, useState } from "react";
import { Activity, Clock3, Database, Filter, RadioTower, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sourceStats, sources } from "@/lib/mock-data/voc";
import { cn, formatCompactNumber } from "@/lib/utils";

const statusVariantMap = {
  healthy: "success",
  abnormal: "danger",
  delay: "warning",
} as const;

export function SourcesConsole() {
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "abnormal" | "delay">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Batch" | "Stream">("all");
  const [selectedId, setSelectedId] = useState(sources[0]?.id ?? "");

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      const statusMatch = statusFilter === "all" || source.status === statusFilter;
      const typeMatch = typeFilter === "all" || source.type === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [statusFilter, typeFilter]);

  const selectedSource = filteredSources.find((item) => item.id === selectedId) ?? filteredSources[0] ?? sources[0];

  return (
    <div className="space-y-6">
      <section className="soft-glow overflow-hidden rounded-[34px]">
        <div className="glass-card-solid relative rounded-[34px] p-7 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(91,140,255,0.2),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(34,211,238,0.16),transparent_24%)]" />
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
            <div>
              <Badge variant="cyan" className="w-fit">
                Data Ingestion Matrix
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-[54px]">
                Source cards, not admin tables.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
                将 YTS、NPS、KAFKA_NPS、ECOMMERCE、SOCIAL 等多通道接入状态组织成一个有节奏的摄取面板，
                让数据引擎本身也具有产品感和展示力。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sourceStats.map((stat) => (
                <div key={stat.label} className="rounded-[26px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted">{stat.label}</div>
                  <div className="mt-4 text-3xl font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-6">
          <Card className="rounded-[30px]">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Filter className="h-4 w-4" />
                  Source filters
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "healthy", "abnormal", "delay"] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setStatusFilter(item)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
                        statusFilter === item
                          ? "border-[rgba(91,140,255,0.3)] bg-[rgba(91,140,255,0.12)] text-white"
                          : "border-white/8 bg-[rgba(255,255,255,0.03)] text-muted",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                  {(["all", "Batch", "Stream"] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setTypeFilter(item)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
                        typeFilter === item
                          ? "border-[rgba(34,211,238,0.3)] bg-[rgba(34,211,238,0.12)] text-white"
                          : "border-white/8 bg-[rgba(255,255,255,0.03)] text-muted",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredSources.map((source) => (
              <Card
                key={source.id}
                className={cn(
                  "cursor-pointer rounded-[30px]",
                  selectedSource.id === source.id && "border-[rgba(91,140,255,0.28)] bg-[rgba(91,140,255,0.08)]",
                )}
                onClick={() => setSelectedId(source.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-muted">{source.sourceChannel}</div>
                      <h3 className="mt-3 text-xl font-semibold text-white">{source.name}</h3>
                    </div>
                    <Badge variant={statusVariantMap[source.status]}>{source.status}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">{source.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant="default">{source.type}</Badge>
                    <Badge variant="cyan">{source.integration}</Badge>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MetricBox icon={Database} label="Today volume" value={formatCompactNumber(source.todayVolume)} />
                    <MetricBox icon={Activity} label="Success rate" value={`${source.successRate}%`} />
                    <MetricBox icon={Clock3} label="Avg latency" value={source.avgLatency} />
                    <MetricBox icon={RadioTower} label="Last update" value={source.updatedAt.slice(11)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="sticky top-28 h-fit rounded-[32px]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-muted">Source detail</div>
                <h2 className="mt-3 text-3xl font-semibold text-white">{selectedSource.name}</h2>
                <p className="mt-3 text-sm leading-7 text-muted">{selectedSource.description}</p>
              </div>
              <Badge variant={statusVariantMap[selectedSource.status]}>{selectedSource.status}</Badge>
            </div>
            <div className="mt-6 grid gap-3">
              <DetailRow label="source_channel" value={selectedSource.sourceChannel} />
              <DetailRow label="Ingestion type" value={selectedSource.type} />
              <DetailRow label="Integration" value={selectedSource.integration} />
              <DetailRow label="Latest update" value={selectedSource.updatedAt} />
              <DetailRow label="Today processed" value={formatCompactNumber(selectedSource.todayVolume)} />
              <DetailRow label="Success rate" value={`${selectedSource.successRate}%`} />
              <DetailRow label="Average latency" value={selectedSource.avgLatency} />
            </div>

            <div className="mt-6 rounded-[24px] border border-[rgba(91,140,255,0.16)] bg-[rgba(91,140,255,0.08)] p-5">
              <div className="flex items-center gap-2 text-sm text-white">
                <Sparkles className="h-4 w-4 text-[#a9c6ff]" />
                Console insight
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">
                当前这个数据源直接影响统一六段 pipeline 的输入负载和标签召回质量。未来接真实 API 时，只需要把这里的
                mock 指标替换成实时接口返回即可。
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="primary">Open source config</Button>
              <Button>View diagnostics</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-3 text-base font-medium text-white">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
