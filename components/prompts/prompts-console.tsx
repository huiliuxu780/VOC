"use client";

import { useMemo, useState } from "react";
import { ChevronRight, GitBranch, PencilLine, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { promptItems } from "@/lib/mock-data/voc";

const promptMeta = {
  "pr-1": {
    labelName: "安装延迟",
    tree: ["履约体验", "安装服务", "预约履约", "安装延迟"],
    definition: "识别预约安装未按承诺时间上门、重复改期、安装排期失约等履约问题。",
  },
  "pr-2": {
    labelName: "冰箱不制冷",
    tree: ["产品故障", "制冷系统", "核心能力", "冰箱不制冷"],
    definition: "识别冰箱或冷柜存在不制冷、制冷弱、温度异常无法达标等核心故障。",
  },
  "pr-3": {
    labelName: "售后服务态度",
    tree: ["服务体验", "售后交互", "沟通质量", "售后服务态度"],
    definition: "识别客服或工程师在沟通中表现出的冷漠、敷衍、不耐烦或态度好等评价。",
  },
} as const;

const groupedTree = [
  {
    group: "履约体验",
    children: [{ id: "pr-1", name: "安装延迟", path: ["安装服务", "预约履约", "安装延迟"] }],
  },
  {
    group: "产品故障",
    children: [{ id: "pr-2", name: "冰箱不制冷", path: ["制冷系统", "核心能力", "冰箱不制冷"] }],
  },
  {
    group: "服务体验",
    children: [{ id: "pr-3", name: "售后服务态度", path: ["售后交互", "沟通质量", "售后服务态度"] }],
  },
];

export function PromptsConsole() {
  const [selectedId, setSelectedId] = useState(promptItems[0]?.id ?? "");
  const [testInput, setTestInput] = useState("约好今天安装冰箱，但师傅一直没来，客服也说不清楚具体上门时间。");
  const [draftPrompt, setDraftPrompt] = useState(promptItems[0]?.prompt ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const selected = useMemo(() => promptItems.find((item) => item.id === selectedId) ?? promptItems[0], [selectedId]);
  const meta = promptMeta[selected.id as keyof typeof promptMeta];
  const simulatedConfidence = Math.min(0.99, selected.testResult.confidence + (testInput.length > 26 ? 0.02 : 0));

  return (
    <div className="space-y-6">
      <section className="soft-glow overflow-hidden rounded-[34px]">
        <div className="glass-card-solid relative rounded-[34px] p-7 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(124,58,237,0.2),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(91,140,255,0.18),transparent_28%)]" />
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge variant="cyan" className="w-fit">
                Semantic Prompt Lab
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-[54px]">像 AI 规则工作台一样管理 Prompt。</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
                左侧是标签层级结构，中间是当前 Prompt 配置和版本信息，右侧是测试面板。默认以配置查看为主，不再把整块编辑态直接铺满。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <MetaHero label="Active version" value={selected.version} />
              <MetaHero label="Prompt count" value={`${promptItems.length}`} />
              <MetaHero label="Lab confidence" value={`${(selected.testResult.confidence * 100).toFixed(0)}%`} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.8fr_1.02fr_0.78fr]">
        <Card className="rounded-[30px]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
              <GitBranch className="h-4 w-4" />
              Label hierarchy
            </div>
            <div className="mt-6 space-y-4">
              {groupedTree.map((group) => (
                <div key={group.group} className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="text-sm font-semibold text-white">{group.group}</div>
                  <div className="mt-4 space-y-3">
                    {group.children.map((node) => {
                      const active = node.id === selected.id;
                      return (
                        <button
                          key={node.id}
                          onClick={() => {
                            const next = promptItems.find((item) => item.id === node.id);
                            if (!next) return;
                            setSelectedId(node.id);
                            setDraftPrompt(next.prompt);
                            setIsEditing(false);
                          }}
                          className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                            active
                              ? "border-[rgba(91,140,255,0.28)] bg-[rgba(91,140,255,0.12)]"
                              : "border-white/8 bg-[rgba(255,255,255,0.03)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-white">{node.name}</div>
                              <div className="mt-1 text-xs text-muted">{promptItems.find((item) => item.id === node.id)?.version}</div>
                            </div>
                            <Badge variant={promptItems.find((item) => item.id === node.id)?.active ? "success" : "warning"}>
                              {promptItems.find((item) => item.id === node.id)?.active ? "active" : "staged"}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                            {node.path.map((segment, index) => (
                              <span key={`${node.id}-${segment}`} className="flex items-center gap-2">
                                {segment}
                                {index < node.path.length - 1 ? <ChevronRight className="h-3 w-3" /> : null}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
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
                <div className="text-xs uppercase tracking-[0.22em] text-muted">Prompt configuration</div>
                <h2 className="mt-3 text-3xl font-semibold text-white">{meta.labelName}</h2>
                <p className="mt-3 text-sm leading-7 text-muted">{meta.definition}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selected.active ? "success" : "warning"}>{selected.version}</Badge>
                <Button size="sm" variant={isEditing ? "secondary" : "primary"} onClick={() => setIsEditing((value) => !value)}>
                  <PencilLine className="h-4 w-4" />
                  {isEditing ? "收起编辑" : "进入编辑"}
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <MetaCard label="Published at" value={selected.publishedAt} />
              <MetaCard label="Current effective" value={selected.active ? "Yes" : "No"} />
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Tree path</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {meta.tree.map((node) => (
                  <Badge key={node} variant="default">
                    {node}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Prompt definition</div>
              {isEditing ? (
                <div className="mt-4">
                  <Textarea value={draftPrompt} onChange={(event) => setDraftPrompt(event.target.value)} className="min-h-[220px]" />
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-white/8 bg-[rgba(7,11,20,0.34)] p-4 text-sm leading-7 text-white">
                  {draftPrompt}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <PromptExample title="Positive examples" items={selected.positives} tone="cyan" />
              <PromptExample title="Negative examples" items={selected.negatives} tone="danger" />
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                <ShieldAlert className="h-4 w-4" />
                Conflict labels
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.conflicts.map((conflict) => (
                  <Badge key={conflict} variant="warning">
                    {conflict}
                  </Badge>
                ))}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-6 flex gap-3">
                <Button variant="primary">Publish new version</Button>
                <Button>Save draft</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[30px]">
          <CardContent className="p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-muted">Simulation panel</div>
            <h2 className="mt-3 text-3xl font-semibold text-white">实时测试</h2>
            <p className="mt-3 text-sm leading-7 text-muted">输入一段模拟 VOC，观察输出标签、置信度和命中原因。</p>
            <div className="mt-6">
              <Textarea value={testInput} onChange={(event) => setTestInput(event.target.value)} className="min-h-[180px]" />
            </div>
            <div className="mt-6 rounded-[24px] border border-[rgba(91,140,255,0.18)] bg-[rgba(91,140,255,0.08)] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Simulated output labels</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.testResult.output.map((output) => (
                  <Badge key={output} variant="default">
                    {output}
                  </Badge>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                <MetaCard label="Confidence" value={`${(simulatedConfidence * 100).toFixed(1)}%`} />
                <MetaCard label="Hit reason" value={selected.testResult.reason} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetaHero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function PromptExample({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "cyan" | "danger";
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">{title}</div>
        <Badge variant={tone}>{tone}</Badge>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-[18px] border border-white/8 bg-[rgba(7,11,20,0.34)] p-4 text-sm leading-6 text-white">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 text-sm leading-7 text-white">{value}</div>
    </div>
  );
}
