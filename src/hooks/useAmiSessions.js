import { useCallback, useEffect } from "react";
import { useAmi } from "../context/AmiContext";
import { fetchSessions, fetchSession, deleteSession } from "../services/amiApi";

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
      const userId = "ami-user"; // TODO: get real user ID
      const data = await fetchSessions(userId, selectedSource);
      setSessions(data.sessions || []);
    } catch {}
  }, [selectedSource, setSessions]);

  const loadSession = useCallback(async (sessionId) => {
    try {
      const data = await fetchSession(sessionId);
      if (data.exchanges) {
        const msgs = [];
        data.exchanges.forEach((ex) => {
          if (ex.user_query) msgs.push({ id: `h-u-${msgs.length}`, role: "user", content: ex.user_query, timestamp: ex.timestamp });
          if (ex.agent_response) msgs.push({ id: `h-a-${msgs.length}`, role: "assistant", content: ex.agent_response, timestamp: ex.timestamp });
        });
        setMessages(msgs);
      }
      setCurrentSessionId(sessionId);
    } catch {}
  }, [setMessages, setCurrentSessionId]);

  const removeSession = useCallback(async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) newConversation();
    } catch {}
  }, [setSessions, currentSessionId, newConversation]);

  useEffect(() => {
    if (selectedSource) loadSessions();
  }, [selectedSource, loadSessions]);

  return { sessions, loadSessions, loadSession, removeSession };
}
