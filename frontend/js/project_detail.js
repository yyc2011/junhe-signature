const projectId = new URLSearchParams(location.search).get("id");

if (!projectId) {
  alert("缺少项目 ID，即将返回项目列表");
  location.href = "project_list.html";
}

const STATUS_MAP = { draft: "草稿", filling: "填写中", generated: "已生成" };
const STATUS_CLASS = { draft: "status-draft", filling: "status-filling", generated: "status-generated" };

let projectData = null;
let allTemplates = [];
let bindPanelOpen = false;

// ── 通用工具 ──────────────────────────────────────────────

function showMsg(boxId, text, type) {
  const el = document.getElementById(boxId);
  el.textContent = text;
  el.className = "msg-box " + type;
  el.style.display = "block";
  if (type === "success") {
    setTimeout(() => { el.style.display = "none"; }, 4000);
  }
}

function hideMsg(boxId) {
  const el = document.getElementById(boxId);
  if (el) el.style.display = "none";
}

function setLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "处理中..." : defaultText;
}

// ── 页面初始化 ────────────────────────────────────────────

async function init() {
  try {
    projectData = await api.getProject(projectId);
    renderInfo();
    renderBoundTemplates();
    renderVariableCard();
    renderGenerateCard();
  } catch (e) {
    document.querySelector(".container").innerHTML =
      `<div class="msg-box error" style="display:block">加载失败：${e.message}</div>`;
  }
}

// ── 区块一：项目信息 ──────────────────────────────────────

function renderInfo() {
  const p = projectData;
  document.getElementById("projName").textContent = p.name;
  const statusEl = document.getElementById("projStatus");
  statusEl.textContent = STATUS_MAP[p.status] || p.status;
  statusEl.className = "value " + (STATUS_CLASS[p.status] || "");
  document.getElementById("projCreatedAt").textContent = new Date(p.created_at).toLocaleString("zh-CN");
  document.title = `${p.name} — 签字页系统`;
}

// ── 区块二：模板绑定 ──────────────────────────────────────

function renderBoundTemplates() {
  const p = projectData;
  const container = document.getElementById("boundTemplates");
  const summary = document.getElementById("varSummary");

  if (!p.templates || p.templates.length === 0) {
    container.innerHTML = '<div style="color:#888;font-size:14px">尚未绑定模板</div>';
    summary.style.display = "none";
  } else {
    container.innerHTML = p.templates.map(t => `
      <div class="template-item">
        <span class="tname">${t.name}</span>
        <span class="tcount">${(t.variable_keys || []).length} 个变量</span>
      </div>
    `).join("");
    summary.style.display = "block";
    summary.textContent = `已去重变量：共 ${p.variables.length} 个`;
  }
}

async function toggleBindPanel() {
  bindPanelOpen = !bindPanelOpen;
  const panel = document.getElementById("bindPanel");
  panel.style.display = bindPanelOpen ? "block" : "none";
  document.getElementById("toggleBindBtn").textContent = bindPanelOpen ? "收起" : "重新绑定模板";

  if (bindPanelOpen) {
    await loadTemplateCheckboxes();
  }
}

async function loadTemplateCheckboxes() {
  const container = document.getElementById("templateCheckboxes");
  container.textContent = "加载中...";
  try {
    allTemplates = await api.getTemplates();
    if (!allTemplates.length) {
      container.innerHTML = '<div style="color:#888;font-size:14px">暂无可用模板，请先上传</div>';
      return;
    }
    const boundIds = new Set((projectData.templates || []).map(t => t.id));
    container.innerHTML = allTemplates.map(t => `
      <div class="checkbox-item">
        <input type="checkbox" id="tmpl_${t.id}" value="${t.id}" ${boundIds.has(t.id) ? "checked" : ""}>
        <label for="tmpl_${t.id}">${t.name} <span style="color:#888;font-size:12px">（${(t.variable_keys||[]).length} 个变量）</span></label>
      </div>
    `).join("");
  } catch (e) {
    container.innerHTML = `<div style="color:#b00020;font-size:14px">加载失败：${e.message}</div>`;
  }
}

async function confirmBind() {
  const checked = Array.from(document.querySelectorAll('#templateCheckboxes input[type=checkbox]:checked')).map(cb => cb.value);
  if (!checked.length) {
    showMsg("bindMsg", "至少选择一个模板", "error");
    return;
  }

  setLoading("confirmBindBtn", true, "确认绑定");
  hideMsg("bindMsg");

  try {
    await api.bindTemplates(projectId, checked);
    showMsg("bindMsg", "绑定成功，正在刷新页面...", "success");
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    showMsg("bindMsg", "绑定失败：" + e.message, "error");
    setLoading("confirmBindBtn", false, "确认绑定");
  }
}

// ── 区块三：变量填写 ──────────────────────────────────────

function renderVariableCard() {
  const p = projectData;
  const card = document.getElementById("variableCard");
  if (p.status === "draft") {
    card.classList.add("section-hidden");
    return;
  }
  card.classList.remove("section-hidden");
  renderVarTable();
}

