import { useCallback, useRef, useState } from "react";
import { useAmi } from "../context/AmiContext";
import {
  endModuleSession,
  sendModuleTurn,
  startProfileSession,
} from "../services/agentModulesApi";

export const DEBATE_TIME_OPTIONS = {
  "2m":      { label: "2 phút",          seconds: 120 },
  "3m":      { label: "3 phút",          seconds: 180 },
  "5m":      { label: "5 phút",          seconds: 300 },
  unlimited: { label: "Không giới hạn", seconds: 0   },
};

const UNLIMITED_MAX_TURNS = 5;

export const DEBATE_ROUND_OPTIONS = [
  { value: 3, label: "3 vòng" },
  { value: 5, label: "5 vòng" },
  { value: 7, label: "7 vòng" },
];

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
  const isEvaluatingRef    = useRef(false);
  const timeOptionRef      = useRef(timeOption);
  const requestedMaxRoundsRef = useRef(UNLIMITED_MAX_TURNS);
  timeOptionRef.current    = timeOption;

  const endDebateRef       = useRef(null);
  const runEvaluateRef     = useRef(null);
  const debateSessionIdRef = useRef(null);
  const debateStateVersionRef = useRef(0);

  const endDebate = useCallback(() => {
    setDebateActive(false);
    setDebateFinished(true);
    setDebateTurn(0);
    setTimeLeft(null);
    userHistoryRef.current     = [];
    questionHistoryRef.current = [];
    currentQuestionRef.current = "";
    isEvaluatingRef.current    = false;
    debateSessionIdRef.current = null;
    debateStateVersionRef.current = 0;
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
      if (!debateSessionIdRef.current) {
        throw new Error("Missing debate session");
      }
      const data = await endModuleSession(debateSessionIdRef.current, {
        expected_state_version: debateStateVersionRef.current,
      });
      debateStateVersionRef.current = data.state_version ?? debateStateVersionRef.current;
      setDebateResult(data.state?.evaluation || null);
      endDebateRef.current();
    } catch {
      setDebateResult(null);
      endDebateRef.current();
    }
    setIsSending(false);
  }, [setMessages, setIsSending, setDebateResult, model]);
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
    const nextTimeOption = typeof opt === "object" && opt ? opt.timeOption : opt;
    const nextMaxRounds = typeof opt === "object" && opt ? Number(opt.maxRounds) : UNLIMITED_MAX_TURNS;
    if (nextTimeOption) { setTimeOption(nextTimeOption); timeOptionRef.current = nextTimeOption; }
    requestedMaxRoundsRef.current = Number.isFinite(nextMaxRounds) ? nextMaxRounds : UNLIMITED_MAX_TURNS;

    prevSessionIdRef.current   = currentSessionId;
    userHistoryRef.current     = [];
    questionHistoryRef.current = [];
    currentQuestionRef.current = "";
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
      const data = await startProfileSession("ami_review", "guided_debate", {
        workspace_id: selectedSource,
        input_payload: {
          subject_name: selectedName,
          time_option: timeOptionRef.current,
          debate_mode: "quick",
          requested_max_rounds: requestedMaxRoundsRef.current,
        },
      });
      if (data.id) {
        debateSessionIdRef.current = data.id;
        debateStateVersionRef.current = data.state_version ?? 0;
        setCurrentSessionId(data.id);
      }
      currentQuestionRef.current = data.state?.opening || "";
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
          ? { ...msg, content: "Chưa khởi tạo được phiên thử thách. Bạn thử lại sau nhé.", pending: false }
          : msg
      ));
      setDebateActive(false);
      setTimeLeft(null);
    }
    setIsSending(false);
  }, [
    selectedSource, selectedName,
    setDebateActive, setDebateTurn, setTimeLeft,
    newConversation, openFeature, setMessages,
    currentSessionId, setCurrentSessionId,
    setDebateResult, setTimeOption,
    setIsSending, model,
  ]);

  const submitDebateAnswer = useCallback(async (content) => {
    if (!debateActive || isEvaluatingRef.current) return;
    if (!debateSessionIdRef.current) {
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}-debate-wait`,
          role: "assistant",
          content: "Ami đang chuẩn bị phiên thử thách, cậu gửi lại sau vài giây nhé.",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

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

    try {
      const data = await sendModuleTurn(debateSessionIdRef.current, {
        message: content,
        expected_state_version: debateStateVersionRef.current,
      });
      const assistantEvent = data.events?.find((event) => event.event === "assistant_message");
      const shouldEnd = data.events?.some((event) => event.event === "session_ready_to_end");
      const assistantMessage = assistantEvent?.data?.content || "Ami đã phản biện.";
      const nextRound = assistantEvent?.data?.round;
      const maxRounds = assistantEvent?.data?.max_rounds;

      if (isEvaluatingRef.current) {
        keepReading = false;
        if (readingTimerRef.current) { clearTimeout(readingTimerRef.current); readingTimerRef.current = null; }
        setIsSending(false);
        return;
      }

      debateStateVersionRef.current = data.session?.state_version ?? debateStateVersionRef.current;
      currentQuestionRef.current = assistantMessage;
      questionHistoryRef.current.push(currentQuestionRef.current);
      setDebateTurn(shouldEnd ? maxRounds || nextRound || answeredTurn : (nextRound || answeredTurn) + 1);

      setMessages(prev => prev.map(msg =>
        msg.id === pendingAmiId
          ? { ...msg, content: assistantMessage, pending: false }
          : msg
      ));
      if (shouldEnd) {
        keepReading = false;
        if (readingTimerRef.current) { clearTimeout(readingTimerRef.current); readingTimerRef.current = null; }
        setIsSending(false);
        await runEvaluateRef.current();
        return;
      }
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
    debateActive, debateTurn,
    setMessages, setIsSending, model, setDebateTurn, startCountdown,
  ]);

  const finishDebate = useCallback(() => runEvaluateRef.current?.(), []);

  return {
    debateActive, debateTurn, timeLeft, timeOption, setTimeOption,
    startDebate, cancelDebate, submitDebateAnswer, finishDebate,
    DEBATE_TIME_OPTIONS, DEBATE_ROUND_OPTIONS, UNLIMITED_MAX_TURNS,
  };
}
