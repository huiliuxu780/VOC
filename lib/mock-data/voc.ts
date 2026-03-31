export type KPI = {
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta: string;
  detail: string;
};

export type TrendPoint = {
  day: string;
  total: number;
  negative: number;
  automation: number;
};

export type DistributionPoint = {
  name: string;
  value: number;
  color: string;
};

export type RiskAlert = {
  title: string;
  channel: string;
  severity: "critical" | "high" | "medium";
  count: number;
  description: string;
  time: string;
};

export type EngineState = {
  name: string;
  status: "online" | "optimizing" | "degraded";
  throughput: string;
  latency: string;
};

export type SourceItem = {
  id: string;
  name: string;
  sourceChannel: string;
  type: "Batch" | "Stream";
  integration: "ODPS" | "Kafka" | "API";
  status: "healthy" | "abnormal" | "delay";
  updatedAt: string;
  todayVolume: number;
  successRate: number;
  avgLatency: string;
  description: string;
};

export type LabelNode = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "active" | "draft" | "review";
  level: "L1" | "L2" | "L3" | "L4";
  path: string[];
  examples: string[];
  hitCount: number;
  negativeRate: number;
  impactChannels: string[];
};

export type PromptItem = {
  id: string;
  labelId: string;
  labelName: string;
  version: string;
  publishedAt: string;
  active: boolean;
  prompt: string;
  positives: string[];
  negatives: string[];
  conflicts: string[];
  testResult: {
    output: string[];
    confidence: number;
    reason: string;
  };
};

export type SearchResult = {
  id: string;
  voiceContent: string;
  sourceChannel: string;
  brand: string;
  productCategory: string;
  labels: string[];
  sentimentLabel: "正面" | "中性" | "负面";
  sentimentScore: number;
  risk: boolean;
  time: string;
  summary: string;
};

export type PipelineStage = {
  key: string;
  title: string;
  status: "running" | "warning" | "stable";
  processed: number;
  errorRate: number;
  avgLatency: string;
  lastIncident: string;
  trend: { name: string; value: number }[];
};

export const dashboardKpis: KPI[] = [
  {
    title: "总 VOC 数",
    value: 1284300,
    delta: "+18.4%",
    detail: "统一标准化后的客户声音总量",
  },
  {
    title: "今日新增",
    value: 18342,
    delta: "+12.1%",
    detail: "最近 24 小时新增入湖样本",
  },
  {
    title: "负面情绪占比",
    value: 18.6,
    suffix: "%",
    decimals: 1,
    delta: "-1.3%",
    detail: "sentiment_analysis 输出的负面占比",
  },
  {
    title: "自动打标覆盖率",
    value: 94.6,
    suffix: "%",
    decimals: 1,
    delta: "+2.7%",
    detail: "已完成层级标签归一的记录占比",
  },
];

export const dashboardTrend: TrendPoint[] = [
  { day: "Mon", total: 14800, negative: 3120, automation: 90 },
  { day: "Tue", total: 16240, negative: 3360, automation: 91 },
  { day: "Wed", total: 17100, negative: 3480, automation: 92 },
  { day: "Thu", total: 18220, negative: 3640, automation: 93 },
  { day: "Fri", total: 19430, negative: 3890, automation: 94 },
  { day: "Sat", total: 17680, negative: 3310, automation: 95 },
  { day: "Sun", total: 18342, negative: 3412, automation: 96 },
];

export const channelDistribution: DistributionPoint[] = [
  { name: "YTS", value: 26, color: "#5B8CFF" },
  { name: "NPS", value: 18, color: "#22D3EE" },
  { name: "KAFKA_NPS", value: 14, color: "#7C3AED" },
  { name: "ECOMMERCE", value: 23, color: "#10B981" },
  { name: "SOCIAL", value: 11, color: "#F59E0B" },
  { name: "COMPLAINT", value: 8, color: "#F43F5E" },
];

export const topLabelDistribution: DistributionPoint[] = [
  { name: "安装延迟", value: 3540, color: "#5B8CFF" },
  { name: "冰箱不制冷", value: 2910, color: "#22D3EE" },
  { name: "售后服务态度", value: 2630, color: "#7C3AED" },
  { name: "噪音大", value: 2140, color: "#10B981" },
  { name: "漏水", value: 1970, color: "#F43F5E" },
  { name: "物流破损", value: 1680, color: "#F59E0B" },
];