function renderVarTable() {
  const vars = projectData.variables || [];
  const tbody = document.getElementById("varTableBody");
  if (!vars.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:#888;text-align:center">无变量</td></tr>';
    return;
  }
  tbody.innerHTML = vars.map(v => `
    <tr>
      <td><input type="text" readonly value="${escHtml(v.key)}"></td>
      <td><input type="text" id="label_${v.key}" placeholder="请输入中文名" value="${escHtml(v.label)}"></td>
      <td><input type="text" id="value_${v.key}" placeholder="请输入填写值" value="${escHtml(v.value)}"></td>
    </tr>
  `).join("");
}

function escHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function switchTab(tab) {
  if (tab === "form") {
    document.getElementById("formTab").classList.add("active");
    document.getElementById("excelTab").classList.remove("active");
    document.getElementById("tab1Btn").classList.add("active");
    document.getElementById("tab2Btn").classList.remove("active");
  } else {
    document.getElementById("excelTab").classList.add("active");
    document.getElementById("formTab").classList.remove("active");
    document.getElementById("tab2Btn").classList.add("active");
    document.getElementById("tab1Btn").classList.remove("active");
  }
}

async function saveVariables() {
  const vars = projectData.variables || [];
  const payload = vars.map(v => ({
    key: v.key,
    label: (document.getElementById("label_" + v.key)?.value || "").trim(),
    value: (document.getElementById("value_" + v.key)?.value || "").trim(),
  }));

  setLoading("saveVarBtn", true, "保存变量");
  hideMsg("varMsg");

  try {
    await api.submitVariables(projectId, payload);
    showMsg("varMsg", "变量保存成功", "success");
    projectData = await api.getProject(projectId);
    renderVariableCard();
    renderGenerateCard();
  } catch (e) {
    showMsg("varMsg", "保存失败：" + e.message, "error");
  } finally {
    setLoading("saveVarBtn", false, "保存变量");
  }
}

async function downloadExcel() {
  setLoading("downloadExcelBtn", true, "下载变量 Excel 模板");
  try {
    await api.downloadVariableExcel(projectId);
  } catch (e) {
    showMsg("varMsg", "下载失败：" + e.message, "error");
  } finally {
    setLoading("downloadExcelBtn", false, "下载变量 Excel 模板");
  }
}

async function uploadExcel() {
  const fileInput = document.getElementById("excelFileInput");
  if (!fileInput.files[0]) {
    showMsg("varMsg", "请先选择 Excel 文件", "error");
    return;
  }

  setLoading("uploadExcelBtn", true, "上传并导入");
  hideMsg("varMsg");

  try {
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);
    const res = await api.uploadVariableExcel(projectId, fd);
    showMsg("varMsg", `Excel 导入成功，共导入 ${res.count} 条变量`, "success");
    fileInput.value = "";
    projectData = await api.getProject(projectId);
    renderVariableCard();
    renderGenerateCard();
  } catch (e) {
    showMsg("varMsg", "导入失败：" + e.message, "error");
  } finally {
    setLoading("uploadExcelBtn", false, "上传并导入");
  }
}

// ── 区块四：生成与下载 ────────────────────────────────────

function renderGenerateCard() {
  const p = projectData;
  const card = document.getElementById("generateCard");
  const vars = p.variables || [];

  const allFilled = vars.length > 0 && vars.every(v => v.label && v.label.trim() && v.value && v.value.trim());

  if (!allFilled) {
    card.classList.add("section-hidden");
    return;
  }
  card.classList.remove("section-hidden");

  const hasFiles = p.generated_files && p.generated_files.length > 0;
  const downloadAllBtn = document.getElementById("downloadAllBtn");
  downloadAllBtn.style.display = hasFiles ? "inline-block" : "none";

  renderFileList();
}

function renderFileList() {
  const p = projectData;
  const files = p.generated_files || [];
  const fileList = document.getElementById("fileList");

  if (!files.length) {
    fileList.innerHTML = "";
    return;
  }

  fileList.innerHTML = files.map(f => `
    <div class="file-item">
      <span class="fname">${escHtml(f.template_name)}.docx</span>
      <button class="btn-sm" onclick="downloadSingle('${f.template_id}', '${escHtml(f.template_name)}.docx')">下载</button>
    </div>
  `).join("");
}

async function generateFiles() {
  setLoading("generateBtn", true, "生成签字页");
  hideMsg("genMsg");

  try {
    const res = await api.generate(projectId);
    showMsg("genMsg", `生成成功，共生成 ${res.count} 个文件`, "success");
    projectData = await api.getProject(projectId);
    renderInfo();
    renderGenerateCard();
  } catch (e) {
    showMsg("genMsg", "生成失败：" + e.message, "error");
  } finally {
    setLoading("generateBtn", false, "生成签字页");
  }
}

async function downloadSingle(templateId, filename) {
  try {
    await api.downloadFile(projectId, templateId, filename);
  } catch (e) {
    showMsg("genMsg", "下载失败：" + e.message, "error");
  }
}

async function downloadAll() {
  setLoading("downloadAllBtn", true, "打包下载全部");
  try {
    await api.downloadAllZip(projectId, projectData.name);
  } catch (e) {
    showMsg("genMsg", "打包下载失败：" + e.message, "error");
  } finally {
    setLoading("downloadAllBtn", false, "打包下载全部");
  }
}

// ── 启动 ──────────────────────────────────────────────────
init();
