import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { API_ENDPOINTS } from "../config/api";

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
  const [returnFeature, setReturnFeature] = useState(null);

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
  const [skipSessions, setSkipSessions] = useState(0);
  const [hasMoreSessions, setHasMoreSessions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ── Voice ──
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpeechText, setLastSpeechText] = useState("");
  const [interimText, setInterimText] = useState("");

  // ── Debate ──
  const [debateActive, setDebateActive] = useState(false);
  const [debateTurn, setDebateTurn] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [debateFinished, setDebateFinished] = useState(false);
  const [debateResult, setDebateResult] = useState(null);

  // ── Settings ──
  const [thinkEnabled, setThinkEnabled] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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

  const openFeature = useCallback((feature, returnTo = null) => {
    setActiveFeature(feature);
    setSidebarState("feature");
    setReturnFeature(returnTo);
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
    setActiveFeature(null);
    // Only open to extended if we were in a feature pane; don't expand a collapsed sidebar
    setSidebarState(prev => prev === "feature" ? "extended" : prev);
  }, []);

  const formatChatHistoryToMessages = useCallback((chatHistoryData) => {
    const formattedMessages = [];
    chatHistoryData.forEach(chatItem => {
      formattedMessages.push({
        id: `user-${chatItem._id}`,
        role: "user",
        content: chatItem.message,
        timestamp: new Date(chatItem.timestamp).toISOString(),
        historyId: chatItem._id
      });

      let botText = "";
      let sources = [];
      if (typeof chatItem.response === 'string') botText = chatItem.response;
      else if (chatItem.response && typeof chatItem.response === 'object') {
        botText = chatItem.response.response || JSON.stringify(chatItem.response);
        if (Array.isArray(chatItem.response.sources)) sources = chatItem.response.sources;
      }

      formattedMessages.push({
        id: `bot-${chatItem._id}`,
        role: "assistant",
        content: botText,
        timestamp: new Date(chatItem.timestamp).toISOString(),
        sources: sources,
        thinking: chatItem.thinking || "",
        historyId: chatItem._id
      });
    });
    return formattedMessages;
  }, []);

  const loadSessions = useCallback(async (skip = 0, append = false) => {
    if (!profile?.username || !selectedSource) return;
    try {
      const authHeader = token ? `Bearer ${token}` : "";
      const response = await fetch(API_ENDPOINTS.CHAT_SESSIONS(profile.username, selectedSource, 30, skip), {
        headers: { "accept": "application/json", "Authorization": authHeader, "ngrok-skip-browser-warning": "69420" }
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedSessions = data.sessions || [];
        if (append) {
          setSessions(prev => [...prev, ...fetchedSessions]);
        } else {
          setSessions(fetchedSessions);
        }
        setHasMoreSessions(fetchedSessions.length === 30);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [profile?.username, selectedSource, token]);

  const loadSessionMessages = useCallback(async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const authHeader = token ? `Bearer ${token}` : "";
      const response = await fetch(API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId), {
        headers: { "accept": "application/json", "Authorization": authHeader, "ngrok-skip-browser-warning": "69420" }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.history) {
          setMessages(formatChatHistoryToMessages(data.history));
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [formatChatHistoryToMessages, token]);

  // Sync sessions when selected source changes
  useEffect(() => {
    if (selectedSource && profile?.username) {
      setSessions([]);
      setSkipSessions(0);
      setCurrentSessionId("");
      loadSessions(0, false);
    }
  }, [selectedSource, profile?.username, loadSessions]);

  // Load messages when current session changes.
  // Only fetch from server if the session exists in the known sessions list
  // (i.e. it's a server-confirmed session, not a locally-generated new one).
  useEffect(() => {
    if (debateActive) return;
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const isServerSession = sessions.some(s => s.session_id === currentSessionId);
    if (isServerSession && messages.length === 0) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId, sessions, loadSessionMessages, debateActive]);

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
    sidebarState, activeFeature, returnFeature, setReturnFeature, toggleSidebar, openFeature, backToExtended, collapseSidebar,
    chatbots, selectedSource, selectedName, selectSubject,
    messages, setMessages, isSending, setIsSending,
    sessions, setSessions, currentSessionId, setCurrentSessionId, newConversation,
    isRecording, setIsRecording,
    isTranscribing, setIsTranscribing,
    isSpeaking, setIsSpeaking,
    lastSpeechText, setLastSpeechText,
    interimText, setInterimText,
    debateActive, setDebateActive, debateTurn, setDebateTurn, timeLeft, setTimeLeft, debateFinished, setDebateFinished, debateResult, setDebateResult,
    thinkEnabled, setThinkEnabled, searchEnabled, setSearchEnabled, voiceEnabled, setVoiceEnabled,
    chatHidden, setChatHidden, studyPanelClosed, setStudyPanelClosed,
    subjectPanelClosed, setSubjectPanelClosed,
    profile, token,
    loadSessions, loadSessionMessages, skipSessions, setSkipSessions, hasMoreSessions, isLoadingHistory,
  };

  return <AmiContext.Provider value={value}>{children}</AmiContext.Provider>;
}
