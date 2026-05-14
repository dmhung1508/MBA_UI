import { useCallback } from "react";
import { useAmi } from "../context/AmiContext";
import { chatStream } from "../services/amiApi";

export default function useAmiChat() {
  const {
    messages, setMessages, setIsSending,
    selectedSource, thinkEnabled, searchEnabled,
    currentSessionId, setCurrentSessionId,
    model,
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
      thinking: thinkEnabled ? "Ami đang bắt đầu suy nghĩ..." : "",
      timestamp: new Date().toISOString(),
      pending: true,
      steps: [
        {
          id: "step-1",
          step: "analyzing",
          detail: thinkEnabled ? "Ami đang bắt đầu suy nghĩ..." : "Ami đang xử lý câu hỏi...",
          status: "active",
          timestamp: Date.now(),
        },
      ],
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
        userId: localStorage.getItem("access_token") ? JSON.parse(atob(localStorage.getItem("access_token").split(".")[1])).sub || "unknown" : "unknown",
        text: content,
        source: selectedSource,
        sessionId,
        think: thinkEnabled,
        search: searchEnabled,
        mode: "ami_study",
        history: messages.filter((m) => m.id !== tempUserId && m.id !== tempAmiId).map((m) => ({ role: m.role, content: m.content })),
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

              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== tempAmiId) return msg;
                  const steps = [...(msg.steps || [])];

                  if (eventType === "token") {
                    accumulatedAnswer += data.text;
                    if (!steps.some((s) => s.step === "generating" && s.status === "active")) {
                      steps.push({ id: `step-${steps.length + 1}`, step: "generating", detail: "Đang tạo câu trả lời...", status: "active", timestamp: Date.now() });
                    }
                    return { ...msg, content: accumulatedAnswer, steps };
                  }

                  if (eventType === "thinking") {
                    accumulatedThinking += data.text;
                    const updatedSteps = steps.map((s) =>
                      s.step === "analyzing" ? { ...s, thinkingText: accumulatedThinking } : s
                    );
                    return { ...msg, thinking: accumulatedThinking, steps: updatedSteps };
                  }

                  if (eventType === "status") {
                    const completed = steps.map((s) => ({ ...s, status: "completed" }));
                    completed.push({ id: `step-${completed.length + 1}`, step: data.step || "processing", detail: data.detail || "Đang xử lý...", status: "active", timestamp: Date.now() });
                    return { ...msg, steps: completed };
                  }

                  if (eventType === "sources") {
                    const completed = steps.map((s) => ({ ...s, status: "completed" }));
                    completed.push({
                      id: `step-${completed.length + 1}`, step: "sources_found",
                      detail: `Đã tìm thấy ${Array.isArray(data.sources) ? data.sources.length : 0} tài liệu phù hợp`,
                      status: "completed", timestamp: Date.now(),
                      sourceCount: Array.isArray(data.sources) ? data.sources.length : 0,
                    });
                    return { ...msg, steps: completed, sources: data.sources };
                  }

                  if (eventType === "complete") {
                    if (data.answer) accumulatedAnswer = data.answer;
                    const completed = steps.map((s) => ({ ...s, status: "completed" }));
                    if (!completed.some((s) => s.step === "done")) {
                      completed.push({ id: `step-${completed.length + 1}`, step: "done", detail: "Hoàn thành", status: "completed", timestamp: Date.now() });
                    }
                    return { ...msg, content: accumulatedAnswer, pending: false, steps: completed };
                  }

                  if (eventType === "error") {
                    return { ...msg, content: data.message || "Lỗi không xác định", pending: false };
                  }

                  return msg;
                })
              );
            } catch {}
          }
        }
      }

      // TTS — routed through speakText so lip sync works
      if (accumulatedAnswer) {
        window.dispatchEvent(new CustomEvent("ami-speak", { detail: accumulatedAnswer }));
      }

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
    currentSessionId, setCurrentSessionId, model,
  ]);

  return { submitMessage };
}
