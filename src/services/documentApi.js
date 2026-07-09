import { API_ENDPOINTS } from "../config/api";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("access_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "ngrok-skip-browser-warning": "69420",
    ...extra,
  };
}

async function responseError(response, fallback) {
  const payload = await response.json().catch(() => null);
  return new Error(payload?.detail || fallback || `HTTP ${response.status}`);
}

export async function fetchDocumentMetadata(documentId, signal) {
  const response = await fetch(API_ENDPOINTS.DOCUMENT_METADATA(documentId), {
    headers: authHeaders({ Accept: "application/json" }),
    signal,
  });
  if (!response.ok) throw await responseError(response, "Không thể lấy thông tin tài liệu");
  return response.json();
}

export async function fetchDocumentBlob(documentId, disposition = "inline", signal) {
  const response = await fetch(API_ENDPOINTS.DOCUMENT_FILE(documentId, disposition), {
    headers: authHeaders(),
    signal,
  });
  if (!response.ok) throw await responseError(response, "Không thể tải tài liệu");
  return response.blob();
}

export async function downloadDocument(documentId, fallbackFilename = "document") {
  const metadata = await fetchDocumentMetadata(documentId);
  const blob = await fetchDocumentBlob(documentId, "attachment");
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = metadata.filename || fallbackFilename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function buildDocumentPreviewUrl(documentId, page = 0) {
  const base = import.meta.env.BASE_URL || "/";
  const params = new URLSearchParams();
  if (Number(page) > 0) params.set("page", String(Math.floor(Number(page))));
  const query = params.toString();
  return `${base}document-viewer/${documentId}${query ? `?${query}` : ""}`;
}