export const riskAlerts: RiskAlert[] = [
  {
    title: "华东地区冰箱不制冷负面声量持续抬升",
    channel: "KAFKA_NPS",
    severity: "critical",
    count: 186,
    description: "冷藏区温度异常和首次安装后不制冷反馈在 2 小时内快速聚集。",
    time: "5 min ago",
  },
  {
    title: "安装延迟在 YTS 工单出现跨城市扩散",
    channel: "YTS",
    severity: "high",
    count: 124,
    description: "预约改期与安装上门延迟叠加，导致一线客服重复安抚压力升高。",
    time: "16 min ago",
  },
  {
    title: "ECOMMERCE 渠道物流破损舆情超过预警阈值",
    channel: "ECOMMERCE",
    severity: "medium",
    count: 73,
    description: "外箱破损与玻璃面板裂纹评论在大促 SKU 下集中出现。",
    time: "29 min ago",
  },
];

export const engineStates: EngineState[] = [
  { name: "Realtime Inference", status: "online", throughput: "3.1k msg/min", latency: "1.2s" },
  { name: "Label Decision Engine", status: "optimizing", throughput: "14.8k msg/hr", latency: "4.2s" },
  { name: "Sentiment Runtime", status: "online", throughput: "16.5k msg/hr", latency: "2.1s" },
  { name: "Knowledge Sync", status: "degraded", throughput: "Sync delayed", latency: "14m" },
];

export const sourceStats = [
  { label: "Connected sources", value: "11" },
  { label: "Healthy ratio", value: "81.8%" },
  { label: "Today processed", value: "183.4k" },
  { label: "Streaming share", value: "58.2%" },
];

export const sources: SourceItem[] = [
  {
    id: "src-1",
    name: "YTS Service Ticket Mesh",
    sourceChannel: "YTS",
    type: "Batch",
    integration: "ODPS",
    status: "healthy",
    updatedAt: "2026-03-30 15:42",
    todayVolume: 28400,
    successRate: 99.4,
    avgLatency: "3.8 min",
    description: "安装、维修、换货与上门服务相关工单的核心离线接入层。",
  },
  {
    id: "src-2",
    name: "NPS Daily Survey Hub",
    sourceChannel: "NPS",
    type: "Batch",
    integration: "API",
    status: "healthy",
    updatedAt: "2026-03-30 14:58",
    todayVolume: 8160,
    successRate: 99.8,
    avgLatency: "2.2 min",
    description: "门店购买后与售后闭环满意度问卷回流，用于体验归因分析。",
  },
  {
    id: "src-3",
    name: "Kafka NPS Pulse Stream",
    sourceChannel: "KAFKA_NPS",
    type: "Stream",
    integration: "Kafka",
    status: "delay",
    updatedAt: "2026-03-30 15:31",
    todayVolume: 14820,
    successRate: 97.1,
    avgLatency: "11.4 sec",
    description: "实时 NPS 事件流，覆盖安装完成、首次开机、售后回访等关键触点。",
  },
  {
    id: "src-4",
    name: "E-commerce Review Mesh",
    sourceChannel: "ECOMMERCE",
    type: "Batch",
    integration: "ODPS",
    status: "abnormal",
    updatedAt: "2026-03-30 12:20",
    todayVolume: 22410,
    successRate: 91.4,
    avgLatency: "6.8 min",
    description: "平台评论与追评批量同步，当前一组商家商品映射字段存在异常。",
  },
  {
    id: "src-5",
    name: "Social Mention API",
    sourceChannel: "SOCIAL",
    type: "Stream",
    integration: "API",
    status: "healthy",
    updatedAt: "2026-03-30 15:38",
    todayVolume: 12230,
    successRate: 98.6,
    avgLatency: "7.1 sec",
    description: "社媒公开讨论、种草笔记与短视频评论流，侧重风险扩散监测。",
  },
  {
    id: "src-6",
    name: "Complaint Router",
    sourceChannel: "COMPLAINT",
    type: "Stream",
    integration: "Kafka",
    status: "healthy",
    updatedAt: "2026-03-30 15:44",
    todayVolume: 9350,
    successRate: 99.1,
    avgLatency: "4.4 sec",
    description: "高优投诉升级链路，直接驱动高风险标签与异常工单联动。",
  },
];

