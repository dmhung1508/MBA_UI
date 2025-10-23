import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

function Test() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem('testAnswers');
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem('timeLeft');
    return savedTime ? parseInt(savedTime) : 30 * 60;
  });
  const [timerActive, setTimerActive] = useState(false);
  const [testStarted, setTestStarted] = useState(() => {
    return localStorage.getItem('testStarted') === 'true';
  });

  // *** NEW: Lưu lại thời gian đã dùng sau khi nộp, và cờ testCompleted
  const [finalTimeUsed, setFinalTimeUsed] = useState(0);

  useEffect(() => {
    fetchQuestions();

    // Check if test was already started
    if (!testStarted) {
      localStorage.setItem('timeLeft', (30 * 60).toString());
      localStorage.setItem('testStarted', 'true');
      setTestStarted(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('testAnswers', JSON.stringify(answers));
  }, [answers]);

  // *** NEW: Kiểm tra xem đã nộp bài chưa -> nếu có, hiển thị ngay trang kết quả
  useEffect(() => {
    const completed = localStorage.getItem('testCompleted');
    if (completed === 'true') {
      setShowResults(true);
      setTimerActive(false);

      // Lấy finalScore, finalTimeUsed từ localStorage nếu có
      const storedFinalScore = localStorage.getItem('finalScore');
      const storedFinalTimeUsed = localStorage.getItem('finalTimeUsed');
      if (storedFinalScore) setScore(parseInt(storedFinalScore));
      if (storedFinalTimeUsed) setFinalTimeUsed(parseInt(storedFinalTimeUsed));
    }
  }, []);

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev <= 1 ? 0 : prev - 1;
          localStorage.setItem('timeLeft', newTime.toString());
          if (newTime === 0) {
            handleSubmit();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('https://mba.ptit.edu.vn/api/random-questions?topic=mcl');
      setQuestions(response.data.questions);
      setLoading(false);
      setTimerActive(true);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionIndex]: answer
      };
      localStorage.setItem('testAnswers', JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  // *** ADDED LOGIC: Tính score, thời gian đã làm, lưu localStorage, gửi backend
  const handleSubmit = () => {
    setTimerActive(false);
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      const selectedAnswer = answers[index];
      const correctAnswer = question.answers.find(a => a.isCorrectAnswer === "true");
      if (selectedAnswer === correctAnswer.answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);

    // Tính thời gian đã sử dụng = 30p - timeLeft
    const timeUsed = (30 * 60) - timeLeft;
    setFinalTimeUsed(timeUsed);

    setShowResults(true);

    // Lưu cờ đã nộp bài và các thông tin vào localStorage
    localStorage.setItem('testCompleted', 'true');
    localStorage.setItem('finalScore', correctAnswers.toString());
    localStorage.setItem('finalTimeUsed', timeUsed.toString());

    // Clear localStorage (những gì không cần nữa)
    localStorage.removeItem('timeLeft');
    localStorage.removeItem('testAnswers');
    localStorage.removeItem('testStarted');

    // Gửi kết quả bài làm sang backend
    handleSubmitQuiz(correctAnswers);
  };

  // *** ADDED LOGIC: Gửi kết quả bài làm tới backend
  const handleSubmitQuiz = async (correctAnswers) => {
    // Tạo payload gửi lên
    const quizPayload = {
      timestamp: new Date().toISOString(),
      total_questions: questions.length,
      correct_answers: correctAnswers,
      score: (correctAnswers / questions.length) * 10,
      questions: questions.map((q, idx) => {
        const correctObj = q.answers.find(a => a.isCorrectAnswer === "true");
        return {
          question: q.question,
          user_answer: answers[idx],
          correct_answer: correctObj ? correctObj.answer : "",
          is_correct: answers[idx] === (correctObj ? correctObj.answer : "")
        };
      }),
      quizType: 'entryTest'
    };

    try {
      // Lấy token từ đâu đó, ví dụ localStorage
      const token = localStorage.getItem('access_token');

      const response = await fetch('https://mba.ptit.edu.vn/auth_mini/submit_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(quizPayload)
      });

      const data = await response.json();
      console.log('Kết quả lưu quiz:', data);
      // Xử lý kết quả trả về ...
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const scrollToQuestion = (index) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 pt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Giữ nguyên style của bạn ---
  const styles = {
    questionCard: {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      border: 'none',
      marginBottom: '1.5rem',
      background: '#fff',
      transition: 'transform 0.2s'
    },
    questionHeader: {
      background: 'linear-gradient(45deg, #2b6cb0, #4299e1)',
      color: 'white',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      padding: '1rem'
    },
    answerContainer: {
      padding: '1.5rem'
    },
    radioLabel: {
      cursor: 'pointer',
      padding: '0.75rem',
      borderRadius: '8px',
      transition: 'background-color 0.2s'
    },
    navigationCard: {
      position: 'sticky',
      top: '100px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      border: 'none'
    },
    navigationButton: {
      borderRadius: '8px',
      transition: 'all 0.3s',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    submitButton: {
      background: 'linear-gradient(45deg, #2b6cb0, #4299e1)',
      border: 'none',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s'
    }
  };

  const answeredButtonStyle = {
    background: 'linear-gradient(45deg, #38a169, #48bb78)',
    color: 'white',
    border: 'none'
  };

  const unansweredButtonStyle = {
    background: 'linear-gradient(45deg, #e53e3e, #f56565)',
    color: 'white',
    border: 'none'
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid" style={{ marginTop: '100px', paddingBottom: '60px' }}>
        {!showResults ? (
          <div className="row">
            <div className="col-md-9">
              <div className="card mb-4" style={styles.questionCard}>
                <div className="card-header" style={styles.questionHeader}>
                  <h4 className="mb-0">
                    Bài kiểm tra đầu vào
                  </h4>
                </div>
              </div>

              {questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  id={`question-${questionIndex}`}
                  className="card mb-4"
                  style={styles.questionCard}
                >
                  <div className="card-header" style={styles.questionHeader}>
                    <h5 className="mb-0">Câu {questionIndex + 1}</h5>
                  </div>
                  <div className="card-body" style={styles.answerContainer}>
                    <p className="question-text mb-4">{question.question}</p>
                    <div className="answers">
                      {question.answers.map((answer, answerIndex) => (
                        <div
                          className="form-check mb-3 p-3 border rounded"
                          key={answerIndex}
                          style={{
                            backgroundColor: answers[questionIndex] === answer.answer
                              ? '#f8f9fa'
                              : 'white',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`question${questionIndex}`}
                            id={`question${questionIndex}answer${answerIndex}`}
                            checked={answers[questionIndex] === answer.answer}
                            onChange={() => handleAnswer(questionIndex, answer.answer)}
                          />
                          <label
                            className="form-check-label w-100"
                            htmlFor={`question${questionIndex}answer${answerIndex}`}
                            style={styles.radioLabel}
                          >
                            {answer.answer}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button
                className="btn btn-lg w-100"
                onClick={handleSubmit}
                style={{
                  ...styles.submitButton,
                  borderRadius: '12px',
                  padding: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Nộp bài
              </button>
            </div>

            <div className="col-md-3">
              <div className="card" style={styles.navigationCard}>
                <div className="card-header" style={styles.questionHeader}>
                  <h5 className="mb-0 d-flex justify-content-between align-items-center">
                    <span>Danh sách câu hỏi</span>
                    <span className="badge bg-light text-dark">
                      {formatTime(timeLeft)}
                    </span>
                  </h5>
                </div>
                <div className="card-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  <div className="row g-2">
                    {questions.map((_, index) => (
                      <div className="col-4" key={index}>
                        <button
                          className="btn btn-sm w-100"
                          onClick={() => scrollToQuestion(index)}
                          style={{
                            ...styles.navigationButton,
                            ...(answers[index] ? answeredButtonStyle : unansweredButtonStyle)
                          }}
                        >
                          {index + 1}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // *** Trang Kết Quả sau khi nộp bài
          <div className="card" style={styles.questionCard}>
            <div className="card-header" style={styles.questionHeader}>
              <h4 className="mb-0">Kết quả bài kiểm tra</h4>
            </div>
            <div className="card-body p-4">
              <h5 className="mb-3">Số câu đúng: {score}/{questions.length}</h5>
              <h5>Điểm: {((score / questions.length) * 10).toFixed(2)}</h5>

              {/*
                finalTimeUsed là số giây đã sử dụng:
                30 phút = 1800 giây -> finalTimeUsed = 1800 - timeLeft (lúc nộp)
              */}
              <h5>Thời gian làm bài: {formatTime(finalTimeUsed)}</h5>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Test;
