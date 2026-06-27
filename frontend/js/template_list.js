function showMsg(text, type) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = type;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 4000);
}

async function load() {
  try {
    const templates = await api.getTemplates();
    const content = document.getElementById("content");
    if (!templates.length) {
      content.innerHTML = '<p class="empty">暂无模板，请先上传</p>';
      return;
    }
    const rows = templates.map(t => `
      <tr>
        <td>${t.name}</td>
        <td>${(t.variable_keys || []).map(v => `<span class="tag">${v.key}</span>`).join("") || "<span class='muted'>无</span>"}</td>
        <td class="muted">${t.variable_keys?.length || 0} 个</td>
        <td class="muted">${new Date(t.updated_at).toLocaleString("zh-CN")}</td>
      </tr>
    `).join("");
    content.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>模板名称</th>
            <th>变量列表</th>
            <th>变量数</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (e) {
    showMsg("加载失败：" + e.message, "error");
  }
}

load();
