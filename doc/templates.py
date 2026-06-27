import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Template
from schemas import TemplateOut
from services.variable_service import extract_variable_keys

router = APIRouter(prefix="/api/templates", tags=["templates"])

BASE_DIR = "junhe"


@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    return db.query(Template).order_by(Template.created_at.desc()).all()


@router.post("/upload", response_model=TemplateOut)
async def upload_template(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 校验文件类型
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="只支持 .docx 格式")

    # 模板名 = 文件名去后缀
    template_name = os.path.splitext(file.filename)[0]

    # 查询是否已存在同名模板（覆盖逻辑）
    existing = db.query(Template).filter(Template.name == template_name).first()

    if existing:
        tmpl = existing
        # 删除旧文件目录
        old_dir = os.path.join(BASE_DIR, tmpl.id)
        if os.path.exists(old_dir):
            shutil.rmtree(old_dir)
    else:
        from models import gen_uuid
        tmpl = Template(id=gen_uuid(), name=template_name)
        db.add(tmpl)

    # 保存文件到 /junhe/{templateId}/xxx.docx
    save_dir = os.path.join(BASE_DIR, tmpl.id)
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # 解析变量 key
    variable_keys = extract_variable_keys(file_path)

    tmpl.file_path = file_path
    tmpl.variable_keys = variable_keys

    from datetime import datetime
    tmpl.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(tmpl)
    return tmpl
