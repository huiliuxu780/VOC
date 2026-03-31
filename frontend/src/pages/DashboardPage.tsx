import { Activity, Cpu, Database, Siren } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "../components/ui/KpiCard";
import { Panel } from "../components/ui/Panel";

const trend = [
  { t: "10:00", run: 220 },
  { t: "11:00", run: 280 },
  { t: "12:00", run: 250 },
  { t: "13:00", run: 320 },
  { t: "14:00", run: 300 },
  { t: "15:00", run: 355 }
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="今日处理记录" value="128,420" trend="+12.8% vs yesterday" />
        <KpiCard label="模型成功率" value="97.6%" trend="error rate 2.4%" />
        <KpiCard label="队列积压" value="1,294" trend="-18.2% in 1h" />
        <KpiCard label="告警数" value="7" trend="P1:1 / P2:2 / P3:4" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="平台运行态势"
          description="按小时观测作业吞吐与模型执行热度"
          rightSlot={<Activity size={16} className="text-indigo-300" />}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="t" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(255,255,255,0.12)" }} />
                <Line dataKey="run" stroke="#7B6DFF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="系统总控状态" description="核心链路与组件健康评分">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-white/10 p-3"><span className="inline-flex items-center gap-2"><Database size={14} /> 数据接入</span><b className="text-emerald-300">Healthy</b></li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 p-3"><span className="inline-flex items-center gap-2"><Cpu size={14} /> 模型服务</span><b className="text-emerald-300">Stable</b></li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 p-3"><span className="inline-flex items-center gap-2"><Siren size={14} /> 告警中心</span><b className="text-amber-300">Watch</b></li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
