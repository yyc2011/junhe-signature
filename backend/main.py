import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="签字页系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import templates, projects, generate  # noqa: E402
app.include_router(templates.router)
app.include_router(projects.router)
app.include_router(generate.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# 静态文件挂载在 /frontend，不与 /api 冲突
_frontend_dir = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
)
if os.path.exists(_frontend_dir):
    app.mount("/frontend", StaticFiles(directory=_frontend_dir, html=True), name="frontend")
