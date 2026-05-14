import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const AmiContext = createContext(null);

export function useAmi() {
  const ctx = useContext(AmiContext);
  if (!ctx) throw new Error("useAmi must be used within AmiProvider");
  return ctx;
}

export default function AmiProvider({ children, userProfile, chatbots: initialChatbots, token }) {
  const modelRef = useRef(null);
  const mouthHoldRef = useRef(null);
  const costumeControllerRef = useRef(null);

  // ── Sidebar state: 'collapsed' | 'extended' | 'feature' ──
  const [sidebarState, setSidebarState] = useState("collapsed");
  const [activeFeature, setActiveFeature] = useState(null);

  // ── Subjects ──
  const [chatbots, setChatbots] = useState(initialChatbots || []);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedName, setSelectedName] = useState("");

  // ── Chat ──
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // ── Sessions ──
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("");

  // ── Voice ──
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpeechText, setLastSpeechText] = useState("");
  const [interimText, setInterimText] = useState("");

  // ── Debate ──
  const [debateActive, setDebateActive] = useState(false);
  const [debateTurn, setDebateTurn] = useState(0);
  const [debateTimeOption, setDebateTimeOption] = useState("unlimited");

  // ── Settings ──
  const [thinkEnabled, setThinkEnabled] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [amiStyle, setAmiStyle] = useState(() => localStorage.getItem("ami-style-mode") || "gentle");

  // ── Chat shell UI ──
  const [chatHidden, setChatHidden] = useState(false);
  const [studyPanelClosed, setStudyPanelClosed] = useState(false);
  const [subjectPanelClosed, setSubjectPanelClosed] = useState(false);

  // ── User ──
  const [profile, setProfile] = useState(userProfile || null);

  // Sync chatbots and profile from parent props (fetched asynchronously)
  useEffect(() => { setChatbots(initialChatbots || []); }, [initialChatbots]);
  useEffect(() => { if (userProfile) setProfile(userProfile); }, [userProfile]);

  // ── Sidebar actions ──
  const toggleSidebar = useCallback(() => {
    setSidebarState((prev) => prev === "collapsed" ? "extended" : "collapsed");
    setActiveFeature(null);
  }, []);

  const openFeature = useCallback((feature) => {
    setActiveFeature(feature);
    setSidebarState("feature");
  }, []);

  const backToExtended = useCallback(() => {
    setActiveFeature(null);
    setSidebarState("extended");
  }, []);

  const collapseSidebar = useCallback(() => {
    setSidebarState("collapsed");
    setActiveFeature(null);
  }, []);

  const selectSubject = useCallback((bot) => {
    if (!bot) return;
    setSelectedSource(bot.source || "");
    setSelectedName(bot.name || "");
  }, []);

  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentSessionId("");
    setStudyPanelClosed(false);
    setSubjectPanelClosed(false);
    setDebateActive(false);
    setDebateTurn(0);
    setDebateTimeOption("unlimited");
    setActiveFeature(null);
    // Only open to extended if we were in a feature pane; don't expand a collapsed sidebar
    setSidebarState(prev => prev === "feature" ? "extended" : prev);
  }, []);

  const model = {
    playMotion: (...args) => modelRef.current?.playMotion(...args),
    setExpression: (...args) => modelRef.current?.setExpression(...args),
    fitModel: (...args) => modelRef.current?.fitModel(...args),
    notifyActivity: () => modelRef.current?.notifyActivity?.(),
    pauseIdle: () => modelRef.current?.pauseIdle?.(),
    resumeIdle: () => modelRef.current?.resumeIdle?.(),
  };

  useEffect(() => {
    if (isSending || isSpeaking) {
      modelRef.current?.pauseIdle?.();
    } else {
      modelRef.current?.resumeIdle?.();
    }
  }, [isSending, isSpeaking]);

  const value = {
    modelRef, mouthHoldRef, costumeControllerRef, model,
    sidebarState, activeFeature, toggleSidebar, openFeature, backToExtended, collapseSidebar,
    chatbots, selectedSource, selectedName, selectSubject,
    messages, setMessages, isSending, setIsSending,
    sessions, setSessions, currentSessionId, setCurrentSessionId, newConversation,
    isRecording, setIsRecording,
    isTranscribing, setIsTranscribing,
    isSpeaking, setIsSpeaking,
    lastSpeechText, setLastSpeechText,
    interimText, setInterimText,
    debateActive, setDebateActive, debateTurn, setDebateTurn, debateTimeOption, setDebateTimeOption,
    thinkEnabled, setThinkEnabled, searchEnabled, setSearchEnabled, voiceEnabled, setVoiceEnabled,
    amiStyle, setAmiStyle,
    chatHidden, setChatHidden, studyPanelClosed, setStudyPanelClosed,
    subjectPanelClosed, setSubjectPanelClosed,
    profile, token,
  };

  return <AmiContext.Provider value={value}>{children}</AmiContext.Provider>;
}
