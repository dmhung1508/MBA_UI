import React from "react";
import { useAmi } from "../../../context/AmiContext";

export default function VoiceRecorder() {
  const { isRecording } = useAmi();
  if (!isRecording) return null;
  return (
    <div className="voice-bar">
      <button
        className="voice-bar-cancel"
        type="button"
        title="Hủy ghi âm"
        onClick={() => window.dispatchEvent(new CustomEvent("ami-cancel-voice"))}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="voice-bar-wave">
        <span/><span/><span/><span/><span/>
      </div>
      <div className="voice-bar-copy">
        <span className="voice-bar-label">Ami đang nghe...</span>
        <span className="voice-bar-hint">Nói thoải mái · bấm ■ để dừng · bấm ✕ để hủy</span>
      </div>
    </div>
  );
}
