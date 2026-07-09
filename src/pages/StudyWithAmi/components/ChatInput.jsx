import React, { useState, useRef, useEffect } from "react";
import { useAmi } from "../../../context/AmiContext";

const WORD_LIMIT = 1000;

const wordsOf = (text) => text.trim().split(/\s+/).filter(Boolean);

const limitWords = (text) => {
  const words = wordsOf(text);
  if (words.length <= WORD_LIMIT) return text;
  return words.slice(0, WORD_LIMIT).join(" ");
};

export default function ChatInput({
  onSubmit, optionsOpen, onToggleOptions, optionsRef,
  thinkEnabled, onThinkToggle, searchEnabled, onSearchToggle,
  voiceEnabled, onVoiceToggle,
}) {
  const { isSending, isRecording } = useAmi();
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const wordCount = wordsOf(value).length;
  const showWordCount = wordCount >= 800;

  useEffect(() => {
    const handler = (e) => {
      const text = e.detail?.trim();
      if (text) {
        setValue(limitWords(text));
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("ami-voice-ready", handler);
    return () => window.removeEventListener("ami-voice-ready", handler);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [value]);

  const updateValue = (nextValue) => {
    setValue(limitWords(nextValue));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || isSending) return;
    setValue("");
    onSubmit(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form id="chat-form" onSubmit={handleSubmit} className={isRecording ? "is-recording" : ""}>
      {optionsOpen && (
        <div className="chat-options-dropdown" ref={optionsRef}>
          <button type="button" className={`chat-option-item${thinkEnabled ? " is-on" : ""}`} onClick={onThinkToggle}>
            <span className="chat-option-check">{thinkEnabled ? "✓" : ""}</span>
            <span className="chat-option-label">Adaptive Thinking</span>
            <span className="chat-option-desc">Ami phân tích sâu trước khi đưa ra câu trả lời</span>
          </button>
          <button type="button" className={`chat-option-item${searchEnabled ? " is-on" : ""}`} onClick={onSearchToggle}>
            <span className="chat-option-check">{searchEnabled ? "✓" : ""}</span>
            <span className="chat-option-label">Web Search</span>
            <span className="chat-option-desc">Ami tìm kiếm thông tin từ internet theo thời gian thực</span>
          </button>
          <button type="button" className={`chat-option-item${voiceEnabled ? " is-on" : ""}`} onClick={onVoiceToggle}>
            <span className="chat-option-check">{voiceEnabled ? "✓" : ""}</span>
            <span className="chat-option-label">Voice Interaction</span>
            <span className="chat-option-desc">Ami giao tiếp với bạn bằng lời nói</span>
          </button>
        </div>
      )}

      <button
        type="button"
        className={`composer-icon-btn composer-options-btn${optionsOpen ? " is-active" : ""}`}
        title="Tuỳ chọn"
        onClick={onToggleOptions}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      <div className="chat-input-wrap">
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          autoComplete="off"
          placeholder={isRecording ? "Đang nghe..." : "Nhắn Ami..."}
          value={isRecording ? "" : value}
          onChange={isRecording ? undefined : (e) => updateValue(e.target.value)}
          onKeyDown={isRecording ? undefined : handleKeyDown}
          disabled={isSending}
          readOnly={isRecording}
        />
        {showWordCount && (
          <span className={`chat-word-count${wordCount >= WORD_LIMIT ? " is-limit" : ""}`}>
            {wordCount}/{WORD_LIMIT} từ
          </span>
        )}
      </div>

      <button
        id="voice-record-btn"
        className={`composer-icon-btn${isRecording ? " is-listening" : ""}`}
        type="button"
        title={isRecording ? "Bấm để hủy" : "Bấm để nói với Ami"}
        onClick={() => window.dispatchEvent(new CustomEvent(isRecording ? "ami-stop-voice" : "ami-toggle-voice"))}
        disabled={isSending}
      >
        {isRecording ? (
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="6" width="12" height="12" rx="2.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path fill="none" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path fill="none" d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      <button id="send-btn" type="submit" disabled={isSending || !value.trim()} aria-label="Gửi">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7Z" />
        </svg>
      </button>
    </form>
  );
}
