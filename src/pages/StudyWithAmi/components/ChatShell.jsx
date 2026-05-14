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
    debateActive,
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
  const toggleVisibility = useCallback(() => setChatHidden((p) => !p), [setChatHidden]);

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
      <section id="chat-shell" ref={shellRef} className={`${chatHidden ? "is-hidden" : ""} ${!selectedSource ? "is-no-subject" : ""}`}>
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
            {debateActive && (
              <div id="debate-header" className="debate-header">
                <div className="debate-heading">
                  <span className="debate-badge">Thử thách Ami</span>
                  <span className="debate-meta">Chọn mốc thời gian trước khi bắt đầu</span>
                </div>
                <div className="debate-pill-group">
                  <span className="debate-turn-pill">Lượt 1/3</span>
                  <span className="debate-time-pill">∞</span>
                </div>
              </div>
            )}
            <MessageList />
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
              <button className="hero-btn hero-btn--ghost" type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("ami-open-feature", { detail: "leaderboard" }))}>
                Bảng xếp hạng
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
