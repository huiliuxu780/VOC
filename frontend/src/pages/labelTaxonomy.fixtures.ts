import type { LabelNodeConfigRecord, LabelNodeRecord, LabelTaxonomyRecord, LabelTaxonomyVersionRecord } from "../lib/api";

const NOW = "2026-04-02T12:00:00Z";

export const demoTaxonomies: LabelTaxonomyRecord[] = [
  {
    id: "tax-install-service",
    name: "安装服务 VOC 标签体系",
    code: "VOC_INSTALL_SERVICE",
    description: "用于安装预约、履约、超时、服务态度等用户声音结构化打标。",
    businessScope: ["安装服务", "客服"],
    categoryScope: ["家电", "家居"],
    owner: "VOC Ops",
    status: "draft",
    currentVersionId: "ver-install-v1-1",
    nodeCount: 8,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: "system",
    updatedBy: "system"
  },
  {
    id: "tax-after-sale",
    name: "售后问题 VOC 标签体系",
    code: "VOC_AFTER_SALE",
    description: "用于售后流程、退款、维修时效相关标签识别。",
    businessScope: ["售后", "客服"],
    categoryScope: ["家电"],
    owner: "AfterSale Team",
    status: "published",
    currentVersionId: "ver-after-sale-v2-0",
    nodeCount: 12,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "tax-platform-common",
    name: "平台通用 VOC 标签体系",
    code: "VOC_COMMON",
    description: "沉淀跨业务线共享标签定义与映射规范。",
    businessScope: ["平台"],
    categoryScope: ["全品类"],
    owner: "Platform",
    status: "archived",
    currentVersionId: "ver-common-v1-0",
    nodeCount: 6,
    createdAt: NOW,
    updatedAt: NOW
  }
];

export const demoVersions: LabelTaxonomyVersionRecord[] = [
  {
    id: "ver-install-v1-0",
    taxonomyId: "tax-install-service",
    version: "v1.0",
    status: "published",
    changeLog: "初始发布版本",
    nodeCount: 6,
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "ver-install-v1-1",
    taxonomyId: "tax-install-service",
    version: "v1.1",
    status: "draft",
    changeLog: "补充安装重试与改约规则",
    nodeCount: 8,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "ver-after-sale-v2-0",
    taxonomyId: "tax-after-sale",
    version: "v2.0",
    status: "published",
    changeLog: "新增物流破损与补发判定",
    nodeCount: 12,
    createdAt: NOW,
    updatedAt: NOW,
    publishedAt: NOW
  }
];

