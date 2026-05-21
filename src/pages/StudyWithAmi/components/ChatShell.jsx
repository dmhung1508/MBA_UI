import React, { useRef, useCallback, useState, useEffect } from "react";
import { useAmi } from "../../../context/AmiContext";
import AMI_API_BASE from "../../../services/amiApi";

const AMI_BASE = import.meta.env.BASE_URL || "/";
const AMI_AVATAR = `${AMI_BASE}ami-avatar.png`;
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import VoiceRecorder from "./VoiceRecorder";

export default function ChatShell() {
  const {
    chatHidden, setChatHidden,
    selectedSource, selectedName,
    thinkEnabled, setThinkEnabled,
    searchEnabled, setSearchEnabled,
    debateActive, timeLeft,
    voiceEnabled, setVoiceEnabled,
  } = useAmi();

  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      fetch(`${AMI_API_BASE}/health`, { method: "GET" })
        .then((r) => { if (!cancelled) setBackendOnline(r.ok); })
        .catch(() => { if (!cancelled) setBackendOnline(false); });
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const statusInfo = backendOnline === null
    ? { label: "Đang kết nối...", state: "busy" }
    : backendOnline
    ? { label: "Sẵn sàng", state: "ready" }
    : { label: "Không khả dụng", state: "offline" };

  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef(null);
  const shellRef = useRef(null);
  const [shellHeight, setShellHeight] = useState(null);
  const defaultHeightRef = useRef(null);
  const dragRef = useRef(null);
  const toggleVisibility = useCallback(() => setChatHidden((p) => !p), [setChatHidden]);

  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = shellRef.current.getBoundingClientRect().height;
    if (!defaultHeightRef.current) defaultHeightRef.current = startH;

    const onMove = (ev) => {
      const delta = startY - ev.clientY;
      const pill = document.querySelector(".ami-subject-pill");
      const stage = shellRef.current?.closest(".ami-stage") || shellRef.current?.parentElement;
      const stageRect = stage?.getBoundingClientRect();
      const pillRect = pill?.getBoundingClientRect();

      const minH = defaultHeightRef.current || 300;
      let maxH = stageRect ? stageRect.height - 16 - 16 : 820;
      if (pillRect && stageRect) {
        const pillBottom = pillRect.bottom - stageRect.top + 4;
        maxH = stageRect.height - pillBottom - 8;
      }

      const newH = Math.min(maxH, Math.max(minH, startH + delta));
      setShellHeight(newH);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    if (!optionsOpen) return;
    const handler = (e) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(e.target) &&
        !e.target.closest(".composer-options-btn")
      ) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [optionsOpen]);

  return (
    <>
      <section id="chat-shell" ref={shellRef} style={shellHeight ? { height: shellHeight } : undefined} className={`${chatHidden ? "is-hidden" : ""} ${!selectedSource ? "is-no-subject" : ""}`}>
        <div className="chat-resize-handle" ref={dragRef} onMouseDown={onResizeStart} />
        {/* Header */}
        <div className="chat-shell-header">
          <div className="chat-shell-meta">
            <img src={AMI_AVATAR} alt="Ami" className="chat-shell-avatar" />
            <div className="chat-shell-meta-text">
              <strong id="chat-shell-title">Học cùng Ami</strong>
              <span id="chat-shell-subtitle">
                {selectedSource ? selectedName : "Chọn môn học để bắt đầu"}
              </span>
            </div>
          </div>

          <div className="chat-shell-presence">
            <span className={`chat-shell-dot chat-shell-dot--${statusInfo.state}`} />
            <span id="chat-shell-status">{statusInfo.label}</span>
          </div>

          <button className="shell-action-btn" type="button" title="Ẩn khung chat" onClick={toggleVisibility}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedSource ? (
          <>
            <div className={`chat-content-area${debateActive ? " has-debate" : ""}`}>
              <div className={`debate-header-clip${debateActive ? " is-visible" : ""}`}>
                <div id="debate-header" className="debate-header">
                  <div className="debate-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M8 21h8M12 17v4M7 4h10c1.7 0 3 1.3 3 3v2c0 2.2-1.8 4-4 4h-8c-2.2 0-4-1.8-4-4V7c0-1.7 1.3-3 3-3Z"/></svg>
                  </div>
                  <span className="debate-badge">Thử thách Ami</span>
                  <div className="debate-spacer" />
                  <span className={`debate-timer${timeLeft !== null && timeLeft <= 30 ? " is-urgent" : ""}`}>
                    {timeLeft !== null
                      ? `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`
                      : "∞"}
                  </span>
                </div>
              </div>
              <MessageList />
            </div>
            <VoiceRecorder />

            <ChatInput
              optionsOpen={optionsOpen}
              onToggleOptions={() => setOptionsOpen((p) => !p)}
              optionsRef={optionsRef}
              thinkEnabled={thinkEnabled}
              onThinkToggle={() => setThinkEnabled((p) => !p)}
              searchEnabled={searchEnabled}
              onSearchToggle={() => setSearchEnabled((p) => !p)}
              voiceEnabled={voiceEnabled}
              onVoiceToggle={() => setVoiceEnabled((p) => !p)}
              onSubmit={(text) => {
                window.dispatchEvent(new CustomEvent("ami-submit-chat", { detail: text }));
              }}
            />
          </>
        ) : (
          <div className="study-panel study-panel--bottom">
            <p className="panel-copy">
              Ami là sinh viên PTIT đồng hành cùng bạn. Chọn môn trước để Ami trả lời đúng ngữ cảnh.
            </p>
            <div className="study-actions">
              <button className="hero-btn hero-btn--green" type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("ami-open-feature", { detail: "subjects" }))}>
                Chọn môn học
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <div id="quick-actions">
        {chatHidden ? (
          <button className="quick-btn quick-btn--restore" type="button" title="Mở khung chat" onClick={toggleVisibility}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        ) : null}

      </div>
    </>
  );
}
