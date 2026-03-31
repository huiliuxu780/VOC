# 启动说明（MVP 骨架）

## 1) 前端启动

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

默认地址：`http://localhost:5173`

### 前端安装替换方案（推荐）

如果 `npm install` 卡住，使用自动回退脚本：

```powershell
cd frontend
powershell -ExecutionPolicy Bypass -File .\setup-deps.ps1 -NoAudit
```

它会自动在 `registry.npmjs.org` 与 `registry.npmmirror.com` 之间切换重试。

## 2) 后端启动

```bash
cd backend
pip install -e .
python -m uvicorn app.main:app --reload --port 8000
```

健康检查：`http://localhost:8000/health`

## 3) API 前缀

- `/api/v1/datasources`
- `/api/v1/labels`
- `/api/v1/prompts`
- `/api/v1/jobs`
- `/api/v1/monitoring`

## 4) 当前状态

- 前端：高保真暗黑风骨架 + 关键业务页面（Dashboard/Mapping/Prompt/作业链路）。
- 后端：FastAPI 模块化路由 + 核心数据模型 + Mock 运行链路。
- 数据库：默认 SQLite（`voc.db`），后续可切 PostgreSQL/MySQL。
- 联调：数据源列表、Mapping 预览、作业触发、运行记录已打通。
