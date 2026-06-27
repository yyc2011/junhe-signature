import re
from docx import Document


def extract_variable_keys(docx_path: str) -> list[dict]:
    """
    使用 python-docx 读取段落文本后做正则匹配，规避 XML 拆分问题。
    只处理段落，不处理表格（按需求约定忽略表格）。
    返回格式: [{"key": "law_firm_name", "type": "text"}, ...]
    变量名只允许 \w+（字母、数字、下划线）。
    """
    doc = Document(docx_path)
    full_text = ""
    for para in doc.paragraphs:
        full_text += para.text + "\n"

    keys = re.findall(r'\{\{(\w+)\}\}', full_text)
    seen = set()
    result = []
    for key in keys:
        if key not in seen:
            seen.add(key)
            result.append({"key": key, "type": "text"})
    return result


def merge_variable_keys(templates) -> list[dict]:
    """
    对多个模板的 variable_keys 做并集去重。
    以 key 为唯一标识，相同 key 只保留第一次出现的 type。
    返回格式与 extract_variable_keys 相同。
    """
    seen = set()
    merged = []
    for tmpl in templates:
        for var_def in (tmpl.variable_keys or []):
            key = var_def.get("key")
            if key and key not in seen:
                seen.add(key)
                merged.append({"key": key, "type": var_def.get("type", "text")})
    return merged
