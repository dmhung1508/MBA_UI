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

  // ── TTS Playback ──
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.close(); } catch {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  const speakText = useCallback(async (text) => {
    if (!voiceEnabled || !text?.trim()) return;
    stopSpeaking();

    try {
      const blob = await textToSpeech(text);
      if (!blob?.size) return;
      setLastSpeechText(text);

      const arrayBuffer = await blob.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioRef.current = ctx;

      let rafId = null;
      const mouthHold = mouthHoldRef?.current;

      const closeMouth = () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        mouthHoldRef?.current?.setAgentTranscriptionActive(0);
        setIsSpeaking(false);
        try { ctx.close(); } catch {}
        if (audioRef.current === ctx) audioRef.current = null;
      };

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = false;
      source.onended = closeMouth;

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
    } catch (e) {
      setIsSpeaking(false);
    }
  }, [voiceEnabled, stopSpeaking, setIsSpeaking, setLastSpeechText, mouthHoldRef]);

  const replayLastSpeech = useCallback(() => {
    if (lastSpeechText) speakText(lastSpeechText);
  }, [lastSpeechText, speakText]);

  return {
    startRecording, cancelRecording, finishRecording, toggleRecording,
    speakText, stopSpeaking, replayLastSpeech,
    setVoiceEnabled, voiceEnabled,
  };
}
