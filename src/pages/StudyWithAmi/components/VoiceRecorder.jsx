import React from "react";
import { useAmi } from "../../../context/AmiContext";

export default function VoiceRecorder() {
  const { isRecording } = useAmi();
  if (!isRecording) return null;
  return (
    <div className="voice-bar">
      <div className="voice-bar-wave">
        <span/><span/><span/><span/><span/>
      </div>
      <div className="voice-bar-copy">
        <span className="voice-bar-label">Đang nghe...</span>
        <span className="voice-bar-hint">Cứ nói thoải mái... bấm ■ để dừng và xem Ami nghe được gì nha!</span>
      </div>
    </div>
  );
}
