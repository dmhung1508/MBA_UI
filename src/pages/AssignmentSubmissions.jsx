import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faClipboardCheck,
  faCheckCircle,
  faTimesCircle,
  faTrophy,
  faCalendar,
  faClock,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../utils/auth';

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/mini/');
      return;
    }
    
    fetchSubmissions();
  }, [assignmentId, navigate]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/teacher/assignments/${assignmentId}/submissions`,
        {
          method: 'GET',
          headers: { 'accept': 'application/json' }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        throw new Error('Failed to fetch submissions');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Không thể tải danh sách bài nộp');
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

  const getPassedBadge = (passed) => {
    if (passed) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Đạt</span>;
    }
    return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Không đạt</span>;
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Đang tải thông tin bài nộp...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Không tìm thấy thông tin bài tập</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/mini/teacher/assignments')}
          className="mb-6 flex items-center text-purple-600 hover:text-purple-700 font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Quay lại danh sách bài tập
        </button>

        {/* Assignment Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            <FontAwesomeIcon icon={faClipboardCheck} className="mr-3 text-purple-600" />
            {data.assignment.title}
          </h1>
          <p className="text-gray-600 mb-4">{data.assignment.description}</p>
          
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center text-gray-600">
              <FontAwesomeIcon icon={faCalendar} className="mr-2" />
              Deadline: {formatDate(data.assignment.deadline)}
            </div>
            <div className="flex items-center">
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
                {data.completion_rate}
              </span>
              <span className="ml-2 text-gray-600">đã hoàn thành</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã nộp</p>
                <p className="text-3xl font-bold text-green-600">{data.submissions?.length || 0}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chưa nộp</p>
                <p className="text-3xl font-bold text-red-600">{data.pending_students?.length || 0}</p>
              </div>
              <FontAwesomeIcon icon={faTimesCircle} className="text-4xl text-red-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Điểm TB</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data.submissions?.length > 0 
                    ? (data.submissions.reduce((sum, s) => sum + s.score, 0) / data.submissions.length).toFixed(1)
                    : 0
                  }
                </p>
              </div>
              <FontAwesomeIcon icon={faTrophy} className="text-4xl text-yellow-200" />
            </div>
          </div>
        </div>

        {/* Submitted Assignments */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-600" />
            Đã Nộp Bài ({data.submissions?.length || 0})
          </h2>
          
          {data.submissions && data.submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Học sinh
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kết quả
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số câu đúng
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian làm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian nộp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.submissions.map((submission, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold mr-3">
                            {submission.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{submission.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(submission.score)}`}>
                          {submission.score.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPassedBadge(submission.passed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="font-medium text-gray-900">
                          {submission.correct_answers || 0}/{submission.total_questions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        <FontAwesomeIcon icon={faClock} className="mr-1" />
                        {formatTime(submission.time_taken)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(submission.submitted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có học sinh nào nộp bài</p>
          )}
        </div>

        {/* Pending Students */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-2 text-red-600" />
            Chưa Nộp Bài ({data.pending_students?.length || 0})
          </h2>
          
          {data.pending_students && data.pending_students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.pending_students.map((student, index) => (
                <div key={index} className="flex items-center p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center text-white font-bold mr-3">
                    {student.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.full_name || student.username}</p>
                    <p className="text-sm text-red-600">{student.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Tất cả học sinh đã nộp bài</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AssignmentSubmissions;
