import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faCalendar, 
  faClock,
  faCheckCircle,
  faExclamationCircle,
  faPlayCircle,
  faEye,
  faQuestionCircle,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Navbar from './Navbar';
import Footer from './Footer';
import { fetchWithAuth } from '../utils/auth';

const StudentAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    avgScore: 0
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/student/assignments`
      );

      if (response.ok) {
        const result = await response.json();
        // API trả về object với assignments array
        const assignmentsData = result.assignments || [];
        setAssignments(assignmentsData);
        calculateStats(assignmentsData);
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      toast.error('Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const completed = data.filter(a => a.status === 'completed').length;
    const pending = total - completed;
    const completedAssignments = data.filter(a => a.status === 'completed');
    const avgScore = completedAssignments.length > 0
      ? (completedAssignments.reduce((sum, a) => sum + (a.submission?.score || a.score || 0), 0) / completedAssignments.length).toFixed(1)
      : 0;

    setStats({ total, pending, completed, avgScore });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không có deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getStatusBadge = (assignment) => {
    if (assignment.status === 'completed') {
      const submissionScore = assignment.submission?.score || assignment.score || 0;
      const passed = assignment.submission?.passed || (submissionScore >= assignment.passing_score);
      return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          passed 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {passed ? 'Đã đạt' : 'Chưa đạt'} - {submissionScore.toFixed(1)}%
        </span>
      );
    }

    if (isOverdue(assignment.deadline)) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
          Quá hạn
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
        Chưa làm
      </span>
    );
  };

  const handleStartAssignment = (assignmentId) => {
    navigate(`/student/assignments/${assignmentId}/take`);
  };

  const handleViewResult = (assignmentId) => {
    navigate(`/student/assignments/${assignmentId}/result`);
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'pending') return assignment.status !== 'completed';
    if (filter === 'completed') return assignment.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <FontAwesomeIcon icon={faClipboardList} className="mr-3 text-purple-600" />
            Bài Tập Của Tôi
          </h1>
          <p className="text-gray-600">Danh sách các bài tập được giao từ giáo viên</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng bài tập</p>
                <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-purple-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chưa làm</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FontAwesomeIcon icon={faExclamationCircle} className="text-4xl text-yellow-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã hoàn thành</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Điểm TB</p>
                <p className="text-3xl font-bold text-blue-600">{stats.avgScore}%</p>
              </div>
              <FontAwesomeIcon icon={faTrophy} className="text-4xl text-blue-200" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chưa làm ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Đã hoàn thành ({stats.completed})
            </button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-lg">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faClipboardList} className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">
                {filter === 'all' && 'Chưa có bài tập nào'}
                {filter === 'pending' && 'Không có bài tập chưa làm'}
                {filter === 'completed' && 'Chưa hoàn thành bài tập nào'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => (
                <div key={assignment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
                            {assignment.topic}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faQuestionCircle} className="mr-2 text-purple-600" />
                          {assignment.num_questions} câu hỏi
                        </div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faTrophy} className="mr-2 text-green-600" />
                          Đạt: {assignment.passing_score}%
                        </div>
                        {assignment.time_limit && (
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faClock} className="mr-2 text-blue-600" />
                            {assignment.time_limit} phút
                          </div>
                        )}
                        <div className={`flex items-center ${
                          isOverdue(assignment.deadline) ? 'text-red-600 font-semibold' : ''
                        }`}>
                          <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                          {formatDate(assignment.deadline)}
                        </div>
                        {assignment.is_mandatory && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold">
                            BẮT BUỘC
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {assignment.status === 'completed' ? (
                        <button
                          onClick={() => handleViewResult(assignment._id)}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          Xem kết quả
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartAssignment(assignment._id)}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          disabled={isOverdue(assignment.deadline)}
                        >
                          <FontAwesomeIcon icon={faPlayCircle} />
                          Làm bài
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentAssignments;
