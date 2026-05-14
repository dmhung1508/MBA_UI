import { useCallback, useEffect } from "react";
import { useAmi } from "../context/AmiContext";
import { fetchSessions, fetchSession } from "../services/amiApi";

function getUserId() {
  const token = localStorage.getItem("access_token");
  try { return token ? (JSON.parse(atob(token.split(".")[1])).sub || "unknown") : "unknown"; }
  catch { return "unknown"; }
}

export default function useAmiSessions() {
  const {
    sessions, setSessions,
    currentSessionId, setCurrentSessionId,
    selectedSource,
    setMessages, newConversation,
  } = useAmi();

  const loadSessions = useCallback(async () => {
    if (!selectedSource) return;
    try {
      const data = await fetchSessions(getUserId(), selectedSource);
      setSessions(data.sessions || []);
    } catch {}
  }, [selectedSource, setSessions]);

  const loadSession = useCallback(async (sessionId) => {
    try {
      const data = await fetchSession(sessionId);
      // Backend returns {chat_history: [{message, response, timestamp, _id}]}
      const history = data.chat_history || data.exchanges || [];
      const msgs = [];
      history.forEach((entry, i) => {
        const ts = entry.timestamp || entry.created_at || new Date().toISOString();
        const userText = entry.message || entry.user_query || "";
        const amiText  = entry.response || entry.agent_response || "";
        if (userText) msgs.push({ id: `h-u-${i}`, role: "user",      content: userText, timestamp: ts });
        if (amiText)  msgs.push({ id: `h-a-${i}`, role: "assistant", content: amiText,  timestamp: ts });
      });
      setMessages(msgs);
      setCurrentSessionId(sessionId);
    } catch {}
  }, [setMessages, setCurrentSessionId]);

  useEffect(() => {
    if (selectedSource) loadSessions();
  }, [selectedSource, loadSessions]);

  return { sessions, loadSessions, loadSession };
}
