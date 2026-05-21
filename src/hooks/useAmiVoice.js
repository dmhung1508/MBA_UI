import { useCallback, useRef } from "react";
import { useAmi } from "../context/AmiContext";
import { textToSpeech } from "../services/amiApi";

export default function useAmiVoice() {
  const {
    isRecording, setIsRecording,
    isSpeaking, setIsSpeaking,
    voiceEnabled, setVoiceEnabled,
    lastSpeechText, setLastSpeechText,
    setInterimText,
    mouthHoldRef,
  } = useAmi();

  const recognitionRef = useRef(null);
  const finalTextRef = useRef('');
  const cancelledRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const audioRef = useRef(null);

  const SILENCE_MS = 2000;

  // ── Recording ──
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || isRecording) return;
    const rec = new SR();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;
    finalTextRef.current = '';
    cancelledRef.current = false;

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
      }, SILENCE_MS);
    };

    rec.onresult = (e) => {
      resetSilenceTimer();
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTextRef.current += e.results[i][0].transcript;
      }
    };

    rec.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setIsRecording(false);
      setInterimText('');
      const text = finalTextRef.current.trim();
      finalTextRef.current = '';
      if (text && !cancelledRef.current) {
        window.dispatchEvent(new CustomEvent('ami-voice-ready', { detail: text }));
      }
    };

    rec.onerror = () => {
      clearTimeout(silenceTimerRef.current);
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = rec;
    setIsRecording(true);
    rec.start();
    resetSilenceTimer();
  }, [isRecording, setIsRecording, setInterimText]);

  const cancelRecording = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    cancelledRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    setInterimText('');
    finalTextRef.current = '';
  }, [setIsRecording, setInterimText]);

  // Stop and hand transcript to input (no cancel flag)
  const finishRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      finishRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, finishRecording]);

  const ttsQueueRef = useRef([]);   // [{ text, bufferPromise }]
  const isPlayingRef = useRef(false);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || ttsQueueRef.current.length === 0) return;
    const { text, bufferPromise } = ttsQueueRef.current.shift();
    isPlayingRef.current = true;

    try {
      // Buffer đã được fetch từ trước (parallel), await gần như tức thì
      const arrayBuffer = await bufferPromise;
      if (!arrayBuffer) { isPlayingRef.current = false; playNextInQueue(); return; }
      setLastSpeechText(text);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioRef.current = ctx;

      let rafId = null;
      const mouthHold = mouthHoldRef?.current;

      const onDone = () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        mouthHoldRef?.current?.setAgentTranscriptionActive(0);
        try { ctx.close(); } catch {}
        if (audioRef.current === ctx) audioRef.current = null;
        isPlayingRef.current = false;
        if (ttsQueueRef.current.length === 0) setIsSpeaking(false);
        playNextInQueue(); // Phát câu tiếp theo ngay lập tức
      };

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = false;
      source.onended = onDone;

      if (mouthHold) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          mouthHold.setAgentTranscriptionActive(avg / 128);
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } else {
        source.connect(ctx.destination);
      }

      setIsSpeaking(true);
      if (ctx.state === "suspended") await ctx.resume();
      source.start(0);
    } catch {
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, [setIsSpeaking, setLastSpeechText, mouthHoldRef]);

  const stopSpeaking = useCallback(() => {
    ttsQueueRef.current = [];
    isPlayingRef.current = false;
    if (audioRef.current) {
      try { audioRef.current.close(); } catch {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  const speakText = useCallback((text) => {
    if (!voiceEnabled || !text?.trim()) return;
    // Bắt đầu fetch TTS NGAY LẬP TỨC song song với audio đang phát
    // Lưu promise vào queue — khi câu trước kết thúc, buffer đã sẵn sàng
    const bufferPromise = textToSpeech(text)
      .then((blob) => blob?.size ? blob.arrayBuffer() : null)
      .catch(() => null);
    ttsQueueRef.current.push({ text, bufferPromise });
    playNextInQueue();
  }, [voiceEnabled, playNextInQueue]);

  const replayLastSpeech = useCallback(() => {
    if (lastSpeechText) speakText(lastSpeechText);
  }, [lastSpeechText, speakText]);

  return {
    startRecording, cancelRecording, finishRecording, toggleRecording,
    speakText, stopSpeaking, replayLastSpeech,
    setVoiceEnabled, voiceEnabled,
  };
}
