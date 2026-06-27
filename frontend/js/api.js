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
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/zip") || ct.includes("spreadsheetml") || ct.includes("wordprocessingml")) {
    return res.blob();
  }
  return res.json();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  downloadVariableExcel: async (projectId) => {
    const blob = await request("GET", `/api/projects/${projectId}/variables/excel`);
    downloadBlob(blob, `variables_${projectId}.xlsx`);
  },
  submitVariables: (projectId, variables) =>
    request("POST", `/api/projects/${projectId}/variables`, { variables }),
  uploadVariableExcel: (projectId, formData) =>
    request("POST", `/api/projects/${projectId}/variables/upload`, formData),

  // Generate
  generate: (projectId) => request("POST", `/api/projects/${projectId}/generate`),
  downloadFile: async (projectId, templateId, filename) => {
    const blob = await request("GET", `/api/projects/${projectId}/files/${templateId}/download`);
    downloadBlob(blob, filename || `${templateId}.docx`);
  },
  downloadAllZip: async (projectId, projectName) => {
    const blob = await request("GET", `/api/projects/${projectId}/download`);
    downloadBlob(blob, `${projectName || projectId}_签字页.zip`);
  },
};
