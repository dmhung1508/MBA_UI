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

export async function chatStream({ userId, text, source, sessionId, think, search, mode, history }) {
  const url = `${AMI_API_BASE}/chat/streaming`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, text, source, sessionId, think, search, mode, history }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.detail || data.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.body.getReader();
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

export async function fetchSessions(userId, source, limit = 30, skip = 0) {
  const url = `${AMI_API_BASE}/user/${userId}/sessions/grouped?source=${source}&limit=${limit}&skip=${skip}`;
  const response = await fetch(url, { headers: headers() });
  return handleResponse(response);
}

export async function fetchSession(sessionId) {
  const url = `${AMI_API_BASE}/session/${sessionId}`;
  const response = await fetch(url, { headers: headers() });
  return handleResponse(response);
}

export async function deleteSession(sessionId) {
  const url = `${AMI_API_BASE}/session/${sessionId}`;
  const response = await fetch(url, { method: "DELETE", headers: headers() });
  return handleResponse(response);
}

// ── Debate ──

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
