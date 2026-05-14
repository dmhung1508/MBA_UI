import { resolveApiBaseUrl } from "../config/runtimeConfig";

const AMI_API_BASE = `${resolveApiBaseUrl()}/auth_mini/mba`;

function getToken() {
  return localStorage.getItem("access_token") || "";
}

function headers(extra = {}) {
  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

async function handleResponse(response) {
  const data = await response.json().catch(async () => {
    const text = await response.text().catch(() => "");
    return { detail: text || `HTTP ${response.status}` };
  });
  if (!response.ok) {
    const error = new Error(data.detail || data.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

// ── Chat ──

export async function chatRequest({ userId, text, source, sessionId, think, search, mode, style_mode, history }) {
  const url = `${AMI_API_BASE}/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      userId, text, source, sessionId,
      think, search, mode, style_mode,
      save: true,
      history,
      metadata: { style_mode },
    }),
  });
  return handleResponse(response);
}

// ── TTS ──

export async function textToSpeech(text) {
  const url = `${AMI_API_BASE}/ami/tts`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("TTS request failed");
  return response.blob();
}

// ── Sessions ──

export async function fetchSessions(userId, source, limit = 30) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (source) params.set("source", source);
  const url = `${AMI_API_BASE}/ami/chat_sessions/${encodeURIComponent(userId)}?${params}`;
  const response = await fetch(url, { headers: headers() });
  return handleResponse(response);
}

export async function fetchSession(sessionId) {
  const url = `${AMI_API_BASE}/ami/chat_history/session/${encodeURIComponent(sessionId)}`;
  const response = await fetch(url, { headers: headers() });
  return handleResponse(response);
}

export async function deleteAllHistory(userId) {
  const url = `${AMI_API_BASE}/ami/chat_history/${encodeURIComponent(userId)}`;
  const response = await fetch(url, { method: "DELETE", headers: headers() });
  return handleResponse(response);
}

// ── Debate ──

export async function debateStart({ userId, source, subjectName, userName, timeOption, styleMode }) {
  const url = `${AMI_API_BASE}/ami/debate/start`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, source, subjectName, userName, timeOption, debateMode: "quick", styleMode }),
  });
  return handleResponse(response);
}

export async function debateRespond({ userId, source, turn, maxTurn, userAnswer, history, questionHistory, currentQuestion, subjectName, userName }) {
  const url = `${AMI_API_BASE}/ami/debate/respond`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, source, turn, maxTurn, userAnswer, history, questionHistory, currentQuestion, subjectName, userName }),
  });
  return handleResponse(response);
}

export async function debateEvaluate({ userId, source, subjectName, userName, answers, questionHistory, currentQuestion, turnScores, timeOption, turnDurations, timedOutTurns }) {
  const url = `${AMI_API_BASE}/ami/debate/evaluate`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, source, subjectName, userName, answers, questionHistory, currentQuestion, turnScores, timeOption, turnDurations, timedOutTurns }),
  });
  return handleResponse(response);
}

export async function fetchLeaderboard(source, limit = 10) {
  const url = `${AMI_API_BASE}/ami/debate/leaderboard?source=${encodeURIComponent(source)}&limit=${limit}`;
  const response = await fetch(url, { headers: headers() });
  return handleResponse(response);
}

// ── Voice Transcription ──

export async function transcribeVoice(audioBlob) {
  const url = `${AMI_API_BASE}/ami/transcribe`;
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "ngrok-skip-browser-warning": "69420" },
    body: formData,
  });
  return handleResponse(response);
}

// ── History Debug ──

export async function sendHistoryDebugLog(event, details = {}) {
  try {
    const url = `${AMI_API_BASE}/ami/history/debug`;
    await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ event, details, timestamp: new Date().toISOString() }),
    });
  } catch {}
}

export default AMI_API_BASE;
