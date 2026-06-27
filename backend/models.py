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
    name = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    variable_keys = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project_templates = relationship("ProjectTemplate", back_populates="template")
    generated_files = relationship("GeneratedFile", back_populates="template")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
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
    __tablename__ = "project_templates"

    project_id = Column(String, ForeignKey("projects.id"), primary_key=True)
    template_id = Column(String, ForeignKey("templates.id"), primary_key=True)

    project = relationship("Project", back_populates="project_templates")
    template = relationship("Template", back_populates="project_templates")


class ProjectVariable(Base):
    __tablename__ = "project_variables"

    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    key = Column(String, nullable=False)
    label = Column(String, default="")
    value = Column(String, default="")
    type = Column(String, default="text")

    __table_args__ = (
        UniqueConstraint("project_id", "key", name="uq_project_variable"),
    )

    project = relationship("Project", back_populates="variables")


class GeneratedFile(Base):
    __tablename__ = "generated_files"

    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    template_id = Column(String, ForeignKey("templates.id"), nullable=False)
    template_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="generated_files")
    template = relationship("Template", back_populates="generated_files")
