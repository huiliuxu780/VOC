# 基于 LLM 的 VOC 消费者原始数据打标平台

## 1. 信息架构

### 1.1 业务域划分
- 数据接入域：多源接入、字段映射、接入测试、接入记录与明细。
- 知识配置域：标签体系、标签层级、Prompt 版本、样例管理。
- 作业编排域：作业定义、链路配置、调度执行、失败重跑。
- 处理运行域：标准化、规则与模型推理、结果落地、状态追踪。
- 观测与治理域：指标监控、告警、系统配置、操作审计。

### 1.2 系统分层
- 展示层（Frontend）：运营配置与监控控制台。
- 接口层（API Gateway / FastAPI Routers）：模块化 REST API。
- 领域服务层（Domain Services）：Mapping、Prompt、Pipeline、Run 管理。
- 执行层（Worker / Scheduler）：实时消费、批处理、重跑任务。
- 基础设施层（DB/Redis/Kafka/RocketMQ/对象存储/监控）。

---

## 2. 页面 Sitemap

### 2.1 一级导航
- Dashboard
- 数据源接入
- 标签层级管理
- 标签语义 Prompt 管理
- 作业任务管理
- 监控中心
- 系统设置

### 2.2 二级页面
- Dashboard
  - 总览页
- 数据源接入
  - 数据源列表
  - 新建/编辑数据源
  - 数据源详情
  - Mapping 配置
  - 数据接入测试
  - 接入记录
  - 接入明细
- 标签层级管理
  - 标签树管理
  - 标签详情
  - 标签版本
- 标签语义 Prompt 管理
  - Prompt 列表
  - Prompt 编辑
  - 样例管理
  - 在线调试
  - 历史版本
- 作业任务管理
  - 作业列表
  - 作业配置
  - 分析链路配置
  - 运行记录
  - 数据处理明细
  - 失败重跑
- 监控中心
  - 数据接入监控
  - 模型监控
  - 队列与接口健康
  - 告警记录
- 系统设置
  - 模型配置
  - 环境配置
  - 告警阈值
  - 字典/字段配置
  - 权限预留

---

## 3. 前后端模块划分

### 3.1 前端模块（React + TS + Tailwind）
- `app-shell`：布局骨架（侧栏/顶部/内容区）。
- `dashboard`：平台总控台与关键 KPI。
- `datasource`：数据源 CRUD、接入测试、字段结构展示。
- `mapping-studio`：字段映射可视化编辑、表达式编辑、样本预览。
- `label-taxonomy`：标签树、层级管理、范围配置。
- `prompt-workbench`：Prompt 编辑、版本、样例、在线调试。
- `job-center`：作业配置、链路编排、运行记录、失败重跑。
- `monitoring`：接入/模型/队列/API 健康与告警。
- `settings`：模型、阈值、环境等系统配置。

### 3.2 后端模块（FastAPI）
- `api/v1/datasource.py`：数据源与字段结构、接入记录接口。
- `api/v1/mapping.py`：Mapping 配置、预览、版本接口。
- `api/v1/labels.py`：标签树与标签节点管理。
- `api/v1/prompts.py`：Prompt 配置、版本发布、在线调试。
- `api/v1/jobs.py`：作业配置、链路节点、触发与查询。
- `api/v1/monitoring.py`：Dashboard 指标、模型统计、健康检查。
- `services/pipeline_runner.py`：MVP Pipeline 执行入口。
- `workers/celery_app.py`：异步任务执行器。
- `tasks/scheduler.py`：定时作业调度。

---

## 4. 核心数据库表设计

### 4.1 配置类
- `datasource_config`：数据源基础信息及扩展配置。
- `datasource_mapping_config`：字段映射规则与表达式配置。
- `internal_field_definition`：内部标准字段字典。
- `label_category`：标签体系。
- `label_node`：标签树节点（1~4 级）。
- `prompt_config`：Prompt 当前版本配置。
- `prompt_example`：正例/反例/边界样本。
- `model_config`：模型与版本配置。
- `pipeline_template`：可复用链路模板。
- `job_config`：作业定义与调度配置。

### 4.2 运行类
- `job_run`：一次作业执行主记录。
- `job_run_stage`：各阶段状态与耗时。
- `ingest_record`：接入阶段每条记录明细。
- `analysis_record`：分析总结果记录。
- `analysis_stage_detail`：节点输入输出明细。
- `output_record`：结果落表/消息输出状态。

### 4.3 监控类
- `model_usage_stats`：模型调用次数、token、延迟、错误率。
- `datasource_stats`：各数据源吞吐、成功率、延迟。
- `queue_health_stats`：Kafka/RocketMQ 积压与消费状态。
- `api_health_stats`：接口可用性与异常率。
- `alert_record`：告警事件与处理状态。

### 4.4 审计类
- `operation_log`：用户操作日志。
- `config_change_log`：配置变更前后快照。

---

## 5. 核心 API 设计

