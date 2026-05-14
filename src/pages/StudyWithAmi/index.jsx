import React, { useEffect, useRef, useState, useCallback } from "react";
import { resolveApiBaseUrl } from "../../config/runtimeConfig";
import AmiProvider, { useAmi } from "../../context/AmiContext";
import Live2DCanvas from "./components/Live2DCanvas";
import Sidebar from "./components/Sidebar";
import ChatShell from "./components/ChatShell";
import DrawerPage from "./components/Drawer";
import useAmiChat from "../../hooks/useAmiChat";
import useAmiVoice from "../../hooks/useAmiVoice";
import useAmiDebate from "../../hooks/useAmiDebate";
import "./StudyWithAmi.css";

function MobileNav({ initials }) {
  const { activeFeature, sidebarState, openFeature, collapseSidebar, newConversation, chatHidden, setChatHidden } = useAmi();
  const drawerOpen = sidebarState === "feature" || sidebarState === "extended";
  const activeNav = drawerOpen ? activeFeature : null;

  const items = [
    { id: "chat",        label: "Chat",      svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.9"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: "subjects",    label: "Môn học",   svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.9"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { id: "history",     label: "Lịch sử",   svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.9"><path d="M12 7v5l3 2"/><path d="M12 3a9 9 0 1 1-9 9"/><path d="M5 4v4H1"/></svg> },
    { id: "debate",      label: "Thử thách", svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.9"><path d="M8 21h8M12 17v4M7 4h10c1.7 0 3 1.3 3 3v2c0 2.2-1.8 4-4 4h-8c-2.2 0-4-1.8-4-4V7c0-1.7 1.3-3 3-3Z"/></svg> },
    { id: "profile",     label: "Tài khoản", isAvatar: true },
    { id: "settings",   label: "Cài đặt",   svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.9"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z"/></svg> },
  ];

  const handleTap = (id) => {
    if (id === "chat") {
      collapseSidebar();
      if (chatHidden) setChatHidden(false);
    } else {
      openFeature(id);
    }
  };

  return (
    <>
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={collapseSidebar} />
      )}
      {drawerOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-handle" />
          <div className="mobile-drawer-header">
            <span className="mobile-drawer-title">
              {activeFeature ? items.find(i => i.id === activeFeature)?.label || activeFeature : "Menu"}
            </span>
            <button className="mobile-drawer-close" onClick={collapseSidebar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="mobile-drawer-content">
            <DrawerPage feature={activeFeature || "subjects"} />
          </div>
        </div>
      )}
      <nav className="ami-mobile-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-btn${activeNav === item.id ? " is-active" : ""}${item.id === "chat" && !drawerOpen ? " is-active" : ""}`}
            onClick={() => handleTap(item.id)}
          >
            <span className="mobile-nav-icon">
              {item.isAvatar
                ? <span className="mobile-avatar-badge">{initials || "?"}</span>
                : item.svg}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

function decodeJWT(token) {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
}

// Inner component that has access to AmiContext
function getInitials(fullName, username) {
  const name = (fullName || username || "?").trim();
  const parts = name.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function AmiApp() {
  const modelRef = useRef(null);
  const { submitMessage } = useAmiChat();
  const { toggleRecording, cancelRecording, finishRecording, replayLastSpeech, speakText } = useAmiVoice();
  const { startDebate, cancelDebate, submitDebateAnswer, debateActive } = useAmiDebate();
  const { modelRef: contextModelRef, mouthHoldRef: contextMouthHoldRef, costumeControllerRef: contextCostumeRef, selectedSource, selectedName, profile } = useAmi();
  const [modelReady, setModelReady] = useState(false);
  const initials = getInitials(profile?.full_name, profile?.username);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const AMI_BASE = import.meta.env.BASE_URL || "/";
  const AMI_AVATAR = `${AMI_BASE}ami-avatar.png`;
  const HEADER_H = 48;

  const handleModelReady = useCallback((ref) => {
    modelRef.current = ref;
    contextModelRef.current = ref;
    if (ref?.mouthHold) contextMouthHoldRef.current = ref.mouthHold.current;
    if (ref?.costumeController) contextCostumeRef.current = ref.costumeController.current;
    setModelReady(ref?.ready || false);
  }, [contextModelRef, contextMouthHoldRef]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFS);
    return () => document.removeEventListener("fullscreenchange", handleFS);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlerRefs = useRef({});
  handlerRefs.current = { submitMessage, submitDebateAnswer, debateActive, startDebate, cancelDebate, toggleRecording, cancelRecording, finishRecording, replayLastSpeech, speakText };

  // Wire custom events — stable listeners via ref, no re-registration on dep changes
  useEffect(() => {
    const onChatSubmit  = (e) => {
      const { debateActive: isDebate, submitDebateAnswer: debateSubmit, submitMessage: normalSubmit } = handlerRefs.current;
      if (isDebate) debateSubmit(e.detail);
      else normalSubmit(e.detail);
    };
    const onToggleVoice  = ()  => handlerRefs.current.toggleRecording();
    const onCancelVoice  = ()  => handlerRefs.current.cancelRecording();
    const onStopVoice    = ()  => handlerRefs.current.finishRecording();
    const onReplayVoice  = ()  => handlerRefs.current.replayLastSpeech();
    const onSpeak        = (e) => handlerRefs.current.speakText(e.detail);
    const onStartDebate  = ()  => handlerRefs.current.startDebate();
    const onCancelDebate = ()  => handlerRefs.current.cancelDebate();

    window.addEventListener("ami-submit-chat",    onChatSubmit);
    window.addEventListener("ami-toggle-voice",   onToggleVoice);
    window.addEventListener("ami-cancel-voice",   onCancelVoice);
    window.addEventListener("ami-stop-voice",     onStopVoice);
    window.addEventListener("ami-replay-voice",   onReplayVoice);
    window.addEventListener("ami-speak",          onSpeak);
    window.addEventListener("ami-start-debate",   onStartDebate);
    window.addEventListener("ami-cancel-debate",  onCancelDebate);

    return () => {
      window.removeEventListener("ami-submit-chat",    onChatSubmit);
      window.removeEventListener("ami-toggle-voice",   onToggleVoice);
      window.removeEventListener("ami-cancel-voice",   onCancelVoice);
      window.removeEventListener("ami-stop-voice",     onStopVoice);
      window.removeEventListener("ami-replay-voice",   onReplayVoice);
      window.removeEventListener("ami-speak",          onSpeak);
      window.removeEventListener("ami-start-debate",   onStartDebate);
      window.removeEventListener("ami-cancel-debate",  onCancelDebate);
    };
  }, []);

  return (
    <div className="ami-app">
      {/* Top header bar */}
      {!isFullscreen && (
        <div className="ami-header" style={{ height: HEADER_H }}>
          <div className="ami-header-left">
            <button onClick={() => window.location.href = AMI_BASE} className="ami-header-btn" title="Trang chủ">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.7762 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H6.50002C6.22388 7.99999 6.00002 8.22385 6.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM7.00002 12H9.00002V8.99999H7.00002V12Z" fill="currentColor" />
              </svg>
            </button>
            <img src={AMI_AVATAR} alt="Ami" className="ami-header-avatar" />
            <span className="ami-header-title">Học cùng Ami</span>
            <div className="ami-status-badge">
              <span className={`ami-status-dot ${modelReady ? "ready" : "loading"}`} />
              <span key={modelReady ? "ready" : "loading"} className="ami-status-text">
                {modelReady ? "Sẵn sàng" : "Ami đang thức dậy..."}
              </span>
            </div>
          </div>
          <div className="ami-header-right">
            <button onClick={toggleFullscreen} className="ami-header-btn" title="Toàn màn hình">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main canvas area — sidebar pushes stage right */}
      <div className="ami-canvas-area">
        <Sidebar />

        {/* Stage — character canvas + overlays, pushed right by sidebar */}
        <div className="ami-stage">
          <Live2DCanvas ref={handleModelReady} />
          <div className="ami-bg-ambiance" />

          {statusMsg && (
            <div className="ami-status-toast">{statusMsg}</div>
          )}

          {modelReady && (
            <div className="ami-subject-pill">
              {selectedSource ? (
                <>
                  <span className="ami-subject-pill-dot" />
                  {selectedName}
                </>
              ) : (
                "Chọn môn học để bắt đầu cùng Ami"
              )}
            </div>
          )}

          {modelReady && <ChatShell />}
        </div>
      </div>

      {/* Mobile bottom nav — hidden on desktop via CSS */}
      <MobileNav initials={initials} />
    </div>
  );
}

// Main page component
const StudyWithAmi = () => {
  const [chatbots, setChatbots] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const amiApiBase = String(resolveApiBaseUrl() || "").replace(/\/+$/, "");

  const token = localStorage.getItem("access_token");
  const jwt = decodeJWT(token);

  useEffect(() => {
    if (!token) return;
    const profile = jwt ? {
      username: jwt.sub || jwt.username || "",
      full_name: jwt.full_name || jwt.name || "",
      role: localStorage.getItem("user_role") || jwt.role || "user",
    } : null;

    // Fetch full profile
    fetch(`${amiApiBase}/auth_mini/users/me`, {
      headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "69420" },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.username) {
          setUserProfile({
            username: data.username,
            email: data.email || "",
            full_name: data.full_name || data.name || profile?.full_name || "",
            role: data.role || profile?.role || "user",
          });
        } else {
          setUserProfile(profile);
        }
      })
      .catch(() => setUserProfile(profile));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${amiApiBase}/auth_mini/chatbots`, {
      headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "69420" },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setChatbots(data?.chatbots || []))
      .catch(() => {});
  }, []);

  return (
    <AmiProvider userProfile={userProfile} chatbots={chatbots} token={token}>
      <AmiApp />
    </AmiProvider>
  );
};

export default StudyWithAmi;
