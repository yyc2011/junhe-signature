import os
import shutil
import zipfile
from docxtpl import DocxTemplate


def render_docx(template_file_path: str, output_path: str, variables: dict) -> None:
    """
    使用 docxtpl 将模板文件渲染为填充后的 DOCX。
    variables 格式: {"law_firm_name": "君合律师事务所", ...}
    输出目录不存在时自动创建。
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = DocxTemplate(template_file_path)
    doc.render(variables)
    doc.save(output_path)


def clear_project_outputs(project_id: str, base_dir: str = "junhe") -> None:
    """
    删除项目生成目录下的所有文件。
    路径: /junhe/{project_id}/
    """
    project_output_dir = os.path.join(base_dir, project_id)
    if os.path.exists(project_output_dir):
        shutil.rmtree(project_output_dir)


def pack_project_zip(project_id: str, file_paths: list[str], base_dir: str = "junhe") -> str:
    """
    将项目所有生成文件打包成 ZIP。
    返回 ZIP 文件路径。
    """
    zip_path = os.path.join(base_dir, project_id, "all_signatures.zip")
    os.makedirs(os.path.dirname(zip_path), exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in file_paths:
            if os.path.exists(fp):
                zf.write(fp, os.path.basename(fp))
    return zip_path
