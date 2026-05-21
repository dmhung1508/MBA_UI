import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useAmi } from "../context/AmiContext";
import { chatStream } from "../services/amiApi";

// rAF ensures paint, then 100ms delay for visible typing speed
const yieldPaint = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 100)));
// Force visible pause between status transitions (250ms)
const yieldStatus = () => new Promise(r => setTimeout(r, 250));

export default function useAmiChat() {
  const {
    messages, setMessages, setIsSending,
    selectedSource, thinkEnabled, searchEnabled,
    currentSessionId, setCurrentSessionId,
    loadSessions, model,
  } = useAmi();

  const submitMessage = useCallback(async (text) => {
    const content = text.trim();
    if (!content) return;

    if (!selectedSource) return;

    setIsSending(true);
    const tempUserId = `u-${Date.now()}`;
    const tempAmiId = `a-${Date.now()}`;

    const tempUser = {
      id: tempUserId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    const tempAmi = {
      id: tempAmiId,
      role: "assistant",
      content: "",
      thinking: "",
      timestamp: new Date().toISOString(),
      pending: true,
      steps: [{
        id: "step-init",
        step: "analyzing",
        detail: "Đang phân tích câu hỏi...",
        status: "active",
        timestamp: Date.now(),
      }],
    };

    setMessages((prev) => [...prev, tempUser, tempAmi]);

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
      const sessionId = currentSessionId || `session-${Date.now()}`;
      if (!currentSessionId) setCurrentSessionId(sessionId);

      const reader = await chatStream({
        userId: localStorage.getItem("access_token")
          ? JSON.parse(atob(localStorage.getItem("access_token").split(".")[1])).sub || "unknown"
          : "unknown",
        text: content,
        source: selectedSource,
        sessionId,
        think: thinkEnabled,
        search: searchEnabled,
        mode: "ami_study",
        history: messages
          .filter((m) => m.id !== tempUserId && m.id !== tempAmiId)
          .map((m) => ({ role: m.role, content: m.content })),
      });

      const decoder = new TextDecoder();
      let buffer = "";
      let eventType = "unknown";
      let accumulatedAnswer = "";
      let accumulatedThinking = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("event: ")) {
            eventType = trimmed.replace("event: ", "").trim();
          } else if (trimmed.startsWith("data: ")) {
            try {
              const jsonStr = trimmed.replace("data: ", "").trim();
              if (!jsonStr) continue;
              const data = JSON.parse(jsonStr);

              if (eventType === "token") {
                accumulatedAnswer += data.text;
                const snapshot = accumulatedAnswer;
                flushSync(() =>
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== tempAmiId) return msg;
                      const steps = [...(msg.steps || [])];
                      if (!steps.some((s) => s.step === "generating")) {
                        steps.push({
                          id: `step-${steps.length + 1}`,
                          step: "generating",
                          status: "active",
                          timestamp: Date.now(),
                        });
                      }
                      return { ...msg, content: snapshot, steps };
                    })
                  )
                );
                await yieldPaint();

              } else if (eventType === "sentence") {
                if (data.text) {
                  window.dispatchEvent(new CustomEvent("ami-speak", { detail: data.text }));
                }

              } else if (eventType === "thinking") {
                accumulatedThinking += data.text;
                flushSync(() =>
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== tempAmiId) return msg;
                      const steps = [...(msg.steps || [])].map((s) =>
                        s.step === "analyzing" ? { ...s, thinkingText: accumulatedThinking } : s
                      );
                      return { ...msg, thinking: accumulatedThinking, steps };
                    })
                  )
                );
                await yieldPaint();

              } else if (eventType === "status") {
                flushSync(() =>
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== tempAmiId) return msg;
                      const completed = [...(msg.steps || [])].map((s) => ({ ...s, status: "completed" }));
                      completed.push({
                        id: `step-${completed.length + 1}`,
                        step: data.step || "processing",
                        detail: data.detail || "Đang xử lý...",
                        status: "active",
                        timestamp: Date.now(),
                      });
                      return { ...msg, steps: completed };
                    })
                  )
                );
                await yieldStatus();

              } else if (eventType === "sources") {
                flushSync(() =>
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== tempAmiId) return msg;
                      const completed = [...(msg.steps || [])].map((s) => ({ ...s, status: "completed" }));
                      completed.push({
                        id: `step-${completed.length + 1}`,
                        step: "sources_found",
                        detail: `Đã tìm thấy ${Array.isArray(data.sources) ? data.sources.length : 0} tài liệu phù hợp`,
                        status: "completed",
                        timestamp: Date.now(),
                        sourceCount: Array.isArray(data.sources) ? data.sources.length : 0,
                      });
                      return { ...msg, steps: completed, sources: data.sources };
                    })
                  )
                );
                await yieldStatus();

              } else if (eventType === "complete") {
                if (data.answer) accumulatedAnswer = data.answer;
                flushSync(() =>
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== tempAmiId) return msg;
                      const completed = [...(msg.steps || [])].map((s) => ({ ...s, status: "completed" }));
                      return { ...msg, content: accumulatedAnswer, pending: false, steps: completed };
                    })
                  )
                );

              } else if (eventType === "error") {
                flushSync(() =>
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAmiId
                        ? { ...msg, content: data.message || "Lỗi không xác định", pending: false }
                        : msg
                    )
                  )
                );
              }
            } catch {}
          }
        }
      }

      model.playMotion("Head_Nod");
      loadSessions(0, false);
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
    currentSessionId, setCurrentSessionId, loadSessions, model,
  ]);

  return { submitMessage };
}
