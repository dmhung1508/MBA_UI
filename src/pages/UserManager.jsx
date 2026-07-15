import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaUserShield,
  FaChalkboardTeacher,
  FaUser,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaCheck,
  FaStar,
  FaBookOpen,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const ROLES = ['admin', 'teacher', 'user'];
const PAGE_LIMIT = 10; // số user tải mỗi role mỗi lần (không lấy hết một lúc)
const emptyRoleData = () => ({
  admin: { items: [], total: 0, offset: 0 },
  teacher: { items: [], total: 0, offset: 0 },
  user: { items: [], total: 0, offset: 0 },
});

const UserManager = () => {
  // Mỗi role có dữ liệu + phân trang riêng, tải theo limit từ server.
  const [roleData, setRoleData] = useState(emptyRoleData());
  const [availableChatbots, setAvailableChatbots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    search: ''
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('role'); // 'role', 'assign-topics'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    role: '',
    assigned_topics: []
  });
  const [topicSearch, setTopicSearch] = useState('');

  const navigate = useNavigate();

  const colors = {
    primary: '#dc2626',
    secondary: '#ff416c',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    teacher: 'bg-yellow-100 text-yellow-800',
    user: 'bg-green-100 text-green-800'
  };

  const roleIcons = {
    admin: FaUserShield,
    teacher: FaChalkboardTeacher,
    user: FaUser
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchRole = async (role, offset = 0, searchVal = filters.search) => {
    try {
      setLoading(true);
      const response = await fetch(
        API_ENDPOINTS.ADMIN_USERS_BY_ROLE(role, offset, PAGE_LIMIT, searchVal),
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Không thể tải danh sách người dùng');
      const data = await response.json();
      setRoleData(prev => ({
        ...prev,
        [role]: { items: data.users || [], total: data.total || 0, offset },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoles = (searchVal = filters.search) => {
    ROLES.forEach(role => fetchRole(role, 0, searchVal));
  };

  // Kiểm tra quyền admin + tải trang đầu của mỗi role
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllRoles('');
    fetchChatbots();
  }, [navigate]);

  // Tìm kiếm: debounce rồi tải lại từ trang đầu cho mọi role
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const t = setTimeout(() => fetchAllRoles(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const changePage = (role, newOffset) => {
    if (newOffset < 0) return;
    fetchRole(role, newOffset, filters.search);
  };

  const fetchChatbots = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.CHATBOTS,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableChatbots(data.chatbots || []);
      }
    } catch (err) {
      console.error('Error fetching chatbots:', err);
    }
  };

  // Remove Vietnamese diacritics for search
  const removeVietnameseDiacritics = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const handleUpdateRole = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.ADMIN_USER_ROLE(selectedUser.username),
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(roleForm)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể cập nhật role');
      }

      setSuccess(`Đã cập nhật role cho ${selectedUser.username} thành ${roleForm.role}`);
      fetchAllRoles(filters.search);
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignTopics = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.ADMIN_USER_ASSIGN_TOPICS(selectedUser.username),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(roleForm.assigned_topics)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể assign topics');
      }

      setSuccess(`Đã assign ${roleForm.assigned_topics.length} topics cho ${selectedUser.username}`);
      fetchAllRoles(filters.search);
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const openRoleModal = (user) => {
    setModalMode('role');
    setSelectedUser(user);
    setRoleForm({
      role: user.role || 'user',
      assigned_topics: user.assigned_topics || []
    });
    setTopicSearch('');
    setShowModal(true);
  };

  const openAssignModal = (user) => {
    setModalMode('assign-topics');
    setSelectedUser(user);
    setRoleForm({
      role: user.role || 'teacher',
      assigned_topics: user.assigned_topics || []
    });
    setTopicSearch('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setRoleForm({
      role: '',
      assigned_topics: []
    });
    setTopicSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'role') {
      handleUpdateRole();
    } else if (modalMode === 'assign-topics') {
      handleAssignTopics();
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleTopicToggle = (topicSource) => {
    const currentTopics = roleForm.assigned_topics || [];
    const isAssigned = currentTopics.includes(topicSource);
    
    if (isAssigned) {
      setRoleForm(prev => ({
        ...prev,
        assigned_topics: currentTopics.filter(topic => topic !== topicSource)
      }));
    } else {
      setRoleForm(prev => ({
        ...prev,
        assigned_topics: [...currentTopics, topicSource]
      }));
    }
  };

  // Remove Vietnamese diacritics for search
  const removeVietnameseTones = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Filter chatbots based on search
  const filteredChatbots = availableChatbots.filter(chatbot => {
    const searchNormalized = removeVietnameseTones(topicSearch.toLowerCase());
    const nameNormalized = removeVietnameseTones(chatbot.name.toLowerCase());
    const sourceNormalized = removeVietnameseTones(chatbot.source.toLowerCase());

    return nameNormalized.includes(searchNormalized) ||
           sourceNormalized.includes(searchNormalized);
  });

  const totalAllUsers = ROLES.reduce((sum, r) => sum + (roleData[r].total || 0), 0);

  if (loading && totalAllUsers === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px'}}>
      <Navbar />

      <div className="container mx-auto px-4 py-8 pb-16 flex-1">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaUsers className="w-8 h-8 mr-3 inline-block align-middle" style={{ color: colors.primary }} />
                Quản lý Người dùng
              </h1>
              <p className="text-gray-600">Quản lý role và phân quyền cho users, teachers</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaFilter className="w-4 h-4 mr-2 inline-block align-middle" />
                Lọc theo role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Tất cả roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaSearch className="w-4 h-4 mr-2 inline-block align-middle" />
                Tìm kiếm
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Tìm theo username hoặc họ tên..."
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div>Tổng: <strong>{totalAllUsers}</strong> users</div>
                <div className="text-xs text-gray-400">Tải {PAGE_LIMIT}/role mỗi trang</div>
              </div>
            </div>
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

        {/* Users by Role */}
        {ROLES.map(role => {
          if (filters.role && filters.role !== role) return null;

          const rd = roleData[role];
          const roleUsers = rd.items;
          const totalPages = Math.max(1, Math.ceil(rd.total / PAGE_LIMIT));
          const currentPage = Math.floor(rd.offset / PAGE_LIMIT) + 1;

          return (
            <div key={role} className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    {React.createElement(roleIcons[role], { className: "w-5 h-5 mr-2 inline-block align-middle" })}
                    {role === 'admin' ? 'Administrators' : role === 'teacher' ? 'Teachers' : 'Users'}
                    <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                      {rd.total}
                    </span>
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      {role === 'teacher' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Topics</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roleUsers.map((user, index) => (
                      <tr key={user.username} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username} - {user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'} inline-flex items-center`}>
                            {React.createElement(roleIcons[user.role], { className: "w-3 h-3 mr-1 inline-block align-middle" })}
                            {user.role}
                          </span>
                        </td>
                        {role === 'teacher' && (
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {user.assigned_topics && user.assigned_topics.length > 0 ? (
                                user.assigned_topics.map((topic, idx) => (
                                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {topic}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 italic">Chưa assign topic nào</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openRoleModal(user)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-100"
                              title="Thay đổi role"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            {(user.role === 'teacher' || (user.role === 'user' && modalMode !== 'assign-topics')) && (
                              <button
                                onClick={() => openAssignModal(user)}
                                className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-100"
                                title="Assign topics"
                              >
                                <FaBookOpen className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {roleUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {React.createElement(roleIcons[role], { className: "w-16 h-16 mb-2 text-gray-300 mx-auto" })}
                    <p>Không có {role} nào</p>
                  </div>
                )}
              </div>

              {/* Phân trang cho role này */}
              {rd.total > PAGE_LIMIT && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-600">
                    Trang {currentPage}/{totalPages} — {rd.total} user
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => changePage(role, rd.offset - PAGE_LIMIT)}
                      disabled={rd.offset === 0}
                      className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center"
                    >
                      <FaChevronLeft className="w-3 h-3 mr-1" /> Trước
                    </button>
                    <button
                      onClick={() => changePage(role, rd.offset + PAGE_LIMIT)}
                      disabled={rd.offset + PAGE_LIMIT >= rd.total}
                      className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center"
                    >
                      Sau <FaChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'role' && `Thay đổi role - ${selectedUser?.username}`}
                  {modalMode === 'assign-topics' && `Assign Topics - ${selectedUser?.username}`}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {modalMode === 'role' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role mới
                      </label>
                      <select
                        value={roleForm.role}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="user">User - Quyền cơ bản</option>
                        <option value="teacher">Teacher - Quản lý assigned topics</option>
                        <option value="admin">Admin - Quyền tối cao</option>
                      </select>
                    </div>
                    
                    {roleForm.role === 'teacher' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Topics (tùy chọn)
                        </label>
                        <div className="mb-2 relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={topicSearch}
                            onChange={(e) => setTopicSearch(e.target.value)}
                            placeholder="Tìm kiếm môn học..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          {filteredChatbots.length > 0 ? (
                            filteredChatbots.map(chatbot => (
                              <label key={chatbot.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={roleForm.assigned_topics.includes(chatbot.source)}
                                  onChange={() => handleTopicToggle(chatbot.source)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">{chatbot.name}</span>
                                <code className="text-xs bg-gray-100 px-1 rounded">{chatbot.source}</code>
                              </label>
                            ))
                          ) : (
                            <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
                              Không tìm thấy môn học
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Đã chọn: {roleForm.assigned_topics.length} topics
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Topics cho {selectedUser?.username}
                      </label>
                      <div className="mb-2 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={topicSearch}
                          onChange={(e) => setTopicSearch(e.target.value)}
                          placeholder="Tìm kiếm môn học..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {filteredChatbots.length > 0 ? (
                          filteredChatbots.map(chatbot => (
                            <label key={chatbot.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={roleForm.assigned_topics.includes(chatbot.source)}
                                onChange={() => handleTopicToggle(chatbot.source)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm">{chatbot.name}</span>
                              <code className="text-xs bg-gray-100 px-1 rounded">{chatbot.source}</code>
                            </label>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-gray-500 text-sm">
                            Không tìm thấy môn học
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Đã chọn: {roleForm.assigned_topics.length} topics
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                  >
                    <FaSave className="w-4 h-4 mr-2 inline-block align-middle" />
                    {modalMode === 'role' ? 'Cập nhật Role' : 'Assign Topics'}
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

export default UserManager;


