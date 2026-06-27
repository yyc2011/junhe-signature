import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Template, gen_uuid
from schemas import TemplateOut
from services.variable_service import extract_variable_keys

router = APIRouter(prefix="/api/templates", tags=["templates"])

BASE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "junhe")
)


@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    return db.query(Template).order_by(Template.created_at.desc()).all()


@router.post("/upload", response_model=TemplateOut)
async def upload_template(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="只支持 .docx 格式")

    template_name = os.path.splitext(file.filename)[0]

    existing = db.query(Template).filter(Template.name == template_name).first()

    if existing:
        tmpl = existing
        old_dir = os.path.join(BASE_DIR, tmpl.id)
        if os.path.exists(old_dir):
            shutil.rmtree(old_dir)
    else:
        tmpl = Template(id=gen_uuid(), name=template_name)
        db.add(tmpl)

    save_dir = os.path.join(BASE_DIR, tmpl.id)
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    variable_keys = extract_variable_keys(file_path)

    tmpl.file_path = file_path
    tmpl.variable_keys = variable_keys
    tmpl.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(tmpl)
    return tmpl
