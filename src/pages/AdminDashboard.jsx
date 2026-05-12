import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
  FaRobot,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'delete'
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    prompt: ''
  });
  const [analyticsTopics, setAnalyticsTopics] = useState([]);
  const [analyticsStatusByTopic, setAnalyticsStatusByTopic] = useState({});
  const [bulkUpdateState, setBulkUpdateState] = useState({
    ranking: { running: false, total: 0, completed: 0, success: 0, failed: 0, currentTopic: '' },
    clusters: { running: false, total: 0, completed: 0, success: 0, failed: 0, currentTopic: '' }
  });
  
  // States for avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // No more upload tab - only chatbot management
  
  const navigate = useNavigate();

  const colors = {
    primary: '#dc2626',
    secondary: '#ff416c',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  // Kiểm tra quyền admin
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
      navigate('/mini/');
      return;
    }
    fetchChatbots();
  }, [navigate]);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
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
      if (!response.ok) {
        throw new Error(await getApiError(response, 'Không thể tải danh sách chatbot'));
      }
      const data = (await parseJsonSafe(response)) || {};
      const chatbotList = data.chatbots || [];
      setChatbots(chatbotList);
      const topicsRaw = chatbotList
        .map((item) => {
          const code = String(item?.source || item?.quizTopic || '').trim();
          const name = String(item?.name || code).trim();
          if (!code) return null;
          return { code, name };
        })
        .filter(Boolean);
      const topics = Array.from(new Map(topicsRaw.map((item) => [item.code, item])).values());
      setAnalyticsTopics(topics);
      setAnalyticsStatusByTopic((prev) => {
        const next = { ...prev };
        topics.forEach((topic) => {
          if (!next[topic.code]) {
            next[topic.code] = {
              ranking: 'idle',
              clusters: 'idle',
              rankingMessage: '',
              clustersMessage: '',
              rankingUpdatedAt: null,
              clustersUpdatedAt: null
            };
          }
        });
        return next;
      });
    } catch (err) {
      setError('Không thể tải danh sách chatbot');
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Function để tạo source và quiztopic từ tên chatbot
  const generateSourceAndQuizTopic = (name) => {
    // Bỏ dấu tiếng Việt
    const removeAccents = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    };
    
    // Tạo chuỗi base từ tên
    const baseString = removeAccents(name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15); // Giới hạn độ dài
    
    // Tạo 5 số ngẫu nhiên
    const randomNumbers = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    return baseString + randomNumbers;
  };

  const handleCreateChatbot = async () => {
    try {
      if (!avatarFile) {
        setError('Vui lòng chọn ảnh avatar');
        return;
      }

      // Tự động tạo source và quiztopic từ tên
      const generatedSourceAndQuizTopic = generateSourceAndQuizTopic(formData.name);

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('source', generatedSourceAndQuizTopic);
      formDataToSend.append('quizTopic', generatedSourceAndQuizTopic);
      formDataToSend.append('prompt', formData.prompt);
      formDataToSend.append('avatar_file', avatarFile);

      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_CHATBOTS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = (await parseJsonSafe(response)) || {};
        throw new Error(errorData.detail || 'Không thể tạo chatbot');
      }

      setSuccess('Chatbot đã được tạo thành công!');
      fetchChatbots();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateChatbot = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (avatarFile) {
        // Nếu có file avatar mới, sử dụng FormData
        const formDataToSend = new FormData();
        
        if (formData.name !== selectedChatbot.name) {
          formDataToSend.append('name', formData.name);
        }
        if (formData.prompt !== selectedChatbot.prompt) {
          formDataToSend.append('prompt', formData.prompt);
        }
        formDataToSend.append('avatar_file', avatarFile);

        const response = await fetch(API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(selectedChatbot.id), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });

        if (!response.ok) {
          const errorData = (await parseJsonSafe(response)) || {};
          throw new Error(errorData.detail || 'Không thể cập nhật chatbot');
        }
      } else {
        // Nếu không có file avatar mới, sử dụng JSON
        const updateData = Object.fromEntries(
          Object.entries(formData).filter(([key, value]) => value !== '' && value !== selectedChatbot[key])
        );

        if (Object.keys(updateData).length === 0) {
          setError('Không có thay đổi nào để cập nhật');
          return;
        }

        const response = await fetch(API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(selectedChatbot.id), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = (await parseJsonSafe(response)) || {};
          throw new Error(errorData.detail || 'Không thể cập nhật chatbot');
        }
      }

      setSuccess('Chatbot đã được cập nhật thành công!');
      fetchChatbots();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteChatbot = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(selectedChatbot.id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = (await parseJsonSafe(response)) || {};
        throw new Error(errorData.detail || 'Không thể xóa chatbot');
      }

      setSuccess('Chatbot đã được xóa thành công!');
      fetchChatbots();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', prompt: '' });
    setAvatarFile(null);
    setAvatarPreview('');
    setShowModal(true);
  };

  const openEditModal = (chatbot) => {
    setModalMode('edit');
    setSelectedChatbot(chatbot);
    setFormData({
      name: chatbot.name,
      prompt: chatbot.prompt
    });
    setAvatarFile(null);
    setAvatarPreview(chatbot.avatar || '');
    setShowModal(true);
  };

  const openDeleteModal = (chatbot) => {
    setModalMode('delete');
    setSelectedChatbot(chatbot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedChatbot(null);
    setFormData({ name: '', prompt: '' });
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      handleCreateChatbot();
    } else if (modalMode === 'edit') {
      handleUpdateChatbot();
    } else if (modalMode === 'delete') {
      handleDeleteChatbot();
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const parseJsonSafe = async (response) => {
    try {
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const getApiError = async (response, fallbackMessage) => {
    const data = await parseJsonSafe(response);
    return data?.detail || data?.message || fallbackMessage;
  };

  const updateTopicStatus = (topicCode, type, patch) => {
    setAnalyticsStatusByTopic((prev) => {
      const current = prev[topicCode] || {
        ranking: 'idle',
        clusters: 'idle',
        rankingMessage: '',
        clustersMessage: '',
        rankingUpdatedAt: null,
        clustersUpdatedAt: null
      };
      return {
        ...prev,
        [topicCode]: {
          ...current,
          ...patch,
          [type]: patch[type] || current[type]
        }
      };
    });
  };

  const refreshTopicAnalytics = async (topicCode, type) => {
    const token = localStorage.getItem('access_token');
    const endpoint =
      type === 'ranking'
        ? API_ENDPOINTS.TEACHER_STUDENT_RANKING(topicCode, true)
        : API_ENDPOINTS.TEACHER_QUESTION_CLUSTERS(topicCode, true);

    updateTopicStatus(topicCode, type, {
      [type]: 'running',
      [`${type}Message`]: 'Đang cập nhật...'
    });

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const msg = await getApiError(
        response,
        type === 'ranking'
          ? 'Không thể cập nhật xếp hạng sinh viên'
          : 'Không thể cập nhật cụm câu hỏi'
      );
      updateTopicStatus(topicCode, type, {
        [type]: 'error',
        [`${type}Message`]: msg
      });
      return false;
    }

    const payload = await parseJsonSafe(response);
    const updatedAt = payload?.updated_at || new Date().toISOString();

    updateTopicStatus(topicCode, type, {
      [type]: 'success',
      [`${type}Message`]: 'Đã cập nhật',
      [`${type}UpdatedAt`]: updatedAt
    });
    return true;
  };

  const runBulkRefresh = async (type) => {
    if (!analyticsTopics.length) {
      setError('Chưa có môn học nào để cập nhật.');
      return;
    }
    const stateKey = type === 'ranking' ? 'ranking' : 'clusters';
    setBulkUpdateState((prev) => ({
      ...prev,
      [stateKey]: {
        running: true,
        total: analyticsTopics.length,
        completed: 0,
        success: 0,
        failed: 0,
        currentTopic: ''
      }
    }));

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < analyticsTopics.length; i += 1) {
      const topic = analyticsTopics[i];
      setBulkUpdateState((prev) => ({
        ...prev,
        [stateKey]: {
          ...prev[stateKey],
          currentTopic: topic.code
        }
      }));

      const ok = await refreshTopicAnalytics(topic.code, type);
      if (ok) successCount += 1;
      else failedCount += 1;

      setBulkUpdateState((prev) => ({
        ...prev,
        [stateKey]: {
          ...prev[stateKey],
          completed: i + 1,
          success: successCount,
          failed: failedCount
        }
      }));
    }

    setBulkUpdateState((prev) => ({
      ...prev,
      [stateKey]: {
        ...prev[stateKey],
        running: false,
        currentTopic: ''
      }
    }));

    if (failedCount > 0) {
      setError(
        `Hoàn tất cập nhật ${type === 'ranking' ? 'xếp hạng' : 'cụm câu hỏi'}: ${successCount} thành công, ${failedCount} lỗi.`
      );
    } else {
      setSuccess(
        `Đã cập nhật xong ${type === 'ranking' ? 'xếp hạng sinh viên' : 'cụm câu hỏi'} cho toàn bộ môn học.`
      );
    }
  };

  const renderStatusBadge = (status, message) => {
    if (status === 'running') {
      return (
        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          <FaSpinner className="mr-1 animate-spin" />
          {message || 'Đang cập nhật'}
        </span>
      );
    }
    if (status === 'success') {
      return (
        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
          <FaCheckCircle className="mr-1" />
          {message || 'Đã cập nhật'}
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
          <FaTimesCircle className="mr-1" />
          {message || 'Lỗi cập nhật'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
        Chưa cập nhật
      </span>
    );
  };

  const formatUpdatedAt = (rawValue) => {
    if (!rawValue) return '';
    const dt = new Date(rawValue);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };


  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Kiểm tra kích thước file (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Tạo preview cho ảnh
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.onerror = () => {
        setError('Không thể đọc file ảnh');
      };
      reader.readAsDataURL(file);
    }
  };

  // Function để xử lý hiển thị avatar
  const getAvatarSrc = (avatar) => {
    if (!avatar) {
      return 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png';
    }
    
    // Kiểm tra nếu là base64 data URL
    if (avatar.startsWith('data:image/')) {
      return avatar;
    }
    
    // Nếu là base64 string thuần (không có prefix), thêm prefix
    if (avatar.match(/^[A-Za-z0-9+/=]+$/)) {
      return `data:image/jpeg;base64,${avatar}`;
    }
    
    // Nếu là URL thông thường
    if (avatar.startsWith('http')) {
      return avatar;
    }
    
    // Fallback
    return 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px' }}>
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div id="student-analytics-management" className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaRobot className="w-8 h-8 mr-3 inline-block align-middle" style={{ color: colors.primary }} />
                Quản lý Chatbot
              </h1>
              <p className="text-gray-600">Quản lý danh sách chatbot và dữ liệu trong hệ thống</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 flex items-center"
            >
              <FaPlus className="w-4 h-4 mr-2 inline-block align-middle" />
              Thêm Chatbot
            </button>
          </div>
          
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Quản lý phân tích sinh viên</h2>
              <p className="text-sm text-gray-600">
                Cập nhật dữ liệu phân tích theo từng môn hoặc toàn bộ môn học.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runBulkRefresh('ranking')}
                disabled={bulkUpdateState.ranking.running || bulkUpdateState.clusters.running}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
              >
                {bulkUpdateState.ranking.running ? (
                  <FaSpinner className="mr-2 animate-spin" />
                ) : (
                  <FaSyncAlt className="mr-2" />
                )}
                Cập nhật xếp hạng sinh viên
              </button>
              <button
                onClick={() => runBulkRefresh('clusters')}
                disabled={bulkUpdateState.ranking.running || bulkUpdateState.clusters.running}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
              >
                {bulkUpdateState.clusters.running ? (
                  <FaSpinner className="mr-2 animate-spin" />
                ) : (
                  <FaSyncAlt className="mr-2" />
                )}
                Cập nhật cụm câu hỏi
              </button>
            </div>
          </div>

          {(bulkUpdateState.ranking.running || bulkUpdateState.clusters.running) && (
            <div className="space-y-2 mb-4">
              {['ranking', 'clusters'].map((kind) => {
                const state = bulkUpdateState[kind];
                if (!state.running) return null;
                const percent = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 0;
                return (
                  <div key={kind} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">
                        {kind === 'ranking' ? 'Xếp hạng sinh viên' : 'Cụm câu hỏi'}: {state.completed}/{state.total}
                      </span>
                      <span className="text-gray-600">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-indigo-500" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Đang xử lý môn: <strong>{state.currentTopic || '...'}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-4 py-2">Môn học</th>
                  <th className="px-4 py-2">Xếp hạng sinh viên</th>
                  <th className="px-4 py-2">Cụm câu hỏi</th>
                </tr>
              </thead>
              <tbody>
                {analyticsTopics.map((topic) => {
                  const status = analyticsStatusByTopic[topic.code] || {};
                  return (
                    <tr key={topic.code} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{topic.code}</div>
                        <div className="text-xs text-gray-500">{topic.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderStatusBadge(status.ranking, status.rankingMessage)}
                          <button
                            onClick={() => refreshTopicAnalytics(topic.code, 'ranking')}
                            disabled={status.ranking === 'running' || bulkUpdateState.ranking.running || bulkUpdateState.clusters.running}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-2 py-1 rounded"
                          >
                            Cập nhật môn này
                          </button>
                        </div>
                        {status.rankingUpdatedAt && (
                          <div className="text-[11px] text-gray-500 mt-1">
                            Cập nhật lúc: {formatUpdatedAt(status.rankingUpdatedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderStatusBadge(status.clusters, status.clustersMessage)}
                          <button
                            onClick={() => refreshTopicAnalytics(topic.code, 'clusters')}
                            disabled={status.clusters === 'running' || bulkUpdateState.ranking.running || bulkUpdateState.clusters.running}
                            className="text-xs bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-2 py-1 rounded"
                          >
                            Cập nhật môn này
                          </button>
                        </div>
                        {status.clustersUpdatedAt && (
                          <div className="text-[11px] text-gray-500 mt-1">
                            Cập nhật lúc: {formatUpdatedAt(status.clustersUpdatedAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {analyticsTopics.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      Chưa có môn học để cập nhật phân tích.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

        {/* Chatbot List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã môn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chatbots.map((chatbot) => {
                  const topicCode = chatbot.source || chatbot.quizTopic || '';
                  return (
                  <tr key={chatbot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {chatbot.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center p-1">
                        <img 
                          src={getAvatarSrc(chatbot.avatar)} 
                          alt={chatbot.name}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {chatbot.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {topicCode || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={chatbot.prompt}>
                        {chatbot.prompt ? chatbot.prompt.substring(0, 80) + (chatbot.prompt.length > 80 ? '...' : '') : 'Chưa có prompt'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => refreshTopicAnalytics(topicCode, 'ranking')}
                          disabled={!topicCode || bulkUpdateState.ranking.running || bulkUpdateState.clusters.running}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-100 disabled:text-indigo-300 disabled:hover:bg-transparent"
                          title="Cập nhật xếp hạng sinh viên môn này"
                        >
                          <FaSyncAlt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => refreshTopicAnalytics(topicCode, 'clusters')}
                          disabled={!topicCode || bulkUpdateState.ranking.running || bulkUpdateState.clusters.running}
                          className="text-teal-600 hover:text-teal-900 p-2 rounded hover:bg-teal-100 disabled:text-teal-300 disabled:hover:bg-transparent"
                          title="Cập nhật cụm câu hỏi môn này"
                        >
                          <FaSyncAlt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(chatbot)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-100"
                          title="Chỉnh sửa"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(chatbot)}
                          className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-100"
                          title="Xóa"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          {chatbots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FaRobot className="w-24 h-24 mb-4 text-gray-300 mx-auto" />
              <p className="text-xl">Chưa có chatbot nào</p>
            </div>
          )}
        </div>


      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' && 'Thêm Chatbot Mới'}
                  {modalMode === 'edit' && 'Chỉnh Sửa Chatbot'}
                  {modalMode === 'delete' && 'Xác Nhận Xóa'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {modalMode === 'delete' ? (
                <div>
                  <div className="text-center mb-6">
                    <FaExclamationTriangle className="w-24 h-24 text-red-500 mb-4 mx-auto" />
                    <p className="text-gray-700">
                      Bạn có chắc chắn muốn xóa chatbot <strong>{selectedChatbot?.name}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Hành động này không thể hoàn tác.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên Chatbot
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Nhập tên chatbot"
                        required={modalMode === 'create'}
                      />
                      {modalMode === 'create' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Source và Quiz Topic sẽ được tự động tạo từ tên chatbot
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Avatar
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required={modalMode === 'create' && !avatarPreview}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Hỗ trợ: JPG, PNG, GIF, WebP. Tối đa 5MB.
                      </p>
                      {avatarPreview && (
                        <div className="mt-3 flex justify-center">
                          <div className="h-20 w-20 rounded-full bg-white border border-gray-300 flex items-center justify-center p-2">
                            <img 
                              src={getAvatarSrc(avatarPreview)} 
                              alt="Avatar preview"
                              className="h-16 w-16 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt
                      </label>
                      <textarea
                        value={formData.prompt}
                        onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Nhập prompt mô tả vai trò và chức năng của chatbot"
                        rows="4"
                        required={modalMode === 'create'}
                      />
                    </div>
                  </div>
                  
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
                      {modalMode === 'create' ? 'Tạo' : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard; 