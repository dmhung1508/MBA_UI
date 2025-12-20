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
  FaEye,
  FaExclamationTriangle,
  FaUpload,
  FaDatabase,
  FaFile
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
      const data = await response.json();
      setChatbots(data.chatbots || []);
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
        const errorData = await response.json();
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
          const errorData = await response.json();
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
          const errorData = await response.json();
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
        const errorData = await response.json();
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
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px' }}>
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chatbots.map((chatbot) => (
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
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={chatbot.prompt}>
                        {chatbot.prompt ? chatbot.prompt.substring(0, 80) + (chatbot.prompt.length > 80 ? '...' : '') : 'Chưa có prompt'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
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
                ))}
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