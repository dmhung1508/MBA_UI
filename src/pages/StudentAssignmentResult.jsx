import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faArrowLeft,
  faChartBar,
  faQuestionCircle,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Navbar from './Navbar';
import Footer from './Footer';
import { fetchWithAuth } from '../utils/auth';

const StudentAssignmentResult = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [assignmentId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const username = sessionStorage.getItem('username');
      
      // Fetch assignment submission result
      // API sẽ trả về cả assignment details và submission details
      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/student/assignments/${assignmentId}/result`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch result');
      }

      const data = await response.json();
      
      // Set assignment từ data trả về
      setAssignment({
        _id: assignmentId,
        title: data.assignment_title || 'Bài tập',
        description: data.assignment_description || '',
        topic: data.topic || '',
        passing_score: data.passing_score || 70,
        time_limit: data.time_limit
      });
      
      // Set result từ submission
      setResult({
        score: data.score,
        passed: data.passed,
        correct_answers: data.correct_answers,
        total_questions: data.total_questions,
        time_taken: data.time_taken,
        submitted_at: data.submitted_at,
        detailed_results: data.detailed_results || []
      });

    } catch (err) {
      console.error('Error fetching result:', err);
      toast.error('Không thể tải kết quả bài làm');
      navigate('/student/assignments');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!result || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy kết quả</p>
          <button
            onClick={() => navigate('/mini/student/assignments')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const passed = result.score >= assignment.passing_score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/assignments')}
          className="mb-6 flex items-center text-purple-600 hover:text-purple-700 font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Quay lại danh sách bài tập
        </button>

        {/* Assignment Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{assignment.title}</h1>
          <p className="text-gray-600">{assignment.description}</p>
        </div>

        {/* Result Summary Card */}
        <div className={`bg-gradient-to-r ${getScoreBgColor(result.score)} rounded-lg shadow-lg p-8 mb-6 text-white`}>
          <div className="text-center">
            <FontAwesomeIcon 
              icon={passed ? faTrophy : faTimesCircle} 
              className="text-6xl mb-4 opacity-90" 
            />
            <h2 className="text-3xl font-bold mb-2">
              {passed ? 'Chúc mừng! Bạn đã đạt' : 'Chưa đạt yêu cầu'}
            </h2>
            <p className="text-xl mb-4">
              Điểm của bạn: <span className="font-bold text-4xl">{result.score.toFixed(1)}%</span>
            </p>
            <p className="text-lg opacity-90">
              Điểm đạt: {assignment.passing_score}%
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-green-500" />
              <span className="text-3xl font-bold text-green-600">{result.correct_answers}</span>
            </div>
            <p className="text-gray-600">Câu đúng</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faTimesCircle} className="text-3xl text-red-500" />
              <span className="text-3xl font-bold text-red-600">
                {result.total_questions - result.correct_answers}
              </span>
            </div>
            <p className="text-gray-600">Câu sai</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faQuestionCircle} className="text-3xl text-blue-500" />
              <span className="text-3xl font-bold text-blue-600">{result.total_questions}</span>
            </div>
            <p className="text-gray-600">Tổng số câu</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faClock} className="text-3xl text-purple-500" />
              <span className="text-xl font-bold text-purple-600">
                {Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <p className="text-gray-600">Thời gian làm bài</p>
          </div>
        </div>

        {/* Submission Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin nộp bài</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <div>
              <span className="font-medium">Thời gian nộp:</span>{' '}
              {formatDate(result.submitted_at)}
            </div>
            <div>
              <span className="font-medium">Thời gian làm bài:</span>{' '}
              {formatTime(result.time_taken)}
            </div>
            <div>
              <span className="font-medium">Chủ đề:</span>{' '}
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                {assignment.topic}
              </span>
            </div>
            <div>
              <span className="font-medium">Trạng thái:</span>{' '}
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {passed ? 'Đạt' : 'Không đạt'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Results Toggle */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => setShowDetailedResults(!showDetailedResults)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faChartBar} className="mr-2 text-purple-600" />
              Chi tiết từng câu hỏi
            </h3>
            <FontAwesomeIcon 
              icon={showDetailedResults ? faTimesCircle : faCheckCircle} 
              className="text-purple-600"
            />
          </button>

          {showDetailedResults && result.detailed_results && (
            <div className="mt-6 space-y-4">
              {result.detailed_results.map((item, index) => {
                const isCorrect = item.is_correct;
                return (
                  <div 
                    key={index}
                    className={`border-2 rounded-lg p-4 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 flex-1">
                        Câu {index + 1}: {item.question}
                      </h4>
                      <FontAwesomeIcon 
                        icon={isCorrect ? faCheck : faTimes}
                        className={`text-2xl ml-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="font-medium text-gray-700 mr-2">Câu trả lời của bạn:</span>
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {item.user_answer || '(Không trả lời)'}
                        </span>
                      </div>

                      {!isCorrect && (
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2">Đáp án đúng:</span>
                          <span className="text-green-700 font-semibold">
                            {item.correct_answer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!passed && (
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <FontAwesomeIcon icon={faTimesCircle} className="text-4xl text-yellow-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Bạn chưa đạt điểm yêu cầu
            </h3>
            <p className="text-gray-600 mb-4">
              Hãy ôn tập thêm và thử lại nếu giáo viên cho phép làm lại bài tập này.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default StudentAssignmentResult;
