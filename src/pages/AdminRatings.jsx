import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { FaStar, FaUsers, FaChartBar, FaCommentAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

const QUESTION_LABELS = {
  q1_ui_intuitive: 'Giao diện trực quan, rõ ràng và dễ nhìn',
  q2_ui_easy: 'Dễ thao tác, không cần hướng dẫn',
  q3_perf_fast: 'Hệ thống phản hồi nhanh chóng',
  q4_perf_stable: 'Hoạt động ổn định, không lỗi gián đoạn',
  q5_feat_useful: 'Tính năng đáp ứng tốt nhu cầu sử dụng',
  q6_feat_accurate: 'Thông tin trả về chính xác và hữu ích',
  q7_overall: 'Mức độ hài lòng chung',
};

const SECTION_MAP = {
  q1_ui_intuitive: 'UI/UX',
  q2_ui_easy: 'UI/UX',
  q3_perf_fast: 'Hiệu suất',
  q4_perf_stable: 'Hiệu suất',
  q5_feat_useful: 'Tính năng',
  q6_feat_accurate: 'Tính năng',
  q7_overall: 'Tổng thể',
};

const StarDisplay = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FaStar key={s} size={14} className={s <= value ? 'text-yellow-400' : 'text-gray-200'} />
    ))}
    <span className="ml-1 text-xs text-gray-500">({value})</span>
  </div>
);

const ScoreBar = ({ label, value, max = 5 }) => {
  const pct = ((value / max) * 100).toFixed(0);
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-52 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-10 text-right">{value}</span>
    </div>
  );
};

const AdminRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0, total_pages: 1, current_page: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin') { navigate('/mini/'); return; }
    fetchRatings(0);
  }, [navigate]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  });

  const fetchRatings = async (offset = 0) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.ADMIN_RATINGS}?offset=${offset}&limit=20`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Không thể tải dữ liệu đánh giá');
      const data = await res.json();
      setRatings(data.ratings || []);
      setStats(data.stats || {});
      setTotal(data.total || 0);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const overallAvg = stats.overall_avg || 0;
  const overallColor = overallAvg >= 4 ? 'text-green-600' : overallAvg >= 3 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaStar className="text-yellow-400" /> Quản lý Đánh giá hệ thống
          </h1>
          <p className="text-gray-500 text-sm mt-1">Xem phản hồi và đánh giá của người dùng về MBA Chatbot</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaUsers className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng đánh giá</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaStar className="text-yellow-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Điểm trung bình tổng thể</p>
              <p className={`text-2xl font-bold ${overallColor}`}>{overallAvg > 0 ? overallAvg : '—'} <span className="text-sm text-gray-400">/ 5</span></p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaChartBar className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Điểm hài lòng chung (q7)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.q7_overall || '—'} <span className="text-sm text-gray-400">/ 5</span></p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'list', label: 'Danh sách đánh giá', icon: <FaUsers size={14} /> },
            { key: 'stats', label: 'Thống kê chi tiết', icon: <FaChartBar size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : activeTab === 'stats' ? (
          /* Stats tab */
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-6">Điểm trung bình từng tiêu chí</h2>
            {total === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Chưa có đánh giá nào.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(QUESTION_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{SECTION_MAP[key]}</span>
                    </div>
                    <ScoreBar label={label} value={stats[key] || 0} />
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100">
                  <ScoreBar label="Trung bình tổng thể" value={stats.overall_avg || 0} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List tab */
          <div>
            {ratings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <FaStar className="text-gray-200 mx-auto mb-3" size={48} />
                <p className="text-gray-400">Chưa có đánh giá nào từ người dùng.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900">{r.full_name || r.username}</p>
                        <p className="text-xs text-gray-400">@{r.username} · {formatDate(r.submitted_at)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-400" size={16} />
                        <span className="font-bold text-gray-800">{r.q7_overall}</span>
                        <span className="text-xs text-gray-400">/5 tổng thể</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                      {Object.entries(QUESTION_LABELS).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex-1">{label}</span>
                          <StarDisplay value={r[key] || 0} />
                        </div>
                      ))}
                    </div>

                    {r.suggestion && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FaCommentAlt className="text-red-400 mt-0.5 flex-shrink-0" size={12} />
                          <p className="italic">{r.suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Trang {pagination.current_page} / {pagination.total_pages} ({total} đánh giá)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.offset === 0}
                    onClick={() => fetchRatings(pagination.offset - pagination.limit)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft size={12} /> Trước
                  </button>
                  <button
                    disabled={!pagination.has_more}
                    onClick={() => fetchRatings(pagination.offset + pagination.limit)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tiếp <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminRatings;
