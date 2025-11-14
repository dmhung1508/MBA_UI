import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserGraduate,
  faArrowLeft,
  faTrophy,
  faChartLine,
  faClipboardCheck,
  faCalendar,
  faCheckCircle,
  faTimesCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../utils/auth';

const StudentProgress = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/mini/');
      return;
    }
    
    fetchStudentProgress();
  }, [username, navigate]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/teacher/student-progress/${username}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else {
        throw new Error('Failed to fetch student progress');
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
      toast.error('Không thể tải thông tin tiến độ học sinh');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ paddingTop: '100px' }}>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải thông tin học sinh...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ paddingTop: '100px' }}>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Không tìm thấy thông tin học sinh</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/mini/teacher/students')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Quay lại danh sách học sinh
        </button>

        {/* Student Info Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mr-4">
                {progress.full_name?.charAt(0).toUpperCase() || progress.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{progress.full_name || 'N/A'}</h1>
                <p className="text-gray-600">@{progress.username}</p>
                <p className="text-sm text-gray-500">{progress.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {progress.topics && progress.topics.length > 0 ? (
                progress.topics.map((topic, index) => (
                  <span key={index} className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Chưa có chủ đề</span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Submissions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng bài đã làm</p>
                <p className="text-3xl font-bold text-blue-600">{progress.total_submissions || 0}</p>
              </div>
              <FontAwesomeIcon icon={faClipboardCheck} className="text-4xl text-blue-200" />
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Điểm trung bình</p>
                <p className="text-3xl font-bold text-green-600">{progress.average_score?.toFixed(1) || 0}</p>
              </div>
              <FontAwesomeIcon icon={faTrophy} className="text-4xl text-yellow-200" />
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bài tập bắt buộc</p>
                <p className="text-3xl font-bold text-purple-600">
                  {progress.mandatory_assignments?.filter(a => a.completed).length || 0}/
                  {progress.mandatory_assignments?.length || 0}
                </p>
              </div>
              <FontAwesomeIcon icon={faChartLine} className="text-4xl text-purple-200" />
            </div>
          </div>
        </div>

        {/* Mandatory Assignments */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            <FontAwesomeIcon icon={faClipboardCheck} className="mr-2 text-purple-600" />
            Bài Tập Bắt Buộc
          </h2>
          {progress.mandatory_assignments && progress.mandatory_assignments.length > 0 ? (
            <div className="space-y-3">
              {progress.mandatory_assignments.map((assignment, index) => (
                <div key={index} className={`border-l-4 p-4 rounded-r-lg ${assignment.completed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={assignment.completed ? faCheckCircle : faTimesCircle} 
                          className={`mr-2 ${assignment.completed ? 'text-green-600' : 'text-red-600'}`}
                        />
                        <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                          Deadline: {formatDate(assignment.deadline)}
                        </div>
                        {assignment.completed && (
                          <>
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faClock} className="mr-2" />
                              Hoàn thành: {formatDate(assignment.completed_at)}
                            </div>
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                              Điểm: <span className={`ml-1 font-semibold ${getScoreColor(assignment.score)}`}>{assignment.score}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-semibold ${assignment.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {assignment.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có bài tập bắt buộc nào</p>
          )}
        </div>

        {/* Quiz History */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            <FontAwesomeIcon icon={faChartLine} className="mr-2 text-blue-600" />
            Lịch Sử Làm Bài
          </h2>
          {progress.quiz_history && progress.quiz_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chủ đề
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số câu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progress.quiz_history.map((quiz, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                          {quiz.topic}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(quiz.score)}`}>
                          {quiz.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {quiz.total_questions || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(quiz.submitted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có lịch sử làm bài</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentProgress;
