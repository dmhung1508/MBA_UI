import { useCallback } from "react";
import { useAmi } from "../context/AmiContext";
import { chatRequest } from "../services/amiApi";

function extractAnswer(data) {
  if (data?.text?.response) return data.text.response;
  if (data?.answer?.response) return data.answer.response;
  if (typeof data?.text === "string") return data.text;
  if (typeof data?.response === "string") return data.response;
  if (typeof data?.result === "string") return data.result;
  return "Ami không thể trả lời lúc này.";
}

export default function useAmiChat() {
  const {
    messages, setMessages, setIsSending,
    selectedSource, thinkEnabled, searchEnabled,
    currentSessionId, setCurrentSessionId,
    amiStyle,
    model,
  } = useAmi();

  const submitMessage = useCallback(async (text) => {
    const content = text.trim();
    if (!content || !selectedSource) return;

    setIsSending(true);
    const tempUserId = `u-${Date.now()}`;
    const tempAmiId  = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user",      content, timestamp: new Date().toISOString() },
      { id: tempAmiId,  role: "assistant", content: "", pending: true, timestamp: new Date().toISOString() },
    ]);

    let keepReading = true;
    model.playMotion("Reading");
    const scheduleReading = () => {
      setTimeout(() => {
        if (!keepReading) return;
        model.playMotion("Reading");
        scheduleReading();
      }, 3800);
    };
    scheduleReading();

    try {
      const token = localStorage.getItem("access_token");
      const userId = token
        ? (JSON.parse(atob(token.split(".")[1])).sub || "unknown")
        : "unknown";
      const sessionId = currentSessionId || `session-${Date.now()}`;
      if (!currentSessionId) setCurrentSessionId(sessionId);

      const data = await chatRequest({
        userId,
        text: content,
        source: selectedSource,
        sessionId,
        think: thinkEnabled,
        search: searchEnabled,
        mode: "ami_study",
        style_mode: amiStyle || "gentle",
        history: messages
          .filter((m) => m.id !== tempUserId && m.id !== tempAmiId && !m.pending)
          .map((m) => ({ role: m.role, content: m.content })),
      });

      if (data?.session_id) setCurrentSessionId(data.session_id);
      const answer = extractAnswer(data);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAmiId ? { ...msg, content: answer, pending: false } : msg
        )
      );

      if (answer) window.dispatchEvent(new CustomEvent("ami-speak", { detail: answer }));
      model.playMotion("Head_Nod");
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAmiId
            ? { ...msg, content: "Ami đang bận một chút, bạn thử lại nhé.", pending: false }
            : msg
        )
      );
      model.playMotion("Sad");
    } finally {
      keepReading = false;
      setIsSending(false);
    }
  }, [
    messages, setMessages, setIsSending,
    selectedSource, thinkEnabled, searchEnabled,
    currentSessionId, setCurrentSessionId, amiStyle, model,
  ]);

  return { submitMessage };
}
