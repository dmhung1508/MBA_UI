import { useCallback, useRef } from "react";
import { useAmi } from "../context/AmiContext";
import { debateStart, debateRespond, debateEvaluate } from "../services/amiApi";

function getUserId() {
  const token = localStorage.getItem("access_token");
  try { return token ? (JSON.parse(atob(token.split(".")[1])).sub || "unknown") : "unknown"; }
  catch { return "unknown"; }
}

const MAX_DEBATE_TURN = 3;
const DEBATE_TIME_OPTIONS = {
  "2m": { label: "2 phút/lượt", seconds: 120, bonus: 150 },
  "3m": { label: "3 phút/lượt", seconds: 180, bonus: 100 },
  "5m": { label: "5 phút/lượt", seconds: 300, bonus: 50 },
  unlimited: { label: "Không giới hạn", seconds: 0, bonus: 0 },
};

export default function useAmiDebate() {
  const {
    debateActive, setDebateActive,
    debateTurn, setDebateTurn,
    debateTimeOption: timeOption, setDebateTimeOption: setTimeOption,
    selectedSource, selectedName,
    messages, setMessages, setIsSending,
    model,
  } = useAmi();
  const timerRef = useRef(null);
  const userHistoryRef = useRef([]);
  const questionHistoryRef = useRef([]);
  const currentQuestionRef = useRef("");
  const turnScoresRef = useRef([]);

  const startDebate = useCallback(async () => {
    if (!selectedSource) {
      window.dispatchEvent(new CustomEvent("ami-open-feature", { detail: "subjects" }));
      return;
    }
    userHistoryRef.current = [];
    questionHistoryRef.current = [];
    currentQuestionRef.current = "";
    turnScoresRef.current = [];

    setDebateActive(true);
    setDebateTurn(1);
    setIsSending(true);

    const pendingId = `a-${Date.now()}-debate-open`;
    setMessages((prev) => [
      ...prev,
      { id: pendingId, role: "assistant", content: "", pending: true, timestamp: new Date().toISOString() },
    ]);

    try {
      const data = await debateStart({
        userId: getUserId(),
        source: selectedSource,
        subjectName: selectedName,
        userName: "Bạn",
        timeOption,
        styleMode: "gentle",
      });
      const opening = data?.opening || `Tình huống môn **${selectedName}**: Bạn hãy phản biện lại nhận định sau bằng một lập luận rõ ràng, có ít nhất 1 khái niệm hoặc ví dụ minh họa nhé!`;
      currentQuestionRef.current = opening;
      questionHistoryRef.current = [opening];
      setMessages((prev) =>
        prev.map((m) => m.id === pendingId ? { ...m, content: opening, pending: false } : m)
      );
      window.dispatchEvent(new CustomEvent("ami-speak", { detail: opening }));
    } catch {
      const fallback = `Bắt đầu thử thách môn **${selectedName}**! Hãy đưa ra lập luận của bạn.`;
      currentQuestionRef.current = fallback;
      questionHistoryRef.current = [fallback];
      setMessages((prev) =>
        prev.map((m) => m.id === pendingId ? { ...m, content: fallback, pending: false } : m)
      );
    } finally {
      setIsSending(false);
    }
  }, [selectedSource, selectedName, timeOption, setDebateActive, setDebateTurn, setIsSending, setMessages]);

  const cancelDebate = useCallback(() => {
    setDebateActive(false);
    setDebateTurn(0);
    userHistoryRef.current = [];
    questionHistoryRef.current = [];
    currentQuestionRef.current = "";
    turnScoresRef.current = [];
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, [setDebateActive, setDebateTurn]);

  const submitDebateAnswer = useCallback(async (content) => {
    if (!debateActive) return;
    setIsSending(true);

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

    const answeredTurn = debateTurn;
    const pendingAmiId = `a-${Date.now()}-debate`;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() },
      { id: pendingAmiId, role: "assistant", content: "", pending: true, timestamp: new Date().toISOString() },
    ]);

    userHistoryRef.current.push({ answer: content, turn: answeredTurn });

    // Last turn - evaluate
    if (answeredTurn >= MAX_DEBATE_TURN) {
      try {
        const data = await debateEvaluate({
          userId: getUserId(),
          source: selectedSource,
          subjectName: selectedName,
          userName: "Bạn",
          answers: userHistoryRef.current,
          questionHistory: questionHistoryRef.current,
          currentQuestion: currentQuestionRef.current,
          turnScores: turnScoresRef.current,
          timeOption,
          turnDurations: [],
          timedOutTurns: [],
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingAmiId
              ? { ...msg, content: data.final_feedback_message || "Ami đã chấm xong.", pending: false }
              : msg
          )
        );
        cancelDebate();
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingAmiId
              ? { ...msg, content: "Ami chưa tổng kết được. Bạn gửi lại nhé.", pending: false }
              : msg
          )
        );
      }
    } else {
      // Mid-debate response
      try {
        const data = await debateRespond({
          userId: getUserId(),
          source: selectedSource,
          turn: answeredTurn,
          maxTurn: MAX_DEBATE_TURN,
          userAnswer: content,
          history: userHistoryRef.current.slice(0, -1),
          questionHistory: questionHistoryRef.current,
          currentQuestion: currentQuestionRef.current,
          subjectName: selectedName,
          userName: "Bạn",
        });

        const score = Number(data?.evaluation?.score ?? 0) || 0;
        turnScoresRef.current.push(score);
        currentQuestionRef.current = data.next_question_message || data.next_question || "";
        questionHistoryRef.current.push(currentQuestionRef.current);
        setDebateTurn((p) => Math.min(MAX_DEBATE_TURN, p + 1));

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingAmiId
              ? { ...msg, content: data.evaluation_message || "Ami đã phản biện.", pending: false }
              : msg
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingAmiId
              ? { ...msg, content: "Ami chưa phản hồi được. Bạn gửi lại nhé.", pending: false }
              : msg
          )
        );
      }
    }

    keepReading = false;
    setIsSending(false);
  }, [
    debateActive, debateTurn, selectedSource, selectedName,
    messages, setMessages, setIsSending, model,
    timeOption, cancelDebate, setDebateTurn,
  ]);

  return {
    debateActive, debateTurn, timeOption, setTimeOption,
    startDebate, cancelDebate, submitDebateAnswer,
    DEBATE_TIME_OPTIONS, MAX_DEBATE_TURN,
  };
}
