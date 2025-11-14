// QuizPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchWithAuth } from '../utils/auth';

// ExplanationPanel removed - not needed anymore

const QuizPopup = ({ isOpen, onClose, apiUrl }) => {
  if (!isOpen) return null;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        console.log('Quiz API response:', data);
        if (data?.questions) {
          console.log('Questions structure:', data.questions[0]);
          setQuestions(data.questions);
        } else {
          console.warn('No questions found in API response');
        }
      })
      .catch(err => console.error('Lỗi tải câu hỏi:', err))
      .finally(() => setIsLoading(false));
  }, [apiUrl]);

  const handleOptionChange = (index, option) => {
    setAnswers({ ...answers, [index]: option });
  };

  const getScore = () => {
    return questions.reduce((score, q, index) => {
      let correctAnswer;
      
      // Check for new format or old format
      if (q.choices && q.correct_answer) {
        correctAnswer = q.correct_answer;
      } else if (q.answers && Array.isArray(q.answers)) {
        const correct = q.answers.find(a => a.isCorrectAnswer === "true");
        correctAnswer = correct?.answer;
      }
      
      return answers[index] === correctAnswer ? score + 1 : score;
    }, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    toast.success('✅ Bài đã được nộp!');
    
    // Submit quiz to backend
    try {
      const score = getScore();
      
      const payload = {
        timestamp: new Date().toISOString(),
        total_questions: questions.length,
        correct_answers: score,
        score: (score / questions.length) * 10,
        questions: questions.map((q, idx) => {
          let correctAnswer;
          
          if (q.choices && q.correct_answer) {
            correctAnswer = q.correct_answer;
          } else if (q.answers && Array.isArray(q.answers)) {
            const correct = q.answers.find(a => a.isCorrectAnswer === "true");
            correctAnswer = correct?.answer;
          }
          
          return {
            question: q.question,
            user_answer: answers[idx] || '',
            correct_answer: correctAnswer || '',
            is_correct: answers[idx] === correctAnswer
          };
        }),
        quizType: 'practice'
      };

      console.log('Submitting quiz payload:', payload);

      const response = await fetchWithAuth('https://api.dinhmanhhung.net/auth_mini/submit_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Quiz submitted successfully:', data);
        toast.success('💾 Đã lưu kết quả vào lịch sử!');
      } else {
        console.error('Failed to submit quiz:', data);
        toast.error('❌ Không thể lưu kết quả: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('❌ Lỗi khi lưu kết quả!');
    }
    
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleRetry = () => {
    setAnswers({});
    setIsSubmitted(false);
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
        ) : (
          questions.map((q, idx) => {
            // Check for new API format (choices + correct_answer) or old format (answers)
            const hasNewFormat = q.choices && Array.isArray(q.choices);
            const hasOldFormat = q.answers && Array.isArray(q.answers);
            
            if (!hasNewFormat && !hasOldFormat) {
              console.warn(`Question ${idx} has invalid format:`, q);
              return null;
            }
            
            let correctAnswer;
            let choicesList;
            
            if (hasNewFormat) {
              // New API format: choices array + correct_answer string
              correctAnswer = q.correct_answer;
              choicesList = q.choices;
            } else {
              // Old API format: answers array with isCorrectAnswer flag
              const correct = q.answers.find(a => a.isCorrectAnswer === "true");
              correctAnswer = correct?.answer;
              choicesList = q.answers.map(a => a.answer);
            }
            
            const userChoice = answers[idx];
            const isCorrect = userChoice === correctAnswer;
            const isWrong = isSubmitted && !isCorrect;

            return (
              <div key={idx} className="mb-6 p-4 border rounded">
                <p className="font-medium mb-2">Câu {idx + 1}: {q.question}</p>
                {choicesList.map((choice, i) => {
                  let colorClass = "border-gray-300";

                  if (isSubmitted) {
                    if (choice === correctAnswer) colorClass = "bg-green-100 border-green-500 font-bold";
                    else if (choice === userChoice && !isCorrect) colorClass = "bg-red-100 border-red-500";
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
                      {choice}
                    </label>
                  );
                })}

                {isSubmitted && (
                  <div className="mt-2">
                    <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect
                        ? '✅ Đáp án đúng!'
                        : `❌ Sai rồi! Đáp án đúng là: ${correctAnswer}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
          {!isSubmitted ? (
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
            </>
          )}
        </div>

        <div ref={bottomRef}></div>
      </div>
    </div>
  );
};

export default QuizPopup;