### 5.1 数据源管理
- `GET /api/v1/datasources`
- `POST /api/v1/datasources`
- `GET /api/v1/datasources/{id}`
- `PUT /api/v1/datasources/{id}`
- `DELETE /api/v1/datasources/{id}`
- `POST /api/v1/datasources/{id}/test-connection`
- `GET /api/v1/datasources/{id}/schema`
- `GET /api/v1/datasources/{id}/ingest-runs`
- `GET /api/v1/datasources/{id}/ingest-records`

### 5.2 Mapping
- `GET /api/v1/mappings/{datasource_id}`
- `PUT /api/v1/mappings/{datasource_id}`
- `POST /api/v1/mappings/{datasource_id}/preview`
- `POST /api/v1/mappings/{datasource_id}/version`

### 5.3 标签管理
- `GET /api/v1/labels/tree`
- `POST /api/v1/labels`
- `PUT /api/v1/labels/{id}`
- `DELETE /api/v1/labels/{id}`
- `POST /api/v1/labels/{id}/move`
- `GET /api/v1/labels/{id}`

### 5.4 Prompt 管理
- `GET /api/v1/prompts`
- `POST /api/v1/prompts`
- `GET /api/v1/prompts/{id}`
- `PUT /api/v1/prompts/{id}`
- `POST /api/v1/prompts/{id}/publish`
- `POST /api/v1/prompts/{id}/rollback`
- `POST /api/v1/prompts/{id}/test`

### 5.5 作业管理
- `GET /api/v1/jobs`
- `POST /api/v1/jobs`
- `PUT /api/v1/jobs/{id}`
- `POST /api/v1/jobs/{id}/enable`
- `POST /api/v1/jobs/{id}/disable`
- `POST /api/v1/jobs/{id}/trigger`
- `GET /api/v1/jobs/{id}/runs`
- `GET /api/v1/jobs/runs/{run_id}/stages`
- `POST /api/v1/jobs/runs/{run_id}/retry`

### 5.6 监控与系统设置
- `GET /api/v1/monitoring/dashboard`
- `GET /api/v1/monitoring/datasources`
- `GET /api/v1/monitoring/models`
- `GET /api/v1/monitoring/queues`
- `GET /api/v1/monitoring/apis`
- `GET /api/v1/monitoring/alerts`
- `GET /api/v1/settings/models`
- `PUT /api/v1/settings/models`

---

## 6. MVP 实现范围

### 6.1 前端 MVP
- 全局暗黑科技风 Layout（侧栏 + Header + 主区）。
- Dashboard 总览页（关键指标 + 流程态势）。
- 数据源列表/编辑页（HTTP/Excel/Kafka）。
- Mapping 配置页（字段映射 + 表达式 + 预览）。
- 标签层级管理页（树 + 详情）。
- Prompt 管理页（列表 + 编辑 + 发布状态）。
- 作业列表页 + 分析链路配置页。
- 监控中心页（接入、模型、队列、接口）。

### 6.2 后端 MVP
- 数据源配置 CRUD。
- Mapping 配置 CRUD + 预览。
- 标签 CRUD。
- Prompt CRUD + 发布。
- 作业配置 CRUD + 手动触发。
- 运行记录查询。
- 模拟监控指标接口。

### 6.3 流程与落地 MVP
- 接入：HTTP / Excel / Kafka（先 mock 连接与样例数据）。
- Pipeline 节点：`pre_filter`、`relevance_analysis`、`label_classify`、`sentiment_analysis`。
- 结果：结果表 + 接入/分析明细记录。

---

## 7. 高保真页面方案

### 7.1 视觉系统
- 背景：`#05070A` + `#07090D` 分层渐变。
- 卡片：半透明深色 + 细边框 + 大圆角（16~20px）。
- 强调色：`#5B6CFF -> #8B5CFF` 渐变用于重点 CTA 与高亮。
- 文字层级：主文案高对比，辅助信息 65% 透明白。

### 7.2 交互原则
- 关键操作不超过两层点击。
- 所有列表支持“筛选 + 状态 + 详情抽屉”。
- Mapping/Prompt/链路配置页优先“工作台”布局，不走传统表单堆叠。
- 运行状态使用统一状态色与微动效反馈（克制，不炫技）。

### 7.3 核心页面重点
- Dashboard：展示“平台运行总控”而非普通卡片堆砌（链路运行状态、模型调用热点、失败聚类）。
- Mapping 配置页：左右结构（外部字段树 + 内部字段映射工作区），底部实时样本预览。
- Prompt 管理页：标签树 + Prompt 版本轨道 + 在线调试面板。
- 作业链路配置页：节点画布化编排（启停、顺序、模型、Prompt 版本）。

---

## 8. 实施策略（当前交付）
- 先交付前后端可启动骨架与假数据演示闭环。
- 通过清晰模块边界保证二期可扩展（更多数据源、节点、模型、告警）。
- 预留 Celery/Redis/Kafka 接入位，避免后续重构成本。
