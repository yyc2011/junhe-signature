from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Template ──────────────────────────────────────────────

class VariableKeySchema(BaseModel):
    key: str
    type: str = "text"   # label 不在模板层，由项目层用户填写


class TemplateOut(BaseModel):
    id: str
    name: str
    file_path: str
    variable_keys: list[VariableKeySchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Project ───────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str


class ProjectOut(BaseModel):
    id: str
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── ProjectVariable ───────────────────────────────────────

class ProjectVariableOut(BaseModel):
    id: str
    project_id: str
    key: str
    label: str
    value: str
    type: str

    class Config:
        from_attributes = True


class VariableInput(BaseModel):
    """单条变量填写"""
    key: str
    label: str
    value: str


class VariablesSubmit(BaseModel):
    """批量提交变量（表单方式）"""
    variables: list[VariableInput]


# ── Bind ──────────────────────────────────────────────────

class BindTemplatesRequest(BaseModel):
    template_ids: list[str]


class BindTemplatesResponse(BaseModel):
    """绑定模板后返回去重变量列表"""
    project_id: str
    variables: list[ProjectVariableOut]
    excel_download_url: str


# ── ProjectDetail ─────────────────────────────────────────

class GeneratedFileOut(BaseModel):
    id: str
    template_id: str
    template_name: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectDetailOut(BaseModel):
    id: str
    name: str
    status: str
    created_at: datetime
    templates: list[TemplateOut]
    variables: list[ProjectVariableOut]
    generated_files: list[GeneratedFileOut]

    class Config:
        from_attributes = True
