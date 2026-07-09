import { API_ENDPOINTS } from "../config/api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    "Content-Type": "application/json",
  };
}

function errorMessage(payload, status) {
  const detail = payload?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
  }
  return payload?.message || `Yêu cầu thất bại (HTTP ${status})`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(errorMessage(payload, response.status));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function listModules() {
  return request(API_ENDPOINTS.AGENT_MODULES);
}

export function listAgentProfiles() {
  return request(API_ENDPOINTS.AGENT_PROFILES);
}

export function listAgents(workspaceId) {
  return request(API_ENDPOINTS.AGENT_DEFINITIONS(workspaceId));
}

export function listArchivedAgents(workspaceId) {
  return request(API_ENDPOINTS.AGENT_ARCHIVED_DEFINITIONS(workspaceId));
}

export function createAgent(payload) {
  return request(API_ENDPOINTS.AGENT_DEFINITION_CREATE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAgent(definitionId, payload) {
  return request(API_ENDPOINTS.AGENT_DEFINITION(definitionId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveAgent(definitionId) {
  return request(API_ENDPOINTS.AGENT_DEFINITION_ARCHIVE(definitionId), {
    method: "DELETE",
  });
}

export function restoreAgent(definitionId) {
  return request(API_ENDPOINTS.AGENT_DEFINITION_RESTORE(definitionId), {
    method: "POST",
  });
}

export function hardDeleteAgent(definitionId) {
  return request(API_ENDPOINTS.AGENT_DEFINITION_HARD_DELETE(definitionId), {
    method: "DELETE",
  });
}

export function listAgentVersions(definitionId) {
  return request(API_ENDPOINTS.AGENT_VERSIONS(definitionId));
}

export function createAgentVersion(definitionId, payload) {
  return request(API_ENDPOINTS.AGENT_VERSIONS(definitionId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function publishAgentVersion(versionId) {
  return request(API_ENDPOINTS.AGENT_VERSION_PUBLISH(versionId), {
    method: "POST",
  });
}

export function setGlobalDefaultAgentVersion(versionId, enabled) {
  return request(API_ENDPOINTS.AGENT_VERSION_GLOBAL_DEFAULT(versionId, enabled), {
    method: "POST",
  });
}

export function archiveAgentVersion(versionId) {
  return request(API_ENDPOINTS.AGENT_VERSION_ARCHIVE(versionId), {
    method: "POST",
  });
}

export function submitModuleJob(moduleKey, payload) {
  return request(API_ENDPOINTS.AGENT_MODULE_JOB(moduleKey), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitProfileJob(profileKey, capabilityKey, payload) {
  return request(API_ENDPOINTS.AGENT_PROFILE_JOB(profileKey, capabilityKey), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getModuleJob(jobId) {
  return request(API_ENDPOINTS.AGENT_MODULE_JOB_STATUS(jobId));
}

export function getArtifact(artifactId) {
  return request(API_ENDPOINTS.AGENT_ARTIFACT(artifactId));
}

export function submitArtifactFeedback(artifactId, payload) {
  return request(API_ENDPOINTS.AGENT_ARTIFACT_FEEDBACK(artifactId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startModuleSession(moduleKey, payload) {
  return request(API_ENDPOINTS.AGENT_SESSION_START(moduleKey), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startProfileSession(profileKey, capabilityKey, payload) {
  return request(API_ENDPOINTS.AGENT_PROFILE_SESSION(profileKey, capabilityKey), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getModuleSession(sessionId) {
  return request(API_ENDPOINTS.AGENT_SESSION(sessionId));
}

export function sendModuleTurn(sessionId, payload) {
  return request(API_ENDPOINTS.AGENT_SESSION_TURN(sessionId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function endModuleSession(sessionId, payload) {
  return request(API_ENDPOINTS.AGENT_SESSION_END(sessionId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function waitForJob(jobId, {
  intervalMs = 2000,
  timeoutMs = 10 * 60 * 1000,
  signal,
  onUpdate,
} = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) throw new DOMException("Đã hủy theo dõi job", "AbortError");
    const job = await getModuleJob(jobId);
    onUpdate?.(job);
    if (["completed", "failed", "cancelled"].includes(job.status)) return job;
    await new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException("Đã hủy theo dõi job", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, intervalMs);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  throw new Error("Job xử lý quá thời gian cho phép");
}
