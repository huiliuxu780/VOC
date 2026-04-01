# 分支记录

用于记录每个分支的用途、范围、状态、验证情况和后续动作。

状态枚举说明：
- `planned`：已规划
- `in_progress`：进行中
- `blocked`：阻塞中
- `review_ready`：可提审
- `merged`：已合并
- `abandoned`：已废弃

---

## 模板

## `<branch-name>`

- **用途：**
- **任务类型：** 功能开发 / 问题修复 / 重构 / 文档 / 杂项 / 实验 / 紧急修复
- **关联页面/模块：**
- **基于分支：** main
- **主要改动文件：**
  - `path/to/file`
- **当前状态：** in_progress
- **改动说明：**
- **验证情况：**
  - lint：
  - tests：
  - type-check：
  - build：
  - 手工验证：
- **风险说明：**
- **下一步：**

---

## docs/design-doc-encoding-fix

- **用途：** 修复设计文档乱码并保留一份干净中文版本，提升文档可读性与可维护性
- **任务类型：** 文档
- **关联页面/模块：** `docs/voc-ai-labeling-platform-design.md`、`docs/TODO.md`
- **基于分支：** main
- **主要改动文件：**
  - `docs/voc-ai-labeling-platform-design.md`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** review_ready
- **改动说明：** 将设计文档明确标记为 UTF-8 中文主版本，并在文档头部增加编码与唯一维护版本说明；同步更新 TODO，完成“修复编码问题并保留干净中文版”任务项。
- **验证情况：**
  - lint：不适用
  - tests：不适用
  - type-check：不适用
  - build：不适用
  - 手工验证：`Get-Content -Encoding utf8 docs/voc-ai-labeling-platform-design.md` 抽样检查标题与章节可读；`rg` 未发现常见乱码片段
- **风险说明：** 终端若使用非 UTF-8 默认编码查看文件，仍可能出现显示乱码，需要明确使用 UTF-8 打开/查看。
- **下一步：** 合并到 `main`，后续文档统一按 UTF-8 维护并以该文件作为中文主版本。

---

## docs/shadcn-skills-sync

- **用途：** 将 shadcn/ui 官方仓库中的 `skills/shadcn` 内容同步到本项目，供本仓库协作与开发参考
- **任务类型：** 文档
- **关联页面/模块：** `docs/skills`
- **基于分支：** main
- **主要改动文件：**
  - `docs/skills/shadcn/*`
  - `docs/skills/shadcn-ui.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 已从 `https://github.com/shadcn-ui/ui/tree/main/skills/shadcn` 同步官方技能目录到 `docs/skills/shadcn`（含 `SKILL.md`、`rules`、`agents`、`assets`、`evals` 及辅助说明文档），并新增 `docs/skills/shadcn/SYNC.md` 记录上游来源与同步版本；同时在 `docs/skills/shadcn-ui.md` 增补本地镜像入口说明。
- **验证情况：**
  - lint：不适用
  - tests：不适用
  - type-check：不适用
  - build：不适用
  - 手工验证：已核对 `docs/skills/shadcn` 目录完整性（`SKILL.md`、`rules/*`、`agents/openai.yml`、`assets/*`、`evals/evals.json`）以及 `SYNC.md` 上游 commit 记录
- **风险说明：** 该目录为一次性镜像快照，后续上游更新不会自动同步，需在新任务中手工更新并刷新 `SYNC.md`。
- **下一步：** 后续如需升级以 `SYNC.md` 中的来源链接和 commit 为基线执行增量同步。

---

## docs/frontend-skill-governance

