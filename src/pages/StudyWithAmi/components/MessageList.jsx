import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useAmi } from "../../../context/AmiContext";

const AMI_BASE = import.meta.env.BASE_URL || "/";
const AMI_AVATAR = `${AMI_BASE}ami-avatar.png`;

export default function MessageList() {
  const { messages, selectedSource } = useAmi();
  const listRef = useRef(null);
  const atBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [jumpMounted, setJumpMounted] = useState(false);
  const [jumpHiding, setJumpHiding] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (showJump) {
      clearTimeout(hideTimerRef.current);
      setJumpHiding(false);
      setJumpMounted(true);
    } else if (jumpMounted) {
      setJumpHiding(true);
      hideTimerRef.current = setTimeout(() => {
        setJumpMounted(false);
        setJumpHiding(false);
      }, 220);
    }
  }, [showJump]);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  const jumpToLatest = useCallback(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (listRef.current && atBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div id="message-list">
        <div className="empty-chat">
          {selectedSource ? "Ami đã sẵn sàng, đang chờ đợi câu hỏi của bạn!" : "Chọn môn học rồi hỏi Ami bất cứ câu gì nhé!"}
        </div>
      </div>
    );
  }

  return (
    <div id="message-list" ref={listRef} onScroll={handleScroll}>
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const isPending = msg.pending;

        if (isUser) {
          return (
            <div key={msg.id} className="chat-row user-row">
              <div className="chat-bubble user-bubble">
                <span className="bubble-text">{msg.content}</span>
                {msg.timestamp && <span className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
              </div>
            </div>
          );
        }

        // Assistant message — skip empty non-pending bubbles
        if (!isPending && !msg.content && !msg.thinking && !(msg.steps?.length)) return null;

        return (
          <div key={msg.id} className="chat-row ami-row">
            <img src={AMI_AVATAR} alt="Ami" className="ami-avatar-img" />
            <div className={`chat-bubble ami-bubble ${isPending ? "is-pending" : ""}`}>
              {/* Thinking timeline */}
              {msg.thinking && (
                <div className="thinking-box">
                  <div className="thinking-title">
                    <span className="thinking-dot" />
                    Ami đang suy nghĩ
                  </div>
                  <div className="thinking-summary">{msg.thinking}</div>
                </div>
              )}

              {/* Steps timeline */}
              {msg.steps && msg.steps.length > 0 && (
                <div className="thinking-timeline">
                  {msg.steps.map((step) => (
                    <div key={step.id} className={`thinking-step ${step.status || ""}`}>
                      <div className="thinking-step-label">
                        {step.step === "analyzing" && "🔍 Đang phân tích câu hỏi"}
                        {step.step === "generating" && "✍️ Đang tạo câu trả lời"}
                        {step.step === "sources_found" && `📄 Đã tìm thấy ${step.sourceCount || 0} tài liệu`}
                        {step.step === "done" && "✅ Hoàn thành"}
                        {!["analyzing", "generating", "sources_found", "done"].includes(step.step) && step.detail}
                      </div>
                      {step.thinkingText && (
                        <div className="thinking-step-subtext">{step.thinkingText}</div>
                      )}
                      {step.status === "active" && step.step !== "done" && (
                        <div className="thinking-step-badge">Đang xử lý...</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Main content */}
              <div className="bubble-text bubble-text--md">
                {isPending && !msg.content ? (
                  <span>Ami đang trả lời...</span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.timestamp && <span className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
          </div>
        );
      })}
      {jumpMounted && (
        <button className={`jump-to-latest-btn${jumpHiding ? " is-hiding" : ""}`} type="button" title="Tin nhắn mới nhất" onClick={jumpToLatest}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
