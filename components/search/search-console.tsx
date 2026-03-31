"use client";

import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown, Search, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchResults } from "@/lib/mock-data/voc";
import { cn } from "@/lib/utils";

export function SearchConsole() {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [expandedId, setExpandedId] = useState(searchResults[0]?.id ?? "");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-30");

  const filtered = useMemo(() => {
    return searchResults.filter((item) => {
      const queryMatch =
        !query ||
        item.voiceContent.toLowerCase().includes(query.toLowerCase()) ||
        item.summary.toLowerCase().includes(query.toLowerCase());
      const channelMatch = channel === "all" || item.sourceChannel === channel;
      const sentimentMatch = sentiment === "all" || item.sentimentLabel === sentiment;
      return queryMatch && channelMatch && sentimentMatch;
    });
  }, [channel, query, sentiment]);

  return (
    <div className="space-y-6">
      <section className="soft-glow overflow-hidden rounded-[34px]">
        <div className="glass-card-solid relative rounded-[34px] p-7 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(91,140,255,0.22),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.16),transparent_28%)]" />
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
            <div>
              <Badge variant="cyan" className="w-fit">
                Voice Search & Analysis
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-[54px]">像检索台一样查看 VOC，而不是结果表格。</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
                大搜索框、多维过滤器、卡片化结果和展开式分析，让语义查询页本身也具备控制台气质。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <HeroMetric label="Result pool" value={`${searchResults.length}`} />
              <HeroMetric label="High risk" value={`${searchResults.filter((item) => item.risk).length}`} />
              <HeroMetric label="Negative share" value={`${Math.round((searchResults.filter((item) => item.sentimentLabel === "负面").length / searchResults.length) * 100)}%`} />
            </div>
          </div>
        </div>
      </section>

      <Card className="rounded-[32px]">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索原始 voice_content、分析摘要、标签词或风险信号..."
              className="h-16 rounded-[28px] pl-14 text-base"
            />
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-6">
            <FilterPill
              label="source_channel"
              value={channel}
              onChange={setChannel}
              options={["all", ...Array.from(new Set(searchResults.map((item) => item.sourceChannel)))]}
            />
            <FilterPill label="sentiment" value={sentiment} onChange={setSentiment} options={["all", "正面", "中性", "负面"]} />
            <StaticPill label="brand" value="All brands" />
            <StaticPill label="product_category" value="All categories" />
            <StaticPill label="label hierarchy" value="All levels" />
            <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                <CalendarRange className="h-4 w-4" />
                Date range
              </div>
              <div className="mt-3 flex gap-2">
                <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-10 rounded-xl px-3 text-xs" />
                <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-10 rounded-xl px-3 text-xs" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filtered.map((result) => {
          const expanded = expandedId === result.id;
          return (
            <Card key={result.id} className="rounded-[28px]">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-4xl">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">{result.sourceChannel}</Badge>
                      <Badge variant={result.sentimentLabel === "负面" ? "danger" : result.sentimentLabel === "正面" ? "success" : "warning"}>
                        {result.sentimentLabel}
                      </Badge>
                      {result.risk ? <Badge variant="danger">Risk</Badge> : null}
                    </div>
                    <h3 className="mt-4 text-xl leading-8 text-white">{result.voiceContent}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.labels.map((label) => (
                        <Badge key={label} variant="cyan">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setExpandedId(expanded ? "" : result.id)} className="flex items-center gap-2 text-sm text-[#afd3ff]">
                    {expanded ? "Collapse" : "Expand"}
                    <ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} />
                  </button>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  <SummaryBox label="Brand" value={result.brand} />
                  <SummaryBox label="Category" value={result.productCategory} />
                  <SummaryBox label="Time" value={result.time} />
                  <SummaryBox label="Sentiment score" value={result.sentimentScore.toFixed(2)} />
                </div>

                {expanded ? (
                  <div className="mt-6 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                      <div>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                          <Sparkles className="h-4 w-4" />
                          Analysis summary
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white">{result.summary}</p>
                      </div>
                      <div className="rounded-[22px] border border-[rgba(244,63,94,0.16)] bg-[rgba(244,63,94,0.08)] p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                          <ShieldAlert className="h-4 w-4 text-[#ff88a2]" />
                          Risk marker
                        </div>
                        <div className="mt-3 text-sm leading-7 text-white">
                          {result.risk ? "该条 VOC 已被纳入风险聚合观察清单。" : "该条 VOC 未触发额外升级，但可继续用于标签与情绪校准。"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
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

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-10 w-full rounded-xl border border-white/8 bg-[rgba(7,11,20,0.6)] px-3 text-sm text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function StaticPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 text-sm text-white">{value}</div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 text-sm text-white">{value}</div>
    </div>
  );
}
