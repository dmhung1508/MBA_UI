import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const QuizPopup = ({ isOpen, onClose, apiUrl, onRequestExplanation }) => {
  if (!isOpen) return null;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data && data.questions) {
          setQuestions(data.questions);
        } else {
          console.error('API response does not contain questions');
        }
      })
      .catch(error => {
        console.error('Error fetching questions:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [apiUrl]);

  const handleOptionChange = (questionIndex, option) => {
    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  };

  const handleSubmit = () => {
    const token = sessionStorage.getItem('access_token');
    setIsSubmitted(true);

    const score = getScore();
    const totalQuestions = questions.length;
    const timestamp = new Date().toISOString();

    const submissionData = {
      timestamp,
      total_questions: totalQuestions,
      correct_answers: score,
      score: (score / totalQuestions) * 100,
      questions: questions.map((q, index) => {
        const correctAnswer = q.answers.find(a => a.isCorrectAnswer === "true");
        const userAnswer = answers[index]
          ? q.answers.find(a => a.answer.charAt(0) === answers[index])?.answer
          : 'Không trả lời';
        return {
          question: q.question,
          user_answer: userAnswer,
          correct_answer: correctAnswer?.answer || '',
          is_correct: userAnswer === correctAnswer?.answer,
        };
      }),
    };

    // Send the submissionData to the backend
    fetch('https://mba.ptit.edu.vn/submit_quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(submissionData),
    })
      .then(response => response.json())
      .then(data => {
        // Handle success
        toast.success('Quiz submission saved successfully');
        // alert('Quiz submission saved successfully');
      })
      .catch(error => {
        // Handle error
        toast.error('Error submitting quiz. Please try again later.');
        // alert('Error submitting quiz. Please try again later.');
      });
  };

  const handleRetry = () => {
    setAnswers({});
    setIsSubmitted(false);
  };

  const getScore = () => {
    return questions.reduce((score, q, index) => {
      const correctAnswer = q.answers.find(a => a.isCorrectAnswer === "true");
      if (correctAnswer && answers[index] === correctAnswer.answer.charAt(0)) {
        return score + 1;
      }
      return score;
    }, 0);
  };

  const handleViewExplanation = (questionIndex) => {
    const question = questions[questionIndex];
    const correctAnswer = question.answers.find(a => a.isCorrectAnswer === "true");
    const userAnswer = answers[questionIndex]
      ? question.answers.find(a => a.answer.charAt(0) === answers[questionIndex])?.answer
      : 'Không trả lời';

    const explanationData = {
      totalQuestions: 1,
      correctAnswers: userAnswer === correctAnswer?.answer ? 1 : 0,
      timestamp: new Date().toISOString(),
      explanations: [{
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer?.answer || '',
        remainingAnswers: question.answers
          .filter(a => a.answer !== userAnswer && a.answer !== correctAnswer?.answer)
          .map(a => a.answer),
        isCorrect: userAnswer === correctAnswer?.answer
      }]
    };

    // Đóng popup
    onClose();

    // Gửi yêu cầu giải thích về Chatbot1
    onRequestExplanation(explanationData);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="bg-white p-6 rounded-lg z-10">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>

      <div
        className="bg-white p-6 rounded-lg z-10 overflow-auto"
        style={{
          maxHeight: '90vh',
          maxWidth: '90vw',
          minWidth: '300px',
          minHeight: '200px',
          resize: 'both',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Bài Trắc Nghiệm</h2>

        {questions.map((q, index) => (
          <div key={index} className="mb-6 p-4 border rounded" id={`question-${index}`}>
            <p className="font-medium">Câu {index + 1}: {q.question}</p>
            <div className="mt-2">
              {q.answers.map((answer, i) => (
                <label
                  key={i}
                  className="block border p-2 rounded-lg cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors mb-2"
                  style={{
                    borderColor: answers[index] === answer.answer.charAt(0) ? 'blue' : 'gray',
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={answer.answer.charAt(0)}
                    disabled={isSubmitted}
                    checked={answers[index] === answer.answer.charAt(0)}
                    onChange={() => handleOptionChange(index, answer.answer.charAt(0))}
                    className="mr-2"
                  />
                  {answer.answer}
                </label>
              ))}
            </div>

            {isSubmitted && (
              <div className="mt-3">
                <p className={`${answers[index] === q.answers.find(a => a.isCorrectAnswer === "true")?.answer.charAt(0) ? 'text-green-600' : 'text-red-600'}`}>
                  {answers[index] === q.answers.find(a => a.isCorrectAnswer === "true")?.answer.charAt(0)
                    ? 'Đáp án đúng!'
                    : `Đáp án sai. Đáp án đúng là ${q.answers.find(a => a.isCorrectAnswer === "true")?.answer}.`}
                </p>

                <button
                  onClick={() => handleViewExplanation(index)}
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                >
                  Xem giải thích
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-2">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Nộp Bài
            </button>
          ) : (
            <>
              <p className="mt-4 font-bold">
                Bạn đã trả lời đúng {getScore()} trên {questions.length} câu hỏi.
              </p>
              <button
                onClick={handleRetry}
                className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Làm Lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPopup;
