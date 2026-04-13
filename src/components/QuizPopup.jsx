// QuizPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaHourglassHalf } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaVolumeUp } from 'react-icons/fa';
import explainData from '../assets/explain.json';
import { API_ENDPOINTS } from '../config/api';
const ExplanationPanel = ({ visible, onClose, currentIndex, wrongIndexes, questions, setCurrentIndex }) => {
  if (!visible || wrongIndexes.length === 0) return null;
  const realIndex = wrongIndexes[currentIndex];
  const videoSrc = `/chat/video/ami_${String(realIndex + 1).padStart(2, '0')}_00001-audio.mp4`;
  const rawSubtitle = explainData[`slide${realIndex + 1}`] || "Chưa có giải thích.";

  const [isGeneratingAI, setIsGeneratingAI] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsGeneratingAI(true);
    const timer = setTimeout(() => setIsGeneratingAI(false), 2000);
    return () => clearTimeout(timer);
  }, [realIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Autoplay was prevented:", err);
      });
    }
  }, [realIndex]);

  const [volume, setVolume] = useState(1);               // 0 → 1

  useEffect(() => {                                      // đồng bộ thanh kéo & thẻ <video>
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume, realIndex]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentIndex(i => Math.min(i + 1, wrongIndexes.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
      <div className="w-full max-w-[1400px] flex items-start justify-between px-4">

        {/* Subtitle Section */}
        <div className="w-[300px] h-[500px] bg-white shadow-lg border border-gray-300 rounded-md p-4 pointer-events-auto overflow-y-auto">
          {isGeneratingAI ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Đang kết nối với gia sư ...</p>
              <div className="text-center mb-2">{progress}%</div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
              {rawSubtitle}
            </p>
          )}
        </div>

        {/* Video Section */}
        <div className="w-[300px] bg-white shadow-lg border border-gray-300 rounded-md p-3 pointer-events-auto flex flex-col items-center justify-start">
          {isGeneratingAI ? (
            <div className="h-[420px] flex flex-col items-center justify-center w-full">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-700 mt-2">Đang kết nối với gia sư ...</p>
              <div className="text-center mb-2">{progress}%</div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[380px] overflow-hidden
                    flex items-center justify-center
                    shadow-md"
              style={{ borderRadius: '50% / 60%' }}>       {/* khung oval */}
              <video
                ref={videoRef}
                key={realIndex}
                autoPlay
                muted={volume === 0}                          // “giả lập phát trực tiếp”
                playsInline                                   // ẩn nút picture‑in‑picture iOS
                className="absolute inset-0 w-full h-full object-cover"
                controls={false}                              // ẩn toàn bộ native controls
                disablePictureInPicture
                controlsList="nodownload nofullscreen noplaybackrate"
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-3 w-full flex items-center justify-between gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="bg-blue-600 text-white px-3 py-[6px] rounded
                        hover:bg-blue-700 disabled:opacity-50"
            >◀ Trước</button>

            <div className="flex items-center gap-2 flex-1 justify-center">
              <FaVolumeUp className="text-gray-600" />
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === wrongIndexes.length - 1}
              className="bg-blue-600 text-white px-3 py-[6px] rounded
                        hover:bg-blue-700 disabled:opacity-50"
            >Tiếp ▶</button>
          </div>
        </div>
      </div>
    </div>
  );
};




const QuizPopup = ({ isOpen, onClose, apiUrl, onRequestExplanation }) => {
  if (!isOpen) return null;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [wrongIndexes, setWrongIndexes] = useState([]);
  const [currentWrongIndex, setCurrentWrongIndex] = useState(0);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const quizRefs = useRef([]);
  const bottomRef = useRef(null);

  const videoPath = 'public/video/quiz_clean.mp4';

  useEffect(() => {
    setQuestions([]);
    setAnswers({});
    setIsSubmitted(false);
    setWrongIndexes([]);
    setCurrentWrongIndex(0);
    setShowVideoPanel(false);
    setShowVideo(false);
    setIsVideoLoading(false);
    setFetchError("");
    setIsLoading(true);
    fetch(apiUrl)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || 'Không thể tải bộ câu hỏi.');
        }

        return data;
      })
      .then(data => {
        if (!Array.isArray(data?.questions) || data.questions.length === 0) {
          throw new Error('Không có câu hỏi phù hợp với lựa chọn hiện tại.');
        }

        const transformedQuestions = data.questions.map(q => {
          const answers = q.choices.map((choice, index) => ({
            answer: `${String.fromCharCode(65 + index)}. ${choice}`,
            isCorrectAnswer: choice === q.correct_answer ? "true" : "false"
          }));

          return {
            question: q.question,
            answers: answers
          };
        });

        setQuestions(transformedQuestions);
      })
      .catch(err => {
        console.error('Lỗi tải câu hỏi:', err);
        setFetchError(err.message || 'Không thể tải câu hỏi.');
      })
      .finally(() => setIsLoading(false));
  }, [apiUrl]);

  useEffect(() => {
    if (showVideoPanel && wrongIndexes.length > 0) {
      const scrollTo = quizRefs.current[wrongIndexes[currentWrongIndex]];
      scrollTo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWrongIndex, showVideoPanel]);

  useEffect(() => {
    if (showVideo) {
      const videoEl = document.getElementById('plyr-video');
      if (videoEl) {
        videoEl.play().catch(err => console.error("Auto-play thất bại:", err));
      }
    }
  }, [showVideo]);

  useEffect(() => {
    if (showVideo) {
      // Dynamically import Plyr and its CSS only when needed
      Promise.all([
        import('plyr'),
        import('plyr/dist/plyr.css')
      ]).then(([PlyrModule]) => {
        const Plyr = PlyrModule.default;
        new Plyr('#plyr-video', {
          controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        });
      }).catch(err => {
        console.error('Failed to load Plyr:', err);
      });
    }
  }, [showVideo]);

  const handleOptionChange = (index, option) => {
    setAnswers({ ...answers, [index]: option });
  };

  const getScore = () => {
    return questions.reduce((score, q, index) => {
      const correct = q.answers.find(a => a.isCorrectAnswer === "true");
      return (correct && answers[index] === correct.answer.charAt(0)) ? score + 1 : score;
    }, 0);
  };

  const hasWrongAnswers = () => {
    return questions.some((q, index) => {
      const correct = q.answers.find(a => a.isCorrectAnswer === "true");
      return answers[index] !== correct?.answer.charAt(0);
    });
  };

  const handleSubmit = () => {
    if (questions.length === 0) {
      toast.error('Không có câu hỏi để nộp bài.');
      return;
    }

    setIsSubmitted(true);
    toast.success('✅ Bài đã được nộp!');

    const wrongs = questions.reduce((arr, q, i) => {
      const correct = q.answers.find(a => a.isCorrectAnswer === "true");
      if (answers[i] !== correct?.answer.charAt(0)) arr.push(i);
      return arr;
    }, []);

    setWrongIndexes(wrongs);

    // Save quiz history to backend
    const score = getScore();
    const scorePercentage = (score / questions.length * 100).toFixed(2);
    const historyData = {
      timestamp: new Date().toISOString(),
      total_questions: questions.length,
      correct_answers: score,
      score: parseFloat(scorePercentage),
      questions: questions.map((q, index) => {
        const correct = q.answers.find(a => a.isCorrectAnswer === "true");
        const userAnswer = answers[index];
        const userAnswerText = userAnswer ? q.answers.find(a => a.answer.charAt(0) === userAnswer)?.answer : null;

        return {
          question: q.question,
          user_answer: userAnswerText || "",
          correct_answer: correct?.answer || "",
          is_correct: userAnswer === correct?.answer.charAt(0)
        };
      }),
      is_intake_test: false
    };

    // Get token for authentication
    const token = localStorage.getItem('access_token');

    fetch(API_ENDPOINTS.SUBMIT_QUIZ, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(historyData)
    })
      .then(res => res.json())
      .then(data => {
        console.log('Quiz history saved:', data);
      })
      .catch(err => {
        console.error('Error saving quiz history:', err);
      });

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleRetry = () => {
    setAnswers({});
    setIsSubmitted(false);
    setWrongIndexes([]);
    setCurrentWrongIndex(0);
    setShowVideoPanel(false);
    setShowVideo(false);
    setIsVideoLoading(false);
  };

  const handleViewExplanation = (index) => {
    const q = questions[index];
    const correct = q.answers.find(a => a.isCorrectAnswer === "true");
    const user = answers[index]
      ? q.answers.find(a => a.answer.charAt(0) === answers[index])?.answer
      : 'Không trả lời';

    const explanation = {
      totalQuestions: 1,
      correctAnswers: user === correct?.answer ? 1 : 0,
      timestamp: new Date().toISOString(),
      explanations: [
        {
          question: q.question,
          userAnswer: user,
          correctAnswer: correct?.answer || '',
          remainingAnswers: q.answers.filter(a => ![user, correct?.answer].includes(a.answer)).map(a => a.answer),
          isCorrect: user === correct?.answer,
        },
      ],
    };

    onClose();
    onRequestExplanation(explanation);
  };

  const handleShowVideo = () => {
    setIsVideoLoading(true);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    setTimeout(() => {
      setIsVideoLoading(false);
      setShowVideo(true);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white p-6 rounded-lg z-10 overflow-y-auto shadow-xl max-h-[90vh] max-w-[90vw] w-full md:w-[700px] relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-black">
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">📝 Bài Trắc Nghiệm</h2>

        {isLoading ? (
          <p>Đang tải câu hỏi...</p>
        ) : fetchError ? (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
            <p className="font-medium mb-2">Không thể bắt đầu bài luyện tập</p>
            <p className="text-sm">{fetchError}</p>
          </div>
        ) : (
          questions.map((q, idx) => {
            // Safety check: ensure answers exists and is an array
            if (!q.answers || !Array.isArray(q.answers)) {
              return null;
            }

            const correct = q.answers.find(a => a.isCorrectAnswer === "true");
            const userChoice = answers[idx];
            const correctLetter = correct?.answer.charAt(0);
            const isWrong = isSubmitted && answers[idx] !== correctLetter;

            return (
              <div key={idx} ref={el => quizRefs.current[idx] = el} className="mb-6 p-4 border rounded">
                <p className="font-medium mb-2">Câu {idx + 1}: {q.question}</p>
                {q.answers.map((ans, i) => {
                  const choice = ans.answer.charAt(0);
                  let colorClass = "border-gray-300";

                  if (isSubmitted) {
                    if (choice === correctLetter) colorClass = "bg-green-100 border-green-500 font-bold";
                    else if (choice === userChoice && choice !== correctLetter) colorClass = "bg-red-100 border-red-500";
                  }

                  return (
                    <label
                      key={i}
                      className={`block border p-2 rounded-lg cursor-pointer mb-2 transition-colors ${colorClass}`}
                    >
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value={choice}
                        disabled={isSubmitted}
                        checked={userChoice === choice}
                        onChange={() => handleOptionChange(idx, choice)}
                        className="mr-2"
                      />
                      {ans.answer}
                    </label>
                  );
                })}

                {isSubmitted && (
                  <div className="mt-2">
                    <p className={`text-sm ${userChoice === correctLetter ? 'text-green-600' : 'text-red-600'}`}>
                      {userChoice === correctLetter
                        ? '✅ Đáp án đúng!'
                        : `❌ Sai rồi! Đáp án đúng là: ${correct?.answer}`}
                    </p>
                    {/* <button
                      onClick={() => handleViewExplanation(idx)}
                      className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition text-sm"
                    >
                      🧠 Xem giải thích
                    </button> */}
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          {fetchError ? (
            <button
              onClick={onClose}
              className="bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800"
            >
              Đóng
            </button>
          ) : !isSubmitted ? (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
            >
              Nộp Bài
            </button>
          ) : (
            <>
              <p className="text-center font-bold">
                ✅ Đúng {getScore()} / {questions.length} câu
              </p>
              <button
                onClick={handleRetry}
                className="bg-yellow-500 text-white px-5 py-2 rounded hover:bg-yellow-600"
              >
                Làm Lại
              </button>
              {/* {hasWrongAnswers() && (
                <button
                  onClick={() => {
                    setShowVideoPanel(true);
                    setCurrentWrongIndex(0);
                  }}
                  className="bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700"
                >
                  📺 Xem Video Chữa Bài
                </button>
              )} */}
            </>
          )}
        </div>

        {isVideoLoading && (
          <div className="mt-8 flex justify-center items-center">
            <FaHourglassHalf className="text-4xl text-blue-500 animate-pulse" />
            <p className="ml-4 text-lg">Đang kết nối gia sư...</p>
          </div>
        )}

        {showVideo && !isVideoLoading && (
          <div className="mt-8" ref={bottomRef}>
            <h3 className="text-xl font-semibold mb-2">📺 Video Chữa Bài</h3>
            <video
              id="plyr-video"
              className="w-full h-[400px] rounded-lg shadow-lg"
              controls
            >
              <source src={videoPath} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <ExplanationPanel
        visible={showVideoPanel}
        onClose={() => setShowVideoPanel(false)}
        currentIndex={currentWrongIndex}
        wrongIndexes={wrongIndexes}
        questions={questions}
        setCurrentIndex={setCurrentWrongIndex}
      />
    </div>
  );
};

export default QuizPopup;
