import React, { useState, useEffect } from 'react';
import { FaTicketAlt, FaFilter, FaSearch, FaPlus, FaComments, FaPaperclip } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../config/api';
import Navbar from './Navbar';
import Footer from './Footer';
import TicketModal from '../components/TicketModal';
import TicketDetailModal from '../components/TicketDetailModal';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const limit = 10;

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

  const fetchTickets = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const offset = (currentPage - 1) * limit;

      const response = await fetch(
        API_ENDPOINTS.TICKET_MY_LIST(limit, offset, statusFilter, typeFilter),
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
        setTotalTickets(data.total_tickets);
      } else {
        toast.error('Không thể tải danh sách tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter, typeFilter]);

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
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
      in_progress: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      closed: 'Đã đóng'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
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
      bug: 'Báo lỗi',
      question: 'Câu hỏi',
      feature_request: 'Yêu cầu tính năng'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${badges[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const totalPages = Math.ceil(totalTickets / limit);

  // Filter tickets by search term (client-side)
  const displayedTickets = tickets.filter(ticket =>
    searchTerm === '' ||
    removeVietnameseDiacritics(ticket.title).includes(removeVietnameseDiacritics(searchTerm)) ||
    removeVietnameseDiacritics(ticket.ticket_number).includes(removeVietnameseDiacritics(searchTerm)) ||
    removeVietnameseDiacritics(ticket.created_by?.name || '').includes(removeVietnameseDiacritics(searchTerm)) ||
    removeVietnameseDiacritics(ticket.created_by?.username || '').includes(removeVietnameseDiacritics(searchTerm))
  );

  return (
    <div className="bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px' }}>
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex-1 pb-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                <FaTicketAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yêu cầu hỗ trợ của tôi</h1>
                <p className="text-sm text-gray-600">Quản lý các yêu cầu hỗ trợ của bạn</p>
              </div>
            </div>
            <button
              onClick={() => setShowTicketModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-sm"
            >
              <FaPlus className="mr-2" />
              Tạo yêu cầu mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="open">Mở</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tất cả loại</option>
              <option value="bug">Báo lỗi</option>
              <option value="question">Câu hỏi</option>
              <option value="feature_request">Yêu cầu tính năng</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FaTicketAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || statusFilter || typeFilter
                ? 'Không tìm thấy ticket nào'
                : 'Chưa có yêu cầu hỗ trợ nào'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter || typeFilter
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Tạo yêu cầu hỗ trợ đầu tiên của bạn'}
            </p>
            {!searchTerm && !statusFilter && !typeFilter && (
              <button
                onClick={() => setShowTicketModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
              >
                <FaPlus className="mr-2" />
                Tạo yêu cầu hỗ trợ
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTickets.map((ticket) => (
              <div
                key={ticket.ticket_number}
                onClick={() => handleTicketClick(ticket)}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-red-300"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {ticket.ticket_number}
                      </span>
                      {getTypeBadge(ticket.type)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {ticket.description}
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="font-medium">{ticket.created_by?.name || 'Unknown'}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">@{ticket.created_by?.username || 'unknown'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Tạo: {new Date(ticket.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                        {ticket.comments_count > 0 && (
                          <span className="flex items-center">
                            <FaComments className="mr-1" />
                            {ticket.comments_count} bình luận
                          </span>
                        )}
                        {ticket.attachments_count > 0 && (
                          <span className="flex items-center">
                            <FaPaperclip className="mr-1" />
                            {ticket.attachments_count} file
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      <Footer />

      {/* Modals */}
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSuccess={() => {
          fetchTickets();
          setShowTicketModal(false);
        }}
      />

      {selectedTicket && (
        <TicketDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTicket(null);
          }}
          ticketNumber={selectedTicket.ticket_number}
          onUpdate={fetchTickets}
        />
      )}
    </div>
  );
};

export default MyTickets;
