import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faCalendar,
  faCheckCircle,
  faUsers,
  faTimes,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../utils/auth';

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [teacherTopics, setTeacherTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    num_questions: 10,
    passing_score: 70,
    time_limit: '',
    assigned_to: [],
    deadline: '',
    is_mandatory: true,
    question_indices: null
  });

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/mini/');
      return;
    }
    
    fetchTeacherTopics();
    fetchAssignments();
    fetchStudents();
  }, [navigate]);

  const fetchTeacherTopics = async () => {
    try {
      const response = await fetchWithAuth('https://api.dinhmanhhung.net/auth_mini/teacher/my-topics', {
        method: 'GET',
        headers: { 'accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setTeacherTopics(data.assigned_topics || []);
      }
    } catch (err) {
      console.error('Error fetching teacher topics:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetchWithAuth('https://api.dinhmanhhung.net/auth_mini/teacher/students', {
        method: 'GET',
        headers: { 'accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('https://api.dinhmanhhung.net/auth_mini/teacher/assignments?only_mine=true', {
        method: 'GET',
        headers: { 'accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
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

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetchWithAuth('https://api.dinhmanhhung.net/auth_mini/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Tạo bài tập thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchAssignments();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast.error('Không thể tạo bài tập: ' + err.message);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/teacher/assignments/${selectedAssignment._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            deadline: formData.deadline,
            assigned_to: formData.assigned_to
          })
        }
      );

      if (response.ok) {
        toast.success('Cập nhật bài tập thành công!');
        setShowEditModal(false);
        resetForm();
        fetchAssignments();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast.error('Không thể cập nhật bài tập: ' + err.message);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
    
    try {
      const response = await fetchWithAuth(
        `https://api.dinhmanhhung.net/auth_mini/teacher/assignments/${assignmentId}`,
        {
          method: 'DELETE',
          headers: { 'accept': 'application/json' }
        }
      );

      if (response.ok) {
        toast.success('Xóa bài tập thành công!');
        fetchAssignments();
      } else {
        throw new Error('Failed to delete assignment');
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Không thể xóa bài tập');
    }
  };

  const handleViewSubmissions = (assignmentId) => {
    navigate(`/teacher/assignments/${assignmentId}/submissions`);
  };

  const handleEditClick = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      topic: assignment.topic,
      num_questions: assignment.num_questions || 10,
      passing_score: assignment.passing_score || 70,
      time_limit: assignment.time_limit || '',
      assigned_to: assignment.assigned_to || [],
      deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : '',
      is_mandatory: assignment.is_mandatory,
      question_indices: assignment.question_indices || null
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      topic: '',
      num_questions: 10,
      passing_score: 70,
      time_limit: '',
      assigned_to: [],
      deadline: '',
      is_mandatory: true,
      question_indices: null
    });
    setSelectedAssignment(null);
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

  const handleAssignedToChange = (value, checked) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: checked 
        ? [...prev.assigned_to, value]
        : prev.assigned_to.filter(v => v !== value)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <FontAwesomeIcon icon={faClipboardList} className="mr-3 text-purple-600" />
                Quản Lý Bài Tập
              </h1>
              <p className="text-gray-600">Tạo và quản lý bài tập bắt buộc cho học sinh</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-semibold"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Tạo bài tập mới
            </button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Đang tải danh sách bài tập...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faClipboardList} className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-600">Chưa có bài tập nào</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Tạo bài tập đầu tiên
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{assignment.title}</h3>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
                            {assignment.topic}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-600">{assignment.num_questions || 10} câu hỏi</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold text-green-600">Đạt: {assignment.passing_score || 70}%</span>
                        </div>
                        {assignment.time_limit && (
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faClock} className="mr-1" />
                            {assignment.time_limit} phút
                          </div>
                        )}
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                          {formatDate(assignment.deadline)}
                        </div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-600" />
                          {assignment.completed_count || 0} đã hoàn thành
                        </div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUsers} className="mr-2" />
                          Giao cho: {assignment.assigned_to?.join(', ') || 'Chưa giao'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewSubmissions(assignment._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem bài nộp"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEditClick(assignment)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tạo Bài Tập Mới</h2>
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ví dụ: Bài tập Marketing tuần 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Mô tả chi tiết về bài tập..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chủ đề (Topic) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Chọn chủ đề</option>
                      {teacherTopics.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số câu hỏi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="50"
                        value={formData.num_questions}
                        onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ random câu hỏi từ topic</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Điểm đạt (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={formData.passing_score}
                        onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="70"
                      />
                      <p className="text-xs text-gray-500 mt-1">Điểm tối thiểu để đạt</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian làm bài (phút)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.time_limit}
                        onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? parseInt(e.target.value) : '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Không giới hạn"
                      />
                      <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giao cho <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="assign-all"
                          checked={formData.assigned_to.includes('all')}
                          onChange={(e) => handleAssignedToChange('all', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="assign-all" className="font-semibold text-blue-600">
                          Tất cả học sinh
                        </label>
                      </div>
                      
                      {teacherTopics.map((topic) => (
                        <div key={topic} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`topic-${topic}`}
                            checked={formData.assigned_to.includes(topic)}
                            onChange={(e) => handleAssignedToChange(topic, e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`topic-${topic}`} className="text-purple-600">
                            Topic: {topic}
                          </label>
                        </div>
                      ))}

                      {students.map((student) => (
                        <div key={student.username} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`student-${student.username}`}
                            checked={formData.assigned_to.includes(student.username)}
                            onChange={(e) => handleAssignedToChange(student.username, e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`student-${student.username}`}>
                            {student.full_name || student.username}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Tạo bài tập
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal - Similar to Create but with update handler */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Bài Tập</h2>
                <button
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <form onSubmit={handleUpdateAssignment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chủ đề (Topic) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Chọn chủ đề</option>
                      {teacherTopics.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FontAwesomeIcon icon={faQuestionCircle} className="mr-2 text-purple-600" />
                        Số câu hỏi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="50"
                        value={formData.num_questions}
                        onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Điểm đạt (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={formData.passing_score}
                        onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-purple-600" />
                        Giới hạn thời gian (phút)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.time_limit}
                        onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? parseInt(e.target.value) : '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Không giới hạn"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giao cho
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="edit-assign-all"
                          checked={formData.assigned_to.includes('all')}
                          onChange={(e) => handleAssignedToChange('all', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="edit-assign-all" className="font-semibold text-blue-600">
                          Tất cả học sinh
                        </label>
                      </div>
                      
                      {teacherTopics.map((topic) => (
                        <div key={topic} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`edit-topic-${topic}`}
                            checked={formData.assigned_to.includes(topic)}
                            onChange={(e) => handleAssignedToChange(topic, e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`edit-topic-${topic}`} className="text-purple-600">
                            Topic: {topic}
                          </label>
                        </div>
                      ))}

                      {students.map((student) => (
                        <div key={student.username} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`edit-student-${student.username}`}
                            checked={formData.assigned_to.includes(student.username)}
                            onChange={(e) => handleAssignedToChange(student.username, e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`edit-student-${student.username}`}>
                            {student.full_name || student.username}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TeacherAssignments;
