import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComments,
  faUsers, 
  faEye, 
  faCalendarAlt, 
  faSearch, 
  faTimes, 
  faUser, 
  faRobot, 
  faChevronLeft, 
  faChevronRight,
  faFilter,
  faEnvelope,
  faClock,
  faHashtag
} from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

const MessageManager = () => {
  const [availableChatbots, setAvailableChatbots] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const colors = {
    primary: '#dc2626',
    secondary: '#ff416c',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(20);
  const [chatPage, setChatPage] = useState(1);
  const [chatLimit] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalChatMessages, setTotalChatMessages] = useState(0);

  // Permission states
  const [userRole, setUserRole] = useState('');
  const [assignedTopics, setAssignedTopics] = useState([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize user role and fetch data
  useEffect(() => {
    const role = localStorage.getItem('user_role') || '';
    setUserRole(role);

    if (role === 'teacher') {
      fetchTeacherTopics();
    } else if (role === 'admin') {
      fetchChatbots();
    }
  }, []);

  // Fetch teacher's assigned topics
  const fetchTeacherTopics = async () => {
    try {
      const response = await fetch('https://mba.ptit.edu.vn/auth_mini/teacher/my-topics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const topics = data.assigned_topics || [];
        console.log('Teacher assigned topics:', topics);
        setAssignedTopics(topics);
        
        // Fetch all chatbots and filter by assigned topics
        const chatbotsResponse = await fetch('https://mba.ptit.edu.vn/auth_mini/chatbots');
        const chatbotsData = await chatbotsResponse.json();
        
        if (chatbotsData.chatbots) {
          const filteredChatbots = chatbotsData.chatbots.filter(cb => 
            topics.includes(cb.source)
          );
          console.log('Filtered chatbots for teacher:', filteredChatbots);
          setAvailableChatbots(filteredChatbots);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher topics:', error);
      setError('Không thể tải danh sách chủ đề được phân công');
    }
  };

  // Fetch all chatbots (for admin)
  const fetchChatbots = async () => {
    try {
      const response = await fetch('https://mba.ptit.edu.vn/auth_mini/chatbots');
      const data = await response.json();
      
      if (data.chatbots) {
        setAvailableChatbots(data.chatbots);
      }
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      setError('Không thể tải danh sách chatbot');
    }
  };

  // Fetch users for selected topic
  const fetchUsers = async (topic, page = 1) => {
    if (!topic) return;

    setIsUsersLoading(true);
    setError('');

    try {
      const offset = (page - 1) * usersLimit;
      const response = await fetch(
        `https://mba.ptit.edu.vn/mba_mini/source/${encodeURIComponent(topic)}/users?limit=${usersLimit}&skip=${offset}`,
        {
          headers: {
            'accept': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok') {
        setUsers(data.users || []);
        setTotalUsers(data.total_users || 0);
        setUsersPage(page);
      } else {
        setError('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Lỗi khi tải danh sách người dùng: ' + error.message);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Fetch chat history for selected user
  const fetchChatHistory = async (userId, source, page = 1) => {
    setIsChatLoading(true);
    setError('');

    try {
      const skip = (page - 1) * chatLimit;
      const token = localStorage.getItem('access_token');
      const headers = {
        'accept': 'application/json',
        'ngrok-skip-browser-warning': '69420'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `https://mba.ptit.edu.vn/auth_mini/mba/chat_history/${encodeURIComponent(userId)}?limit=${chatLimit}&skip=${skip}&source=${encodeURIComponent(source)}`,
        {
          headers: headers
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok') {
        setChatHistory(data.chat_history || []);
        setTotalChatMessages(data.total_returned || 0);
        setChatPage(page);
      } else {
        setChatHistory([]);
        setTotalChatMessages(0);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Lỗi khi tải lịch sử chat: ' + error.message);
      setChatHistory([]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle topic selection
  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
    setUsers([]);
    setUsersPage(1);
    setSearchTerm('');
    if (topic) {
      fetchUsers(topic, 1);
    }
  };

  // Handle view user chat history
  const handleViewChat = (user) => {
    setSelectedUser(user);
    setChatHistory([]);
    setChatPage(1);
    setIsModalOpen(true);
    fetchChatHistory(user.user_id, user.source, 1);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setChatHistory([]);
    setChatPage(1);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate pagination info
  const totalUsersPages = Math.ceil(totalUsers / usersLimit);
  const totalChatPages = Math.ceil(totalChatMessages / chatLimit);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (isUsersLoading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <FontAwesomeIcon icon={faComments} className="mr-3" style={{ color: colors.primary }} />
                Quản lý Tin nhắn
              </h1>
              <p className="text-gray-600">Xem và quản lý tin nhắn của người dùng với chatbot</p>
              {userRole === 'teacher' && (
                <div className="mt-2 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                  <span className="text-sm font-medium text-blue-700">
                    Quyền: Giáo viên ({assignedTopics.length} chủ đề được phân công)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                Chọn chủ đề
              </label>
              <select
                id="topic"
                value={selectedTopic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">-- Chọn chủ đề --</option>
                {availableChatbots.map((chatbot) => (
                  <option key={chatbot.id} value={chatbot.source}>
                    {chatbot.name} ({chatbot.source})
                  </option>
                ))}
              </select>
            </div>

            {selectedTopic && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                    Tìm kiếm
                  </label>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo User ID hoặc nội dung tin nhắn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <div>Tổng: <strong>{totalUsers}</strong> người dùng</div>
                    <div>Đang hiển thị: <strong>{filteredUsers.length}</strong> người dùng</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className={`p-4 rounded-lg mb-6 ${error ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`}>
            <div className="flex justify-between items-center">
              <p>{error || success}</p>
              <button onClick={clearMessages} className="text-xl font-bold">×</button>
            </div>
          </div>
        )}

        {/* Users List */}
        {selectedTopic && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Danh sách Người dùng - {selectedTopic}
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {filteredUsers.length}
                  </span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isUsersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-gray-600">Đang tải danh sách người dùng...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faUsers} className="text-4xl mb-2 text-gray-300" />
                  <p className="text-gray-500 text-lg font-medium">
                    {searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
                  </p>
                  <p className="text-gray-400">
                    {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Người dùng sẽ xuất hiện khi họ chat với chatbot này'}
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Người dùng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tin nhắn đầu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tin nhắn cuối
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thống kê
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user, index) => (
                        <tr key={`${user.user_id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-red-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.user_id}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {user.user_id.slice(0, 20)}{user.user_id.length > 20 ? '...' : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 mr-1 text-gray-400" />
                              {user.first_message}
                            </div>
                            <div className="text-xs text-gray-500">
                              <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                              {formatTimestamp(user.first_timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 mr-1 text-gray-400" />
                              {user.last_message}
                            </div>
                            <div className="text-xs text-gray-500">
                              <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                              {formatTimestamp(user.last_timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex flex-col space-y-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <FontAwesomeIcon icon={faHashtag} className="w-3 h-3 mr-1" />
                                  {user.message_count} tin nhắn
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FontAwesomeIcon icon={faComments} className="w-3 h-3 mr-1" />
                                  {user.session_count} phiên
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center text-xs">
                                <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                                Đầu: {new Date(user.first_timestamp).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="flex items-center text-xs">
                                <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                                Cuối: {new Date(user.last_timestamp).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewChat(user)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-100"
                              title="Xem lịch sử chat"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Users Pagination */}
                  {totalUsersPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => fetchUsers(selectedTopic, usersPage - 1)}
                          disabled={usersPage <= 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <button
                          onClick={() => fetchUsers(selectedTopic, usersPage + 1)}
                          disabled={usersPage >= totalUsersPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{(usersPage - 1) * usersLimit + 1}</span> đến{' '}
                            <span className="font-medium">
                              {Math.min(usersPage * usersLimit, totalUsers)}
                            </span>{' '}
                            trong <span className="font-medium">{totalUsers}</span> người dùng
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => fetchUsers(selectedTopic, usersPage - 1)}
                              disabled={usersPage <= 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" />
                            </button>
                            {[...Array(Math.min(5, totalUsersPages))].map((_, index) => {
                              const pageNumber = Math.max(1, usersPage - 2) + index;
                              if (pageNumber > totalUsersPages) return null;
                              
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => fetchUsers(selectedTopic, pageNumber)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    pageNumber === usersPage
                                      ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => fetchUsers(selectedTopic, usersPage + 1)}
                              disabled={usersPage >= totalUsersPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat History Modal */}
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <FontAwesomeIcon icon={faComments} className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Lịch sử chat: {selectedUser.user_id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        <FontAwesomeIcon icon={faHashtag} className="w-3 h-3 mr-1" />
                        {selectedUser.message_count} tin nhắn • 
                        <FontAwesomeIcon icon={faComments} className="w-3 h-3 ml-2 mr-1" />
                        {selectedUser.session_count} phiên chat
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                {/* Chat History Content */}
                <div className="mt-4" style={{ maxHeight: '60vh', minHeight: '400px' }}>
                  {isChatLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <span className="ml-3 text-gray-600">Đang tải lịch sử chat...</span>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faComments} className="text-4xl mb-2 text-gray-300" />
                      <p className="text-gray-500 text-lg font-medium">Không có tin nhắn nào</p>
                      <p className="text-gray-400">Lịch sử chat sẽ hiển thị ở đây</p>
                    </div>
                  ) : (
                    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                      {chatHistory.reverse().map((chat, index) => (
                        <div key={chat._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          {/* User Message */}
                          <div className="flex items-start space-x-3 mb-4">
                            <div className="flex-shrink-0">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-sm text-gray-900">{chat.message}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                                {formatTimestamp(chat.timestamp)} • Session: {chat.session_id?.slice(0, 8)}...
                              </p>
                            </div>
                          </div>

                          {/* Bot Response */}
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="bg-green-100 p-2 rounded-full">
                                <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                {typeof chat.response === 'string' ? (
                                  <ReactMarkdown className="text-sm text-gray-900 prose prose-sm max-w-none">
                                    {chat.response}
                                  </ReactMarkdown>
                                ) : chat.response?.response ? (
                                  <ReactMarkdown className="text-sm text-gray-900 prose prose-sm max-w-none">
                                    {chat.response.response}
                                  </ReactMarkdown>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">Không có phản hồi</p>
                                )}
                                
                                {/* Sources */}
                                {chat.response?.sources && chat.response.sources.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-2">
                                      <FontAwesomeIcon icon={faSearch} className="w-3 h-3 mr-1" />
                                      Nguồn tham khảo ({chat.response.sources.length}):
                                    </p>
                                    <div className="space-y-1">
                                      {chat.response.sources.slice(0, 3).map((source, sourceIndex) => (
                                        <div key={sourceIndex} className="text-xs text-gray-600 bg-gray-100 rounded p-2">
                                          <p className="font-medium">
                                            <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 mr-1" />
                                            {source.file_name}
                                          </p>
                                          <p className="truncate">{source.text?.slice(0, 100)}...</p>
                                          {source.score && (
                                            <p className="text-gray-500">Điểm: {(source.score * 100).toFixed(1)}%</p>
                                          )}
                                        </div>
                                      ))}
                                      {chat.response.sources.length > 3 && (
                                        <p className="text-xs text-gray-500 italic">
                                          ... và {chat.response.sources.length - 3} nguồn khác
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                <FontAwesomeIcon icon={faRobot} className="w-3 h-3 mr-1" />
                                LISA AI • {formatTimestamp(chat.created_at || chat.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Chat Pagination */}
                {totalChatPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-700">
                      Trang {chatPage} / {totalChatPages} • {totalChatMessages} tin nhắn
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchChatHistory(selectedUser.user_id, selectedUser.source, chatPage - 1)}
                        disabled={chatPage <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
                        Trước
                      </button>
                      <button
                        onClick={() => fetchChatHistory(selectedUser.user_id, selectedUser.source, chatPage + 1)}
                        disabled={chatPage >= totalChatPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                        <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MessageManager;