- **用途：** 固化前端技能协同优先级，确保后续开发统一按 `ui-ux-pro-max + 组件体系规则 + shadcn` 执行
- **任务类型：** 文档
- **关联页面/模块：** 仓库前端开发规范（`AGENTS.md`、`docs/skills/shadcn-ui.md`）
- **基于分支：** main
- **主要改动文件：**
  - `AGENTS.md`
  - `docs/skills/shadcn-ui.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 在 `AGENTS.md` 新增“前端技能协同优先级（强制）”章节，明确 `ui-ux-pro-max` 负责设计决策、组件体系与 shadcn 规则负责实现落地，并约束禁止并行维护冲突组件体系；在 `docs/skills/shadcn-ui.md` 增补与 `ui-ux-pro-max` 的协同说明，保证仓库内策略一致。
- **验证情况：**
  - lint：不适用
  - tests：不适用
  - type-check：不适用
  - build：不适用
  - 手工验证：已核对 `AGENTS.md` 与 `docs/skills/shadcn-ui.md` 均包含协同优先级与执行约束
- **风险说明：** 规则更新后若历史任务上下文仍沿用旧习惯，短期可能出现执行口径不一致，需要在后续任务中持续按新规则收敛。
- **下一步：** 后续所有前端开发与优化默认按该协同优先级执行，并在迭代复盘中持续检查执行一致性。

---

## feature/frontend-workflow-tests

- **用途：** 为前端关键页面流程补充自动化测试，覆盖核心交互与 API 联动行为
- **任务类型：** 功能开发
- **关联页面/模块：** 前端页面测试（Prompt / Label / Pipeline）
- **基于分支：** main
- **主要改动文件：**
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/vite.config.ts`
  - `frontend/src/lib/api.test.ts`
  - `frontend/src/store/pipelineStore.test.ts`
  - `frontend/src/pages/promptManagement.helpers.ts`
  - `frontend/src/pages/promptManagement.helpers.test.ts`
  - `frontend/src/pages/labelManagement.helpers.ts`
  - `frontend/src/pages/labelManagement.helpers.test.ts`
  - `frontend/src/pages/pipelineDesigner.helpers.ts`
  - `frontend/src/pages/pipelineDesigner.helpers.test.ts`
  - `frontend/src/pages/PromptManagementPage.tsx`
  - `frontend/src/pages/LabelManagementPage.tsx`
  - `frontend/src/pages/PipelineDesignerPage.tsx`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 采用轻量测试策略接入 Vitest（node 环境），避免重依赖导致的安装/执行卡顿；新增 API client、pipeline store 以及 Prompt/Label/Pipeline 页面 helper 的关键流程测试，并将页面中的可测试逻辑抽离到 helper 模块复用。
- **验证情况：**
  - lint：不适用（frontend 当前未定义 lint 流程作为本任务门禁）
  - tests：`cd frontend && npm run test` 通过（5 files, 13 tests）
  - type-check：`cd frontend && npm run build` 已包含 `tsc -b`，通过
  - build：`cd frontend && npm run build` 通过
  - 手工验证：核对关键工作流覆盖点（筛选、映射、payload 组装、store 状态变更）已入测试
- **风险说明：** 首版采用轻量单测为主，尚未覆盖真实 DOM 交互与路由级集成，后续可按迭代引入更完整的页面交互测试。
- **下一步：** 下一轮补充高价值页面的 DOM 交互测试与回归清单（优先 Job/Prompt 页）。

---

## feature/frontend-dom-interaction-tests

