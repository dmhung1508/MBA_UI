import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faCheckCircle,
  faArrowLeft,
  faArrowRight,
  faPaperPlane,
  faExclamationTriangle,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Navbar from './Navbar';
import Footer from './Footer';
import { fetchWithAuth } from '../utils/auth';

const StudentTakeAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch questions for this assignment (bao gồm cả assignment details)
      const questionsResponse = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/student/assignments/${assignmentId}/questions`
      );

      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await questionsResponse.json();
      
      // Set assignment details
      setAssignment({
        _id: data.assignment_id,
        title: data.title,
        description: data.description,
        topic: data.topic,
        num_questions: data.num_questions,
        passing_score: data.passing_score,
        time_limit: data.time_limit,
        deadline: data.deadline
      });
      
      // Set questions
      setQuestions(data.questions);

      // Initialize timer if time limit is set
      if (data.time_limit) {
        setTimeLeft(data.time_limit * 60); // Convert minutes to seconds
      }

    } catch (err) {
      console.error('Error fetching assignment:', err);
      toast.error('Không thể tải bài tập');
      navigate('/student/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleAutoSubmit = async () => {
    toast.warning('Hết thời gian! Tự động nộp bài...');
    await submitAssignment();
  };

  const handleSubmitClick = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      setShowSubmitConfirm(true);
    } else {
      submitAssignment();
    }
  };

  const submitAssignment = async () => {
    try {
      setSubmitting(true);
      
      // Calculate time taken
      const timeTaken = assignment.time_limit 
        ? (assignment.time_limit * 60 - timeLeft) 
        : 0;

      // Prepare submission data theo format API mới
      const submissionData = {
        assignment_id: assignmentId,
        answers: questions.map((q, idx) => ({
          assignment_index: q.assignment_index,
          answer: answers[idx] || null
        })),
        time_taken: timeTaken
      };

      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/submit_assignment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success('Nộp bài thành công!');
        navigate(`/student/assignments/${assignmentId}/result`);
      } else {
        throw new Error('Failed to submit assignment');
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      toast.error('Không thể nộp bài. Vui lòng thử lại');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return 'Không giới hạn';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft === null) return 'text-gray-600';
    if (timeLeft < 60) return 'text-red-600 font-bold animate-pulse';
    if (timeLeft < 300) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  if (!assignment || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy bài tập</p>
          <button
            onClick={() => navigate('/student/assignments')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Timer */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{assignment.title}</h1>
              <p className="text-gray-600">{assignment.description}</p>
            </div>
            {assignment.time_limit && (
              <div className={`text-center px-6 py-3 bg-gray-50 rounded-lg ${getTimeColor()}`}>
                <FontAwesomeIcon icon={faClock} className="mr-2" />
                <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
                <p className="text-xs text-gray-500 mt-1">Thời gian còn lại</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Tiến độ: {answeredCount}/{questions.length} câu</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Câu {currentQuestionIndex + 1}/{questions.length}
                  </h2>
                  {answers[currentQuestionIndex] && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                      Đã trả lời
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-lg mb-6">{currentQuestion.question}</p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.choices?.map((choice, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      answers[currentQuestionIndex] === choice
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={choice}
                      checked={answers[currentQuestionIndex] === choice}
                      onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                      className="mr-3 w-5 h-5 text-purple-600"
                    />
                    <span className="text-gray-700">{choice}</span>
                  </label>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    currentQuestionIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Câu trước
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitClick}
                    disabled={submitting}
                    className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Câu tiếp
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <FontAwesomeIcon icon={faQuestionCircle} className="mr-2 text-purple-600" />
                Danh sách câu hỏi
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`aspect-square rounded-lg font-medium transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                        : answers[index]
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-600 rounded"></div>
                  <span className="text-gray-600">Câu hiện tại</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <span className="text-gray-600">Chưa trả lời</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-6xl text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận nộp bài</h2>
              <p className="text-gray-600">
                Bạn đã trả lời {answeredCount}/{questions.length} câu hỏi.
              </p>
              {answeredCount < questions.length && (
                <p className="text-red-600 font-medium mt-2">
                  Còn {questions.length - answeredCount} câu chưa trả lời!
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={submitAssignment}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default StudentTakeAssignment;
