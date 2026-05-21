import { useCallback, useRef, useState } from "react";
import { useAmi } from "../context/AmiContext";
import { debateStart, debateRespond, debateEvaluate } from "../services/amiApi";

export const DEBATE_TIME_OPTIONS = {
  "2m":      { label: "2 phút",          seconds: 120 },
  "3m":      { label: "3 phút",          seconds: 180 },
  "5m":      { label: "5 phút",          seconds: 300 },
  unlimited: { label: "Không giới hạn", seconds: 0   },
};

const UNLIMITED_MAX_TURNS = 5;

function getUserId() {
  const token = localStorage.getItem("access_token");
  try { return token ? (JSON.parse(atob(token.split(".")[1])).sub || "unknown") : "unknown"; }
  catch { return "unknown"; }
}

export default function useAmiDebate() {
  const {
    debateActive, setDebateActive,
    debateTurn, setDebateTurn,
    timeLeft, setTimeLeft,
    debateFinished, setDebateFinished,
    setDebateResult,
    selectedSource, selectedName,
    setMessages, setIsSending,
    newConversation, openFeature,
    currentSessionId, setCurrentSessionId, loadSessionMessages,
    setDebateReadOnly,
    model,
  } = useAmi();

  const [timeOption, setTimeOption] = useState("unlimited");
  const prevSessionIdRef   = useRef(null);
  const readingTimerRef    = useRef(null);
  const countdownRef       = useRef(null);
  const userHistoryRef     = useRef([]);
  const questionHistoryRef = useRef([]);
  const currentQuestionRef = useRef("");
  const turnScoresRef      = useRef([]);
  const isEvaluatingRef    = useRef(false);
  const timeOptionRef      = useRef(timeOption);
  timeOptionRef.current    = timeOption;

  const endDebateRef       = useRef(null);
  const runEvaluateRef     = useRef(null);
  const debateSessionIdRef = useRef(null);

  const endDebate = useCallback(() => {
    setDebateActive(false);
    setDebateFinished(true);
    setDebateTurn(0);
    setTimeLeft(null);
    userHistoryRef.current     = [];
    questionHistoryRef.current = [];
    currentQuestionRef.current = "";
    turnScoresRef.current      = [];
    isEvaluatingRef.current    = false;
    debateSessionIdRef.current = null;
    if (readingTimerRef.current) { clearTimeout(readingTimerRef.current); readingTimerRef.current = null; }
    if (countdownRef.current)    { clearInterval(countdownRef.current);   countdownRef.current    = null; }
  }, [setDebateActive, setDebateFinished, setDebateTurn, setTimeLeft]);
  endDebateRef.current = endDebate;

  const cancelDebate = useCallback(() => {
    const prev = prevSessionIdRef.current;
    prevSessionIdRef.current = null;
    endDebateRef.current();
    setDebateFinished(false);
    if (prev) { setCurrentSessionId(prev); loadSessionMessages(prev); }
    else { setMessages([]); }
  }, [setCurrentSessionId, loadSessionMessages, setMessages, setDebateFinished]);

  const runEvaluate = useCallback(async (existingPendingId = null) => {
    if (isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;

    if (existingPendingId) {
      setMessages(prev => prev.filter(m => m.id !== existingPendingId));
    }

    setIsSending(true);
    model.playMotion("Reading");
    try {
      const data = await debateEvaluate({
        userId:          getUserId(),
        sessionId:       debateSessionIdRef.current,
        source:          selectedSource,
        subjectName:     selectedName,
        userName:        "Bạn",
        answers:         userHistoryRef.current,
        questionHistory: questionHistoryRef.current,
        currentQuestion: currentQuestionRef.current,
        turnScores:      turnScoresRef.current,
        timeOption:      timeOptionRef.current,
        turnDurations:   [],
        timedOutTurns:   [],
      });
      setDebateResult(data.evaluation || null);
      endDebateRef.current();
    } catch {
      setDebateResult(null);
      endDebateRef.current();
    }
    setIsSending(false);
  }, [selectedSource, selectedName, setMessages, setIsSending, setDebateResult, model]);
  runEvaluateRef.current = runEvaluate;

  const startCountdown = useCallback((seconds) => {
    if (!seconds || countdownRef.current) return;
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          runEvaluateRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [setTimeLeft]);

  const startDebate = useCallback(async (opt) => {
    if (!selectedSource) {
      window.dispatchEvent(new CustomEvent("ami-open-page", { detail: "subjects" }));
      return;
    }
    if (opt) { setTimeOption(opt); timeOptionRef.current = opt; }

    prevSessionIdRef.current   = currentSessionId;
    userHistoryRef.current     = [];
    questionHistoryRef.current = [];
    currentQuestionRef.current = "";
    turnScoresRef.current      = [];
    isEvaluatingRef.current    = false;

    setDebateResult(null);
    setDebateReadOnly(false);
    newConversation();
    setCurrentSessionId(`debate-local-${Date.now()}`);
    openFeature("debate");

    const initSeconds = DEBATE_TIME_OPTIONS[timeOptionRef.current]?.seconds || 0;
    setDebateActive(true);
    setDebateTurn(1);
    setTimeLeft(initSeconds || null);

    // Show pending while Ami prepares first question
    const initPendingId = `a-${Date.now()}-init`;
    setMessages([{
      id: initPendingId, role: "assistant", content: "", pending: true,
      timestamp: new Date().toISOString(),
    }]);

    // Countdown starts on user's first message (not here)

    // Ami asks the opening question
    setIsSending(true);
    model.playMotion("Reading");
    try {
      const data = await debateStart({
        userId:      getUserId(),
        source:      selectedSource,
        subjectName: selectedName,
        timeOption:  timeOptionRef.current,
        debateMode:  "quick",
      });
      if (data.session_id) {
        debateSessionIdRef.current = data.session_id;
        setCurrentSessionId(data.session_id);
      }
      currentQuestionRef.current = data.opening || "";
      if (currentQuestionRef.current) questionHistoryRef.current.push(currentQuestionRef.current);
      setMessages(prev => prev.map(msg =>
        msg.id === initPendingId
          ? { ...msg, content: currentQuestionRef.current || "Hãy bắt đầu trả lời!", pending: false }
          : msg
      ));
    } catch (err) {
      console.error("[debate] startDebate initial question failed:", err);
      setMessages(prev => prev.map(msg =>
        msg.id === initPendingId
          ? { ...msg, content: "Ami đã sẵn sàng! Hãy bắt đầu.", pending: false }
          : msg
      ));
    }
    setIsSending(false);
  }, [
    selectedSource, selectedName,
    setDebateActive, setDebateTurn, setTimeLeft,
    newConversation, openFeature, setMessages,
    currentSessionId, setCurrentSessionId,
    setDebateResult, setTimeOption,
    setIsSending, model, startCountdown,
  ]);

  const submitDebateAnswer = useCallback(async (content) => {
    if (!debateActive || isEvaluatingRef.current) return;

    const answeredTurn = debateTurn;
    setIsSending(true);

    let keepReading = true;
    model.playMotion("Reading");
    const scheduleReading = () => {
      readingTimerRef.current = setTimeout(() => {
        if (!keepReading) return;
        model.playMotion("Reading");
        scheduleReading();
      }, 3800);
    };
    scheduleReading();

    const pendingAmiId = `a-${Date.now()}-debate`;
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() },
      { id: pendingAmiId, role: "assistant", content: "", pending: true, timestamp: new Date().toISOString() },
    ]);

    userHistoryRef.current.push({ answer: content, turn: answeredTurn });

    // Start countdown on first answer for timed modes
    if (answeredTurn === 1) {
      const secs = DEBATE_TIME_OPTIONS[timeOptionRef.current]?.seconds || 0;
      startCountdown(secs);
    }

    // Unlimited soft cap
    if (timeOptionRef.current === "unlimited" && answeredTurn >= UNLIMITED_MAX_TURNS) {
      keepReading = false;
      if (readingTimerRef.current) { clearTimeout(readingTimerRef.current); readingTimerRef.current = null; }
      setIsSending(false);
      await runEvaluateRef.current(pendingAmiId);
      return;
    }

    try {
      const data = await debateRespond({
        userId:          getUserId(),
        sessionId:       debateSessionIdRef.current,
        source:          selectedSource,
        turn:            answeredTurn,
        maxTurn:         UNLIMITED_MAX_TURNS,
        userAnswer:      content,
        history:         userHistoryRef.current.slice(0, -1),
        questionHistory: questionHistoryRef.current,
        currentQuestion: currentQuestionRef.current,
        subjectName:     selectedName,
        userName:        "Bạn",
      });

      if (isEvaluatingRef.current) {
        keepReading = false;
        if (readingTimerRef.current) { clearTimeout(readingTimerRef.current); readingTimerRef.current = null; }
        setIsSending(false);
        return;
      }

      const score = Number(data?.evaluation?.score ?? 0) || 0;
      turnScoresRef.current.push(score);
      currentQuestionRef.current = data.next_question_message || data.next_question || "";
      questionHistoryRef.current.push(currentQuestionRef.current);
      setDebateTurn(p => p + 1);

      setMessages(prev => prev.map(msg =>
        msg.id === pendingAmiId
          ? { ...msg, content: data.evaluation_message || "Ami đã phản biện.", pending: false }
          : msg
      ));
    } catch {
      setMessages(prev => prev.map(msg =>
        msg.id === pendingAmiId
          ? { ...msg, content: "Ami chưa phản hồi được. Bạn gửi lại nhé.", pending: false }
          : msg
      ));
    }

    keepReading = false;
    if (readingTimerRef.current) { clearTimeout(readingTimerRef.current); readingTimerRef.current = null; }
    setIsSending(false);
  }, [
    debateActive, debateTurn, selectedSource, selectedName,
    setMessages, setIsSending, model, setDebateTurn, startCountdown,
  ]);

  const finishDebate = useCallback(() => runEvaluateRef.current?.(), []);

  return {
    debateActive, debateTurn, timeLeft, timeOption, setTimeOption,
    startDebate, cancelDebate, submitDebateAnswer, finishDebate,
    DEBATE_TIME_OPTIONS, UNLIMITED_MAX_TURNS,
  };
}
