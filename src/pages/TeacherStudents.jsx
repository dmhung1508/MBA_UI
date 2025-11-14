import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faEye, 
  faTrophy,
  faChartLine,
  faSearch,
  faFilter,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../utils/auth';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [teacherTopics, setTeacherTopics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/mini/');
      return;
    }
    
    fetchTeacherTopics();
    fetchStudents();
  }, [navigate]);

  const fetchTeacherTopics = async () => {
    try {
      const response = await fetchWithAuth('https://api.dinhmanhhung.net/auth_mini/teacher/my-topics', {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeacherTopics(data.assigned_topics || []);
      }
    } catch (err) {
      console.error('Error fetching teacher topics:', err);
    }
  };

  const fetchStudents = async (topic = '') => {
    try {
      setLoading(true);
      const url = topic 
        ? `https://api.dinhmanhhung.net/auth_mini/teacher/students?topic=${encodeURIComponent(topic)}`
        : 'https://api.dinhmanhhung.net/auth_mini/teacher/students';
      
      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Không thể tải danh sách học sinh');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicFilter = (topic) => {
    setSelectedTopic(topic);
    fetchStudents(topic);
  };

  const handleViewProgress = (username) => {
    navigate(`/mini/teacher/student-progress/${username}`);
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.username?.toLowerCase().includes(searchLower) ||
      student.full_name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <FontAwesomeIcon icon={faUsers} className="mr-3 text-blue-600" />
                Quản Lý Học Sinh
              </h1>
              <p className="text-gray-600">Xem danh sách và theo dõi tiến độ học tập của học sinh</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{students.length}</div>
              <div className="text-sm text-gray-600">Tổng học sinh</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Tìm kiếm học sinh
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, username, email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Topic Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                Lọc theo chủ đề
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => handleTopicFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả chủ đề</option>
                {teacherTopics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải danh sách học sinh...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faUserGraduate} className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-600">Không tìm thấy học sinh nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Học sinh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chủ đề
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.username} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                              {student.full_name?.charAt(0).toUpperCase() || student.username?.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">@{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {student.topics && student.topics.length > 0 ? (
                            student.topics.map((topic, index) => (
                              <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {topic}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Chưa có chủ đề</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewProgress(student.username)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-2" />
                          Xem tiến độ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TeacherStudents;
