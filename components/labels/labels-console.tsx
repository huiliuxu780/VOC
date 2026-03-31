"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Layers2, Network, Sigma, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { labelNodes } from "@/lib/mock-data/voc";
import { formatCompactNumber } from "@/lib/utils";

const labelStatusMap = {
  active: "success",
  draft: "warning",
  review: "cyan",
} as const;

export function LabelsConsole() {
  const [selectedId, setSelectedId] = useState(labelNodes[0]?.id ?? "");
  const selected = labelNodes.find((item) => item.id === selectedId) ?? labelNodes[0];

  const grouped = useMemo(() => {
    return labelNodes.reduce<Record<string, typeof labelNodes>>((acc, item) => {
      const key = item.path[0] ?? "Unknown";
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    }, {});
  }, []);

  return (
    <div className="space-y-6">
      <section className="soft-glow overflow-hidden rounded-[34px]">
        <div className="glass-card-solid relative rounded-[34px] p-7 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(91,140,255,0.2),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(124,58,237,0.18),transparent_28%)]" />
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Badge variant="cyan" className="w-fit">
                Taxonomy Intelligence
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-[54px]">
                把标签体系做成知识控制台，而不是树控件。
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
                这里展示的是 VOC 标签知识结构本身，包括父子层级、命中规模、负面贡献和样例语料，
                让 taxonomy 看起来像平台能力，不像配置页面。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <HeroMetric label="Active labels" value={`${labelNodes.filter((item) => item.status === "active").length}`} />
              <HeroMetric label="Review needed" value={`${labelNodes.filter((item) => item.status === "review").length}`} />
              <HeroMetric label="Avg negative" value={`${(labelNodes.reduce((sum, item) => sum + item.negativeRate, 0) / labelNodes.length).toFixed(1)}%`} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.02fr_0.68fr]">
        <Card className="rounded-[30px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
              <Layers2 className="h-4 w-4" />
              Label hierarchy
            </div>
            <div className="mt-6 space-y-4">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="text-sm font-semibold text-white">{group}</div>
                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                          selected.id === item.id
                            ? "border-[rgba(91,140,255,0.28)] bg-[rgba(91,140,255,0.12)]"
                            : "border-white/8 bg-[rgba(255,255,255,0.03)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-white">{item.name}</div>
                            <div className="mt-1 text-xs text-muted">{item.code}</div>
                          </div>
                          <Badge variant={labelStatusMap[item.status]}>{item.level}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                          {item.path.map((node, index) => (
                            <span key={`${item.id}-${node}`} className="flex items-center gap-2">
                              {node}
                              {index < item.path.length - 1 ? <ArrowRight className="h-3 w-3" /> : null}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-muted">Selected label</div>
                <h2 className="mt-3 text-3xl font-semibold text-white">{selected.name}</h2>
                <p className="mt-3 text-sm leading-7 text-muted">{selected.description}</p>
              </div>
              <Badge variant={labelStatusMap[selected.status]}>{selected.status}</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoPanel label="Label code" value={selected.code} />
              <InfoPanel label="Level" value={selected.level} />
              <InfoPanel label="Hit count" value={formatCompactNumber(selected.hitCount)} />
              <InfoPanel label="Negative rate" value={`${selected.negativeRate}%`} />
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Hierarchy path</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.path.map((node) => (
                  <Badge key={node} variant="default" className="text-[10px]">
                    {node}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                <Sparkles className="h-4 w-4" />
                Example voices
              </div>
              <div className="mt-4 space-y-3">
                {selected.examples.map((example) => (
                  <div key={example} className="rounded-[20px] border border-white/8 bg-[rgba(7,11,20,0.34)] p-4 text-sm leading-7 text-white">
                    {example}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[30px]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
                <Network className="h-4 w-4" />
                Parent / child
              </div>
              <div className="mt-6 space-y-4">
                {selected.path.map((node, index) => (
                  <div key={node} className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">Level {index + 1}</div>
                    <div className="mt-2 text-white">{node}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
                <Sigma className="h-4 w-4" />
                Impact range
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {selected.impactChannels.map((channel) => (
                  <Badge key={channel} variant="cyan">
                    {channel}
                  </Badge>
                ))}
              </div>
              <div className="mt-6 rounded-[22px] border border-[rgba(244,63,94,0.14)] bg-[rgba(244,63,94,0.08)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Risk reading</div>
                <div className="mt-2 text-sm leading-7 text-white">该标签在负面样本中的占比较高，适合作为风险预警和召回优化的优先对象。</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 text-lg font-medium text-white">{value}</div>
    </div>
  );
}