export const labelNodes: LabelNode[] = [
  {
    id: "lbl-1",
    name: "安装延迟",
    code: "INSTALL_DELAY",
    description: "用户预约安装后未按承诺时段上门，或多次改期仍未完成安装。",
    status: "active",
    level: "L4",
    path: ["履约体验", "安装服务", "预约履约", "安装延迟"],
    examples: ["约好今天上午安装，师傅一直没来。", "连续两次改期，冰箱还没装上。"],
    hitCount: 3540,
    negativeRate: 88.4,
    impactChannels: ["YTS", "NPS", "KAFKA_NPS"],
  },
  {
    id: "lbl-2",
    name: "冰箱不制冷",
    code: "NO_COOLING",
    description: "制冷功能异常，包括冷藏不冷、冷冻不结霜或运行后温度无变化。",
    status: "active",
    level: "L4",
    path: ["产品故障", "制冷系统", "核心能力", "冰箱不制冷"],
    examples: ["通电一天了还是不冷。", "冷冻室完全没有效果，食物都化了。"],
    hitCount: 2910,
    negativeRate: 93.1,
    impactChannels: ["YTS", "KAFKA_NPS", "COMPLAINT"],
  },
  {
    id: "lbl-3",
    name: "售后服务态度",
    code: "AFTERSALES_ATTITUDE",
    description: "客服或上门工程师在沟通中表现出的态度、耐心与同理心问题。",
    status: "review",
    level: "L4",
    path: ["服务体验", "售后交互", "沟通质量", "售后服务态度"],
    examples: ["客服一直打断我，也不给解决方案。", "维修师傅很耐心，解释得很清楚。"],
    hitCount: 2630,
    negativeRate: 61.2,
    impactChannels: ["YTS", "NPS", "SOCIAL"],
  },
  {
    id: "lbl-4",
    name: "噪音大",
    code: "HIGH_NOISE",
    description: "产品运行噪音明显超出预期，影响夜间使用或客厅环境体验。",
    status: "active",
    level: "L4",
    path: ["产品体验", "运行表现", "噪音控制", "噪音大"],
    examples: ["晚上压缩机声音特别大，根本睡不着。", "新机运行时一直嗡嗡响。"],
    hitCount: 2140,
    negativeRate: 78.5,
    impactChannels: ["ECOMMERCE", "SOCIAL", "NPS"],
  },
  {
    id: "lbl-5",
    name: "漏水",
    code: "WATER_LEAK",
    description: "冰箱、洗衣机或净水类产品出现渗水、滴水或地面积水现象。",
    status: "draft",
    level: "L4",
    path: ["产品故障", "结构密封", "液体异常", "漏水"],
    examples: ["用了两天底部就开始往外渗水。", "打开门后地上都是水，怀疑密封有问题。"],
    hitCount: 1970,
    negativeRate: 89.2,
    impactChannels: ["YTS", "COMPLAINT", "ECOMMERCE"],
  },
  {
    id: "lbl-6",
    name: "物流破损",
    code: "LOGISTICS_DAMAGE",
    description: "商品在运输和签收环节产生外观损伤、箱体破裂或面板裂纹。",
    status: "active",
    level: "L4",
    path: ["履约体验", "物流签收", "包装完好", "物流破损"],
    examples: ["外箱破了，侧板也磕凹了。", "送到家时门板已经有裂纹。"],
    hitCount: 1680,
    negativeRate: 84.6,
    impactChannels: ["ECOMMERCE", "SOCIAL", "COMPLAINT"],
  },
];

