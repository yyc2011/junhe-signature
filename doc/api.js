const BASE = "http://localhost:8000";

async function request(method, path, body = null) {
  const opts = { method, headers: {} };
  if (body && !(body instanceof FormData)) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body;
  }
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "请求失败");
  }
  // 下载类接口返回 blob
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/zip") || ct.includes("spreadsheetml")) {
    return res.blob();
  }
  return res.json();
}

const api = {
  // Templates
  getTemplates: () => request("GET", "/api/templates"),
  uploadTemplate: (formData) => request("POST", "/api/templates/upload", formData),

  // Projects
  getProjects: () => request("GET", "/api/projects"),
  createProject: (name) => request("POST", "/api/projects", { name }),
  getProject: (id) => request("GET", `/api/projects/${id}`),

  // Bind
  bindTemplates: (projectId, templateIds) =>
    request("POST", `/api/projects/${projectId}/bind`, { template_ids: templateIds }),

  // Variables
  downloadVariableExcel: (projectId) =>
    request("GET", `/api/projects/${projectId}/variables/excel`),
  submitVariables: (projectId, variables) =>
    request("POST", `/api/projects/${projectId}/variables`, { variables }),
  uploadVariableExcel: (projectId, formData) =>
    request("POST", `/api/projects/${projectId}/variables/upload`, formData),

  // Generate
  generate: (projectId) => request("POST", `/api/projects/${projectId}/generate`),
  downloadFile: (projectId, templateId) =>
    request("GET", `/api/projects/${projectId}/files/${templateId}/download`),
  downloadAllZip: (projectId) =>
    request("GET", `/api/projects/${projectId}/download`),
};

// 工具：触发浏览器下载 blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