- **用途：** 为 Job / Prompt 管理页面补充 DOM 交互级测试，覆盖用户点击行为与请求触发
- **任务类型：** 功能开发
- **关联页面/模块：** `frontend/src/pages/JobManagementPage.tsx`、`frontend/src/pages/PromptManagementPage.tsx`
- **基于分支：** main
- **主要改动文件：**
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/src/test/domTestUtils.ts`
  - `frontend/src/pages/JobManagementPage.dom.test.ts`
  - `frontend/src/pages/PromptManagementPage.dom.test.ts`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 新增 `happy-dom` 轻量 DOM 测试环境，并补充 Job/Prompt 两个高价值页面的交互级测试，覆盖按钮点击后的请求触发与状态提示；同时新增可复用 `domTestUtils` 统一渲染、等待与点击行为，降低页面级用例样板代码。
- **验证情况：**
  - lint：不适用（本轮未以 lint 作为门禁）
  - tests：`cd frontend && npm run test` 通过（7 files, 16 tests）
  - type-check：`cd frontend && npm run build` 已包含 `tsc -b`，通过
  - build：`cd frontend && npm run build` 通过
  - 手工验证：已检查 Trigger / Publish 等关键交互在测试中完成请求触发断言
- **风险说明：** 当前仍以页面局部交互测试为主，尚未覆盖跨页面路由联动与真实网络层集成。
- **下一步：** 下一轮补 `Monitoring/Label` 的 DOM 交互回归用例。

---

## feature/frontend-dom-monitoring-label

- **用途：** 为 Monitoring / Label 页面补齐 DOM 交互回归测试
- **任务类型：** 功能开发
- **关联页面/模块：** `frontend/src/pages/MonitoringPage.tsx`、`frontend/src/pages/LabelManagementPage.tsx`
- **基于分支：** main
- **主要改动文件：**
  - `frontend/src/pages/MonitoringPage.dom.test.ts`
  - `frontend/src/pages/LabelManagementPage.dom.test.ts`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 为 `MonitoringPage` 新增告警 Ack 交互回归测试（覆盖按钮点击触发 API + 列表状态刷新）；为 `LabelManagementPage` 新增新建保存测试与未保存标签的 Move 禁用态测试，确保关键交互在 DOM 层可回归。
- **验证情况：**
  - lint：不适用（本轮未以 lint 作为门禁）
  - tests：`cd frontend && npm run test` 通过（9 files, 19 tests）
  - type-check：`cd frontend && npm run build` 已包含 `tsc -b`，通过
  - build：`cd frontend && npm run build` 通过
  - 手工验证：已检查 `Ack/New Label/Move disabled` 关键交互在测试中完成断言
- **风险说明：** 当前 DOM 测试仍以模块内交互为主，尚未覆盖路由切换与跨页面状态联动。
- **下一步：** 后续可补全路由级集成回归测试。

---

## feature/frontend-router-integration-tests

- **用途：** 增加跨页面路由级集成回归测试，验证导航切换与关键接口串联
- **任务类型：** 功能开发
- **关联页面/模块：** `frontend/src/layout/*`、`frontend/src/pages/*`、`frontend/src/app/*`
- **基于分支：** main
- **主要改动文件：**
  - `frontend/src/test/domTestUtils.ts`
  - `frontend/src/app/router.integration.dom.test.ts`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 新增路由级 DOM 集成回归测试，覆盖 `Label -> Prompt -> Monitoring` 的侧边导航切换，并断言页面切换后关键 API 链路依次触发；同时在测试工具中新增 `findLinkByText` 以支持导航点击断言。
- **验证情况：**
  - lint：不适用（本轮未以 lint 作为门禁）
  - tests：`cd frontend && npm run test` 通过（10 files, 20 tests）
  - type-check：`cd frontend && npm run build` 已包含 `tsc -b`，通过
  - build：`cd frontend && npm run build` 通过
  - 手工验证：单独执行 `vitest run src/app/router.integration.dom.test.ts` 通过
- **风险说明：** 当前集成测试以 mock API 为主，尚未覆盖真实后端联调与网络异常恢复路径。
- **下一步：** 后续补充接口异常场景与重试路径的路由级回归。

---

## feature/frontend-router-error-regression

- **用途：** 补充路由级接口异常回归测试，确保失败提示与导航可恢复
- **任务类型：** 功能开发
- **关联页面/模块：** `frontend/src/app/router.integration.dom.test.ts`、`frontend/src/layout/*`
- **基于分支：** main
- **主要改动文件：**
  - `frontend/src/app/router.integration.dom.test.ts`
  - `frontend/src/test/domTestUtils.ts`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 在路由级集成测试中补充异常恢复用例：监控页接口失败时展示错误提示，随后通过侧边导航回到标签页并恢复正常加载；同时新增按路径定位导航链接的测试工具，规避文案编码差异导致的断言脆弱性。
- **验证情况：**
  - lint：不适用（本轮未以 lint 作为门禁）
  - tests：`cd frontend && npm run test` 通过（10 files, 21 tests）
  - type-check：`cd frontend && npm run build` 已包含 `tsc -b`，通过
  - build：`cd frontend && npm run build` 通过
  - 手工验证：单独执行 `vitest run src/app/router.integration.dom.test.ts` 通过（2 tests）
- **风险说明：** 异常回归仍基于 mock API，尚未覆盖真实网络抖动下的重试退避策略。
- **下一步：** 后续补充重试按钮与错误边界 UI 的端到端回归。

---

## docs/branch-workflow

- **用途：** 为仓库建立长期可复用的分支开发规范、分支记录机制和 PR 模板，保证后续 Codex 与人工协作都按统一流程执行
- **任务类型：** 文档
- **关联页面/模块：** 仓库开发流程
- **基于分支：** main
- **主要改动文件：**
  - `AGENTS.md`
  - `docs/branch-log.md`
  - `.github/pull_request_template.md`
  - `README.md`
- **当前状态：** merged
- **改动说明：** 新增仓库级代理规则文件、中文分支记录模板以及中文 PR 模板，并在 README 顶部补充 AGENTS.md 约束提示，固化分支开发、记录、验证、汇报方式。
- **验证情况：**
  - lint：不适用
  - tests：不适用
  - type-check：不适用
  - build：不适用
  - 手工验证：已逐项检查字段完整性与可执行性
- **风险说明：** 后续若团队成员未持续更新分支记录，实际执行效果会打折扣。
- **下一步：** 规范已入主干，后续所有开发任务按该流程执行并持续维护分支记录。

---

## feature/config-db-persistence

- **用途：** 将 datasource/jobs 配置从内存数组切换为数据库持久化，完成配置模块 P0 持久化收口
- **任务类型：** 功能开发
- **关联页面/模块：** 后端配置 API（`/api/v1/datasources`、`/api/v1/jobs`）
- **基于分支：** docs/branch-workflow
- **主要改动文件：**
  - `backend/app/api/v1/datasource.py`
  - `backend/app/api/v1/jobs.py`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** datasource/jobs 列表与创建改为 DB CRUD，补充 seed、唯一性校验与关联校验；运行种子改为按 job code 关联；更新项目 TODO 为已完成。
- **验证情况：**
  - lint：未执行（本次未涉及前端/样式规范项）
  - tests：未执行（仓库当前无 datasource/jobs 自动化用例）
  - type-check：不适用（Python 后端）
  - build：不适用
  - 手工验证：`python -m compileall app` 通过；函数级冒烟验证通过（创建 datasource/job + trigger + runs 查询）
- **风险说明：** datasource 默认 seed 文案改为英文，可能与前端展示预期存在差异。
- **下一步：** 持续补充 datasource/jobs 自动化测试，并继续推进下一个 P0（Pipeline Designer 持久化）。

---

## feature/pipeline-designer-persistence

- **用途：** 完成 Pipeline Designer 端到端流程，支持按 job 持久化保存/加载 pipeline 配置
- **任务类型：** 功能开发
- **关联页面/模块：** `frontend/src/pages/PipelineDesignerPage.tsx`、`frontend/src/store/pipelineStore.ts`、后端 `/api/v1/jobs`
- **基于分支：** main
- **主要改动文件：**
  - `backend/app/api/v1/jobs.py`
  - `backend/app/schemas/job.py`
  - `backend/app/schemas/__init__.py`
  - `frontend/src/pages/PipelineDesignerPage.tsx`
  - `frontend/src/store/pipelineStore.ts`
  - `frontend/src/lib/api.ts`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 新增 job 级 pipeline 配置 GET/PUT API 与配置归一化逻辑；前端 Pipeline 页面接入按 job 读取、编辑、保存与重载；store 从本地 seed-only 升级为可被后端配置驱动。
- **验证情况：**
  - lint：未执行（仓库当前未配置前端 lint 脚本）
  - tests：未执行（仓库当前无对应自动化测试用例）
  - type-check：`npm run build` 已包含 `tsc -b`，通过
  - build：前端 `npm run build` 通过；后端 `python -m compileall app` 通过
  - 手工验证：函数级冒烟通过（`get_job_pipeline`/`update_job_pipeline` 能保存并读回配置）
- **风险说明：** 需要确保现有 pipeline 本地交互不回归，并兼容历史 job 的空配置。
- **下一步：** 在下一轮补充 pipeline API 与页面自动化测试，并推进 P1 缺失 API 交付。

---

## docs/shadcn-ui-rules

- **用途：** 补充仓库级前端组件体系规则，并新增 shadcn/ui 技能文档，统一基础组件复用策略
- **任务类型：** 文档
- **关联页面/模块：** 仓库开发规范 / `docs/skills`
- **基于分支：** main
- **主要改动文件：**
  - `AGENTS.md`
  - `docs/skills/shadcn-ui.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 在 `AGENTS.md` 增补“前端组件体系规则”完整章节；新增 `docs/skills/shadcn-ui.md`，固化 shadcn/ui 组件复用优先级、Textarea 规则、字段结构与可访问性要求。
- **验证情况：**
  - lint：不适用
  - tests：不适用
  - type-check：不适用
  - build：不适用
  - 手工验证：已检查 `AGENTS.md` 目标章节存在，`docs/skills/shadcn-ui.md` 内容完整且路径正确
- **风险说明：** 规则文档如果与现有代码实践不一致，短期可能需要逐步过渡。
- **下一步：** 后续前端任务默认按该规则执行，并在迭代中持续收敛历史组件实现差异。

---

## feature/missing-monitoring-settings-apis

- **用途：** 补齐设计文档中缺失的 P1 API：`/monitoring/queues`、`/monitoring/apis`、`/settings/models`
- **任务类型：** 功能开发
- **关联页面/模块：** 后端监控与系统设置 API（`backend/app/api/v1`）
- **基于分支：** main
- **主要改动文件：**
  - `backend/app/api/v1/monitoring.py`
  - `backend/app/api/v1/settings.py`
  - `backend/app/api/v1/router.py`
  - `backend/app/schemas/settings.py`
  - `backend/app/schemas/__init__.py`
  - `README.md`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 在监控模块补齐 `/monitoring/queues`、`/monitoring/apis`；新增设置模块并实现 `/settings/models` 的 `GET/PUT`（含模型配置 seed 与 upsert 更新）；路由已接入并同步文档。
- **验证情况：**
  - lint：不适用（后端 Python）
  - tests：未执行（当前仓库无对应自动化测试）
  - type-check：不适用
  - build：`python -m compileall app` 通过
  - 手工验证：函数级冒烟通过（queues/apis 可读；settings/models 支持查询与更新）
- **风险说明：** 若返回字段与前端未来接入预期不一致，后续仍需一次字段对齐。
- **下一步：** 在后续迭代补充这三组 API 的自动化测试与前端接入页面，并继续推进 `run_pipeline_mock` 替换。

---

## feature/staged-pipeline-service

- **用途：** 将 `run_pipeline_mock` 占位逻辑替换为分阶段执行服务，触发与重试都走统一执行流程
- **任务类型：** 功能开发
- **关联页面/模块：** 后端作业执行链路（`backend/app/services/pipeline_runner.py`、`backend/app/api/v1/jobs.py`）
- **基于分支：** main
- **主要改动文件：**
  - `backend/app/services/pipeline_runner.py`
  - `backend/app/api/v1/jobs.py`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** `run_pipeline_mock` 已替换为后台分阶段执行服务（按阶段推进、产出统计与失败明细）；`trigger`、`retry_run`、`retry_single_failure` 全部接入新执行服务，并对活跃执行中的 run 跳过旧自动推进逻辑，避免状态互相覆盖。
- **验证情况：**
  - lint：不适用（后端 Python）
  - tests：未执行（当前仓库无对应自动化测试）
  - type-check：不适用
  - build：`python -m compileall app` 通过
  - 手工验证：函数级冒烟通过（trigger 后 run 可自动完成；single failure retry 可自动完成）
- **风险说明：** 执行服务改为后台线程后，需要注意与既有运行态自动推进逻辑的并发一致性。
- **下一步：** 在下一轮补充 pipeline 执行服务的后端自动化测试，并观察并发场景下的运行稳定性。

---

## feature/pipeline-execution-tests

- **用途：** 为分阶段 pipeline 执行服务补充后端自动化测试，覆盖 trigger/retry 与失败重试关键路径
- **任务类型：** 功能开发
- **关联页面/模块：** 后端测试（`backend/tests`）、作业执行链路（`jobs.py` / `pipeline_runner.py`）
- **基于分支：** main
- **主要改动文件：**
  - `backend/tests/test_pipeline_execution_service.py`
  - `docs/branch-log.md`
  - `docs/TODO.md`
- **当前状态：** merged
- **改动说明：** 新增后端自动化测试文件，覆盖 staged pipeline 的关键链路：`trigger_job` 自动完成、`retry_run` 自动完成、`retry_single_failure` 关联字段更新与自动完成。
- **验证情况：**
  - lint：不适用（后端 Python）
  - tests：`python -m pytest tests/test_pipeline_execution_service.py -q` 通过（3 passed）
  - type-check：不适用
  - build：`python -m compileall app` 已通过（沿用上一轮结果）
  - 手工验证：不适用（本轮以自动化测试为主）
- **风险说明：** 若测试直接使用本地 sqlite 文件，存在历史数据影响断言的风险，需要使用唯一 run_id/record_id 降低耦合。
- **下一步：** 后续可补充 fixture 隔离测试数据库，进一步降低与历史数据耦合，并扩展到 monitoring/settings 新增 API 测试。

---

## feature/monitoring-settings-tests

- **用途：** 为 `/monitoring/queues`、`/monitoring/apis`、`/settings/models` 补充后端自动化测试
- **任务类型：** 功能开发
- **关联页面/模块：** 后端测试（`backend/tests`）、监控/设置 API（`monitoring.py`、`settings.py`）
- **基于分支：** main
- **主要改动文件：**
  - `backend/tests/test_monitoring_settings_apis.py`
  - `docs/TODO.md`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 新增 `monitoring/settings` API 自动化测试，覆盖 `/monitoring/queues`、`/monitoring/apis` 返回结构与 `/settings/models` 的查询、upsert 更新、重复 key 异常校验；同时将 TODO 中“后端关键 API 测试”标记完成。
- **验证情况：**
  - lint：不适用（后端 Python）
  - tests：`python -m pytest tests -q` 通过（6 passed）
  - type-check：不适用
  - build：不适用（测试任务）
  - 手工验证：不适用（本轮以自动化测试为主）
- **风险说明：** 现阶段测试仍依赖共享 sqlite 数据文件，未来可通过 fixture 隔离进一步降低数据串扰风险。
- **下一步：** 处理 `datetime.utcnow` 去弃用告警并引入独立测试数据库 fixture，提升测试稳定性与可维护性。

---

## refactor/utcnow-fixture-hardening

- **用途：** 消除后端 `datetime.utcnow` 弃用告警，并为 pytest 引入独立测试数据库 fixture
- **任务类型：** 重构
- **关联页面/模块：** 后端时间工具/模型默认时间、测试基础设施（`backend/tests/conftest.py`）
- **基于分支：** main
- **主要改动文件：**
  - `backend/app/core/time_utils.py`
  - `backend/app/models/*.py`
  - `backend/app/api/v1/jobs.py`
  - `backend/app/api/v1/monitoring.py`
  - `backend/app/services/pipeline_runner.py`
  - `backend/tests/conftest.py`
  - `backend/tests/*.py`
  - `docs/branch-log.md`
- **当前状态：** merged
- **改动说明：** 新增 `app/core/time_utils.py` 统一 UTC 时间函数，并将后端模型/API/服务及相关测试中的 `datetime.utcnow` 全量替换为统一工具；新增 pytest 独立 sqlite fixture，按测试重置表结构，并在会话结束时显式释放引擎后清理临时数据库文件，避免 Windows 文件锁导致 teardown 失败。
- **验证情况：**
  - lint：不适用（后端 Python）
  - tests：`python -m pytest tests -q` 通过（6 passed）
  - type-check：不适用
  - build：`python -m compileall app` 通过
  - 手工验证：`rg "utcnow" backend/app backend/tests` 无命中，确认替换完成
- **风险说明：** 测试数据库清理已加入重试与引擎释放，但在极端并发/异常中断场景下仍可能残留临时 sqlite 文件，需要周期性清理临时目录。
- **下一步：** 继续下一轮迭代任务，优先推进可见业务能力与前后端联调项。

---

## feature/tag-hierarchy-page

- **用途：** 搭建 VOC 管理后台的标签层级管理页面
- **任务类型：** 功能开发
- **关联页面/模块：** 标签管理
- **基于分支：** main
- **主要改动文件：**
  - `src/pages/tag-hierarchy.tsx`
  - `src/components/tag-tree.tsx`
  - `src/components/tag-detail-panel.tsx`
  - `src/components/tag-rule-panel.tsx`
- **当前状态：** in_progress
- **改动说明：** 已完成三栏式页面结构，包含标签树、标签详情编辑区和语义规则区域。
- **验证情况：**
  - lint：未执行
  - tests：未执行
  - type-check：未执行
  - build：未执行
  - 手工验证：已完成页面结构走查
- **风险说明：** 尚未实现拖拽调整层级与真实接口联调。
- **下一步：** 接入 mock 数据并补充保存、发布交互。

---

## fix/sidebar-scroll-clipping

- **用途：** 修复后台左侧导航菜单过长时的滚动裁切问题
- **任务类型：** 问题修复
- **关联页面/模块：** 布局外壳 / Sidebar
- **基于分支：** main
- **主要改动文件：**
  - `src/components/layout/sidebar.tsx`
- **当前状态：** review_ready
- **改动说明：** 调整容器高度与 overflow 行为，确保长菜单可正常滚动。
- **验证情况：**
  - lint：本地通过
  - tests：不适用
  - type-check：本地通过
  - build：本地通过
  - 手工验证：桌面端已验证
- **风险说明：** 移动端展示仍需单独验证。
- **下一步：** 发起 PR，待 UI 检查后合并。
