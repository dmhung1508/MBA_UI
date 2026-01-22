import React, { useState, useEffect } from 'react';
import { FaTicketAlt, FaChartBar, FaSearch, FaTrash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../config/api';
import Navbar from './Navbar';
import Footer from './Footer';
import TicketDetailModal from '../components/TicketDetailModal';

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_TICKET_STATS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        API_ENDPOINTS.ADMIN_TICKETS_LIST(100, 0, statusFilter, typeFilter, '', searchTerm),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Lỗi tải danh sách tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, [statusFilter, typeFilter, searchTerm]);

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleDeleteTicket = (ticket, e) => {
    e.stopPropagation(); // Prevent row click
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_TICKET_DELETE(ticketToDelete.ticket_number), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Đã xóa ticket thành công');
        setShowDeleteModal(false);
        setTicketToDelete(null);
        fetchTickets();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Không thể xóa ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      open: 'Mở',
      in_progress: 'Đ.xử lý',
      resolved: 'Đ.g.quyết',
      closed: 'Đóng'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const badges = {
      bug: 'bg-red-100 text-red-800',
      question: 'bg-purple-100 text-purple-800',
      feature_request: 'bg-indigo-100 text-indigo-800'
    };
    const labels = {
      bug: 'Lỗi',
      question: 'Câu hỏi',
      feature_request: 'Tính năng'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${badges[type]}`}>
        {labels[type]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px' }}>
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex-1 pb-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
              <FaTicketAlt className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Hỗ trợ</h1>
              <p className="text-sm text-gray-600">Xem và quản lý tất cả yêu cầu hỗ trợ</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-gray-400">
              <div className="text-sm text-gray-600 mb-1">Tổng số tickets</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_tickets}</div>
              <div className="text-xs text-gray-500 mt-2">Tất cả trạng thái</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-400">
              <div className="text-sm text-gray-600 mb-1">Đang mở</div>
              <div className="text-3xl font-bold text-blue-600">{stats.open_tickets}</div>
              <div className="text-xs text-gray-500 mt-2">Cần xử lý</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-400">
              <div className="text-sm text-gray-600 mb-1">Đang xử lý</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.in_progress_tickets}</div>
              <div className="text-xs text-gray-500 mt-2">Đang làm việc</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-400">
              <div className="text-sm text-gray-600 mb-1">Đã giải quyết</div>
              <div className="text-3xl font-bold text-green-600">{stats.resolved_tickets}</div>
              <div className="text-xs text-gray-500 mt-2">Hoàn thành</div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Theo loại</h3>
                <FaChartBar className="text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Báo lỗi</span>
                  <span className="font-semibold text-red-600">{stats.by_type.bug}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Câu hỏi</span>
                  <span className="font-semibold text-purple-600">{stats.by_type.question}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Yêu cầu tính năng</span>
                  <span className="font-semibold text-indigo-600">{stats.by_type.feature_request}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hiệu suất</h3>
                <FaChartBar className="text-gray-400" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Thời gian giải quyết TB</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.avg_resolution_time_hours ? stats.avg_resolution_time_hours.toFixed(1) : '0'}h
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Tỷ lệ hoàn thành</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.total_tickets === 0 ? '100' : ((stats.resolved_tickets / stats.total_tickets) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm ticket, tên hoặc username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="open">Mở</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả loại</option>
              <option value="bug">Báo lỗi</option>
              <option value="question">Câu hỏi</option>
              <option value="feature_request">Yêu cầu tính năng</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <FaTicketAlt className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-gray-600">Không tìm thấy ticket nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.ticket_number}
                      onClick={() => handleTicketClick(ticket)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 font-medium">
                        {ticket.ticket_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{ticket.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getTypeBadge(ticket.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{ticket.created_by?.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">@{ticket.created_by?.username || 'unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => handleDeleteTicket(ticket, e)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                          title="Xóa ticket"
                        >
                          <FaTrash className="mr-1" size={12} />
                          Xóa
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

      {selectedTicket && (
        <TicketDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTicket(null);
          }}
          ticketNumber={selectedTicket.ticket_number}
          onUpdate={() => {
            fetchTickets();
            fetchStats();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 rounded-t-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-white text-2xl mr-3" />
                <h2 className="text-xl font-bold text-white">Xác nhận xóa ticket</h2>
              </div>
              <button
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                disabled={isDeleting}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa ticket <span className="font-mono font-bold text-red-600">{ticketToDelete.ticket_number}</span>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Tiêu đề:</span> {ticketToDelete.title}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Người tạo:</span> {ticketToDelete.created_by?.name || 'Unknown'}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 flex items-center">
                  <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                  Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteTicket}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Xóa ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
