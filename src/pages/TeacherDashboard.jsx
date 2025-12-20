import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
  FaChalkboardTeacher,
  FaBookOpen,
  FaQuestionCircle,
  FaFileAlt,
  FaUserGraduate,
  FaStar,
  FaCheck,
  FaExclamationTriangle,
  FaEdit,
  FaComments,
  FaClipboardList
} from 'react-icons/fa';

const TeacherDashboard = () => {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const colors = {
    primary: '#dc2626',
    secondary: '#ff416c',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  // Kiểm tra quyền teacher hoặc admin
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'teacher' && userRole !== 'admin') {
      navigate('/mini/');
      return;
    }
    fetchTeacherInfo();
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchTeacherInfo = async () => {
    try {
      setLoading(true);

      // Fetch teacher's assigned topics
      const teacherResponse = await fetch(API_ENDPOINTS.TEACHER_MY_TOPICS, {
        headers: getAuthHeaders()
      });

      if (!teacherResponse.ok) {
        throw new Error('Không thể tải thông tin teacher');
      }

      const teacherData = await teacherResponse.json();

      // Fetch all chatbots to get subject names
      const accessToken = localStorage.getItem('access_token');
      const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (chatbotsResponse.ok) {
        const chatbotsData = await chatbotsResponse.json();
        const allChatbots = chatbotsData.chatbots || [];
        setChatbots(allChatbots);

        // Map assigned topics to include subject names
        const assignedTopics = teacherData.assigned_topics || [];
        const enrichedTopics = assignedTopics.map(topicCode => {
          const chatbot = allChatbots.find(cb => cb.source === topicCode);
          return {
            code: topicCode,
            name: chatbot ? chatbot.name : topicCode
          };
        });

        setTeacherInfo({
          ...teacherData,
          enriched_topics: enrichedTopics
        });
      } else {
        // Fallback nếu không lấy được chatbots
        setTeacherInfo(teacherData);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaChalkboardTeacher className="w-8 h-8 mr-3 inline-block align-middle" style={{ color: colors.primary }} />
                Bảng Điều Khiển Giảng Viên
              </h1>
              <p className="text-gray-600">
                Chào mừng {teacherInfo?.name || teacherInfo?.user}!
                {teacherInfo?.role === 'admin' ? ' (Admin có full access)' : ' Quản lý môn học được giao cho bạn'}
              </p>
            </div>
            {/* <div className="text-right">
              <div className="text-sm text-gray-500">Access Level</div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${teacherInfo?.access_level === 'full_access'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {teacherInfo?.access_level === 'full_access' ? 'Full Access' : 'Restricted'}
              </span>
            </div> */}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg mb-6 bg-red-100 border border-red-400 text-red-700">
            <div className="flex justify-between items-center">
              <p>{error}</p>
              <button onClick={clearMessages} className="text-xl font-bold">×</button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <FaBookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Môn Học Được Giao</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherInfo?.enriched_topics?.length || teacherInfo?.assigned_topics?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <FaUserGraduate className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Vai trò</p>
                <p className="text-lg font-bold text-gray-900">
                  {teacherInfo?.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaStar className="w-5 h-5 mr-2 inline-block align-middle" />
            Hành Động Nhanh
          </h3>

          {/* Chỉnh sửa nguồn - Full width button */}
          <a
            href="/mini/edit"
            className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-orange-300 mb-4"
          >
            <div className="text-center">
              <FaEdit className="w-8 h-8 text-orange-600 mb-2 mx-auto" />
              <h4 className="font-medium text-gray-900">Chỉnh sửa nguồn</h4>
              <p className="text-sm text-gray-600">Thử nghiệm, chỉnh sửa AI</p>
            </div>
          </a>

          {/* Other buttons in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/mini/questions"
              className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300"
            >
              <div className="text-center">
                <FaQuestionCircle className="w-8 h-8 text-blue-600 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900">Quản lý Câu hỏi</h4>
                <p className="text-sm text-gray-600">Tạo, sửa, xóa câu hỏi</p>
              </div>
            </a>

            <a
              href="/mini/sources"
              className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-green-300"
            >
              <div className="text-center">
                <FaFileAlt className="w-8 h-8 text-green-600 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900">Quản lý File</h4>
                <p className="text-sm text-gray-600">Upload dữ liệu lên chatbot</p>
              </div>
            </a>



            <a
              href="/mini/messages"
              className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-purple-300"
            >
              <div className="text-center">
                <FaComments className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900">Quản lý Tin nhắn</h4>
                <p className="text-sm text-gray-600">Xem tin nhắn người dùng</p>
              </div>
            </a>

            <a
              href="/mini/teacher/quiz-history"
              className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-indigo-300"
            >
              <div className="text-center">
                <FaClipboardList className="w-8 h-8 text-indigo-600 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900">Lịch Sử Làm Bài</h4>
                <p className="text-sm text-gray-600">Xem lịch sử quiz học sinh</p>
              </div>
            </a>

            {teacherInfo?.role === 'admin' && (
              <>
                <a
                  href="/mini/admin"
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-purple-300"
                >
                  <div className="text-center">
                    <FaChalkboardTeacher className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
                    <h4 className="font-medium text-gray-900">Quản lý Chatbot</h4>
                    <p className="text-sm text-gray-600">Tạo, sửa chatbot</p>
                  </div>
                </a>

                <a
                  href="/mini/users"
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-red-300"
                >
                  <div className="text-center">
                    <FaUserGraduate className="w-8 h-8 text-red-600 mb-2 mx-auto" />
                    <h4 className="font-medium text-gray-900">Quản lý Người dùng</h4>
                    <p className="text-sm text-gray-600">Phân quyền, giao môn học</p>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Assigned Topics */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaBookOpen className="w-5 h-5 mr-2 inline-block align-middle" />
              {teacherInfo?.role === 'admin' ? 'Tất Cả Môn Học' : 'Môn Học Được Giao Cho Bạn'}
            </h3>
          </div>

          <div className="p-6">
            {(teacherInfo?.enriched_topics || teacherInfo?.assigned_topics) &&
              (teacherInfo?.enriched_topics?.length > 0 || teacherInfo?.assigned_topics?.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(teacherInfo.enriched_topics || teacherInfo.assigned_topics || []).map((topic, index) => {
                  // Handle both enriched topics (with name/code) and simple topics (just string)
                  const topicName = typeof topic === 'object' ? topic.name : topic;
                  const topicCode = typeof topic === 'object' ? topic.code : topic;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{topicName}</h4>
                        <div className="flex space-x-2">
                          <a
                            href={`/mini/questions`}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-100"
                            title="Quản lý câu hỏi"
                          >
                            <FaQuestionCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={`/mini/sources`}
                            className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-100"
                            title="Quản lý file"
                          >
                            <FaFileAlt className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="bg-gray-100 rounded px-2 py-1 font-mono text-xs">
                          {topicCode}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaExclamationTriangle className="w-24 h-24 mb-4 text-gray-300 mx-auto" />
                <h3 className="text-xl font-medium mb-2">
                  {teacherInfo?.role === 'admin' ? 'Không có môn học nào' : 'Chưa được giao môn học nào'}
                </h3>
                <p className="text-gray-400">
                  {teacherInfo?.role === 'admin'
                    ? 'Hệ thống chưa có môn học nào được tạo'
                    : 'Liên hệ admin để được giao môn học để quản lý'}
                </p>
              </div>
            )}
          </div>
        </div>


      </div>

      <Footer />
    </div>
  );
};

export default TeacherDashboard;