export const demoNodes: LabelNodeRecord[] = [
  {
    id: "node-install-root",
    taxonomyVersionId: "ver-install-v1-1",
    parentId: null,
    name: "安装服务",
    code: "L1_INSTALL",
    level: 1,
    pathNames: ["安装服务"],
    pathIds: ["node-install-root"],
    isLeaf: false,
    llmEnabled: true,
    sortOrder: 1,
    status: "enabled",
    hasConfig: true,
    hasExamples: true,
    configStatus: "published",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "node-install-delay",
    taxonomyVersionId: "ver-install-v1-1",
    parentId: "node-install-root",
    name: "安装超时",
    code: "L2_INSTALL_DELAY",
    level: 2,
    pathNames: ["安装服务", "安装超时"],
    pathIds: ["node-install-root", "node-install-delay"],
    isLeaf: true,
    llmEnabled: true,
    sortOrder: 2,
    status: "enabled",
    hasConfig: true,
    hasExamples: true,
    configStatus: "draft",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "node-install-reschedule",
    taxonomyVersionId: "ver-install-v1-1",
    parentId: "node-install-root",
    name: "改约问题",
    code: "L2_INSTALL_RESCHEDULE",
    level: 2,
    pathNames: ["安装服务", "改约问题"],
    pathIds: ["node-install-root", "node-install-reschedule"],
    isLeaf: true,
    llmEnabled: true,
    sortOrder: 3,
    status: "enabled",
    hasConfig: false,
    hasExamples: false,
    configStatus: "empty",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "node-install-attitude",
    taxonomyVersionId: "ver-install-v1-1",
    parentId: "node-install-root",
    name: "服务态度",
    code: "L2_INSTALL_ATTITUDE",
    level: 2,
    pathNames: ["安装服务", "服务态度"],
    pathIds: ["node-install-root", "node-install-attitude"],
    isLeaf: true,
    llmEnabled: false,
    sortOrder: 4,
    status: "enabled",
    hasConfig: true,
    hasExamples: false,
    configStatus: "invalid",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "node-after-sale-root",
    taxonomyVersionId: "ver-after-sale-v2-0",
    parentId: null,
    name: "售后问题",
    code: "L1_AFTER_SALE",
    level: 1,
    pathNames: ["售后问题"],
    pathIds: ["node-after-sale-root"],
    isLeaf: false,
    llmEnabled: true,
    sortOrder: 1,
    status: "enabled",
    hasConfig: true,
    hasExamples: true,
    configStatus: "published",
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: "node-after-sale-refund",
    taxonomyVersionId: "ver-after-sale-v2-0",
    parentId: "node-after-sale-root",
    name: "退款进度",
    code: "L2_REFUND_PROGRESS",
    level: 2,
    pathNames: ["售后问题", "退款进度"],
    pathIds: ["node-after-sale-root", "node-after-sale-refund"],
    isLeaf: true,
    llmEnabled: true,
    sortOrder: 2,
    status: "enabled",
    hasConfig: true,
    hasExamples: true,
    configStatus: "published",
    createdAt: NOW,
    updatedAt: NOW
  }
];

export const demoNodeConfigs: LabelNodeConfigRecord[] = [
  {
    id: "cfg-install-delay-v1",
    labelNodeId: "node-install-delay",
    version: "v1.1",
    promptName: "安装超时判定",
    definition: "用户反馈预约安装未按承诺时间完成。",
    decisionRule: "若文本包含超时、延期且主体为安装履约流程，判定命中。",
    excludeRule: "仅吐槽物流，且未涉及安装预约，不命中。",
    taggingRule: "命中后输出 label=L2_INSTALL_DELAY。",
    systemPrompt: "你是 VOC 标签判定专家，按定义输出结构化 JSON。",
    userPromptTemplate: "输入文本：{{content_text}}",
    outputSchema: "{\"label\":\"string\",\"confidence\":\"number\",\"reason\":\"string\"}",
    postProcessRule: "confidence < 0.5 时输出 uncertain=true。",
    fallbackStrategy: "无法判断时回退 L1_INSTALL。",
    riskNote: "“晚到”可能是物流晚到，需结合安装语义。",
    modelName: "gpt-4.1-mini",
    temperature: 0.1,
    status: "draft",
    createdAt: NOW,
    updatedAt: NOW
  }
];

export function getDemoTaxonomyById(taxonomyId: string) {
  return demoTaxonomies.find((item) => item.id === taxonomyId) ?? null;
}

export function getDemoVersionsByTaxonomy(taxonomyId: string) {
  return demoVersions.filter((item) => item.taxonomyId === taxonomyId);
}

export function getDemoVersionById(versionId: string) {
  return demoVersions.find((item) => item.id === versionId) ?? null;
}

export function getDemoNodesByVersion(versionId: string) {
  return demoNodes
    .filter((item) => item.taxonomyVersionId === versionId)
    .sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function getDemoNodeConfig(nodeId: string) {
  return demoNodeConfigs.find((item) => item.labelNodeId === nodeId) ?? null;
}

export function defaultVersionIdForTaxonomy(taxonomyId: string) {
  const taxonomy = getDemoTaxonomyById(taxonomyId);
  if (taxonomy?.currentVersionId) return taxonomy.currentVersionId;
  const version = getDemoVersionsByTaxonomy(taxonomyId)[0];
  return version?.id ?? "";
}
