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

  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 10 rows per page, matching MyTickets. Anything beyond paginates rather
  // than growing the table.
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(totalTickets / PAGE_SIZE));

  // Debounce the search box. It used to refetch the list AND the stats on every
  // keystroke, and the stats handler runs 11 collection scans on the single
  // event loop.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /**
   * Turn a non-OK response into something an operator can act on.
   * Every failure used to fall through to the same empty "Khong tim thay ticket
   * nao" panel, making an expired session, a permissions problem and a genuinely
   * empty queue indistinguishable.
   */
  const handleFailure = async (response, what) => {
    if (response.status === 401) {
      setLoadError('Phi\u00ean \u0111\u0103ng nh\u1eadp \u0111\u00e3 h\u1ebft h\u1ea1n. \u0110ang chuy\u1ec3n t\u1edbi trang \u0111\u0103ng nh\u1eadp...');
      toast.error('Phi\u00ean \u0111\u0103ng nh\u1eadp \u0111\u00e3 h\u1ebft h\u1ea1n');
      localStorage.removeItem('access_token');
      setTimeout(() => { window.location.href = '/mini/login'; }, 1200);
      return;
    }
    if (response.status === 403) {
      setLoadError('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp trang qu\u1ea3n l\u00fd h\u1ed7 tr\u1ee3.');
      return;
    }
    let detail = '';
    try { detail = (await response.json())?.detail || ''; } catch { /* non-JSON body */ }
    setLoadError(`Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c ${what} (l\u1ed7i ${response.status}). ${detail}`);
    toast.error(`Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c ${what}`);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_TICKET_STATS, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
      });

      if (response.ok) {
        setStats(await response.json());
      } else {
        await handleFailure(response, 'th\u1ed1ng k\u00ea');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoadError('L\u1ed7i k\u1ebft n\u1ed1i t\u1edbi m\u00e1y ch\u1ee7.');
    }
  };

  const fetchTickets = async ({ quiet = false } = {}) => {
    if (!quiet) setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        API_ENDPOINTS.ADMIN_TICKETS_LIST(
          PAGE_SIZE, (page - 1) * PAGE_SIZE, statusFilter, typeFilter, '', debouncedSearch
        ),
        { headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setTotalTickets(data.total_tickets || 0);
        setLoadError(null);
      } else {
        await handleFailure(response, 'danh s\u00e1ch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setLoadError('L\u1ed7i k\u1ebft n\u1ed1i t\u1edbi m\u00e1y ch\u1ee7.');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, [statusFilter, typeFilter, debouncedSearch, page]);

  // Keep the queue fresh without a reload. Admins had no in-app signal at all,
  // so a ticket sat unseen until somebody happened to open this page - a median
  // of 22 hours after it was filed.
  useEffect(() => {
    const id = setInterval(() => fetchTickets({ quiet: true }), 60000);
    return () => clearInterval(id);
  }, [statusFilter, typeFilter, debouncedSearch, page]);

  // Open the ticket named in a notification email deep link
  // (.../admin/tickets?ticket=TICKET-000026&term=...).
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('ticket');
    if (wanted) {
      setSelectedTicket({ ticket_number: wanted });
      setShowDetailModal(true);
    }
  }, []);

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

  // A labelled proportion bar. "3 / 2 / 2" as three numbers makes you compare
  // them yourself; as bars the shape of the queue is visible before you read a
  // digit.
  const distRow = (label, value, max, barClass) => (
    <div key={label} className="flex items-center gap-3">
      <span className="w-28 flex-none text-sm text-gray-600">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
        />
      </div>
      <span className={`w-8 flex-none text-sm text-right tabular-nums ${value === 0 ? 'text-gray-400' : 'font-semibold text-gray-900'}`}>
        {value}
      </span>
    </div>
  );

  // How long a ticket may sit before the queue says something about it.
  // Tiered so a ticket turns amber while it is still a nudge, rather than
  // jumping from "fine" to "alarming" after a month of silence.
  const WAIT_WARN_DAYS = 3;   // amber
  const WAIT_LATE_DAYS = 14;  // red

  // Colour for a wait duration. Only tickets still awaiting a reply escalate —
  // a resolved ticket that once took 200 days is history, not a task.
  const waitTone = (days, status) => {
    const awaiting = ['open', 'in_progress'].includes(status);
    if (days == null || !awaiting) return 'text-gray-500';
    if (days >= WAIT_LATE_DAYS) return 'text-red-600 font-semibold';
    // yellow-700 rather than the yellow-600 used for large stat numbers:
    // small text needs 4.5:1 contrast on white, and yellow-600 misses it.
    if (days >= WAIT_WARN_DAYS) return 'text-yellow-700 font-medium';
    return 'text-gray-500';
  };

  // Whole days a ticket has been waiting. Age is the primary triage signal and
  // the table previously showed only a dd/mm/yyyy created date, so a ticket
  // waiting five months looked identical to one filed an hour ago.
  const daysWaiting = (createdAt) => {
    if (!createdAt) return null;
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  };

  const getPriorityBadge = (priority) => {
    const dot = { low: 'bg-gray-300', medium: 'bg-yellow-400', high: 'bg-red-500' };
    const labels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
    return (
      <span className={`inline-flex items-center gap-2 text-sm whitespace-nowrap ${priority === 'high' ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>
        <span className={`w-2 h-2 rounded-full flex-none ${dot[priority] || 'bg-gray-300'}`} />
        {labels[priority] || priority}
      </span>
    );
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
    <div className="bg-gradient-to-br from-red-100 to-pink-100 bg-fixed flex flex-col" style={{ paddingTop: '120px' }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Theo loại</h3>
                <FaChartBar className="text-gray-400" />
              </div>
              <div className="space-y-3">
                {(() => {
                  const t = stats.by_type;
                  const max = Math.max(t.bug, t.question, t.feature_request, 1);
                  return [
                    distRow('Báo lỗi', t.bug, max, 'bg-red-500'),
                    distRow('Câu hỏi', t.question, max, 'bg-purple-500'),
                    distRow('Tính năng', t.feature_request, max, 'bg-indigo-500'),
                  ];
                })()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Theo mức ưu tiên</h3>
                <FaChartBar className="text-gray-400" />
              </div>
              <div className="space-y-3">
                {(() => {
                  const p = stats.by_priority;
                  const max = Math.max(p.low, p.medium, p.high, 1);
                  return [
                    distRow('Cao', p.high, max, 'bg-red-500'),
                    distRow('Trung bình', p.medium, max, 'bg-yellow-400'),
                    distRow('Thấp', p.low, max, 'bg-gray-300'),
                  ];
                })()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hiệu suất</h3>
                <FaChartBar className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-gray-600">Thời gian giải quyết TB</span>
                  <span className="text-lg font-bold text-gray-900 tabular-nums">
                    {stats.avg_resolution_time_hours != null
                      ? `${stats.avg_resolution_time_hours.toFixed(1)}h`
                      : <span className="text-base font-medium text-gray-400">Chưa có</span>}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-gray-600">Tỷ lệ hoàn thành</span>
                  {/* Red at 0%. This read 0% for five months as a quiet green
                      number and nobody flinched. */}
                  <span className={`text-lg font-bold tabular-nums ${
                    stats.total_tickets > 0 && stats.resolved_tickets === 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stats.total_tickets === 0
                      ? '—'
                      : `${((stats.resolved_tickets / stats.total_tickets) * 100).toFixed(0)}%`}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-gray-600">Ticket cũ nhất còn mở</span>
                  <span className={`text-lg font-bold tabular-nums ${
                    stats.oldest_open_age_days >= WAIT_LATE_DAYS ? 'text-red-600'
                      : stats.oldest_open_age_days >= WAIT_WARN_DAYS ? 'text-yellow-700'
                      : 'text-gray-900'
                  }`}>
                    {stats.oldest_open_age_days != null
                      ? `${stats.oldest_open_age_days} ngày`
                      : <span className="text-base font-medium text-gray-400">—</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* search spans two columns; status moved to chips below */}
            <div className="relative md:col-span-2">
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

          {/* Status as chips rather than a dropdown: the current filter is
              visible without opening anything, and switching is one click.
              aria-pressed carries the state for screen readers. */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { value: '', label: 'Tất cả' },
              { value: 'open', label: 'Đang mở' },
              { value: 'in_progress', label: 'Đang xử lý' },
              { value: 'resolved', label: 'Đã giải quyết' },
              { value: 'closed', label: 'Đã đóng' },
            ].map(({ value, label }) => {
              const active = statusFilter === value;
              return (
                <button
                  key={value || 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setStatusFilter(value); setPage(1); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${
                    active
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Surface load failures instead of rendering an empty queue */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 flex items-start">
            <FaExclamationTriangle className="mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{loadError}</p>
              <button
                onClick={() => { setLoadError(null); fetchStats(); fetchTickets(); }}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

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
                      Ưu tiên
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đã chờ
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
                        {getPriorityBadge(ticket.priority)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums">
                        {(() => {
                          const d = daysWaiting(ticket.created_at);
                          if (d == null) return <span className="text-gray-400">—</span>;
                          return (
                            <span className={waitTone(d, ticket.status)}>
                              {d} ngày
                            </span>
                          );
                        })()}
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

        {/* Pagination - the list was hardcoded to limit=100/offset=0, so ticket
            101 onward was simply unreachable and total_tickets was discarded. */}
        {totalTickets > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
            <p className="text-sm text-gray-600">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalTickets)} trên tổng {totalTickets} ticket
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <span className="px-3 text-sm text-gray-600">Trang {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
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