export const promptItems: PromptItem[] = [
  {
    id: "pr-1",
    labelId: "lbl-1",
    labelName: "安装延迟",
    version: "v3.2.1",
    publishedAt: "2026-03-28 11:00",
    active: true,
    prompt:
      "你是 VOC 标签引擎。识别用户是否明确表达安装预约延期、上门迟到、重复改期、承诺时段未兑现等安装履约问题。排除用户主动改期和仅询问安装时间的情况。",
    positives: ["约好周六上门安装，今天还没人联系我。", "已经改期两次了，冰箱一直无法使用。"],
    negatives: ["我想预约下周安装。", "安装及时，但产品噪音很大。"],
    conflicts: ["物流延迟", "售后服务态度"],
    testResult: {
      output: ["履约体验 > 安装服务 > 预约履约 > 安装延迟"],
      confidence: 0.95,
      reason: "文本包含明确的承诺时段未兑现和重复改期信号。",
    },
  },
  {
    id: "pr-2",
    labelId: "lbl-2",
    labelName: "冰箱不制冷",
    version: "v2.7.0",
    publishedAt: "2026-03-25 16:30",
    active: true,
    prompt:
      "识别冰箱、冷柜等制冷设备不制冷、制冷弱、冷冻失效或温度异常无法达标的反馈。优先关注功能故障，不要误标为噪音或安装问题。",
    positives: ["插电一天冷藏室还是常温。", "冷冻室一点都不冷，肉都化了。"],
    negatives: ["制冷正常，就是声音偏大。", "刚送到还没开机测试。"],
    conflicts: ["噪音大", "安装延迟"],
    testResult: {
      output: ["产品故障 > 制冷系统 > 核心能力 > 冰箱不制冷"],
      confidence: 0.93,
      reason: "命中制冷功能异常和温度未达标两个关键故障条件。",
    },
  },
  {
    id: "pr-3",
    labelId: "lbl-3",
    labelName: "售后服务态度",
    version: "v1.4.3",
    publishedAt: "2026-03-29 09:15",
    active: false,
    prompt:
      "识别售后客服、电话回访或上门工程师在沟通中表现出的冷漠、敷衍、不耐烦、态度好等服务态度评价。注意与解决效率区分。",
    positives: ["客服全程很不耐烦，一直让我自己看说明书。", "师傅态度很好，虽然没修好但解释得很清楚。"],
    negatives: ["问题一直没解决。", "安装时间太晚了。"],
    conflicts: ["售后处理效率", "安装延迟"],
    testResult: {
      output: ["服务体验 > 售后交互 > 沟通质量 > 售后服务态度"],
      confidence: 0.89,
      reason: "存在明显态度评价词，并直接指向售后交互体验。",
    },
  },
];

export const searchResults: SearchResult[] = [
  {
    id: "rs-1",
    voiceContent: "预约的是昨天晚上安装，结果今天下午还没人上门，客服只会让我继续等。",
    sourceChannel: "YTS",
    brand: "Aster Home",
    productCategory: "冰箱",
    labels: ["履约体验", "安装服务", "安装延迟"],
    sentimentLabel: "负面",
    sentimentScore: 0.13,
    risk: true,
    time: "2026-03-30 15:18",
    summary: "安装履约承诺失效，用户等待时间已超过 SLA。",
  },
  {
    id: "rs-2",
    voiceContent: "刚送来的冰箱插电一天了还是不制冷，冷藏室温度完全没下来。",
    sourceChannel: "KAFKA_NPS",
    brand: "Aster Home",
    productCategory: "冰箱",
    labels: ["产品故障", "制冷系统", "冰箱不制冷"],
    sentimentLabel: "负面",
    sentimentScore: 0.09,
    risk: true,
    time: "2026-03-30 14:42",
    summary: "核心制冷能力异常，已触发高优先级故障风险标记。",
  },
  {
    id: "rs-3",
    voiceContent: "客服回复速度还可以，但是态度很差，一直像在敷衍我。",
    sourceChannel: "NPS",
    brand: "Polar Smart",
    productCategory: "洗衣机",
    labels: ["服务体验", "售后交互", "售后服务态度"],
    sentimentLabel: "负面",
    sentimentScore: 0.24,
    risk: false,
    time: "2026-03-30 13:26",
    summary: "售后沟通体验差，情绪强烈但尚未形成大规模风险聚集。",
  },
  {
    id: "rs-4",
    voiceContent: "物流包装很完整，安装师傅提前联系，整个过程比预期顺畅。",
    sourceChannel: "ECOMMERCE",
    brand: "Polar Smart",
    productCategory: "洗碗机",
    labels: ["履约体验", "安装服务", "正向安装体验"],
    sentimentLabel: "正面",
    sentimentScore: 0.93,
    risk: false,
    time: "2026-03-30 12:11",
    summary: "履约和安装体验优于预期，可沉淀为正向服务样本。",
  },
  {
    id: "rs-5",
    voiceContent: "机器运行起来噪音特别大，晚上放在开放式厨房根本没法接受。",
    sourceChannel: "SOCIAL",
    brand: "Aster Home",
    productCategory: "洗碗机",
    labels: ["产品体验", "运行表现", "噪音大"],
    sentimentLabel: "中性",
    sentimentScore: 0.47,
    risk: false,
    time: "2026-03-30 10:56",
    summary: "噪音体验偏负向，但当前扩散速度较低，仍处观察阶段。",
  },
];

