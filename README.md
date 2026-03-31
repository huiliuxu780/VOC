# VOC AI Labeling Platform (MVP)

前后端分离项目：
- 前端：`frontend/`（React + Vite + Tailwind）
- 后端：`backend/`（FastAPI + SQLAlchemy）

## 快速启动

### 1) 启动前端

```powershell
cd frontend
npm install
npm run dev
```

默认地址：`http://localhost:5173`

前端安装卡住时可用替换方案：

```powershell
cd frontend
powershell -ExecutionPolicy Bypass -File .\setup-deps.ps1 -NoAudit
```

### 2) 启动后端

推荐在项目根目录执行（自动查找 Python 路径）：

```powershell
.\start-api.ps1 -Port 8000
```

也可以手动执行：

```powershell
cd backend
pip install -e .
python -m uvicorn app.main:app --reload --port 8000
```

健康检查：`http://localhost:8000/health`

如果 Python 不在 PATH，可用完整路径：

```powershell
C:\Users\<YourUser>\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn app.main:app --reload --port 8000
```

## 常用接口前缀

- `/api/v1/datasources`
- `/api/v1/labels`
- `/api/v1/prompts`
- `/api/v1/jobs`
- `/api/v1/monitoring`

## 当前状态

- 前端：Dashboard、数据源、Mapping、Prompt、作业管理、监控页面可用。
- 后端：配置与作业链路接口可用，支持运行记录、失败明细、单条失败重试。
- 运行时：内置 mock seed，可直接联调。
