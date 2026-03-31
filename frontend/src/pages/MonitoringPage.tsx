import { Panel } from "../components/ui/Panel";

const cards = [
  { title: "数据接入成功率", value: "98.1%", detail: "近 24h, 失败主要为接口超时" },
  { title: "模型平均响应", value: "1.42s", detail: "relevance_analysis 波动偏大" },
  { title: "Kafka 积压", value: "892", detail: "topic:voc_raw_comment" },
  { title: "API 可用性", value: "99.93%", detail: "mapping preview 接口较繁忙" }
];

export function MonitoringPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {cards.map((card) => (
        <Panel key={card.title} title={card.title} description={card.detail}>
          <p className="text-3xl font-semibold text-indigo-200">{card.value}</p>
        </Panel>
      ))}
    </div>
  );
}
