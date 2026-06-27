let selectedFile = null;

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const uploadBtn = document.getElementById("uploadBtn");

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});

function setFile(f) {
  if (!f.name.endsWith(".docx")) {
    showMsg("只支持 .docx 格式", "error");
    return;
  }
  selectedFile = f;
  document.getElementById("fileName").textContent = "已选择：" + f.name;
  uploadBtn.disabled = false;
}

function showMsg(text, type) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = type;
  el.style.display = "block";
}

async function upload() {
  if (!selectedFile) return;
  uploadBtn.disabled = true;
  uploadBtn.textContent = "上传中...";
  try {
    const fd = new FormData();
    fd.append("file", selectedFile);
    const res = await api.uploadTemplate(fd);
    const varCount = res.variable_keys?.length || 0;
    showMsg(`上传成功！模板「${res.name}」解析到 ${varCount} 个变量。`, "success");
    setTimeout(() => location.href = "template_list.html", 1500);
  } catch (e) {
    showMsg("上传失败：" + e.message, "error");
    uploadBtn.disabled = false;
    uploadBtn.textContent = "上传并解析变量";
  }
}
