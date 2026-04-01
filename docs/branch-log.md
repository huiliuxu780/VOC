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
