from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models  # noqa: F401 — 确保模型被导入，触发建表

# 初始化数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="签字页系统", version="1.0.0")

# CORS — 开发阶段允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
from routers import templates, projects, generate
app.include_router(templates.router)
app.include_router(projects.router)
app.include_router(generate.router)

# 静态文件服务（前端 HTML/JS）
# 前端放在 ../frontend 目录，通过 /static 访问
# 也可以直接用浏览器打开 frontend/index.html，使用 fetch 调用后端接口
import os
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/api/health")
def health():
    return {"status": "ok"}
