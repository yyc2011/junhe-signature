const STATUS_MAP = {
  draft: "草稿",
  filling: "填写中",
  generated: "已生成",
};

const STATUS_CLASS = {
  draft: "status-draft",
  filling: "status-filling",
  generated: "status-generated",
};

function showMsg(text, type) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = type;
  el.style.display = "block";
}

async function load() {
  try {
    const projects = await api.getProjects();
    const content = document.getElementById("content");
    if (!projects.length) {
      content.innerHTML = '<p class="empty">暂无项目，点击右上角"新建项目"开始</p>';
      return;
    }
    const rows = projects.map(p => `
      <tr>
        <td>${p.name}</td>
        <td><span class="${STATUS_CLASS[p.status] || ''}">${STATUS_MAP[p.status] || p.status}</span></td>
        <td class="muted">${new Date(p.created_at).toLocaleString("zh-CN")}</td>
        <td><a href="project_detail.html?id=${p.id}" class="btn-sm">进入项目</a></td>
      </tr>
    `).join("");
    content.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>项目名称</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
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
