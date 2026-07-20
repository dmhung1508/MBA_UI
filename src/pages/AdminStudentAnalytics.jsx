import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaChartBar,
  FaUserGraduate
} from 'react-icons/fa';

const emptyBulkState = () => ({
  running: false,
  total: 0,
  completed: 0,
  success: 0,
  failed: 0,
  currentTopic: ''
});

const emptyTopicStatus = () => ({
  ranking: 'idle',
  clusters: 'idle',
  quality: 'idle',
  rankingMessage: '',
  clustersMessage: '',
  qualityMessage: '',
  rankingUpdatedAt: null,
  clustersUpdatedAt: null,
  qualityUpdatedAt: null
});

/**
 * Trang admin riêng: quản lý cập nhật phân tích sinh viên.
 * Không gộp với Quản lý Chatbot.
 */
const AdminStudentAnalytics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusByTopic, setStatusByTopic] = useState({});
  const [bulkUpdateState, setBulkUpdateState] = useState({
    ranking: emptyBulkState(),
    clusters: emptyBulkState(),
    quality: emptyBulkState()
  });
  const navigate = useNavigate();

  const isAnyBulkRunning =
    bulkUpdateState.ranking.running ||
    bulkUpdateState.clusters.running ||
    bulkUpdateState.quality.running;

  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
      navigate('/mini/');
      return;
    }
    fetchTopics();
  }, [navigate]);

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

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.CHATBOTS, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error(await getApiError(response, 'Không thể tải danh sách môn học'));
      }
      const data = (await parseJsonSafe(response)) || {};
      const chatbotList = data.chatbots || [];
      const topicsRaw = chatbotList
        .map((item) => {
          const code = String(item?.source || item?.quizTopic || '').trim();
          const name = String(item?.name || code).trim();
          if (!code) return null;
          return { code, name };
        })
        .filter(Boolean);
      const topicOptions = Array.from(new Map(topicsRaw.map((item) => [item.code, item])).values());
      setTopics(topicOptions);
      setStatusByTopic((prev) => {
        const next = { ...prev };
        topicOptions.forEach((topic) => {
          if (!next[topic.code]) next[topic.code] = emptyTopicStatus();
        });
        return next;
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  const updateTopicStatus = (topicCode, type, patch) => {
    setStatusByTopic((prev) => {
      const current = prev[topicCode] || emptyTopicStatus();
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

  const analyticsTypeLabel = (type) => {
    if (type === 'ranking') return 'xếp hạng sinh viên';
    if (type === 'quality') return 'chất lượng câu hỏi';
    return 'cụm câu hỏi';
  };

  const refreshTopicAnalytics = async (topicCode, type) => {
    const token = localStorage.getItem('access_token');
    let endpoint;
    if (type === 'ranking') {
      endpoint = API_ENDPOINTS.TEACHER_STUDENT_RANKING(topicCode, true);
    } else if (type === 'quality') {
      endpoint = API_ENDPOINTS.TEACHER_QUESTION_QUALITY(topicCode, {
        forceRefresh: true,
        useLlm: true
      });
    } else {
      endpoint = API_ENDPOINTS.TEACHER_QUESTION_CLUSTERS(topicCode, true);
    }

    updateTopicStatus(topicCode, type, {
      [type]: 'running',
      [`${type}Message`]: 'Đang cập nhật...'
    });

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const msg = await getApiError(response, `Không thể cập nhật ${analyticsTypeLabel(type)}`);
      updateTopicStatus(topicCode, type, {
        [type]: 'error',
        [`${type}Message`]: msg
      });
      return false;
    }

    const payload = await parseJsonSafe(response);
    const updatedAt = payload?.updated_at || new Date().toISOString();
    const totalQ = payload?.summary?.total;
    const successMsg =
      type === 'quality' && totalQ != null ? `Đã cập nhật (${totalQ} câu)` : 'Đã cập nhật';

    updateTopicStatus(topicCode, type, {
      [type]: 'success',
      [`${type}Message`]: successMsg,
      [`${type}UpdatedAt`]: updatedAt
    });
    return true;
  };

  const runBulkRefresh = async (type) => {
    if (!topics.length) {
      setError('Chưa có môn học nào để cập nhật.');
      return;
    }
    const stateKey = type === 'ranking' ? 'ranking' : type === 'quality' ? 'quality' : 'clusters';
    setBulkUpdateState((prev) => ({
      ...prev,
      [stateKey]: {
        running: true,
        total: topics.length,
        completed: 0,
        success: 0,
        failed: 0,
        currentTopic: ''
      }
    }));

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < topics.length; i += 1) {
      const topic = topics[i];
      setBulkUpdateState((prev) => ({
        ...prev,
        [stateKey]: { ...prev[stateKey], currentTopic: topic.code }
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
      [stateKey]: { ...prev[stateKey], running: false, currentTopic: '' }
    }));

    if (failedCount > 0) {
      setError(
        `Hoàn tất cập nhật ${analyticsTypeLabel(type)}: ${successCount} thành công, ${failedCount} lỗi.`
      );
    } else {
      setSuccess(`Đã cập nhật xong ${analyticsTypeLabel(type)} cho toàn bộ môn học.`);
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
    return dt.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-100 to-pink-100 flex flex-col min-h-screen" style={{ paddingTop: '100px' }}>
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        {(error || success) && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              error
                ? 'bg-red-100 border border-red-400 text-red-700'
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <p>{error || success}</p>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                }}
                className="text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
                <FaUserGraduate className="w-7 h-7 mr-3 inline-block align-middle text-indigo-600" />
                Quản lý phân tích sinh viên
              </h1>
              <p className="text-sm text-gray-600">
                Trang admin để <strong>cập nhật / rebuild</strong> dữ liệu phân tích theo môn
                (xếp hạng, cụm câu hỏi, chất lượng hay–TB–kém).
              </p>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                <p className="font-semibold mb-1">Đánh giá chất lượng câu hỏi</p>
                <p className="text-xs mb-2">
                  AI phân loại từng câu: hay · trung bình · kém. Bấm nút vàng để đánh giá theo môn (có thể mất thời gian).
                </p>
                <a
                  href="/mini/teacher-analytics?tab=quality"
                  className="inline-flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  <FaChartBar className="mr-1" />
                  Xem chi tiết từng câu →
                </a>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <a
                  href="/mini/admin"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Về quản lý chatbot
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runBulkRefresh('ranking')}
                disabled={isAnyBulkRunning}
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
                type="button"
                onClick={() => runBulkRefresh('clusters')}
                disabled={isAnyBulkRunning}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
              >
                {bulkUpdateState.clusters.running ? (
                  <FaSpinner className="mr-2 animate-spin" />
                ) : (
                  <FaSyncAlt className="mr-2" />
                )}
                Cập nhật cụm câu hỏi
              </button>
              <button
                type="button"
                onClick={() => runBulkRefresh('quality')}
                disabled={isAnyBulkRunning}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
                title="Đánh giá chất lượng câu hỏi (hay / trung bình / kém) cho mọi môn"
              >
                {bulkUpdateState.quality.running ? (
                  <FaSpinner className="mr-2 animate-spin" />
                ) : (
                  <FaSyncAlt className="mr-2" />
                )}
                Đánh giá chất lượng câu hỏi
              </button>
            </div>
          </div>

          {isAnyBulkRunning && (
            <div className="space-y-2 mb-4">
              {['ranking', 'clusters', 'quality'].map((kind) => {
                const state = bulkUpdateState[kind];
                if (!state.running) return null;
                const percent = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 0;
                const kindLabel =
                  kind === 'ranking'
                    ? 'Xếp hạng sinh viên'
                    : kind === 'quality'
                      ? 'Chất lượng câu hỏi'
                      : 'Cụm câu hỏi';
                const barColor =
                  kind === 'ranking' ? 'bg-indigo-500' : kind === 'quality' ? 'bg-amber-500' : 'bg-teal-500';
                return (
                  <div key={kind} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">
                        {kindLabel}: {state.completed}/{state.total}
                      </span>
                      <span className="text-gray-600">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-2 ${barColor}`} style={{ width: `${percent}%` }} />
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
                  <th className="px-4 py-2">Chất lượng câu hỏi</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => {
                  const status = statusByTopic[topic.code] || emptyTopicStatus();
                  return (
                    <tr key={topic.code} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{topic.code}</div>
                        <div className="text-xs text-gray-500">{topic.name}</div>
                      </td>
                      {['ranking', 'clusters', 'quality'].map((type) => {
                        const btnColor =
                          type === 'ranking'
                            ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300'
                            : type === 'quality'
                              ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300'
                              : 'bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300';
                        return (
                          <td key={type} className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {renderStatusBadge(status[type], status[`${type}Message`])}
                              <button
                                type="button"
                                onClick={() => refreshTopicAnalytics(topic.code, type)}
                                disabled={status[type] === 'running' || isAnyBulkRunning}
                                className={`text-xs text-white px-2 py-1 rounded ${btnColor}`}
                              >
                                Cập nhật môn này
                              </button>
                            </div>
                            {status[`${type}UpdatedAt`] && (
                              <div className="text-[11px] text-gray-500 mt-1">
                                Cập nhật lúc: {formatUpdatedAt(status[`${type}UpdatedAt`])}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {topics.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Chưa có môn học để cập nhật phân tích. Hãy tạo chatbot với mã môn (source) trước.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminStudentAnalytics;
