import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { useAmi } from "../../../context/AmiContext";
import SourceReferences from "../../../components/SourceReferences";
import { buildDocumentPreviewUrl } from "../../../services/documentApi";
import { linkifyInlineCitations, sourceForCitation } from "../../../utils/citations";

const AMI_BASE = import.meta.env.BASE_URL || "/";
const AMI_AVATAR = `${AMI_BASE}ami-avatar.png`;

const MD_COMPONENTS = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isBlock = match || String(children).includes("\n");
    return isBlock ? (
      <SyntaxHighlighter
        style={oneDark}
        language={match?.[1] || "text"}
        PreTag="div"
        customStyle={{ borderRadius: 8, fontSize: 12, margin: "6px 0" }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code className="md-inline-code" {...props}>{children}</code>
    );
  },
};

export default function MessageList() {
  const { messages, selectedSource, voiceEnabled, debateActive } = useAmi();
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
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    if (scrollTop > maxScroll) listRef.current.scrollTop = maxScroll;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  const jumpToLatest = useCallback(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  const citationComponents = useCallback((sources) => ({
    ...MD_COMPONENTS,
    a({ href, children, ...props }) {
      const match = /^#source-(\d+)$/.exec(href || "");
      if (!match) return <a href={href} {...props}>{children}</a>;
      const source = sourceForCitation(sources, Number(match[1]));
      const documentId = Number(source?.document_id);
      const canPreview = Number.isInteger(documentId) && documentId > 0 && source?.preview_supported;
      return (
        <button
          type="button"
          className="inline-citation"
          title={source?.filename || source?.source || `Nguồn ${match[1]}`}
          disabled={!canPreview}
          onClick={() => {
            if (canPreview) {
              window.open(buildDocumentPreviewUrl(documentId, source?.page), "_blank", "noopener,noreferrer");
            }
          }}
        >
          {children}
        </button>
      );
    },
  }), []);

  useLayoutEffect(() => {
    if (!listRef.current) return;
    if (messages.length === 0 || (debateActive && messages.length === 1)) {
      listRef.current.scrollTop = 0;
      atBottomRef.current = true;
      setShowJump(false);
      return;
    }
    if (atBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, debateActive]);

  if (messages.length === 0) {
    return (
      <div id="message-list">
        <div className="debate-spacer-block" />
        <div className="empty-chat">
          {selectedSource ? "Ami đã sẵn sàng, đang chờ đợi câu hỏi của bạn!" : "Chọn môn học rồi hỏi Ami bất cứ câu gì nhé!"}
        </div>
      </div>
    );
  }

  return (
    <>
    <div id="message-list" ref={listRef} onScroll={handleScroll}>
      <div className="debate-spacer-block" />
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
              {/* Single step indicator — only while pending */}
              {isPending && msg.steps && msg.steps.length > 0 && (() => {
                const active = msg.steps[msg.steps.length - 1];
                const emoji =
                  active.step === "analyzing"    ? "🔍" :
                  active.step === "retrieving"   ? "📚" :
                  active.step === "generating"   ? "✍️" :
                  active.step === "sources_found"? "📄" :
                  active.step === "done"         ? "✅" : "⚙️";
                const text =
                  active.step === "analyzing"    ? "Đang phân tích câu hỏi"  :
                  active.step === "retrieving"   ? "Đang truy xuất tài liệu" :
                  active.step === "generating"   ? "Đang tạo câu trả lời"    :
                  active.step === "sources_found"? `Đã tìm thấy ${active.sourceCount || 0} tài liệu` :
                  active.step === "done"         ? "Hoàn thành"               :
                  active.detail || active.step;
                return (
                  <div key={active.id} className="step-indicator">
                    <span className="step-emoji">{emoji}</span>
                    <span>{text}</span>
                  </div>
                );
              })()}

              {/* Main content */}
              {isPending && !msg.content ? (
                <span className="bubble-text">Ami đang trả lời...</span>
              ) : (
                <div className="bubble-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={citationComponents(msg.sources)}
                  >
                    {linkifyInlineCitations(msg.content, msg.sources)}
                  </ReactMarkdown>
                </div>
              )}
              {msg.timestamp && <span className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
              {!isPending && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                <SourceReferences sources={msg.sources} compact />
              )}
            </div>
            {!isPending && msg.content && voiceEnabled && (
              <button
                className="speak-btn"
                onClick={() => window.dispatchEvent(new CustomEvent("ami-speak", { detail: msg.content }))}
                title="Nghe Ami đọc"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
    {jumpMounted && (
      <button className={`jump-to-latest-btn${jumpHiding ? " is-hiding" : ""}`} type="button" title="Tin nhắn mới nhất" onClick={jumpToLatest}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    )}
    </>
  );
}
