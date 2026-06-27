import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Template(Base):
    __tablename__ = "templates"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False, unique=True)   # 文件名去后缀，全局唯一
    file_path = Column(String, nullable=False)            # /junhe/{id}/xxx.docx
    # variable_keys 格式: [{"key": "law_firm_name", "type": "text"}]
    # label 不存在 Template 层，由用户在 ProjectVariable 层填写
    variable_keys = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project_templates = relationship("ProjectTemplate", back_populates="template")
    generated_files = relationship("GeneratedFile", back_populates="template")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    # draft: 刚创建未绑定模板
    # filling: 已绑定模板，待填写变量
    # generated: 已生成文件
    status = Column(String, nullable=False, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)

    project_templates = relationship(
        "ProjectTemplate", back_populates="project", cascade="all, delete-orphan"
    )
    variables = relationship(
        "ProjectVariable", back_populates="project", cascade="all, delete-orphan"
    )
    generated_files = relationship(
        "GeneratedFile", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectTemplate(Base):
    """项目与模板的关联表"""
    __tablename__ = "project_templates"

    project_id = Column(String, ForeignKey("projects.id"), primary_key=True)
    template_id = Column(String, ForeignKey("templates.id"), primary_key=True)

    project = relationship("Project", back_populates="project_templates")
    template = relationship("Template", back_populates="project_templates")


class ProjectVariable(Base):
    """项目维度的去重变量表，存储用户填写的 label 和 value"""
    __tablename__ = "project_variables"

    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    key = Column(String, nullable=False)     # 变量名 如 law_firm_name
    label = Column(String, default="")       # 中文名 如 律师事务所名称，用户填写
    value = Column(String, default="")       # 变量值，用户填写
    type = Column(String, default="text")    # text / date

    __table_args__ = (
        UniqueConstraint("project_id", "key", name="uq_project_variable"),
    )

    project = relationship("Project", back_populates="variables")


class GeneratedFile(Base):
    """生成的 DOCX 文件记录"""
    __tablename__ = "generated_files"

    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    template_id = Column(String, ForeignKey("templates.id"), nullable=False)
    template_name = Column(String, nullable=False)   # 冗余存文件名，方便展示
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="generated_files")
    template = relationship("Template", back_populates="generated_files")
