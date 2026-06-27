import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Project, ProjectVariable, ProjectTemplate, GeneratedFile
from services.generate_service import render_docx, clear_project_outputs, pack_project_zip

router = APIRouter(prefix="/api/projects", tags=["generate"])

BASE_DIR = "junhe"


@router.post("/{project_id}/generate")
def generate_files(project_id: str, db: Session = Depends(get_db)):
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="项目不存在")

    # 检查是否绑定了模板
    pt_list = db.query(ProjectTemplate).filter(
        ProjectTemplate.project_id == project_id
    ).all()
    if not pt_list:
        raise HTTPException(status_code=400, detail="该项目尚未绑定模板")

    # 检查所有变量是否都已填写 label 和 value
    variables = db.query(ProjectVariable).filter(
        ProjectVariable.project_id == project_id
    ).all()
    for v in variables:
        if not v.label or not v.label.strip():
            raise HTTPException(
                status_code=400,
                detail=f"变量 {v.key} 的 label 未填写，请先完成变量填写"
            )
        if not v.value or not v.value.strip():
            raise HTTPException(
                status_code=400,
                detail=f"变量 {v.key} 的 value 未填写，请先完成变量填写"
            )

    # 构建变量字典
    var_dict = {v.key: v.value for v in variables}

    # 删除旧的生成文件（磁盘 + DB 记录）
    clear_project_outputs(project_id, BASE_DIR)
    db.query(GeneratedFile).filter(
        GeneratedFile.project_id == project_id
    ).delete()
    db.commit()

    # 遍历绑定的模板，逐个渲染生成
    generated = []
    for pt in pt_list:
        tmpl = pt.template
        if not tmpl.file_path or not os.path.exists(tmpl.file_path):
            raise HTTPException(
                status_code=500,
                detail=f"模板文件不存在: {tmpl.name}"
            )

        filename = os.path.basename(tmpl.file_path)  # 保持和模板源文件同名
        output_path = os.path.join(BASE_DIR, project_id, tmpl.id, filename)

        render_docx(tmpl.file_path, output_path, var_dict)

        gf = GeneratedFile(
            project_id=project_id,
            template_id=tmpl.id,
            template_name=tmpl.name,
            file_path=output_path,
        )
        db.add(gf)
        generated.append({"template_name": tmpl.name, "file_path": output_path})

    proj.status = "generated"
    db.commit()

    return {
        "message": "生成成功",
        "count": len(generated),
        "files": generated,
    }


@router.get("/{project_id}/files/{template_id}/download")
def download_single_file(
    project_id: str,
    template_id: str,
    db: Session = Depends(get_db)
):
    gf = db.query(GeneratedFile).filter(
        GeneratedFile.project_id == project_id,
        GeneratedFile.template_id == template_id,
    ).first()
    if not gf:
        raise HTTPException(status_code=404, detail="文件不存在，请先生成")
    if not os.path.exists(gf.file_path):
        raise HTTPException(status_code=404, detail="文件已丢失，请重新生成")

    filename = f"{gf.template_name}.docx"
    return FileResponse(
        gf.file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/{project_id}/download")
def download_all_zip(project_id: str, db: Session = Depends(get_db)):
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="项目不存在")

    gf_list = db.query(GeneratedFile).filter(
        GeneratedFile.project_id == project_id
    ).all()
    if not gf_list:
        raise HTTPException(status_code=400, detail="该项目尚未生成文件")

    file_paths = [gf.file_path for gf in gf_list]
    zip_path = pack_project_zip(project_id, file_paths, BASE_DIR)

    return FileResponse(
        zip_path,
        filename=f"{proj.name}_签字页.zip",
        media_type="application/zip",
    )
