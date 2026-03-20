    let app;
    let model;
    let drawerOpen = true;
    let currentDrawerPage = "home";
    let dragData = null;
    let currentConversationId = null;
    let currentExchangeCount = 0;
    let isSending = false;
    let messages = [];

    // Khai báo state cho luồng Debate
    let isDebateMode = false;
    let debateTurn = 0;
    const MAX_DEBATE_TURN = 3;
    let debateUserHistory = [];
    let debateQuestionHistory = [];
    let debateCurrentQuestion = "";
    let debateTurnScores = [];
    const DEBATE_TIME_OPTIONS = {
      "2m": { label: "2 phút/lượt", seconds: 120, bonus: 150 },
      "3m": { label: "3 phút/lượt", seconds: 180, bonus: 100 },
      "5m": { label: "5 phút/lượt", seconds: 300, bonus: 50 },
      unlimited: { label: "Không giới hạn", seconds: 0, bonus: 0 }
    };
    const ROTATING_MOTIONS = [
      { motion: "Reading", label: "Đọc sách" },
      { motion: "Head_Nod", label: "Gật đầu" },
      { motion: "Head_Shake", label: "Lắc đầu" }
    ];
    const INLINE_SUBJECT_PREVIEW_LIMITS = {
      compact: 3,
      wide: 5
    };
    const DEFAULT_LIP_SYNC_PARAMETER_IDS = ["ParamMouthOpenY"];
    let debateTimeOption = "unlimited";
    let debateTurnStartedAt = 0;
    let debateTurnRemainingSeconds = 0;
    let debateTimerExpired = false;
    let debateTimerInterval = 0;
    let debateTurnDurations = [];
    let debateTimedOutTurns = [];
    let rotatingMotionTimer = 0;
    let rotatingMotionName = "";
    let amiTokenRefreshPromise = null;
    let amiVoiceEnabled = true;
    let amiVoiceLoading = false;
    let amiVoiceSpeaking = false;
    let amiVoiceRecording = false;
    let amiVoiceTranscribing = false;
    let lastAssistantSpeechText = "";
    let amiSpeechAudio = null;
    let amiSpeechObjectUrl = "";
    let amiSpeechAudioContext = null;
    let amiSpeechSourceNode = null;
    let amiSpeechAnalyserNode = null;
    let amiSpeechLipSyncData = null;
    let amiSpeechLipSyncLevel = 0;
    let amiSpeechLipSyncParameterIds = [];
    let amiSpeechLipSyncFrame = 0;
    let amiSpeechLipSyncTickerAttached = false;
    let amiSpeechLipSyncIndexCache = new Map();
    let voiceInputStream = null;
    let voiceInputContext = null;
    let voiceInputSource = null;
    let voiceInputProcessor = null;
    let voiceInputSilenceGain = null;
    let voiceInputChunks = [];
    let voiceInputSampleRate = 44100;
    let voiceRecordingStartedAt = 0;
    let voiceRecordingElapsedSeconds = 0;
    let voiceRecordingTimer = 0;

    // RAG context (nhận từ React parent)
    let amiToken = "";
    let amiChatbots = [];       // [{id, name, source, quizTopic, prompt}, ...]
    let amiSelectedSource = ""; // source của môn đang chọn
    let amiSelectedName = "";   // tên môn đang chọn
    let amiUserInitials = "?";  // initials của user hiện tại
    let amiUserName = "Bạn";   // tên hiển thị của user
    let amiUserId = "";
    let amiApiBase = "";
    let amiChatSessions = [];
    let amiCurrentSessionId = "";
    let amiHistoryLoading = false;
    let amiHistoryBootstrapped = false;
    let chatShellPanelsCollapsed = false;
    let chatShellMinimized = false;
    let chatShellHidden = false;
    let chatShellDrag = null;
    let studyPanelClosed = false;
    let subjectPanelClosed = false;

    // RAG URL luôn dùng origin của trang — iframe cùng origin với app chính
    const RAG_ORIGIN = window.location.origin;

    const MODEL_PATH = "./public/live2d-models/Ami/ptit_sdk.model3.json";
    const API_BASE = localStorage.getItem("ami-api-base") || "";
    const FALLBACK_WORKSPACE_ID = "550e8400-e29b-41d4-a716-446655440000";
    const FALLBACK_USER_ID = "00000000-0000-4000-a000-000000000003";
    const AMI_HISTORY_USER_ID_STORAGE_KEY = "ami-history-user-id";
    let statusTimer = null;
    let modelBaseBounds = null;
    let fitModelRaf = 0;
    let fitModelTimeout = 0;

    function isCompactViewport() {
      return window.innerWidth <= 900;
    }

    function sanitizeStatusMessage(msg) {
      const raw = String(msg || "").trim();
      if (!raw) return "";
      if (/generic|shallow|too_short|weak_justification|traceback|stack|http\s*\d+|lỗi/i.test(raw)) {
        return "Ami đang xử lý một chút, bạn thử lại sau nhé.";
      }
      return raw.split("\n")[0].trim();
    }

    function status(msg, tone = "info") {
      const el = document.getElementById("status");
      if (!el) return;

      const safe = sanitizeStatusMessage(msg);
      console.log(msg);
      window.clearTimeout(statusTimer);

      if (!safe) {
        el.classList.remove("is-visible");
        el.textContent = "";
        return;
      }

      el.textContent = safe;
      el.dataset.tone = tone;
      el.classList.add("is-visible");
      statusTimer = window.setTimeout(() => {
        el.classList.remove("is-visible");
      }, tone === "error" ? 4200 : 2600);
    }

    function resolveModelAsset(path) {
      return new URL(path, new URL(MODEL_PATH, window.location.href)).href;
    }

    function getChatContext() {
      try {
        const raw = localStorage.getItem("ami-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          const userId = parsed?.state?.user?.id;
          const workspaceId = parsed?.state?.user?.workspace_id;
          if (userId && workspaceId) {
            return { userId, workspaceId };
          }
        }
      } catch { }

      return {
        userId: localStorage.getItem("ami-demo-user-id") || FALLBACK_USER_ID,
        workspaceId: localStorage.getItem("ami-demo-workspace-id") || FALLBACK_WORKSPACE_ID
      };
    }

    function buildApiUrl(path, params) {
      const url = new URL(`${API_BASE}${path}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
          }
        });
      }
      return url.toString();
    }

    async function apiRequest(path, options = {}, params) {
      const url = buildApiUrl(path, params);
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      return response.json();
    }

    function extractChatText(data, fallback = "Ami không thể trả lời lúc này.") {
      if (data && data.text && data.text.response) return data.text.response;
      if (data && data.answer && data.answer.response) return data.answer.response;
      if (data && typeof data.text === "string") return data.text;
      if (data && typeof data.response === "string") return data.response;
      if (data && typeof data.result === "string") return data.result;
      return fallback;
    }

    async function callAmiMbaApi(path, { method = "GET", body, params } = {}) {
      const baseUrl = amiApiBase || RAG_ORIGIN;
      const url = new URL(`${baseUrl}/auth_mini/mba${path}`);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
          }
        });
      }

      const headers = new Headers({
        "ngrok-skip-browser-warning": "69420"
      });

      if (body !== undefined) {
        headers.set("Content-Type", "application/json");
      }

      if (amiToken) {
        headers.set("Authorization", `Bearer ${amiToken}`);
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });

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

    async function callAmiMbaResponseApi(path, { method = "GET", body, params, headers: extraHeaders } = {}) {
      const baseUrl = amiApiBase || RAG_ORIGIN;
      const url = new URL(`${baseUrl}/auth_mini/mba${path}`);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
          }
        });
      }

      const headers = new Headers({
        "ngrok-skip-browser-warning": "69420"
      });

      if (extraHeaders) {
        Object.entries(extraHeaders).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            headers.set(key, value);
          }
        });
      }

      if (body !== undefined && !(body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (amiToken) {
        headers.set("Authorization", `Bearer ${amiToken}`);
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body
      });

      if (!response.ok) {
        const payload = await response.json().catch(async () => {
          const text = await response.text().catch(() => "");
          return { detail: text || `HTTP ${response.status}` };
        });
        const error = new Error(payload.detail || payload.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }

      return response;
    }

    async function refreshAmiAccessToken() {
      if (amiTokenRefreshPromise) {
        return amiTokenRefreshPromise;
      }

      const baseUrl = amiApiBase || RAG_ORIGIN;
      const url = new URL(`${baseUrl}/auth_mini/refresh`, window.location.origin);

      amiTokenRefreshPromise = fetch(url.toString(), {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "69420"
        },
        credentials: "include"
      }).then(async (response) => {
        const data = await response.json().catch(async () => {
          const text = await response.text().catch(() => "");
          return { detail: text || `HTTP ${response.status}` };
        });

        if (!response.ok || !data.access_token) {
          const error = new Error(data.detail || data.message || "Ami chưa làm mới được phiên đăng nhập.");
          error.status = response.status;
          throw error;
        }

        amiToken = data.access_token;
        return amiToken;
      }).finally(() => {
        amiTokenRefreshPromise = null;
      });

      return amiTokenRefreshPromise;
    }

    function formatDisplayTime(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const mo = String(date.getMonth() + 1).padStart(2, "0");
      return `${hh}:${mm} ${dd}-${mo}`;
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
    }

    function normalizeDebateTimeOption(option) {
      const value = String(option || "unlimited").trim().toLowerCase();
      const aliasMap = {
        "2": "2m",
        "2m": "2m",
        "2p": "2m",
        "3": "3m",
        "3m": "3m",
        "3p": "3m",
        "5": "5m",
        "5m": "5m",
        "5p": "5m",
        unlimited: "unlimited",
        "0": "unlimited",
        none: "unlimited"
      };
      return aliasMap[value] || "unlimited";
    }

    function getDebateTimeConfig(option = debateTimeOption) {
      return DEBATE_TIME_OPTIONS[normalizeDebateTimeOption(option)] || DEBATE_TIME_OPTIONS.unlimited;
    }

    function formatCountdown(seconds) {
      const total = Math.max(0, Number(seconds) || 0);
      const minutes = String(Math.floor(total / 60)).padStart(2, "0");
      const remain = String(total % 60).padStart(2, "0");
      return `${minutes}:${remain}`;
    }

    function updateDebateTimerDisplay() {
      const timerEl = document.getElementById("debate-timer-indicator");
      const noteEl = document.getElementById("debate-time-note");
      const config = getDebateTimeConfig();

      if (noteEl) {
        if (isDebateMode) {
          noteEl.textContent = config.seconds > 0
            ? `Mốc ${config.label} • vượt giờ sẽ mất bonus thời gian`
            : "Chế độ không giới hạn thời gian";
        } else {
          noteEl.textContent = config.bonus > 0
            ? `Đang chọn ${config.label} • hoàn thành đủ 3 lượt để nhận +${config.bonus} điểm`
            : "Đang chọn không giới hạn thời gian";
        }
      }

      if (!timerEl) return;

      timerEl.classList.toggle("is-expired", Boolean(debateTimerExpired));
      if (config.seconds <= 0) {
        timerEl.textContent = "∞";
        return;
      }

      if (!isDebateMode && debateTurnRemainingSeconds <= 0) {
        timerEl.textContent = formatCountdown(config.seconds);
        return;
      }

      timerEl.textContent = formatCountdown(
        debateTimerExpired
          ? 0
          : Number.isFinite(debateTurnRemainingSeconds)
            ? debateTurnRemainingSeconds
            : config.seconds
      );
    }

    function updateDebateTimeSelector() {
      document.querySelectorAll("[data-debate-time-option]").forEach((button) => {
        const isActive = normalizeDebateTimeOption(button.dataset.debateTimeOption) === debateTimeOption;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      const bonusCopy = document.getElementById("debate-time-bonus-copy");
      if (bonusCopy) {
        const config = getDebateTimeConfig();
        bonusCopy.textContent = config.bonus > 0
          ? `Giữ trọn 3 lượt trong ${config.label}, không lượt nào dưới 50 điểm để nhận +${config.bonus} điểm vào tổng kết.`
          : "Chế độ này không có điểm thưởng thời gian nhưng bạn có thể nhận thử thách thoải mái hơn.";
      }

      updateDebateTimerDisplay();
    }

    function setDebateTimeOption(option) {
      debateTimeOption = normalizeDebateTimeOption(option);
      debateTurnRemainingSeconds = getDebateTimeConfig().seconds || 0;
      debateTimerExpired = false;
      updateDebateTimeSelector();
    }

    function clearDebateTimer() {
      if (debateTimerInterval) {
        window.clearInterval(debateTimerInterval);
        debateTimerInterval = 0;
      }
      debateTurnStartedAt = 0;
    }

    function registerTimedOutTurn(turnNumber) {
      if (!turnNumber || debateTimedOutTurns.includes(turnNumber)) return;
      debateTimedOutTurns = [...debateTimedOutTurns, turnNumber];
    }

    function startDebateTurnTimer() {
      clearDebateTimer();
      const config = getDebateTimeConfig();
      debateTimerExpired = false;

      if (config.seconds <= 0) {
        debateTurnRemainingSeconds = 0;
        debateTurnStartedAt = Date.now();
        updateDebateTimerDisplay();
        return;
      }

      debateTurnRemainingSeconds = config.seconds;
      debateTurnStartedAt = Date.now();
      updateDebateTimerDisplay();

      debateTimerInterval = window.setInterval(() => {
        const elapsed = Math.max(0, Math.floor((Date.now() - debateTurnStartedAt) / 1000));
        debateTurnRemainingSeconds = Math.max(config.seconds - elapsed, 0);

        if (debateTurnRemainingSeconds <= 0) {
          clearDebateTimer();
          debateTimerExpired = true;
          registerTimedOutTurn(Math.max(debateTurn, 1));
          status("Hết thời gian ở lượt này nên Ami sẽ không cộng bonus thời gian nữa nhé.", "error");
        }

        updateDebateTimerDisplay();
      }, 250);
    }

    function freezeDebateTurnTimer(turnNumber) {
      const config = getDebateTimeConfig();
      const elapsed = debateTurnStartedAt
        ? Math.max(0, Math.round((Date.now() - debateTurnStartedAt) / 1000))
        : 0;
      const timedOut = config.seconds > 0 && (
        debateTimerExpired ||
        debateTimedOutTurns.includes(turnNumber) ||
        elapsed > config.seconds
      );
      const remaining = config.seconds > 0
        ? Math.max(config.seconds - elapsed, 0)
        : 0;

      clearDebateTimer();
      debateTurnRemainingSeconds = remaining;
      if (timedOut) {
        debateTimerExpired = true;
        registerTimedOutTurn(turnNumber);
      }
      updateDebateTimerDisplay();

      return {
        turnNumber,
        option: debateTimeOption,
        elapsed,
        remaining,
        timedOut
      };
    }

    function resumeDebateTurnTimer(snapshot) {
      const config = getDebateTimeConfig(snapshot?.option || debateTimeOption);
      clearDebateTimer();

      if (config.seconds <= 0) {
        debateTimerExpired = false;
        debateTurnRemainingSeconds = 0;
        debateTurnStartedAt = Date.now();
        updateDebateTimerDisplay();
        return;
      }

      if (snapshot?.timedOut) {
        debateTimerExpired = true;
        debateTurnRemainingSeconds = 0;
        registerTimedOutTurn(snapshot.turnNumber);
        updateDebateTimerDisplay();
        return;
      }

      debateTimerExpired = false;
      debateTurnRemainingSeconds = Math.max(0, Number(snapshot?.remaining) || config.seconds);
      debateTurnStartedAt = Date.now() - Math.max(0, config.seconds - debateTurnRemainingSeconds) * 1000;
      updateDebateTimerDisplay();

      debateTimerInterval = window.setInterval(() => {
        const elapsed = Math.max(0, Math.floor((Date.now() - debateTurnStartedAt) / 1000));
        debateTurnRemainingSeconds = Math.max(config.seconds - elapsed, 0);

        if (debateTurnRemainingSeconds <= 0) {
          clearDebateTimer();
          debateTimerExpired = true;
          registerTimedOutTurn(snapshot.turnNumber || Math.max(debateTurn, 1));
          status("Hết thời gian ở lượt này nên Ami sẽ không cộng bonus thời gian nữa nhé.", "error");
        }

        updateDebateTimerDisplay();
      }, 250);
    }

    function resetDebateTimingState() {
      clearDebateTimer();
      debateTurnDurations = [];
      debateTimedOutTurns = [];
      debateTimerExpired = false;
      debateTurnRemainingSeconds = getDebateTimeConfig().seconds || 0;
      updateDebateTimerDisplay();
    }

    function getAvailableMotionSet() {
      return new Set(Object.keys(model?.internalModel?.settings?.motions || {}));
    }

    function rotateHiddenMotion(autoPlay = false) {
      const availableMotions = getAvailableMotionSet();
      const pool = ROTATING_MOTIONS.filter((item) => !availableMotions.size || availableMotions.has(item.motion));
      const candidates = (pool.length ? pool : ROTATING_MOTIONS).filter((item) => item.motion !== rotatingMotionName);
      const next = candidates[Math.floor(Math.random() * candidates.length)] || ROTATING_MOTIONS[0];
      if (!next) return;

      rotatingMotionName = next.motion;

      if (autoPlay && model && (!availableMotions.size || availableMotions.has(next.motion)) && !document.hidden && !amiVoiceSpeaking && !amiVoiceLoading && !isSending) {
        playMotion(next.motion);
      }
    }

    function startRotatingMotionButton(autoPlayImmediately = false) {
      if (rotatingMotionTimer) {
        window.clearInterval(rotatingMotionTimer);
      }
      rotateHiddenMotion(autoPlayImmediately);
      rotatingMotionTimer = window.setInterval(() => {
        rotateHiddenMotion(true);
      }, 5000);
    }

    async function callAmiMbaResponseApiWithRetry(path, options = {}, retries = 1) {
      let lastError = null;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          return await callAmiMbaResponseApi(path, options);
        } catch (error) {
          lastError = error;
          if (Number(error?.status) === 401 && attempt < retries) {
            try {
              await refreshAmiAccessToken();
              continue;
            } catch (refreshError) {
              lastError = refreshError;
            }
          }
          if (attempt >= retries) break;
          await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
        }
      }
      throw lastError;
    }

    async function callAmiMbaApiWithRetry(path, options = {}, retries = 1) {
      let lastError = null;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          return await callAmiMbaApi(path, options);
        } catch (error) {
          lastError = error;
          if (Number(error?.status) === 401 && attempt < retries) {
            try {
              await refreshAmiAccessToken();
              continue;
            } catch (refreshError) {
              lastError = refreshError;
            }
          }
          if (attempt >= retries) break;
          await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
        }
      }
      throw lastError;
    }

    function updateChatHint() {
      const hint = document.getElementById("chat-hint");
      if (!hint) return;

      if (isDebateMode) {
        const config = getDebateTimeConfig();
        hint.textContent = config.seconds > 0
          ? `Trả lời rõ ràng, bám môn học và giữ trong ${formatCountdown(config.seconds)} để còn bonus thời gian.`
          : "Trả lời rõ ràng, bám môn học để Ami chấm điểm sát hơn.";
        return;
      }

      if (!amiSelectedSource) {
        hint.textContent = "Chọn môn học ngay trong khung chat để bắt đầu cùng Ami.";
        return;
      }

      hint.textContent = `Đang học môn ${amiSelectedName}. Nhấn Enter để gửi câu hỏi cho Ami.`;
    }

    function updateShellHeader() {
      const statusEl = document.getElementById("chat-shell-status");
      const titleEl = document.getElementById("chat-shell-title");
      const subtitleEl = document.getElementById("chat-shell-subtitle");
      if (!statusEl || !titleEl || !subtitleEl) return;

      statusEl.textContent = isSending
        ? "Ami đang phản hồi"
        : isDebateMode
          ? "Đang thử thách"
          : "Sẵn sàng";

      titleEl.textContent = amiSelectedName || "Học cùng Ami";

      if (!amiSelectedSource) {
        subtitleEl.textContent = "Chọn môn học để bắt đầu";
        return;
      }

      if (isDebateMode) {
        subtitleEl.textContent = `Lượt ${Math.max(debateTurn, 1)}/${MAX_DEBATE_TURN}`;
        return;
      }

      subtitleEl.textContent = "Sẵn sàng học cùng bạn";
    }

    function applyChatShellState() {
      const shell = document.getElementById("chat-shell");
      const collapseIcon = document.getElementById("chat-shell-collapse-icon");
      const minimizeIcon = document.getElementById("chat-shell-minimize-icon");
      const collapseBtn = document.getElementById("chat-shell-collapse-btn");
      const minimizeBtn = document.getElementById("chat-shell-minimize-btn");
      const quickToggleBtn = document.getElementById("chat-shell-toggle-btn");
      const quickToggleIcon = document.getElementById("chat-shell-toggle-icon");
      const quickActions = document.getElementById("quick-actions");

      if (!shell) return;

      shell.classList.toggle("is-panels-collapsed", chatShellPanelsCollapsed);
      shell.classList.toggle("is-minimized", chatShellMinimized);
      shell.classList.toggle("is-hidden", chatShellHidden);
      shell.classList.toggle("is-study-hidden", studyPanelClosed);
      shell.classList.toggle("is-subject-hidden", subjectPanelClosed);

      const hasHiddenTopPanels = chatShellPanelsCollapsed || studyPanelClosed || subjectPanelClosed;
      const shellVisible = !chatShellHidden;
      if (collapseIcon) collapseIcon.textContent = hasHiddenTopPanels ? "▾" : "▴";
      if (minimizeIcon) minimizeIcon.textContent = shellVisible ? "▾" : "▴";
      if (collapseBtn) {
        collapseBtn.title = hasHiddenTopPanels ? "Hiện lại phần đầu" : "Ẩn phần đầu";
        collapseBtn.setAttribute("aria-label", collapseBtn.title);
      }
      if (minimizeBtn) {
        const label = shellVisible ? "Ẩn khung chat" : "Hiện khung chat";
        minimizeBtn.title = label;
        minimizeBtn.setAttribute("aria-label", label);
      }
      if (quickToggleBtn) {
        const label = shellVisible ? "Ẩn khung chat" : "Hiện khung chat";
        quickToggleBtn.title = label;
        quickToggleBtn.setAttribute("aria-label", label);
        quickToggleBtn.classList.toggle("is-active", shellVisible);
      }
      if (quickToggleIcon) {
        quickToggleIcon.textContent = shellVisible ? "▾" : "▴";
      }
      if (quickActions) {
        quickActions.classList.toggle("is-shell-hidden", chatShellHidden);
      }
      updateAmiSessionUi();
    }

    function toggleShellPanels(force) {
      if (typeof force === "boolean") {
        chatShellPanelsCollapsed = force;
        if (!force) {
          studyPanelClosed = false;
          subjectPanelClosed = false;
        }
      } else if (chatShellPanelsCollapsed || studyPanelClosed || subjectPanelClosed) {
        chatShellPanelsCollapsed = false;
        studyPanelClosed = false;
        subjectPanelClosed = false;
      } else {
        chatShellPanelsCollapsed = true;
      }

      if (chatShellMinimized && !chatShellPanelsCollapsed) {
        chatShellMinimized = false;
      }
      applyChatShellState();
    }

    function closeStudyPanel() {
      studyPanelClosed = true;
      chatShellPanelsCollapsed = false;
      applyChatShellState();
    }

    function closeSubjectPanel() {
      subjectPanelClosed = true;
      chatShellPanelsCollapsed = false;
      applyChatShellState();
    }

    function closeTopPanelsForChat() {
      const needsClosing = !studyPanelClosed || !subjectPanelClosed || chatShellPanelsCollapsed || chatShellHidden;
      if (!needsClosing) return;

      studyPanelClosed = true;
      subjectPanelClosed = true;
      chatShellPanelsCollapsed = false;
      chatShellHidden = false;
      if (chatShellMinimized) {
        chatShellMinimized = false;
      }
      applyChatShellState();
    }

    function toggleChatShellVisibility(forceVisible) {
      const nextHidden = typeof forceVisible === "boolean" ? !forceVisible : !chatShellHidden;
      chatShellHidden = nextHidden;
      if (chatShellHidden) {
        stopChatShellDrag();
      }
      chatShellMinimized = false;
      applyChatShellState();
    }

    function toggleChatShellMinimized(force) {
      if (typeof force === "boolean") {
        toggleChatShellVisibility(!force);
        return;
      }
      toggleChatShellVisibility();
    }

    function resetChatShellPosition() {
      const shell = document.getElementById("chat-shell");
      if (!shell) return;
      shell.classList.remove("is-floating");
      shell.style.left = "";
      shell.style.top = "";
      shell.style.right = "";
      shell.style.bottom = "";
      shell.style.width = "";
      shell.style.height = "";
      shell.style.maxHeight = "";
    }

    function startChatShellDrag(event) {
      if (isCompactViewport() || chatShellMinimized) return;
      const shell = document.getElementById("chat-shell");
      if (!shell) return;
      if (event.target.closest(".shell-action-btn")) return;

      const rect = shell.getBoundingClientRect();
      shell.classList.add("is-floating");
      shell.style.left = `${rect.left}px`;
      shell.style.top = `${rect.top}px`;
      shell.style.right = "auto";
      shell.style.bottom = "auto";
      shell.style.width = `${rect.width}px`;

      chatShellDrag = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };

      window.addEventListener("pointermove", onChatShellDrag);
      window.addEventListener("pointerup", stopChatShellDrag);
      window.addEventListener("pointercancel", stopChatShellDrag);
      event.preventDefault();
    }

    function onChatShellDrag(event) {
      if (!chatShellDrag || event.pointerId !== chatShellDrag.pointerId) return;
      const shell = document.getElementById("chat-shell");
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      const maxLeft = Math.max(12, window.innerWidth - rect.width - 12);
      const maxTop = Math.max(12, window.innerHeight - rect.height - 12);
      const nextLeft = Math.min(Math.max(event.clientX - chatShellDrag.offsetX, 12), maxLeft);
      const nextTop = Math.min(Math.max(event.clientY - chatShellDrag.offsetY, 12), maxTop);

      shell.style.left = `${nextLeft}px`;
      shell.style.top = `${nextTop}px`;
    }

    function stopChatShellDrag(event) {
      if (event && chatShellDrag && event.pointerId && event.pointerId !== chatShellDrag.pointerId) return;
      chatShellDrag = null;
      window.removeEventListener("pointermove", onChatShellDrag);
      window.removeEventListener("pointerup", stopChatShellDrag);
      window.removeEventListener("pointercancel", stopChatShellDrag);
    }

    function refreshComposerState() {
      const sendBtn = document.getElementById("send-btn");
      const chatInput = document.getElementById("chat-input");
      if (!sendBtn || !chatInput) return;

      const lockedByMissingSubject = !amiSelectedSource && !isDebateMode;
      const voiceBusy = amiVoiceRecording || amiVoiceTranscribing;
      sendBtn.disabled = isSending || lockedByMissingSubject || voiceBusy;
      chatInput.disabled = isSending || lockedByMissingSubject || voiceBusy;

      if (isDebateMode) {
        chatInput.placeholder = "Nhập câu trả lời cho thử thách của Ami...";
      } else if (amiSelectedSource) {
        chatInput.placeholder = `Hỏi Ami về ${amiSelectedName}...`;
      } else {
        chatInput.placeholder = "Chọn môn học để bắt đầu cùng Ami";
      }
    }

    function setSendingState(next) {
      isSending = next;
      refreshComposerState();
      updateShellHeader();
      updateVoiceButtons();
    }

    function getEmptyChatMarkup() {
      if (isDebateMode) {
        return '<div class="empty-chat">Ami đang chuẩn bị thử thách cho bạn...</div>';
      }

      if (!amiSelectedSource) {
        return '<div class="empty-chat"><strong>Chọn môn học trước nhé.</strong><br>Ami sẽ trả lời theo tài liệu của từng môn, nên bạn chỉ cần chọn một môn trong khung phía trên để bắt đầu.</div>';
      }

      return `<div class="empty-chat">Bạn đang học môn <strong>${escapeHtml(amiSelectedName || amiSelectedSource)}</strong>. Cứ hỏi Ami bất kỳ điều gì liên quan đến môn này nhé.</div>`;
    }

    function persistSelectedSubject() {
      if (amiSelectedSource) {
        localStorage.setItem("ami-selected-source", amiSelectedSource);
        localStorage.setItem("ami-selected-name", amiSelectedName || "");
      } else {
        localStorage.removeItem("ami-selected-source");
        localStorage.removeItem("ami-selected-name");
      }
    }


    function normalizeAmiUserId(value) {
      return String(value || "").trim();
    }

    function decodeJwtPayload(token) {
      const rawToken = String(token || "").trim();
      if (!rawToken || !rawToken.includes(".")) return null;
      try {
        const payloadSegment = rawToken.split(".")[1] || "";
        const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
        const decoded = window.atob(padded);
        const json = decodeURIComponent(Array.from(decoded).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
        return JSON.parse(json);
      } catch (error) {
        console.warn("Ami chưa đọc được user từ token:", error);
        return null;
      }
    }

    function persistAmiHistoryUserId(userId) {
      const normalized = normalizeAmiUserId(userId);
      if (normalized) {
        localStorage.setItem(AMI_HISTORY_USER_ID_STORAGE_KEY, normalized);
      } else {
        localStorage.removeItem(AMI_HISTORY_USER_ID_STORAGE_KEY);
      }
    }

    function getAmiUserIdCandidates() {
      const fallbackContext = getChatContext();
      const tokenPayload = decodeJwtPayload(amiToken);
      const candidates = [
        amiUserId,
        tokenPayload?.sub,
        tokenPayload?.username,
        localStorage.getItem(AMI_HISTORY_USER_ID_STORAGE_KEY),
        fallbackContext?.userId
      ].map(normalizeAmiUserId).filter(Boolean);

      return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
    }

    function getAmiHistoryUserId() {
      return getAmiUserIdCandidates()[0] || "";
    }

    function getAmiHistorySource() {
      return String(amiSelectedSource || localStorage.getItem("ami-selected-source") || "").trim();
    }

    async function sendAmiHistoryDebugLog(event, details = {}) {
      if (!amiToken) return;

      try {
        await callAmiMbaApi("/ami/history_debug", {
          method: "POST",
          body: {
            event,
            username: normalizeAmiUserId(amiUserId || getAmiHistoryUserId()),
            source: getAmiHistorySource(),
            request_status: details.requestStatus || "",
            api_status: details.apiStatus || "",
            details,
          }
        });
      } catch (error) {
        console.warn("Ami history debug log failed:", error);
      }
    }

    function createAmiSessionId() {
      if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
      }
      return `ami-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function persistAmiSessionSelection() {
      if (amiCurrentSessionId) {
        localStorage.setItem("ami-current-session-id", amiCurrentSessionId);
      } else {
        localStorage.removeItem("ami-current-session-id");
      }
    }

    function setAmiCurrentSession(sessionId) {
      amiCurrentSessionId = String(sessionId || "").trim();
      persistAmiSessionSelection();
      updateAmiSessionUi();
    }

    function ensureAmiCurrentSession(forceNew = false) {
      if (forceNew || !amiCurrentSessionId) {
        setAmiCurrentSession(createAmiSessionId());
      }
      return amiCurrentSessionId;
    }

    function summarizeAmiSessionText(text) {
      const raw = String(text || "").replace(/\s+/g, " ").trim();
      if (!raw) return "Ami sẽ nối tiếp đúng ngữ cảnh của phiên này.";
      return raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
    }

    function formatAmiSessionTime(value) {
      if (!value) return "Vừa xong";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "Vừa xong";
      const now = new Date();
      const sameDay = now.toDateString() === date.toDateString();
      return sameDay
        ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    }

    function resolveAmiSubjectName(source, fallback = "") {
      const matchedBot = amiChatbots.find((bot) => bot.source === source);
      return matchedBot?.name || fallback || source || "Môn học";
    }

    function applyAmiSubjectContext(source, subjectName = "") {
      if (!source) return;
      amiSelectedSource = source;
      amiSelectedName = resolveAmiSubjectName(source, subjectName);
      persistSelectedSubject();

      const dot = document.getElementById("sidebar-subject-dot");
      if (dot) dot.style.display = "block";

      const title = document.querySelector("[data-drawer-page='home'] .drawer-title");
      if (title) title.textContent = amiSelectedName;

      renderSubjectsList();
      if (typeof renderLeaderboard === "function") renderLeaderboard();
    }

    function buildMessagesFromAmiHistory(chatHistory) {
      const nextMessages = [];
      for (const entry of chatHistory || []) {
        const userContent = String(entry?.message || "").trim();
        const assistantContent = String(entry?.response || "").trim();
        const timestamp = entry?.timestamp || entry?.created_at || new Date().toISOString();

        if (userContent) {
          nextMessages.push({
            id: `${entry._id || timestamp}-user`,
            role: "user",
            content: userContent,
            timestamp,
          });
        }
        if (assistantContent) {
          nextMessages.push({
            id: `${entry._id || timestamp}-assistant`,
            role: "assistant",
            content: assistantContent,
            timestamp,
          });
        }
      }
      return nextMessages;
    }

    function updateAmiSessionUi() {
      // Lịch sử chat kiểu gọn: chỉ cần highlight session active trong danh sách bên trái.
    }

    function renderAmiChatSessions() {
      const list = document.getElementById("ami-history-list");
      if (!list) {
        updateAmiSessionUi();
        return;
      }

      if (amiHistoryLoading) {
        list.innerHTML = '<p class="panel-empty">Ami đang tải lịch sử chat...</p>';
        updateAmiSessionUi();
        return;
      }

      if (!amiChatSessions.length) {
        list.innerHTML = '<p class="panel-empty">Chưa có cuộc trò chuyện nào. Nhấn dấu + để tạo session mới nhé.</p>';
        updateAmiSessionUi();
        return;
      }

      list.innerHTML = amiChatSessions.map((session) => {
        const sessionId = String(session.session_id || "");
        const active = sessionId === amiCurrentSessionId;
        const title = escapeHtml(session.session_title || summarizeAmiSessionText(session.first_message || session.last_message));
        const meta = [
          resolveAmiSubjectName(session.source, session.subject_name || session.source),
          formatAmiSessionTime(session.last_timestamp)
        ].filter(Boolean).join(" · ");
        return `
          <button class="ami-session-card ${active ? "is-active" : ""}" type="button" data-ami-session-id="${escapeHtml(sessionId)}">
            <strong class="ami-session-title">${title}</strong>
            <span class="ami-session-meta">${escapeHtml(meta)}</span>
          </button>`;
      }).join("");

      list.querySelectorAll("[data-ami-session-id]").forEach((button) => {
        button.addEventListener("click", () => loadAmiChatSession(button.dataset.amiSessionId));
      });
      updateAmiSessionUi();
    }

    async function loadAmiChatSessions({ silent = false } = {}) {
      const list = document.getElementById("ami-history-list");
      const userCandidates = getAmiUserIdCandidates();
      const historySource = getAmiHistorySource();

      void sendAmiHistoryDebugLog("history_load_requested", {
        requestStatus: "starting",
        usernameCandidates: userCandidates,
        source: historySource,
        hasToken: Boolean(amiToken),
        currentSessionId: amiCurrentSessionId || ""
      });

      if (!amiToken || !userCandidates.length) {
        if (list) {
          list.innerHTML = '<p class="panel-empty">Bạn cần đăng nhập để xem lịch sử chat của Ami.</p>';
        }
        void sendAmiHistoryDebugLog("history_load_skipped", {
          requestStatus: "skipped",
          source: historySource,
          hasToken: Boolean(amiToken),
          usernameCandidates: userCandidates,
          reason: !amiToken ? "missing_token" : "missing_username"
        });
        return [];
      }

      amiHistoryLoading = true;
      renderAmiChatSessions();

      try {
        let resolvedSessions = null;
        let resolvedUserId = "";
        let lastError = null;

        for (const candidate of userCandidates) {
          const params = {
            limit: 30,
            source: historySource || undefined
          };

          void sendAmiHistoryDebugLog("history_request_sent", {
            requestStatus: "sending",
            candidate,
            source: historySource,
            params
          });

          try {
            const historyRequest = callAmiMbaApiWithRetry(`/ami/chat_sessions/${encodeURIComponent(candidate)}`, {
              params
            }, 1);
            const timeoutRequest = new Promise((_, reject) => {
              window.setTimeout(() => {
                const error = new Error("Ami tải lịch sử chat hơi lâu.");
                error.code = "history_timeout";
                reject(error);
              }, 12000);
            });
            const data = await Promise.race([historyRequest, timeoutRequest]);
            const sessions = Array.isArray(data?.sessions) ? data.sessions : [];

            void sendAmiHistoryDebugLog("history_response_received", {
              requestStatus: "received",
              apiStatus: data?.status || "unknown",
              candidate,
              source: historySource,
              sessionCount: sessions.length,
              totalSessions: data?.total_sessions ?? sessions.length
            });

            if (resolvedSessions === null || sessions.length) {
              resolvedSessions = sessions;
              resolvedUserId = candidate;
            }
            if (sessions.length) {
              break;
            }
          } catch (candidateError) {
            lastError = candidateError;
            void sendAmiHistoryDebugLog("history_request_failed", {
              requestStatus: "failed",
              apiStatus: String(candidateError?.status || "error"),
              candidate,
              source: historySource,
              errorMessage: candidateError?.message || "unknown_error"
            });
          }
        }

        if (resolvedSessions === null) {
          if (lastError) throw lastError;
          resolvedSessions = [];
          resolvedUserId = userCandidates[0] || "";
        }

        amiChatSessions = resolvedSessions;
        if (resolvedUserId) {
          persistAmiHistoryUserId(resolvedUserId);
          if (!amiUserId) {
            amiUserId = resolvedUserId;
          }
        }

        void sendAmiHistoryDebugLog("history_load_completed", {
          requestStatus: "completed",
          apiStatus: "ok",
          resolvedUserId,
          source: historySource,
          sessionCount: amiChatSessions.length
        });
      } catch (error) {
        console.error(error);
        amiChatSessions = [];
        if (list) {
          list.innerHTML = '<p class="panel-empty">Ami chưa tải được lịch sử chat. Bạn thử mở lại giúp Ami nhé.</p>';
        }
        if (!silent) {
          status("Ami chưa tải được lịch sử chat lúc này.", "error");
        }
        void sendAmiHistoryDebugLog("history_load_error", {
          requestStatus: "error",
          apiStatus: String(error?.status || error?.code || "error"),
          source: historySource,
          errorMessage: error?.message || "unknown_error"
        });
      } finally {
        amiHistoryLoading = false;
        if (!(list && list.textContent.includes("Ami chưa tải được lịch sử chat."))) {
          renderAmiChatSessions();
        }
      }

      return amiChatSessions;
    }

    function resetDebateStateForSession() {
      isDebateMode = false;
      debateTurn = 0;
      debateUserHistory = [];
      debateQuestionHistory = [];
      debateCurrentQuestion = "";
      debateTurnScores = [];
      resetDebateTimingState();
      const debateHeader = document.getElementById("debate-header");
      if (debateHeader) debateHeader.style.display = "none";
      updateChatHint();
      updateShellHeader();
      refreshComposerState();
    }

    async function loadAmiChatSession(sessionId, { openHome = true, silent = false } = {}) {
      const normalizedSessionId = String(sessionId || "").trim();
      if (!normalizedSessionId || !amiToken) return;

      stopAssistantSpeech();

      try {
        const data = await callAmiMbaApi(`/ami/chat_history/session/${encodeURIComponent(normalizedSessionId)}`);
        resetDebateStateForSession();
        currentConversationId = null;
        currentExchangeCount = 0;
        setAmiCurrentSession(data.session_id || normalizedSessionId);
        applyAmiSubjectContext(data.source, data.subject_name || data.source);
        messages = buildMessagesFromAmiHistory(data.chat_history);
        renderMessages();
        updateStudyPanel();
        updateShellHeader();
        refreshComposerState();
        closeTopPanelsForChat();
        toggleChatShellVisibility(true);
        if (openHome) {
          openDrawerPage("home", true);
        }
        if (!silent) {
          status("Đã mở lại session chat của Ami.");
        }
        loadAmiChatSessions({ silent: true });
      } catch (error) {
        console.error(error);
        if (!silent) {
          status("Ami chưa mở lại được session này.", "error");
        }
      }
    }

    function bootstrapAmiHistoryIfReady() {
      const userId = getAmiHistoryUserId();
      if (!amiToken || !userId || amiHistoryBootstrapped) return;

      amiHistoryBootstrapped = true;
      const savedSessionId = String(localStorage.getItem("ami-current-session-id") || "").trim();
      if (savedSessionId) {
        loadAmiChatSessions({ silent: true }).then((sessions) => {
          const hasSavedSession = Array.isArray(sessions) && sessions.some(
            (session) => String(session?.session_id || "").trim() === savedSessionId
          );
          if (hasSavedSession) {
            return loadAmiChatSession(savedSessionId, { openHome: false, silent: true });
          }
          setAmiCurrentSession("");
          ensureAmiCurrentSession(true);
          return null;
        });
        return;
      }

      ensureAmiCurrentSession(true);
      loadAmiChatSessions({ silent: true });
    }

    function updateStudyPanel() {
      const studyTitle = document.getElementById("study-title");
      const studyDescription = document.getElementById("study-description");
      const studyPanel = document.getElementById("study-panel");
      const inlinePicker = document.getElementById("subject-inline-picker");
      const debateCopy = document.getElementById("debate-subject-copy");
      const leaderboardCopy = document.getElementById("leaderboard-copy");

      if (amiSelectedSource) {
        if (studyTitle) studyTitle.textContent = `${amiSelectedName} (${amiSelectedSource})`;
        if (studyDescription) {
          studyDescription.textContent = `Ami đang đồng hành cùng bạn ở môn ${amiSelectedName}. Bạn có thể hỏi bài bình thường hoặc mở Thử thách Ami để luyện phản xạ.`;
        }
        if (studyPanel) studyPanel.classList.add("is-selected");
        if (debateCopy) {
          debateCopy.textContent = `Bạn đang chọn môn ${amiSelectedName} (${amiSelectedSource}). Sẵn sàng nhận thử thách từ Ami chưa?`;
        }
        if (leaderboardCopy) {
          leaderboardCopy.textContent = `Bảng xếp hạng hiện hiển thị cho môn ${amiSelectedName} (${amiSelectedSource}).`;
        }
      } else {
        if (studyTitle) studyTitle.textContent = "Chọn đúng môn để Ami học cùng bạn nhé";
        if (studyDescription) {
          studyDescription.textContent = "Ami là sinh viên PTIT đồng hành cùng bạn. Chọn môn trước để Ami trả lời đúng ngữ cảnh và mở luôn chế độ học phù hợp.";
        }
        if (studyPanel) studyPanel.classList.remove("is-selected");
        if (debateCopy) {
          debateCopy.textContent = "Hãy chọn môn học trước khi bắt đầu để Ami đưa thử thách đúng tài liệu và chấm sát hơn.";
        }
        if (leaderboardCopy) {
          leaderboardCopy.textContent = "Chọn môn học để xem top người học có điểm thử thách cao nhất.";
        }
      }

      if (inlinePicker) {
        inlinePicker.classList.toggle("is-visible", amiChatbots.length > 0);
      }

      updateChatHint();
      updateShellHeader();
      refreshComposerState();
      updateAmiSessionUi();
      applyChatShellState();
    }

    function renderMessages() {
      const list = document.getElementById("message-list");
      if (!messages.length) {
        list.innerHTML = getEmptyChatMarkup();
        rememberLatestAssistantSpeech();
        return;
      }

      list.innerHTML = messages.map((msg) => {
        const isUser = msg.role === "user";
        const isPending = !!msg.pending;
        const timeStr = escapeHtml(formatDisplayTime(msg.timestamp));
        // Hỗ trợ **bold** markdown đơn giản
        const contentHtml = escapeHtml(msg.content)
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>");

        if (isUser) {
          return `
            <div class="chat-row user-row">
              <div class="chat-bubble user-bubble ${isPending ? "is-pending" : ""}">
                <span class="bubble-text">${contentHtml}</span>
                <span class="bubble-time">${timeStr}</span>
              </div>
              <div class="chat-avatar user-avatar">${escapeHtml(amiUserInitials)}</div>
            </div>`;
        } else {
          return `
            <div class="chat-row ami-row">
              <img class="ami-avatar-img" src="/mini/ami-avatar.png" alt="Ami" />
              <div class="chat-bubble ami-bubble ${isPending ? "is-pending" : ""}">
                <span class="bubble-sender">Ami</span>
                <span class="bubble-text">${contentHtml}</span>
                <span class="bubble-time">${timeStr}</span>
              </div>
            </div>`;
        }
      }).join("");
      rememberLatestAssistantSpeech();
      window.requestAnimationFrame(() => {
        if (isCompactViewport()) {
          const shell = document.getElementById("chat-shell");
          if (shell) shell.scrollTop = shell.scrollHeight;
        } else {
          list.scrollTop = list.scrollHeight;
        }
      });
    }

    function hydrateMessages(detail) {
      const nextMessages = [];
      for (const exchange of detail.exchanges || []) {
        nextMessages.push({
          id: `${exchange.exchange_id}-user`,
          role: "user",
          content: exchange.user_input,
          timestamp: exchange.created_at
        });

        if (exchange.agent_response) {
          nextMessages.push({
            id: `${exchange.exchange_id}-assistant`,
            role: "assistant",
            content: exchange.agent_response,
            timestamp: exchange.completed_at || exchange.created_at
          });
        }
      }
      messages = nextMessages;
      currentExchangeCount = detail.total_exchanges || 0;
      renderMessages();
      updateShellHeader();
    }

    async function assetExists(path) {
      try {
        const res = await fetch(path, { method: "HEAD" });
        return res.ok;
      } catch {
        try {
          const res = await fetch(path, { method: "GET" });
          return res.ok;
        } catch {
          return false;
        }
      }
    }

    function syncSidebarState() {
      ["drawer", "subjects", "history", "debate", "leaderboard", "expressions", "profile", "settings"].forEach((action) => {
        const button = document.querySelector(`[data-sidebar-action="${action}"]`);
        if (!button) return;
        const isHome = action === "drawer" && currentDrawerPage === "home";
        button.classList.toggle("is-active", drawerOpen && (isHome || currentDrawerPage === action));
      });
    }

    function toggleDrawer(force) {
      drawerOpen = typeof force === "boolean" ? force : !drawerOpen;
      document.getElementById("drawer").classList.toggle("is-open", drawerOpen);
      document.getElementById("drawer-backdrop").classList.toggle("is-visible", drawerOpen && isCompactViewport());
      syncSidebarState();
    }

    function openDrawerPage(page, forceOpen = false) {
      currentDrawerPage = page;

      document.querySelectorAll(".drawer-page").forEach((section) => {
        section.classList.toggle("is-active", section.dataset.drawerPage === page);
      });

      if (forceOpen) {
        toggleDrawer(true);
      } else {
        syncSidebarState();
      }
      syncSidebarState();

      if (page === "leaderboard") {
        if (typeof renderLeaderboard === "function") renderLeaderboard();
      }
      if (page === "history") {
        void sendAmiHistoryDebugLog("history_drawer_opened", {
          requestStatus: "drawer_opened",
          forceOpen,
          source: getAmiHistorySource(),
          currentPage: page
        });
        loadAmiChatSessions({ silent: true });
      }
    }

    function newConversation() {
      resetDebateStateForSession();
      currentConversationId = null;
      currentExchangeCount = 0;
      messages = [];
      ensureAmiCurrentSession(true);
      renderMessages();
      updateShellHeader();
      updateAmiSessionUi();
      toggleChatShellVisibility(true);
      openDrawerPage("home", true);
      status("Đã tạo session chat mới");
    }

    async function pollAssistantReply(conversationId, previousExchangeCount) {
      const startedAt = Date.now();
      const timeoutMs = 90000;

      while (Date.now() - startedAt < timeoutMs) {
        const detail = await apiRequest(`/api/v1/conversations/${conversationId}`);
        const total = detail.total_exchanges || 0;
        const exchanges = detail.exchanges || [];
        const latest = exchanges[exchanges.length - 1];

        if (total > previousExchangeCount && latest?.agent_response) {
          currentConversationId = detail.conversation_id;
          const preparedSpeech = await requestSpeechAudio(latest.agent_response, { silent: true });
          hydrateMessages(detail);
          await playPreparedSpeech(preparedSpeech, { silent: true });
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }

      throw new Error("Quá thời gian chờ phản hồi từ Ami");
    }

    async function submitChatMessage(text) {
      const content = text.trim();
      if (!content || isSending) return;

      stopAssistantSpeech();

      if (isDebateMode) {
        await handleDebateSubmit(content);
        return;
      }

      if (amiSelectedSource) {
        closeTopPanelsForChat();
      }

      // ── Mode RAG (có môn học được chọn) ──
      if (amiSelectedSource && amiToken) {
        toggleChatShellVisibility(true);
        setSendingState(true);
        const tempUser = { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() };
        const tempAmi = { id: `a-${Date.now()}`, role: "assistant", content: "Ami đang suy nghĩ...", timestamp: new Date().toISOString(), pending: true };
        messages = [...messages, tempUser, tempAmi];
        renderMessages();

        // Phát hành động suy nghĩ / đọc sách
        playMotion("Reading");

        try {
          const sessionId = ensureAmiCurrentSession();
          const time = getAmiHistoryUserId() || amiUserId || new Date().toISOString();
          const reqBody = {
            userId: time,
            text: content,
            source: amiSelectedSource,
            save: true,
            mode: "ami_study",
            sessionId,
            metadata: {
              subject_name: amiSelectedName,
              user_name: amiUserName
            }
          };

          const data = await callAmiMbaApi("/chat", {
            method: "POST",
            body: reqBody
          });
          if (data && typeof data.session_id === "string" && data.session_id.trim()) {
            setAmiCurrentSession(data.session_id);
          } else {
            setAmiCurrentSession(sessionId);
          }
          const answer = extractChatText(data);
          const preparedSpeech = await requestSpeechAudio(answer, { silent: true });

          messages = messages.map(m => m.pending ? { ...m, content: answer, pending: false } : m);
          renderMessages();
          status("Ami đã phản hồi");
          loadAmiChatSessions({ silent: true });

          if (!preparedSpeech?.audioBlob) {
            playMotion("Head_Nod");
          }
          await playPreparedSpeech(preparedSpeech, { silent: true });
        } catch (error) {
          messages = messages.map(m => m.pending ? { ...m, content: "Ami đang hơi bận một chút nên chưa trả lời trọn vẹn được. Bạn gửi lại giúp Ami nhé.", pending: false } : m);
          renderMessages();
          status("Ami chưa gửi được phản hồi lần này.", "error");
          playMotion("Head_Shake");
        } finally {
          setSendingState(false);
        }
        return;
      }

      // ── Mode mặc định (chưa chọn môn) ──
      if (!amiSelectedSource) {
        const hint = { id: `sys-${Date.now()}`, role: "assistant", content: "📚 Vui lòng chọn môn học trước! Nhấn nút sách 📖 ở sidebar hoặc nút \"Chọn môn\" ở trên.", timestamp: new Date().toISOString() };
        messages = [...messages, { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() }, hint];
        renderMessages();
        return;
      }

      // ── Fallback: API cũ ──
      const { userId, workspaceId } = getChatContext();
      setSendingState(true);
      const tempUser = { id: `temp-user-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() };
      const tempAssistant = { id: `temp-assistant-${Date.now()}`, role: "assistant", content: "Ami đang trả lời...", timestamp: new Date().toISOString(), pending: true };
      messages = [...messages, tempUser, tempAssistant];
      renderMessages();

      try {
        const previousExchangeCount = currentExchangeCount;
        if (currentConversationId) {
          await apiRequest(`/api/v1/conversations/${currentConversationId}/continue`, { method: "POST", body: JSON.stringify({ user_message: content, trace_id: crypto.randomUUID() }) });
        } else {
          const created = await apiRequest("/api/v1/conversations", { method: "POST", body: JSON.stringify({ workspace_id: workspaceId, user_id: userId, initial_message: content, trace_id: crypto.randomUUID() }) });
          currentConversationId = created.conversation_id;
        }
        await pollAssistantReply(currentConversationId, previousExchangeCount);
        status("Ami đã phản hồi");
      } catch (error) {
        messages = messages.filter(m => !m.pending);
        renderMessages();
        status("Ami chưa gửi được phản hồi lần này.", "error");
      } finally {
        setSendingState(false);
      }
    }

    function getSpeakableText(text) {
      const cleaned = String(text || "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleaned) return "";
      return cleaned.slice(0, 1200);
    }

    function formatVoiceRecordingTime(totalSeconds) {
      const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
      const minutes = Math.floor(safeSeconds / 60);
      const seconds = safeSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    function stopVoiceRecordingTicker({ reset = false } = {}) {
      if (voiceRecordingTimer) {
        window.clearInterval(voiceRecordingTimer);
        voiceRecordingTimer = 0;
      }
      if (reset) {
        voiceRecordingStartedAt = 0;
        voiceRecordingElapsedSeconds = 0;
      }
      const timer = document.getElementById("voice-record-timer");
      if (timer) {
        timer.textContent = formatVoiceRecordingTime(voiceRecordingElapsedSeconds);
      }
    }

    function refreshVoiceRecordingTicker() {
      if (amiVoiceRecording && voiceRecordingStartedAt) {
        voiceRecordingElapsedSeconds = Math.max(0, Math.floor((Date.now() - voiceRecordingStartedAt) / 1000));
      }
      const timer = document.getElementById("voice-record-timer");
      if (timer) {
        timer.textContent = formatVoiceRecordingTime(voiceRecordingElapsedSeconds);
      }
    }

    function startVoiceRecordingTicker() {
      stopVoiceRecordingTicker({ reset: true });
      voiceRecordingStartedAt = Date.now();
      refreshVoiceRecordingTicker();
      voiceRecordingTimer = window.setInterval(refreshVoiceRecordingTicker, 250);
    }

    function syncVoiceRecorderUi() {
      const form = document.getElementById("chat-form");
      const shell = document.getElementById("voice-recorder-shell");
      const title = document.getElementById("voice-record-title");
      const subtitle = document.getElementById("voice-record-subtitle");
      const stopBtn = document.getElementById("voice-record-stop-btn");
      const cancelBtn = document.getElementById("voice-record-cancel-btn");
      const visible = amiVoiceRecording || amiVoiceTranscribing;

      if (form) {
        form.classList.toggle("is-recording", amiVoiceRecording);
        form.classList.toggle("is-transcribing", amiVoiceTranscribing);
      }
      if (shell) {
        shell.hidden = !visible;
      }
      if (title) {
        title.textContent = amiVoiceRecording ? "Ami đang nghe bạn nói" : "Ami đang chép lời cho bạn";
      }
      if (subtitle) {
        subtitle.textContent = amiVoiceRecording
          ? "Nhấn nút vuông để chốt ghi âm và chép lời"
          : "Đợi Ami chuyển giọng nói thành văn bản nhé";
      }
      if (stopBtn) {
        stopBtn.disabled = !amiVoiceRecording;
      }
      if (cancelBtn) {
        cancelBtn.disabled = amiVoiceTranscribing;
      }
      refreshVoiceRecordingTicker();
    }

    function updateVoiceButtons() {
      const recordBtn = document.getElementById("voice-record-btn");
      const replayBtn = document.getElementById("voice-replay-btn");
      if (recordBtn) {
        recordBtn.classList.toggle("is-active", amiVoiceRecording);
        recordBtn.classList.toggle("is-busy", amiVoiceTranscribing);
        recordBtn.disabled = amiVoiceTranscribing || isSending;
        const recordLabel = amiVoiceRecording
          ? "Ami đang ghi âm"
          : amiVoiceTranscribing
            ? "Ami đang chép lời cho bạn"
            : "Bấm để nói với Ami";
        recordBtn.title = recordLabel;
        recordBtn.setAttribute("aria-label", recordLabel);
      }
      if (replayBtn) {
        replayBtn.classList.toggle("is-active", amiVoiceSpeaking || amiVoiceLoading);
        replayBtn.classList.toggle("is-busy", amiVoiceLoading);
        replayBtn.disabled = (!lastAssistantSpeechText && !amiVoiceSpeaking) || amiVoiceRecording || amiVoiceTranscribing;
        const replayLabel = amiVoiceSpeaking
          ? "Dừng giọng đọc của Ami"
          : amiVoiceLoading
            ? "Ami đang tạo giọng đọc"
            : "Phát lại câu trả lời gần nhất của Ami";
        replayBtn.title = replayLabel;
        replayBtn.setAttribute("aria-label", replayLabel);
      }
      syncVoiceRecorderUi();
    }

    function rememberLatestAssistantSpeech() {
      const latestAssistant = [...messages].reverse().find((message) =>
        message.role === "assistant" && !message.pending && String(message.content || "").trim()
      );
      lastAssistantSpeechText = latestAssistant ? getSpeakableText(latestAssistant.content) : "";
      updateVoiceButtons();
    }

    function clampUnit(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 0;
      return Math.min(1, Math.max(0, numeric));
    }

    function resolveLipSyncParameterIds() {
      const settings = model?.internalModel?.settings;
      let ids = [];

      if (typeof settings?.getLipSyncParameters === "function") {
        try {
          ids = settings.getLipSyncParameters() || [];
        } catch {
          ids = [];
        }
      }

      const groups = Array.isArray(settings?.Groups)
        ? settings.Groups
        : Array.isArray(settings?.groups)
          ? settings.groups
          : [];

      if (!ids.length && groups.length) {
        const lipSyncGroup = groups.find((group) => String(group?.Name || "").toLowerCase() === "lipsync");
        if (Array.isArray(lipSyncGroup?.Ids) && lipSyncGroup.Ids.length) {
          ids = lipSyncGroup.Ids;
        }
      }

      if (!ids.length) {
        ids = DEFAULT_LIP_SYNC_PARAMETER_IDS.slice();
      }

      return [...new Set(ids.filter((id) => typeof id === "string" && id.trim()))];
    }

    function resetSpeechLipSync({ immediate = false } = {}) {
      amiSpeechLipSyncLevel = 0;
      if (!immediate) return;

      const coreModel = model?.internalModel?.coreModel;
      if (!coreModel) return;

      const lipSyncIds = amiSpeechLipSyncParameterIds.length
        ? amiSpeechLipSyncParameterIds
        : resolveLipSyncParameterIds();

      lipSyncIds.forEach((id) => {
        try {
          coreModel.setParameterValueById(id, 0);
        } catch { }
        try {
          const index = typeof coreModel.getParameterIndex === "function" ? coreModel.getParameterIndex(id) : -1;
          if (index >= 0 && typeof coreModel.setParameterValueByIndex === "function") {
            coreModel.setParameterValueByIndex(index, 0, 1);
          }
        } catch { }
      });
      try {
        coreModel.setParameterValueById("ParamMouthOpenY", 0, 1);
      } catch { }
    }

    function stopSpeechLipSyncLoop({ reset = false } = {}) {
      if (amiSpeechLipSyncFrame) {
        window.cancelAnimationFrame(amiSpeechLipSyncFrame);
        amiSpeechLipSyncFrame = 0;
      }
      if (reset) {
        resetSpeechLipSync({ immediate: true });
      }
    }

    function releaseSpeechLipSync() {
      stopSpeechLipSyncLoop();
      if (amiSpeechAnalyserNode) {
        try {
          amiSpeechAnalyserNode.disconnect();
        } catch { }
        amiSpeechAnalyserNode = null;
      }
      if (amiSpeechSourceNode) {
        try {
          amiSpeechSourceNode.disconnect();
        } catch { }
        amiSpeechSourceNode = null;
      }
      amiSpeechLipSyncData = null;
      resetSpeechLipSync({ immediate: true });
    }

    async function prepareSpeechLipSync(audioElement) {
      releaseSpeechLipSync();
      amiSpeechLipSyncParameterIds = resolveLipSyncParameterIds();
      if (!audioElement || !amiSpeechLipSyncParameterIds.length) return false;

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return false;

      try {
        if (!amiSpeechAudioContext) {
          amiSpeechAudioContext = new AudioContextCtor();
        }
        if (amiSpeechAudioContext.state === "suspended") {
          try {
            await amiSpeechAudioContext.resume();
          } catch {
            return false;
          }
        }
        if (amiSpeechAudioContext.state !== "running") {
          return false;
        }

        amiSpeechSourceNode = amiSpeechAudioContext.createMediaElementSource(audioElement);
        amiSpeechAnalyserNode = amiSpeechAudioContext.createAnalyser();
        amiSpeechAnalyserNode.fftSize = 1024;
        amiSpeechAnalyserNode.smoothingTimeConstant = 0.82;
        amiSpeechLipSyncData = new Uint8Array(amiSpeechAnalyserNode.fftSize);
        amiSpeechSourceNode.connect(amiSpeechAnalyserNode);
        amiSpeechAnalyserNode.connect(amiSpeechAudioContext.destination);
        ensureSpeechLipSyncLoop();
        return true;
      } catch (error) {
        console.error(error);
        releaseSpeechLipSync();
        return false;
      }
    }

    function getFallbackSpeechLipSyncLevel() {
      if (!amiVoiceSpeaking || !amiSpeechAudio || amiSpeechAudio.paused) return 0;
      const time = Number(amiSpeechAudio.currentTime) || 0;
      const primaryBeat = Math.abs(Math.sin(time * 10.6));
      const secondaryBeat = Math.abs(Math.sin(time * 18.4 + 0.9));
      return clampUnit(0.34 + primaryBeat * 0.5 + secondaryBeat * 0.26);
    }

    function getSpeechLipSyncParameterIndex(coreModel, id) {
      if (!coreModel || !id) return -1;

      if (amiSpeechLipSyncIndexCache.has(id)) {
        return amiSpeechLipSyncIndexCache.get(id);
      }

      let index = -1;
      try {
        if (typeof coreModel.getParameterIndex === "function") {
          index = coreModel.getParameterIndex(id);
        }
      } catch { }

      if (index < 0) {
        const ids = Array.isArray(coreModel._parameterIds)
          ? coreModel._parameterIds
          : Array.isArray(coreModel?.parameters?.ids)
            ? coreModel.parameters.ids
            : [];
        index = ids.findIndex((item) => String(item) === id);
      }

      amiSpeechLipSyncIndexCache.set(id, index);
      return index;
    }

    function setSpeechLipSyncParameter(coreModel, id, level) {
      if (!coreModel || !id) return false;

      const nextLevel = clampUnit(level);
      let updated = false;

      try {
        if (typeof coreModel.setParameterValueById === "function") {
          coreModel.setParameterValueById(id, nextLevel, 1);
          updated = true;
        }
      } catch { }

      const index = getSpeechLipSyncParameterIndex(coreModel, id);
      if (index < 0) {
        return updated;
      }

      try {
        if (typeof coreModel.setParameterValueByIndex === "function") {
          coreModel.setParameterValueByIndex(index, nextLevel, 1);
          updated = true;
        }
      } catch { }

      const values = coreModel._parameterValues || coreModel?.parameters?.values;
      if (values && typeof values[index] === "number") {
        const minimumValues = coreModel._parameterMinimumValues || coreModel?.parameters?.minimumValues || [];
        const maximumValues = coreModel._parameterMaximumValues || coreModel?.parameters?.maximumValues || [];
        let directValue = nextLevel;
        if (typeof minimumValues[index] === "number") {
          directValue = Math.max(directValue, minimumValues[index]);
        }
        if (typeof maximumValues[index] === "number") {
          directValue = Math.min(directValue, maximumValues[index]);
        }
        values[index] = directValue;
        updated = true;
      }

      return updated;
    }

    function isSpeechLipSyncActive() {
      return Boolean(
        model &&
        (amiVoiceSpeaking || amiVoiceLoading || (amiSpeechAudio && !amiSpeechAudio.paused) || amiSpeechLipSyncLevel > 0.02)
      );
    }

    function ensureSpeechLipSyncLoop() {
      if (amiSpeechLipSyncFrame || !model) return;

      const loop = () => {
        amiSpeechLipSyncFrame = 0;
        if (!isSpeechLipSyncActive()) {
          if (amiSpeechLipSyncLevel > 0) {
            resetSpeechLipSync({ immediate: true });
          }
          return;
        }

        const forcedFloor = amiVoiceSpeaking ? 0.62 : amiVoiceLoading ? 0.18 : 0;
        const forcedLevel = Math.max(updateSpeechLipSync(), forcedFloor);
        amiSpeechLipSyncLevel = forcedLevel;
        applySpeechLipSyncToCoreModel(forcedLevel);
        amiSpeechLipSyncFrame = window.requestAnimationFrame(loop);
      };

      amiSpeechLipSyncFrame = window.requestAnimationFrame(loop);
    }

    function applySpeechLipSyncToCoreModel(level = amiSpeechLipSyncLevel) {
      const internalModel = model?.internalModel;
      const coreModel = internalModel?.coreModel;
      if (!coreModel) return false;

      if (!amiSpeechLipSyncParameterIds.length) {
        amiSpeechLipSyncParameterIds = resolveLipSyncParameterIds();
      }

      const lipSyncIds = amiSpeechLipSyncParameterIds.length
        ? amiSpeechLipSyncParameterIds
        : DEFAULT_LIP_SYNC_PARAMETER_IDS;
      const nextLevel = clampUnit(level);
      let applied = false;

      lipSyncIds.forEach((id) => {
        applied = setSpeechLipSyncParameter(coreModel, id, nextLevel) || applied;
        try {
          coreModel.addParameterValueById(id, nextLevel * 0.12, 0.2);
        } catch { }
      });

      applied = setSpeechLipSyncParameter(coreModel, "ParamMouthOpenY", nextLevel) || applied;
      return applied;
    }

    function updateSpeechLipSync() {
      const coreModel = model?.internalModel?.coreModel;
      if (!coreModel) return 0;

      let target = 0;
      if (amiSpeechAnalyserNode && amiSpeechLipSyncData && amiVoiceSpeaking && amiSpeechAudio && !amiSpeechAudio.paused) {
        try {
          amiSpeechAnalyserNode.getByteTimeDomainData(amiSpeechLipSyncData);
          let energy = 0;
          for (let idx = 0; idx < amiSpeechLipSyncData.length; idx += 1) {
            const sample = (amiSpeechLipSyncData[idx] - 128) / 128;
            energy += sample * sample;
          }
          const rms = Math.sqrt(energy / amiSpeechLipSyncData.length);
          target = clampUnit((rms - 0.002) * 40);
          if (target < 0.08) {
            target = 0;
          }
        } catch {
          target = 0;
        }
      }

      if (amiVoiceSpeaking) {
        target = Math.max(target, getFallbackSpeechLipSyncLevel(), 0.58);
      }

      const smoothing = target > amiSpeechLipSyncLevel ? 0.92 : 0.56;
      amiSpeechLipSyncLevel += (target - amiSpeechLipSyncLevel) * smoothing;
      if (!amiVoiceSpeaking && amiSpeechLipSyncLevel < 0.015) {
        amiSpeechLipSyncLevel = 0;
      }

      return applySpeechLipSyncToCoreModel(amiSpeechLipSyncLevel) ? amiSpeechLipSyncLevel : 0;
    }

    function bindSpeechLipSync() {
      const internalModel = model?.internalModel;
      const coreModel = internalModel?.coreModel;
      if (!internalModel || !coreModel || internalModel.__amiLipSyncBound) return;

      const originalInternalUpdate = internalModel.update?.bind(internalModel);
      const originalDraw = internalModel.draw?.bind(internalModel);
      const motionManager = internalModel.motionManager;
      const originalMotionManagerUpdate = motionManager?.update?.bind(motionManager);

      if (typeof originalInternalUpdate === "function") {
        internalModel.update = (...args) => {
          const result = originalInternalUpdate(...args);
          if (isSpeechLipSyncActive()) {
            ensureSpeechLipSyncLoop();
            amiSpeechLipSyncLevel = Math.max(updateSpeechLipSync(), amiVoiceSpeaking ? 0.62 : 0);
          }
          return result;
        };
      }

      if (motionManager && typeof originalMotionManagerUpdate === "function" && !motionManager.__amiLipSyncBound) {
        motionManager.update = (...args) => {
          const result = originalMotionManagerUpdate(...args);
          if (isSpeechLipSyncActive()) {
            ensureSpeechLipSyncLoop();
            const forcedLevel = Math.max(updateSpeechLipSync(), amiVoiceSpeaking ? 0.68 : 0.16);
            amiSpeechLipSyncLevel = forcedLevel;
            applySpeechLipSyncToCoreModel(forcedLevel);
          }
          return result;
        };
        motionManager.__amiLipSyncBound = true;
      }

      if (typeof originalDraw === "function") {
        internalModel.draw = (...args) => {
          const shouldForceLipSync = isSpeechLipSyncActive();
          if (shouldForceLipSync) {
            ensureSpeechLipSyncLoop();
            const forcedLevel = Math.max(updateSpeechLipSync(), amiVoiceSpeaking ? 0.72 : 0.18);
            amiSpeechLipSyncLevel = forcedLevel;
            if (applySpeechLipSyncToCoreModel(forcedLevel)) {
              try {
                coreModel.update();
              } catch { }
            }
          }
          return originalDraw(...args);
        };
      }

      internalModel.__amiLipSyncBound = true;

      if (app?.ticker && !amiSpeechLipSyncTickerAttached) {
        app.ticker.add(() => {
          if (!isSpeechLipSyncActive()) return;
          const forcedLevel = Math.max(updateSpeechLipSync(), amiVoiceSpeaking ? 0.7 : 0.16);
          amiSpeechLipSyncLevel = forcedLevel;
          applySpeechLipSyncToCoreModel(forcedLevel);
        });
        amiSpeechLipSyncTickerAttached = true;
      }
    }

    function disposeSpeechAudio() {
      stopSpeechLipSyncLoop();
      releaseSpeechLipSync();
      if (amiSpeechAudio) {
        amiSpeechAudio.onended = null;
        amiSpeechAudio.onerror = null;
        amiSpeechAudio.onplaying = null;
        amiSpeechAudio.pause();
        amiSpeechAudio.src = "";
        amiSpeechAudio = null;
      }
      if (amiSpeechObjectUrl) {
        URL.revokeObjectURL(amiSpeechObjectUrl);
        amiSpeechObjectUrl = "";
      }
    }

    function stopAssistantSpeech() {
      amiVoiceSpeaking = false;
      amiVoiceLoading = false;
      stopSpeechLipSyncLoop();
      disposeSpeechAudio();
      updateVoiceButtons();
    }

    async function requestSpeechAudio(text, { force = false, silent = false } = {}) {
      const speakable = getSpeakableText(text);
      if (!speakable) {
        return { speakable: "", audioBlob: null, skipped: true, error: null };
      }

      lastAssistantSpeechText = speakable;
      updateVoiceButtons();

      if (!amiVoiceEnabled && !force) {
        return { speakable, audioBlob: null, skipped: true, error: null };
      }

      amiVoiceLoading = true;
      updateVoiceButtons();

      try {
        const response = await callAmiMbaResponseApiWithRetry("/ami/tts", {
          method: "POST",
          body: JSON.stringify({ text: speakable }),
          headers: {
            "Content-Type": "application/json"
          }
        }, 1);

        const audioBlob = await response.blob();
        if (!audioBlob.size) {
          throw new Error("Dịch vụ giọng nói chưa trả về audio hợp lệ.");
        }

        return { speakable, audioBlob, skipped: false, error: null };
      } catch (error) {
        console.error(error);
        if (!silent) {
          status(force ? "Ami chưa đọc lại được câu trả lời này." : "Ami chưa đọc được phản hồi lần này.", "error");
        }
        return { speakable, audioBlob: null, skipped: false, error };
      } finally {
        amiVoiceLoading = false;
        updateVoiceButtons();
      }
    }

    async function playPreparedSpeech(preparedSpeech, { silent = false } = {}) {
      if (!preparedSpeech?.audioBlob) return false;

      try {
        stopAssistantSpeech();
        amiSpeechObjectUrl = URL.createObjectURL(preparedSpeech.audioBlob);
        amiSpeechAudio = new Audio(amiSpeechObjectUrl);
        amiSpeechAudio.preload = "auto";
        amiSpeechAudio.onplaying = () => {
          amiVoiceSpeaking = true;
          amiSpeechLipSyncLevel = Math.max(amiSpeechLipSyncLevel, 0.72);
          ensureSpeechLipSyncLoop();
          updateSpeechLipSync();
          updateVoiceButtons();
        };
        amiSpeechAudio.onended = () => {
          amiVoiceSpeaking = false;
          disposeSpeechAudio();
          updateVoiceButtons();
        };
        amiSpeechAudio.onerror = () => {
          stopAssistantSpeech();
        };
        await prepareSpeechLipSync(amiSpeechAudio);
        amiSpeechLipSyncLevel = 0.72;
        amiVoiceSpeaking = true;
        ensureSpeechLipSyncLoop();
        updateSpeechLipSync();
        updateVoiceButtons();
        await amiSpeechAudio.play();
        return true;
      } catch (error) {
        console.error(error);
        stopAssistantSpeech();
        if (!silent) {
          status("Ami chưa phát được giọng đọc lần này.", "error");
        }
        return false;
      }
    }

    function writeWaveString(view, offset, value) {
      for (let idx = 0; idx < value.length; idx += 1) {
        view.setUint8(offset + idx, value.charCodeAt(idx));
      }
    }

    function mergeFloat32Chunks(chunks) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      chunks.forEach((chunk) => {
        merged.set(chunk, offset);
        offset += chunk.length;
      });
      return merged;
    }

    function encodeVoiceChunksAsWav(chunks, sampleRate) {
      const samples = mergeFloat32Chunks(chunks);
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);

      writeWaveString(view, 0, "RIFF");
      view.setUint32(4, 36 + samples.length * 2, true);
      writeWaveString(view, 8, "WAVE");
      writeWaveString(view, 12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeWaveString(view, 36, "data");
      view.setUint32(40, samples.length * 2, true);

      let offset = 44;
      for (let idx = 0; idx < samples.length; idx += 1) {
        const sample = Math.max(-1, Math.min(1, samples[idx]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }

      return new Blob([buffer], { type: "audio/wav" });
    }

    async function cleanupVoiceRecorder({ clearChunks = false } = {}) {
      if (voiceInputProcessor) {
        voiceInputProcessor.disconnect();
        voiceInputProcessor.onaudioprocess = null;
        voiceInputProcessor = null;
      }
      if (voiceInputSilenceGain) {
        voiceInputSilenceGain.disconnect();
        voiceInputSilenceGain = null;
      }
      if (voiceInputSource) {
        voiceInputSource.disconnect();
        voiceInputSource = null;
      }
      if (voiceInputStream) {
        voiceInputStream.getTracks().forEach((track) => track.stop());
        voiceInputStream = null;
      }
      if (voiceInputContext) {
        try {
          await voiceInputContext.close();
        } catch { }
        voiceInputContext = null;
      }
      if (clearChunks) {
        voiceInputChunks = [];
      }
    }

    async function startVoiceRecording() {
      if (amiVoiceRecording || amiVoiceTranscribing) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        status("Trình duyệt này chưa hỗ trợ ghi âm để Ami chép lời.", "error");
        return;
      }

      try {
        stopAssistantSpeech();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
          stream.getTracks().forEach((track) => track.stop());
          status("Trình duyệt này chưa hỗ trợ ghi âm WAV cho Ami.", "error");
          return;
        }

        voiceInputStream = stream;
        voiceInputContext = new AudioContextCtor();
        voiceInputSampleRate = voiceInputContext.sampleRate || 44100;
        voiceInputSource = voiceInputContext.createMediaStreamSource(stream);
        voiceInputProcessor = voiceInputContext.createScriptProcessor(4096, 1, 1);
        voiceInputSilenceGain = voiceInputContext.createGain();
        voiceInputSilenceGain.gain.value = 0;
        voiceInputChunks = [];
        amiVoiceRecording = true;
        startVoiceRecordingTicker();

        voiceInputProcessor.onaudioprocess = (event) => {
          if (!amiVoiceRecording) return;
          const input = event.inputBuffer.getChannelData(0);
          voiceInputChunks.push(new Float32Array(input));
        };

        voiceInputSource.connect(voiceInputProcessor);
        voiceInputProcessor.connect(voiceInputSilenceGain);
        voiceInputSilenceGain.connect(voiceInputContext.destination);

        updateVoiceButtons();
        status("Ami đang nghe bạn nói. Nhấn nút vuông để chốt ghi âm nhé.");
      } catch (error) {
        console.error(error);
        await cleanupVoiceRecorder({ clearChunks: true });
        amiVoiceRecording = false;
        stopVoiceRecordingTicker({ reset: true });
        updateVoiceButtons();
        status("Ami chưa mở được micro. Bạn kiểm tra quyền ghi âm giúp Ami nhé.", "error");
      }
    }

    function extractTranscriptText(data) {
      if (!data) return "";
      if (typeof data.text === "string" && data.text.trim()) return data.text.trim();
      if (typeof data.transcript === "string" && data.transcript.trim()) return data.transcript.trim();
      if (typeof data.result === "string" && data.result.trim()) return data.result.trim();
      if (data.raw) return extractTranscriptText(data.raw);
      return "";
    }

    async function transcribeVoiceBlob(blob) {
      if (!amiToken) {
        amiVoiceTranscribing = false;
        stopVoiceRecordingTicker({ reset: true });
        updateVoiceButtons();
        status("Bạn cần đăng nhập để Ami chép lời nói thành văn bản.", "error");
        return;
      }

      amiVoiceTranscribing = true;
      updateVoiceButtons();
      status("Ami đang chép lời cho bạn...");

      try {
        const formData = new FormData();
        formData.append("audio_file", blob, "ami-recording.wav");
        const response = await callAmiMbaResponseApiWithRetry("/ami/stt", {
          method: "POST",
          body: formData
        }, 1);
        const data = await response.json().catch(() => ({}));
        const transcript = extractTranscriptText(data);
        if (!transcript) {
          status("Ami chưa nghe rõ nội dung vừa rồi. Bạn thử nói chậm và rõ hơn nhé.", "error");
          return;
        }

        const input = document.getElementById("chat-input");
        if (input) {
          const current = input.value.trim();
          input.value = current ? `${current} ${transcript}` : transcript;
          input.focus();
          input.selectionStart = input.value.length;
          input.selectionEnd = input.value.length;
        }
        status("Ami đã chép lời xong. Bạn xem lại rồi bấm Gửi nhé.");
      } catch (error) {
        console.error(error);
        status("Ami chưa chép lời được lần này. Bạn thử nói lại giúp Ami nhé.", "error");
      } finally {
        amiVoiceTranscribing = false;
        stopVoiceRecordingTicker({ reset: true });
        updateVoiceButtons();
      }
    }

    async function stopVoiceRecording({ transcribe = true, cancelled = false } = {}) {
      if (!amiVoiceRecording && !amiVoiceTranscribing) return;
      const chunks = voiceInputChunks.slice();
      const sampleRate = voiceInputSampleRate;
      amiVoiceRecording = false;
      if (transcribe) {
        amiVoiceTranscribing = true;
      }
      stopVoiceRecordingTicker({ reset: false });
      updateVoiceButtons();
      await cleanupVoiceRecorder({ clearChunks: true });

      if (!transcribe) {
        stopVoiceRecordingTicker({ reset: true });
        updateVoiceButtons();
        if (cancelled) {
          status("Đã hủy ghi âm.");
        }
        return;
      }
      if (!chunks.length) {
        amiVoiceTranscribing = false;
        stopVoiceRecordingTicker({ reset: true });
        updateVoiceButtons();
        status("Ami chưa thu được âm thanh nào từ micro.", "error");
        return;
      }

      const wavBlob = encodeVoiceChunksAsWav(chunks, sampleRate);
      if (!wavBlob.size) {
        amiVoiceTranscribing = false;
        stopVoiceRecordingTicker({ reset: true });
        updateVoiceButtons();
        status("Ami chưa tạo được file ghi âm hợp lệ.", "error");
        return;
      }

      await transcribeVoiceBlob(wavBlob);
    }

    async function finishVoiceRecording() {
      if (!amiVoiceRecording) return;
      await stopVoiceRecording({ transcribe: true });
    }

    async function cancelVoiceRecording() {
      if (!amiVoiceRecording) return;
      await stopVoiceRecording({ transcribe: false, cancelled: true });
    }

    async function toggleVoiceRecording() {
      if (amiVoiceTranscribing) return;
      if (amiVoiceRecording) {
        await finishVoiceRecording();
        return;
      }
      await startVoiceRecording();
    }

    async function speakText(text, { force = false } = {}) {
      const preparedSpeech = await requestSpeechAudio(text, { force });
      if (!preparedSpeech?.audioBlob) return;
      await playPreparedSpeech(preparedSpeech, { silent: false });
    }

    function handleVoiceReplay() {
      if (amiVoiceSpeaking) {
        stopAssistantSpeech();
        return;
      }
      if (!lastAssistantSpeechText) {
        status("Chưa có câu trả lời nào để Ami đọc lại cho bạn.", "error");
        return;
      }
      speakText(lastAssistantSpeechText, { force: true });
    }

    function scrollMessagesToTop() {
      const list = document.getElementById("message-list");
      if (!list) return;
      list.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getInlineSubjectPreviewBots() {
      const previewLimit = isCompactViewport()
        ? INLINE_SUBJECT_PREVIEW_LIMITS.compact
        : INLINE_SUBJECT_PREVIEW_LIMITS.wide;

      if (amiChatbots.length <= previewLimit) {
        return amiChatbots.slice();
      }

      const previewBots = amiChatbots.slice(0, previewLimit);
      if (amiSelectedSource && !previewBots.some((bot) => bot.source === amiSelectedSource)) {
        const activeBot = amiChatbots.find((bot) => bot.source === amiSelectedSource);
        if (activeBot) {
          previewBots[previewBots.length - 1] = activeBot;
        }
      }

      const seenSources = new Set();
      return previewBots.filter((bot) => {
        if (!bot?.source || seenSources.has(bot.source)) return false;
        seenSources.add(bot.source);
        return true;
      });
    }

    function renderSubjectCards(containerId, emptyId) {
      const container = document.getElementById(containerId);
      const empty = document.getElementById(emptyId);
      const more = containerId === "subject-inline-list"
        ? document.getElementById("subject-inline-more")
        : null;
      if (!container) return;

      container.querySelectorAll(".subject-card").forEach((el) => el.remove());
      if (more) {
        more.hidden = true;
        more.textContent = "";
      }

      if (!amiChatbots.length) {
        if (empty) {
          empty.style.display = "block";
          empty.textContent = amiToken
            ? "Bạn chưa được phân công môn học nào."
            : "Ami chưa lấy được danh sách môn học.";
        }
        return;
      }

      const visibleBots = containerId === "subject-inline-list"
        ? getInlineSubjectPreviewBots()
        : amiChatbots;

      if (empty) {
        if (containerId === "subject-inline-list") {
          empty.style.display = "none";
        } else {
          empty.style.display = "block";
          empty.textContent = "Chọn đúng môn để Ami học cùng bạn nhé.";
        }
      }

      visibleBots.forEach((bot) => {
        const isActive = bot.source === amiSelectedSource;
        const card = document.createElement("button");
        card.type = "button";
        card.className = "subject-card" + (isActive ? " is-active" : "");
        card.dataset.source = bot.source;
        card.innerHTML = `
          <span class="subject-icon">📚</span>
          <span class="subject-info">
            <span class="subject-name">${escapeHtml(bot.name)}</span>
            <span class="subject-code">${escapeHtml(bot.source)}</span>
          </span>
          ${isActive ? '<span class="subject-check">✓</span>' : ''}
        `;
        card.onclick = () => selectSubject(bot);
        container.appendChild(card);
      });

      if (more) {
        const hiddenCount = Math.max(amiChatbots.length - visibleBots.length, 0);
        if (hiddenCount > 0) {
          more.hidden = false;
          more.textContent = `+${hiddenCount} môn nữa. Bấm "Xem đầy đủ" để chọn nhanh hơn.`;
        }
      }
    }

    // Render danh sách môn học vào trang subjects
    function renderSubjectsList() {
      renderSubjectCards("subjects-list", "subjects-empty");
      renderSubjectCards("subject-inline-list", "subject-inline-empty");
      updateStudyPanel();
    }

    function selectSubject(bot, options = {}) {
      const showWelcome = options.showWelcome !== false;
      amiSelectedSource = bot.source;
      amiSelectedName = bot.name;
      persistSelectedSubject();

      // Cập nhật dot indicator trên sidebar
      const dot = document.getElementById("sidebar-subject-dot");
      if (dot) dot.style.display = "block";

      // Cập nhật tiêu đề chat
      const title = document.querySelector("[data-drawer-page='home'] .drawer-title");
      if (title) title.textContent = bot.name;

      if (showWelcome) {
        newConversation();
        messages = [{
          id: `sys-${Date.now()}`, role: "assistant",
          content: `Xin chào, Ami đây, sinh viên PTIT đồng hành cùng bạn ở môn **${bot.name}** (${bot.source}) nha. Bạn cứ hỏi Ami bất kỳ điều gì liên quan đến môn học này nhé!`,
          timestamp: new Date().toISOString()
        }];
        renderMessages();
      } else {
        renderMessages();
      }

      // Render lại danh sách để update active state
      renderSubjectsList();

      if (typeof renderLeaderboard === "function") renderLeaderboard();

      if (isCompactViewport()) {
        openDrawerPage("home", false);
        toggleDrawer(false);
      } else {
        openDrawerPage("home", true);
      }

      status(`Đã chuyển sang môn ${bot.name}`);
    }

    async function syncControlAvailability() {
      if (!model?.internalModel?.settings) return;

      const settings = model.internalModel.settings;
      const motionNames = new Set(Object.keys(settings.motions || {}));
      const expressionDefs = settings.expressions || [];
      const expressionMap = new Map(expressionDefs.map((expr) => [expr.Name, expr]));

      document.querySelectorAll("[data-motion]").forEach((button) => {
        const enabled = motionNames.has(button.dataset.motion);
        button.disabled = !enabled;
        button.title = enabled ? "" : `Motion "${button.dataset.motion}" không tồn tại`;
      });

      await Promise.all(
        [...document.querySelectorAll("[data-expression]")].map(async (button) => {
          const name = button.dataset.expression;
          const expr = expressionMap.get(name);
          const enabled = !!expr && await assetExists(resolveModelAsset(expr.File));
          button.disabled = !enabled;
          button.title = enabled ? "" : `Expression "${name}" đang thiếu file`;
        })
      );

      rotateHiddenMotion(false);
    }

    async function init() {
      try {
        status("Ami đang khởi động...");

        app = new PIXI.Application({
          resizeTo: window,
          backgroundAlpha: 0,
          antialias: true
        });

        const canvas = app.view || app.canvas;
        document.getElementById("app").appendChild(canvas);

        status("Ami đang thức dậy...");

        model = await PIXI.live2d.Live2DModel.from(MODEL_PATH);
        app.stage.addChild(model);
        bindSpeechLipSync();

        if (model.anchor) {
          model.anchor.set(0.5, 1);
        }

        model.scale.set(1);
        const initialBounds = model.getLocalBounds();
        modelBaseBounds = {
          width: initialBounds.width || 1,
          height: initialBounds.height || 1
        };

        scheduleFitModel(true);
        await syncControlAvailability();
        startRotatingMotionButton(true);

        model.eventMode = "static";
        model.cursor = "pointer";
        model.on("pointertap", () => playMotion("Checkin2"));
        model.on("pointerdown", startDrag);
        model.on("pointerup", endDrag);
        model.on("pointerupoutside", endDrag);
        model.on("pointermove", onDragMove);

        updateStudyPanel();
        status("Ami đã sẵn sàng.");
      } catch (e) {
        console.error(e);
        status("Ami chưa tải xong mô hình. Bạn thử mở lại giúp Ami nhé.", "error");
      }
    }

    function scheduleFitModel(forceDoublePass = false) {
      window.cancelAnimationFrame(fitModelRaf);
      window.clearTimeout(fitModelTimeout);

      fitModelRaf = window.requestAnimationFrame(() => fitModel());
      fitModelTimeout = window.setTimeout(() => fitModel(), forceDoublePass ? 220 : 140);
    }

    function fitModel() {
      if (!model || !app) return;

      const host = document.getElementById("app");
      const screenW = host?.clientWidth || window.innerWidth;
      const screenH = host?.clientHeight || window.innerHeight;
      if (!screenW || !screenH) return;

      app.renderer.resize(screenW, screenH);

      if (!modelBaseBounds?.width || !modelBaseBounds?.height) {
        model.scale.set(1);
        const bounds = model.getLocalBounds();
        modelBaseBounds = {
          width: bounds.width || 1,
          height: bounds.height || 1
        };
      }

      const w = modelBaseBounds.width;
      const h = modelBaseBounds.height;
      if (!w || !h) {
        return;
      }

      const isMobile = screenW < 900;
      const scaleX = (screenW * (isMobile ? 0.68 : 0.38)) / w;
      const scaleY = (screenH * (isMobile ? 0.94 : 1.1)) / h;
      const scale = Math.max(0.1, Math.min(scaleX, scaleY));

      model.scale.set(scale);
      model.position.set(screenW * 0.5, screenH * (isMobile ? 1.04 : 1.2));
    }

    function startDrag(event) {
      if (!model || !app) return;

      const point = event.data.global;
      dragData = {
        pointerId: event.data.pointerId,
        offsetX: model.x - point.x,
        offsetY: model.y - point.y
      };
      model.cursor = "grabbing";
    }

    function endDrag(event) {
      if (!dragData) return;
      if (event?.data?.pointerId && event.data.pointerId !== dragData.pointerId) return;
      dragData = null;
      model.cursor = "pointer";
    }

    function onDragMove(event) {
      if (!dragData || !model || !app) return;
      if (event.data.pointerId !== dragData.pointerId) return;

      const point = event.data.global;
      const nextX = point.x + dragData.offsetX;
      const nextY = point.y + dragData.offsetY;
      const halfW = model.width / 2;
      const modelH = model.height;
      const minX = -halfW;
      const maxX = app.screen.width + halfW;
      const minY = modelH / 2;
      const maxY = app.screen.height + modelH / 2;

      model.position.set(
        Math.min(Math.max(nextX, minX), maxX),
        Math.min(Math.max(nextY, minY), maxY)
      );
    }

    async function playMotion(group, { force = false } = {}) {
      if (!model) return;
      if (!force && (amiVoiceSpeaking || amiVoiceLoading)) return;

      try {
        await model.motion(group, 0);
      } catch (e) {
        console.error(e);
      }
    }

    async function setExpression(name) {
      if (!model) return;

      try {
        await model.expression(name);
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener("resize", () => {
      stopChatShellDrag();
      resetChatShellPosition();
      toggleDrawer(drawerOpen);
      updateChatHint();
      renderSubjectsList();
      scheduleFitModel(true);
    });
    window.addEventListener("orientationchange", () => scheduleFitModel(true));
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => scheduleFitModel(true));
    }

    document.getElementById("chat-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("chat-input");
      const value = input.value;
      if (!value.trim()) return;
      input.value = "";
      await submitChatMessage(value);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAssistantSpeech();
      }
    });

    updateStudyPanel();
    refreshComposerState();
    applyChatShellState();
    updateVoiceButtons();
    setDebateTimeOption("unlimited");
    init();

    // ── Nhận user data từ React parent qua postMessage ──
    // Chuyển từ Western order (Bảo Lê Trần Quốc) → Vietnamese order (Lê Trần Quốc Bảo)
    function toVietnameseOrder(name) {
      if (!name) return name;
      const parts = name.trim().split(/\s+/);
      if (parts.length <= 1) return name;
      return [...parts.slice(1), parts[0]].join(" ");
    }

    function getInitials(fullName, username) {
      const name = toVietnameseOrder(fullName || username || "?").trim();
      const parts = name.split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }

    function applyUserSync(payload) {
      if (!payload) return;
      const displayName = toVietnameseOrder(payload.fullName || payload.username) || "Người dùng";
      const initials = getInitials(payload.fullName, payload.username);
      const username = payload.username || "";
      const email = payload.email || "";
      const roleMap = { admin: "Quản trị viên", teacher: "Giảng viên", user: "Học viên" };
      const roleLabel = roleMap[payload.role] || payload.role || "Người dùng";

      // Lưu để dùng trong renderMessages
      amiUserInitials = initials;
      amiUserName = displayName;
      amiUserId = normalizeAmiUserId(payload.username || payload.userId || "");
      persistAmiHistoryUserId(amiUserId);
      amiHistoryBootstrapped = false;
      if (amiToken) {
        void sendAmiHistoryDebugLog("history_user_sync", {
          requestStatus: "user_sync",
          usernameFromPayload: amiUserId,
          source: getAmiHistorySource()
        });
      }

      // Cập nhật tất cả các cục Avatar badge trên giao diện
      document.querySelectorAll(".avatar-badge").forEach(badge => {
        if (badge) badge.textContent = initials;
      });
      const nameEl = document.getElementById("sidebar-user-name");
      if (nameEl) nameEl.textContent = displayName;
      const fullNameEl = document.getElementById("profile-full-name");
      if (fullNameEl) fullNameEl.textContent = displayName;
      const usernameEl = document.getElementById("profile-username");
      if (usernameEl) usernameEl.textContent = username ? `@${username}` : "";
      const emailEl = document.getElementById("profile-email");
      if (emailEl) emailEl.textContent = email;
      const roleEl = document.getElementById("profile-role");
      if (roleEl) {
        roleEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,0.08);font-size:12px;">
          <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;"></span>${roleLabel}</span>`;
      }
      bootstrapAmiHistoryIfReady();
    }

    function applyChatbotsSync(payload) {
      if (!payload) return;
      amiToken = payload.token || "";
      amiApiBase = payload.apiBase || "";
      amiChatbots = payload.chatbots || [];
      if (amiToken) {
        void sendAmiHistoryDebugLog("history_chatbot_sync", {
          requestStatus: "chatbot_sync",
          source: getAmiHistorySource(),
          chatbotCount: amiChatbots.length,
          apiBase: amiApiBase
        });
      }
      if (!amiUserId) {
        const tokenUserId = getAmiHistoryUserId();
        if (tokenUserId) {
          amiUserId = tokenUserId;
          persistAmiHistoryUserId(tokenUserId);
        }
      }
      renderSubjectsList();

      const savedSource = localStorage.getItem("ami-selected-source");
      const savedBot = amiChatbots.find((bot) => bot.source === savedSource);

      if (!amiSelectedSource && savedBot) {
        selectSubject(savedBot, { showWelcome: false });
      } else if (amiChatbots.length === 1 && !amiSelectedSource) {
        selectSubject(amiChatbots[0]);
      } else if (!amiSelectedSource && amiChatbots.length > 1) {
        openDrawerPage("subjects", true);
        status("Chọn môn học để bắt đầu cùng Ami.");
      }
      bootstrapAmiHistoryIfReady();
    }

    window.addEventListener("message", (event) => {
      if (!event.data) return;
      if (event.data.type === "AMI_USER_SYNC") applyUserSync(event.data.payload);
      if (event.data.type === "AMI_CHATBOTS_SYNC") applyChatbotsSync(event.data.payload);
    });

    // ==========================================
    // DEBATE MODE LOGIC
    // ==========================================

    async function renderLeaderboard() {
      const list = document.getElementById("leaderboard-page-list");
      if (!list) return;
      const source = amiSelectedSource;

      if (!source) {
        list.innerHTML = `<p class="panel-empty">Vui lòng chọn môn học để xem bảng xếp hạng.</p>`;
        return;
      }

      if (!amiToken) {
        list.innerHTML = `<p class="panel-empty">Bạn cần đăng nhập để xem bảng xếp hạng.</p>`;
        return;
      }

      list.innerHTML = `<p class="panel-empty">Ami đang tải bảng xếp hạng...</p>`;

      try {
        const data = await callAmiMbaApi("/ami/debate/leaderboard", {
          params: { source, limit: 10 }
        });

        if (source !== amiSelectedSource) return;

        const lb = Array.isArray(data.leaderboard) ? data.leaderboard : [];
        if (lb.length === 0) {
          list.innerHTML = `<p class="panel-empty">Chưa có bạn nào ghi tên mình vào bảng xếp hạng.</p>`;
          return;
        }

        list.innerHTML = lb.map((item, idx) => {
          const icon = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
          const metaLine = [
            `${item.attempt_count || 1} lượt thử thách`,
            item.bonus_points ? `+${item.bonus_points} bonus` : "",
            item.time_label || ""
          ].filter(Boolean).join(" · ");
          return `
            <div class="leaderboard-item ${idx < 3 ? "is-podium" : ""}">
              <div class="leaderboard-rank">${icon}</div>
              <div class="leaderboard-meta">
                <strong>${escapeHtml(item.user_name || "Ẩn danh")}</strong>
                <span>${escapeHtml(metaLine)}</span>
              </div>
              <div class="leaderboard-score">${escapeHtml(item.score || 0)} đ</div>
            </div>`;
        }).join("");
      } catch (e) {
        if (source !== amiSelectedSource) return;
        console.error(e);
        list.innerHTML = `<p class="panel-empty">Chưa có bạn nào ghi tên mình vào bảng xếp hạng.</p>`;
      }
    }

    function cancelDebate() {
      const wasDebating = isDebateMode;
      isDebateMode = false;
      debateTurn = 0;
      debateUserHistory = [];
      debateQuestionHistory = [];
      debateCurrentQuestion = "";
      debateTurnScores = [];
      resetDebateTimingState();
      document.getElementById("debate-header").style.display = "none";
      updateChatHint();
      updateShellHeader();
      refreshComposerState();

      if (wasDebating) {
        newConversation();
        status("Ami đã tắt Thử thách Ami.");
      }

      if (isCompactViewport()) {
        toggleDrawer(false);
      } else {
        openDrawerPage("home", true);
      }
    }

    async function startDebate() {
      if (!amiSelectedSource) {
        status("Chọn môn học trước khi bắt đầu Thử thách Ami nhé.", "error");
        openDrawerPage('subjects', true);
        return;
      }

      isDebateMode = true;
      debateTurn = 1;
      debateUserHistory = [];
      debateQuestionHistory = [];
      debateCurrentQuestion = "";
      debateTurnScores = [];
      resetDebateTimingState();
      studyPanelClosed = true;
      subjectPanelClosed = true;
      chatShellPanelsCollapsed = false;
      applyChatShellState();

      document.getElementById("debate-header").style.display = "flex";
      document.getElementById("debate-turn-indicator").textContent = `Lượt ${debateTurn}/${MAX_DEBATE_TURN}`;
      updateDebateTimerDisplay();
      updateChatHint();
      updateShellHeader();
      refreshComposerState();

      newConversation();
      messages = [];
      renderMessages();
      if (isCompactViewport()) {
        toggleDrawer(false);
      } else {
        openDrawerPage("home", false);
      }

      setSendingState(true);
      playMotion("Reading");
      const debateSessionUserId = amiUserId || new Date().toISOString();
      const fallbackScenario = `Tình huống môn **${amiSelectedName}**:\n\nCó người nói rằng kiến thức trong môn này chỉ là lý thuyết và gần như không còn giá trị khi làm việc thực tế. Bạn hãy phản biện lại nhận định đó bằng một lập luận rõ ràng, có ít nhất 1 khái niệm hoặc ví dụ minh họa nhé!`;
      const timeConfig = getDebateTimeConfig();

      try {
        const data = await callAmiMbaApiWithRetry("/ami/debate/start", {
          method: "POST",
          body: {
            userId: debateSessionUserId,
            source: amiSelectedSource,
            subjectName: amiSelectedName,
            userName: amiUserName,
            timeOption: debateTimeOption
          }
        }, 1);

        const scenario = data.opening || fallbackScenario;
        const preparedSpeech = await requestSpeechAudio(scenario, { silent: true });
        debateCurrentQuestion = scenario;
        debateQuestionHistory = [scenario];
        messages = [{
          id: `a-${Date.now()}`,
          role: "assistant",
          content: scenario,
          timestamp: new Date().toISOString()
        }];
        renderMessages();
        if (!preparedSpeech?.audioBlob) {
          playMotion("Chong_Nanh");
        }
        startDebateTurnTimer();
        status(
          timeConfig.seconds > 0
            ? `Ami đã mở Thử thách Ami. Mốc bạn chọn là ${timeConfig.label}.`
            : "Ami đã mở Thử thách Ami."
        );
        await playPreparedSpeech(preparedSpeech, { silent: true });
      } catch (error) {
        console.error(error);
        const preparedSpeech = await requestSpeechAudio(fallbackScenario, { silent: true });
        debateCurrentQuestion = fallbackScenario;
        debateQuestionHistory = [fallbackScenario];
        messages = [{
          id: `a-${Date.now()}`,
          role: "assistant",
          content: fallbackScenario,
          timestamp: new Date().toISOString()
        }];
        renderMessages();
        if (!preparedSpeech?.audioBlob) {
          playMotion("Chong_Nanh");
        }
        startDebateTurnTimer();
        status("Ami đang dùng đề dự phòng cho lượt thử thách này.");
        await playPreparedSpeech(preparedSpeech, { silent: true });
      } finally {
        setSendingState(false);
      }
    }

    async function handleDebateSubmit(content) {
      const answeredTurn = debateTurn || 1;
      const previousAnswerCount = debateUserHistory.length;
      const previousTurnScoreCount = debateTurnScores.length;
      const timerSnapshot = freezeDebateTurnTimer(answeredTurn);
      const pendingTurnDurations = [...debateTurnDurations, Math.max(0, Number(timerSnapshot.elapsed) || 0)];
      const pendingTimedOutTurns = timerSnapshot.timedOut
        ? [...new Set([...debateTimedOutTurns, answeredTurn])]
        : [...debateTimedOutTurns];
      const userMessage = { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() };
      const pendingMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: answeredTurn >= MAX_DEBATE_TURN
          ? "Ami đang chấm câu cuối và tổng kết cả vòng thử thách cho bạn nha..."
          : "Ami đang chấm câu này rồi nghĩ tiếp thử thách kế tiếp cho bạn nha...",
        timestamp: new Date().toISOString(),
        pending: true
      };

      debateUserHistory.push(content);
      messages = [...messages, userMessage, pendingMessage];
      renderMessages();

      if (!(amiSelectedSource && amiToken)) {
        isDebateMode = false;
        debateTurn = 0;
        debateUserHistory = [];
        debateQuestionHistory = [];
        debateCurrentQuestion = "";
        debateTurnScores = [];
        resetDebateTimingState();
        document.getElementById("debate-header").style.display = "none";
        updateChatHint();
        updateShellHeader();
        refreshComposerState();
        messages = messages.map((message) =>
          message.id === pendingMessage.id
            ? { ...message, content: "Ami chưa thể chấm vì chưa có kết nối tài khoản hoặc môn học hợp lệ.", pending: false }
            : message
        );
        renderMessages();
        playMotion("Sad");
        setSendingState(false);
        return;
      }

      setSendingState(true);
      playMotion("Reading");

      if (answeredTurn >= MAX_DEBATE_TURN) {
        try {
          const data = await callAmiMbaApiWithRetry("/ami/debate/evaluate", {
            method: "POST",
            body: {
              userId: amiUserId || new Date().toISOString(),
              source: amiSelectedSource,
              subjectName: amiSelectedName,
              userName: amiUserName,
              answers: debateUserHistory,
              questionHistory: debateQuestionHistory,
              currentQuestion: debateCurrentQuestion,
              turnScores: debateTurnScores,
              timeOption: debateTimeOption,
              turnDurations: pendingTurnDurations,
              timedOutTurns: pendingTimedOutTurns
            }
          }, 1);

          const finalFeedback = data.final_feedback_message || "Ami chưa chấm được câu cuối một cách trọn vẹn.";
          const overallSummary = data.overall_summary_message || "Ami chưa tổng kết được toàn bộ vòng thử thách.";
          const finalScore = Number(data?.final_turn_evaluation?.score ?? data?.score ?? 0) || 0;
          const preparedSpeech = await requestSpeechAudio(`${finalFeedback}
${overallSummary}`, { silent: true });

          debateTurnScores = Array.isArray(data.turn_scores) ? data.turn_scores : [...debateTurnScores, finalScore];
          debateTurnDurations = Array.isArray(data.turn_durations) ? data.turn_durations : pendingTurnDurations;
          debateTimedOutTurns = Array.isArray(data.timed_out_turns) ? data.timed_out_turns : pendingTimedOutTurns;
          isDebateMode = false;
          debateTurn = 0;
          debateUserHistory = [];
          debateQuestionHistory = [];
          debateCurrentQuestion = "";
          resetDebateTimingState();
          document.getElementById("debate-header").style.display = "none";
          updateChatHint();
          updateShellHeader();
          refreshComposerState();

          messages = messages.map((message) =>
            message.id === pendingMessage.id
              ? { ...message, content: finalFeedback, pending: false }
              : message
          );
          messages.push({
            id: `a-${Date.now()}-summary`,
            role: "assistant",
            content: overallSummary,
            timestamp: new Date().toISOString()
          });
          renderMessages();
          if (!preparedSpeech?.audioBlob) {
            playMotion((Number(data.base_score ?? data.score) || 0) >= 75 ? "Happy" : "Angry");
          }
          status("Ami đã chấm xong toàn bộ Thử thách Ami");
          await playPreparedSpeech(preparedSpeech, { silent: true });
          await renderLeaderboard();
        } catch (err) {
          console.error(err);
          debateUserHistory = debateUserHistory.slice(0, previousAnswerCount);
          debateTurnScores = debateTurnScores.slice(0, previousTurnScoreCount);
          resumeDebateTurnTimer(timerSnapshot);
          document.getElementById("debate-header").style.display = "flex";
          updateChatHint();
          updateShellHeader();
          refreshComposerState();
          messages = messages.map((message) =>
            message.id === pendingMessage.id
              ? { ...message, content: "Ami vừa hụt nhịp ở phần tổng kết câu cuối. Bạn gửi lại câu trả lời này giúp Ami nhé.", pending: false }
              : message
          );
          renderMessages();
          playMotion("Sad");
          status("Ami chưa tổng kết trọn vẹn câu cuối, bạn gửi lại câu trả lời giúp Ami nhé.", "error");
        } finally {
          setSendingState(false);
        }
        return;
      }

      try {
        const data = await callAmiMbaApiWithRetry("/ami/debate/respond", {
          method: "POST",
          body: {
            userId: amiUserId || new Date().toISOString(),
            source: amiSelectedSource,
            turn: answeredTurn,
            maxTurn: MAX_DEBATE_TURN,
            userAnswer: content,
            history: debateUserHistory,
            questionHistory: debateQuestionHistory,
            currentQuestion: debateCurrentQuestion,
            subjectName: amiSelectedName,
            userName: amiUserName
          }
        }, 1);

        const evaluationMessage = data.evaluation_message || "Ami chưa chấm được rõ ràng cho câu này.";
        const nextQuestion = data.next_question_message || data.next_question || "Bạn thử đào sâu thêm vào khái niệm cốt lõi trong tài liệu nhé.";
        const turnScore = Number(data?.evaluation?.score ?? 0) || 0;
        const preparedSpeech = await requestSpeechAudio(`${evaluationMessage}
${nextQuestion}`, { silent: true });

        debateTurnScores.push(turnScore);
        debateTurnDurations = pendingTurnDurations;
        debateTimedOutTurns = pendingTimedOutTurns;
        debateCurrentQuestion = nextQuestion;
        debateQuestionHistory.push(nextQuestion);
        debateTurn = Math.min(MAX_DEBATE_TURN, answeredTurn + 1);
        document.getElementById("debate-turn-indicator").textContent = `Lượt ${debateTurn}/${MAX_DEBATE_TURN}`;
        startDebateTurnTimer();

        messages = messages.map((message) =>
          message.id === pendingMessage.id
            ? { ...message, content: evaluationMessage, pending: false }
            : message
        );
        messages.push({
          id: `a-${Date.now()}-question`,
          role: "assistant",
          content: nextQuestion,
          timestamp: new Date().toISOString()
        });
        renderMessages();
        if (!preparedSpeech?.audioBlob) {
          playMotion("Checkin3");
        }
        await playPreparedSpeech(preparedSpeech, { silent: true });
      } catch (err) {
        console.error(err);
        debateUserHistory = debateUserHistory.slice(0, previousAnswerCount);
        debateTurnScores = debateTurnScores.slice(0, previousTurnScoreCount);
        resumeDebateTurnTimer(timerSnapshot);
        messages = messages.map((message) =>
          message.id === pendingMessage.id
            ? { ...message, content: "Ami chưa phản hồi trọn vẹn ở lượt này. Bạn gửi lại câu trả lời giúp Ami nhé.", pending: false }
            : message
        );
        renderMessages();
        playMotion("Sad");
        status("Ami chưa phản biện lại được ở lượt này.", "error");
      } finally {
        setSendingState(false);
      }
    }

    function bindAmiGlobalActions() {
      Object.assign(window, {
        toggleDrawer,
        newConversation,
        openDrawerPage,
        setExpression,
        playMotion,
        setDebateTimeOption,
        startDebate,
        cancelDebate,
        toggleShellPanels,
        toggleChatShellVisibility,
        closeStudyPanel,
        closeSubjectPanel,
        cancelVoiceRecording,
        finishVoiceRecording,
        toggleVoiceRecording,
        handleVoiceReplay,
        scrollMessagesToTop,
        handleAmiHistoryButtonClick
      });
    }

    function handleAmiHistoryButtonClick(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      void sendAmiHistoryDebugLog("history_button_clicked", {
        requestStatus: "button_clicked",
        source: getAmiHistorySource(),
        username: normalizeAmiUserId(amiUserId || getAmiHistoryUserId())
      });

      currentDrawerPage = "history";
      document.querySelectorAll(".drawer-page").forEach((section) => {
        section.classList.toggle("is-active", section.dataset.drawerPage === "history");
      });
      toggleDrawer(true);
      syncSidebarState();
      loadAmiChatSessions({ silent: false });
      return false;
    }

    function bindAmiHistoryButton() {
      const historyButton = document.querySelector('[data-sidebar-action="history"]');
      if (!historyButton || historyButton.dataset.amiHistoryBound === "1") return;

      historyButton.dataset.amiHistoryBound = "1";
      historyButton.onclick = handleAmiHistoryButtonClick;
    }

    bindAmiGlobalActions();
    bindAmiHistoryButton();
