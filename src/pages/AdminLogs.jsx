import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
  FaClipboardList,
  FaFilter,
  FaChartBar,
  FaTrash,
  FaSync,
  FaSearch,
  FaCalendar,
  FaUser,
  FaTag,
  FaBox,
  FaExclamationTriangle,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' hoặc 'stats'
  
  // Filter states
  const [filters, setFilters] = useState({
    offset: 0,
    limit: 20,
    username: '',
    role: '',
    action: '',
    resource_type: '',
    from_date: '',
    to_date: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
    has_more: false,
    current_page: 1,
    total_pages: 0
  });

  // Stats filter
  const [statsDays, setStatsDays] = useState(7);

  // Cleanup modal
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);

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
    fetchLogs();
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query string
      const params = new URLSearchParams();
      params.append('offset', filters.offset);
      params.append('limit', filters.limit);
      
      if (filters.username) params.append('username', filters.username);
      if (filters.role) params.append('role', filters.role);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);

      const response = await fetch(
        `${API_ENDPOINTS.ADMIN_LOGS}?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error('Không thể tải logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message || 'Không thể tải logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_ENDPOINTS.ADMIN_LOGS}/stats?days=${statsDays}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error('Không thể tải thống kê');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_ENDPOINTS.ADMIN_LOGS}/cleanup?days=${cleanupDays}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Không thể dọn dẹp logs');
      }

      const data = await response.json();
      setSuccess(data.message);
      setShowCleanupModal(false);
      fetchLogs();
    } catch (err) {
      setError(err.message || 'Không thể dọn dẹp logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset về trang đầu khi thay đổi filter
    }));
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      offset: 0,
      limit: 20,
      username: '',
      role: '',
      action: '',
      resource_type: '',
      from_date: '',
      to_date: ''
    });
    setTimeout(() => fetchLogs(), 0);
  };

  const handlePageChange = (newPage) => {
    const newOffset = (newPage - 1) * filters.limit;
    setFilters(prev => ({ ...prev, offset: newOffset }));
    setTimeout(() => fetchLogs(), 0);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'stats' && !stats) {
      fetchStats();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'VIEW': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaClipboardList className="w-8 h-8 inline-block align-middle mr-3" style={{ color: colors.primary }} />
                Quản lý Logs
              </h1>
              <p className="text-gray-600">Theo dõi và quản lý logs hoạt động của admin và teacher</p>
            </div>
            <button
              onClick={() => setShowCleanupModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 flex items-center"
            >
              <FaTrash className="w-4 h-4 inline-block align-middle mr-2" />
              Dọn dẹp Logs
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('logs')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors flex items-center justify-center ${
                activeTab === 'logs'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              <FaClipboardList className="w-4 h-4 inline-block align-middle mr-2" />
              Danh sách Logs
            </button>
            <button
              onClick={() => handleTabChange('stats')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors flex items-center justify-center ${
                activeTab === 'stats'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              <FaChartBar className="w-4 h-4 inline-block align-middle mr-2" />
              Thống kê
            </button>
          </div>

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="p-6">
              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaFilter className="w-4 h-4 inline-block align-middle mr-2" />
                    Bộ lọc
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleApplyFilters}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center"
                    >
                      <FaSearch className="w-4 h-4 inline-block align-middle mr-2" />
                      Áp dụng
                    </button>
                    <button
                      onClick={handleResetFilters}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center"
                    >
                      <FaSync className="w-4 h-4 inline-block align-middle mr-2" />
                      Đặt lại
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaUser className="w-3 h-3 inline-block align-middle mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={filters.username}
                      onChange={(e) => handleFilterChange('username', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nhập username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaTag className="w-3 h-3 inline-block align-middle mr-2" />
                      Role
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Tất cả</option>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaTag className="w-3 h-3 inline-block align-middle mr-2" />
                      Action
                    </label>
                    <select
                      value={filters.action}
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Tất cả</option>
                      <option value="CREATE">CREATE</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                      <option value="VIEW">VIEW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaBox className="w-3 h-3 inline-block align-middle mr-2" />
                      Resource Type
                    </label>
                    <select
                      value={filters.resource_type}
                      onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Tất cả</option>
                      <option value="QUESTION">QUESTION</option>
                      <option value="USER">USER</option>
                      <option value="CHATBOT">CHATBOT</option>
                      <option value="TOPIC">TOPIC</option>
                      <option value="LOG">LOG</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaCalendar className="w-3 h-3 inline-block align-middle mr-2" />
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={filters.from_date}
                      onChange={(e) => handleFilterChange('from_date', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaCalendar className="w-3 h-3 inline-block align-middle mr-2" />
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={filters.to_date}
                      onChange={(e) => handleFilterChange('to_date', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {log.username}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded ${
                                log.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {log.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded font-medium ${getActionColor(log.action)}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{log.resource_type}</div>
                                <div className="text-gray-500 text-xs">{log.resource_id}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                              {log.details && (
                                <div className="space-y-1">
                                  <div className={`font-medium ${getStatusColor(log.details.status)}`}>
                                    {log.details.status}
                                  </div>
                                  {log.details.result_summary && (
                                    <div className="text-gray-600 text-xs truncate" title={log.details.result_summary}>
                                      {log.details.result_summary}
                                    </div>
                                  )}
                                  {log.details.endpoint && (
                                    <div className="text-gray-500 text-xs">
                                      {log.details.method} {log.details.endpoint}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {log.ip_address || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {logs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FaClipboardList className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl">Không có logs nào</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        Trang {pagination.current_page} / {pagination.total_pages} (Tổng: {pagination.total} logs)
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          disabled={!pagination.has_more}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thống kê cho:
                </label>
                <div className="flex space-x-2">
                  <select
                    value={statsDays}
                    onChange={(e) => setStatsDays(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="1">1 ngày qua</option>
                    <option value="7">7 ngày qua</option>
                    <option value="30">30 ngày qua</option>
                    <option value="90">90 ngày qua</option>
                    <option value="365">365 ngày qua</option>
                  </select>
                  <button
                    onClick={fetchStats}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition duration-300 flex items-center"
                  >
                    <FaSync className="w-4 h-4 inline-block align-middle mr-2" />
                    Tải thống kê
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Overview */}
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{stats.period}</h3>
                    <p className="text-sm opacity-90">Từ {formatDate(stats.from_date)} đến {formatDate(stats.to_date)}</p>
                    <p className="text-3xl font-bold mt-4">{stats.total_logs} logs</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* By Action */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Theo Action</h3>
                      <div className="space-y-3">
                        {stats.statistics?.by_action?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className={`px-3 py-1 rounded font-medium ${getActionColor(item.action)}`}>
                              {item.action}
                            </span>
                            <span className="text-xl font-bold text-gray-800">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Resource Type */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Theo Resource Type</h3>
                      <div className="space-y-3">
                        {stats.statistics?.by_resource_type?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">{item.resource_type}</span>
                            <span className="text-xl font-bold text-gray-800">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By User */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Theo User</h3>
                      <div className="space-y-3">
                        {stats.statistics?.by_user?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <div className="text-gray-700 font-medium">{item.username}</div>
                              <div className={`text-xs px-2 py-0.5 rounded inline-block ${
                                item.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.role}
                              </div>
                            </div>
                            <span className="text-xl font-bold text-gray-800">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Day */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Theo Ngày</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stats.statistics?.by_day?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-700">{item.date}</span>
                            <span className="font-bold text-gray-800">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaChartBar className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">Nhấn "Tải thống kê" để xem dữ liệu</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dọn dẹp Logs Cũ</h3>
                <button
                  onClick={() => setShowCleanupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-6">
                <FaExclamationTriangle
                  className="w-24 h-24 mx-auto text-yellow-500 mb-4"
                />
                <p className="text-gray-700 mb-4">
                  Xóa tất cả logs cũ hơn số ngày chỉ định. Hành động này không thể hoàn tác.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xóa logs cũ hơn (ngày):
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối thiểu: 30 ngày, Tối đa: 365 ngày</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCleanupModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCleanup}
                  disabled={loading || cleanupDays < 30 || cleanupDays > 365}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaTrash className="w-4 h-4 inline-block align-middle mr-2" />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminLogs;