export const pipelineStages: PipelineStage[] = [
  {
    key: "pre_filter",
    title: "pre_filter",
    status: "stable",
    processed: 192320,
    errorRate: 0.4,
    avgLatency: "220 ms",
    lastIncident: "噪音类无效短评拦截规则已稳定运行 48h",
    trend: [
      { name: "1", value: 35 },
      { name: "2", value: 38 },
      { name: "3", value: 42 },
      { name: "4", value: 39 },
      { name: "5", value: 46 },
    ],
  },
  {
    key: "relevance_analysis",
    title: "relevance_analysis",
    status: "running",
    processed: 181204,
    errorRate: 0.9,
    avgLatency: "480 ms",
    lastIncident: "SOCIAL 渠道品牌相关性阈值已在 2h 前热更新",
    trend: [
      { name: "1", value: 28 },
      { name: "2", value: 32 },
      { name: "3", value: 36 },
      { name: "4", value: 34 },
      { name: "5", value: 39 },
    ],
  },
  {
    key: "marketing_analysis",
    title: "marketing_analysis",
    status: "warning",
    processed: 76230,
    errorRate: 2.6,
    avgLatency: "1.8 s",
    lastIncident: "大促券包字段新增导致营销意图解析回退率升高",
    trend: [
      { name: "1", value: 22 },
      { name: "2", value: 28 },
      { name: "3", value: 31 },
      { name: "4", value: 24 },
      { name: "5", value: 27 },
    ],
  },
  {
    key: "information_extraction",
    title: "information_extraction",
    status: "running",
    processed: 169420,
    errorRate: 1.1,
    avgLatency: "1.2 s",
    lastIncident: "冰箱型号与 SKU 字典 30 分钟前完成增量同步",
    trend: [
      { name: "1", value: 30 },
      { name: "2", value: 37 },
      { name: "3", value: 34 },
      { name: "4", value: 39 },
      { name: "5", value: 42 },
    ],
  },
  {
    key: "label_classify",
    title: "label_classify",
    status: "running",
    processed: 158832,
    errorRate: 1.3,
    avgLatency: "2.6 s",
    lastIncident: "安装延迟 prompt v3.2.1 上线后召回率提升 5.4%",
    trend: [
      { name: "1", value: 33 },
      { name: "2", value: 36 },
      { name: "3", value: 41 },
      { name: "4", value: 45 },
      { name: "5", value: 48 },
    ],
  },
  {
    key: "sentiment_analysis",
    title: "sentiment_analysis",
    status: "stable",
    processed: 156114,
    errorRate: 0.7,
    avgLatency: "760 ms",
    lastIncident: "中文情绪模型缓存命中率保持在 98% 以上",
    trend: [
      { name: "1", value: 29 },
      { name: "2", value: 31 },
      { name: "3", value: 33 },
      { name: "4", value: 36 },
      { name: "5", value: 40 },
    ],
  },
];

export const pipelineLogs = [
  {
    time: "15:36:12",
    level: "WARN",
    stage: "marketing_analysis",
    message: "新促销活动 payload 出现未登记字段，已切换到降级解析路径。",
  },
  {
    time: "15:32:07",
    level: "INFO",
    stage: "label_classify",
    message: "安装延迟 Prompt v3.2.1 已提升至 70% 流量并保持稳定精度。",
  },
  {
    time: "15:25:45",
    level: "INFO",
    stage: "information_extraction",
    message: "冰箱型号别名词典完成刷新，新增 41 个 SKU 映射。",
  },
  {
    time: "15:17:09",
    level: "ERROR",
    stage: "marketing_analysis",
    message: "一组满减规则无法映射到标准 schema，213 条记录进入 retry 队列。",
  },
  {
    time: "15:05:58",
    level: "INFO",
    stage: "pre_filter",
    message: "无效社媒噪音样本抑制阈值已按晨间流量自动调整。",
  },
];
