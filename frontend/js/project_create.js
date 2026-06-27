const nameInput = document.getElementById("nameInput");
const submitBtn = document.getElementById("submitBtn");

nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") createProject();
});

function showMsg(text, type) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = type;
  el.style.display = "block";
}

async function createProject() {
  const name = nameInput.value.trim();
  if (!name) {
    showMsg("请输入项目名称", "error");
    nameInput.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "创建中...";

  try {
    const proj = await api.createProject(name);
    showMsg("项目创建成功，即将跳转...", "success");
    setTimeout(() => {
      location.href = `project_detail.html?id=${proj.id}`;
    }, 800);
  } catch (e) {
    showMsg("创建失败：" + e.message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "创建项目";
  }
}
