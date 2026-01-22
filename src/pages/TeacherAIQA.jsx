import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-toastify';
import {
    FaRobot,
    FaChalkboardTeacher,
    FaSearch,
    FaFilter,
    FaCheckCircle,
    FaClock,
    FaStar,
    FaEye,
    FaSpinner,
    FaTimes,
    FaCheck,
    FaChartBar,
    FaUserGraduate,
    FaBook,
    FaComment
} from 'react-icons/fa';

const TeacherAIQA = () => {
    const navigate = useNavigate();

    // States
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [chatbots, setChatbots] = useState([]);
    const [filters, setFilters] = useState({
        topic: '',
        evaluated: '',
        username: ''
    });
    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 20,
        total: 0
    });
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [evaluationForm, setEvaluationForm] = useState({
        score: 5,
        feedback: ''
    });

    // Kiểm tra quyền teacher/admin
    useEffect(() => {
        const userRole = localStorage.getItem('user_role');
        if (userRole !== 'teacher' && userRole !== 'admin') {
            navigate('/mini/');
            return;
        }
        fetchUserInfo();
        fetchStats();
        fetchResponses();
    }, [navigate]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Lấy thông tin user và danh sách môn học được assign
    const fetchUserInfo = async () => {
        try {
            let assignedTopics = [];
            let userRole = localStorage.getItem('user_role');

            // Admin thấy tất cả topics
            if (userRole === 'admin') {
                const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS, {
                    headers: getAuthHeaders()
                });
                if (chatbotsResponse.ok) {
                    const data = await chatbotsResponse.json();
                    setChatbots(data.chatbots || []);
                }
                return;
            }

            // Teacher: lấy danh sách topics được assign
            const myTopicsResponse = await fetch(API_ENDPOINTS.TEACHER_MY_TOPICS, {
                headers: getAuthHeaders()
            });

            if (myTopicsResponse.ok) {
                const topicsData = await myTopicsResponse.json();
                assignedTopics = topicsData.assigned_topics || [];
            }

            // Lấy danh sách chatbots và filter theo assigned topics
            const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS, {
                headers: getAuthHeaders()
            });

            if (chatbotsResponse.ok) {
                const data = await chatbotsResponse.json();
                const allChatbots = data.chatbots || [];

                // Teacher chỉ thấy assigned topics
                const filteredChatbots = allChatbots.filter(
                    chatbot => assignedTopics.includes(chatbot.source)
                );
                setChatbots(filteredChatbots);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    // Lấy thống kê
    const fetchStats = async () => {
        try {
            const url = filters.topic
                ? `${API_ENDPOINTS.TEACHER_AI_QA_STATS}?topic=${filters.topic}`
                : API_ENDPOINTS.TEACHER_AI_QA_STATS;

            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Lấy danh sách câu trả lời
    const fetchResponses = async () => {
        try {
            setLoading(true);

            let url = `${API_ENDPOINTS.TEACHER_AI_QA_RESPONSES}?skip=${pagination.skip}&limit=${pagination.limit}`;

            if (filters.topic) url += `&topic=${filters.topic}`;
            if (filters.evaluated !== '') url += `&evaluated=${filters.evaluated}`;
            if (filters.username) url += `&username=${filters.username}`;

            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setResponses(data.responses || []);
                setPagination(prev => ({ ...prev, total: data.total }));
            }
        } catch (error) {
            console.error('Error fetching responses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Gửi đánh giá
    const handleEvaluate = async () => {
        if (!selectedResponse) return;

        try {
            setEvaluating(true);

            const response = await fetch(
                API_ENDPOINTS.TEACHER_AI_QA_EVALUATE(selectedResponse.id),
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(evaluationForm)
                }
            );

            if (response.ok) {
                toast.success('Đánh giá thành công!');
                setSelectedResponse(null);
                setEvaluationForm({ score: 5, feedback: '' });
                fetchResponses();
                fetchStats();
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Không thể đánh giá');
            }
        } catch (error) {
            console.error('Error evaluating:', error);
            toast.error('Lỗi kết nối server');
        } finally {
            setEvaluating(false);
        }
    };

    // Xử lý filter
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, skip: 0 }));
    };

    // Apply filters
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchResponses();
            fetchStats();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, pagination.skip]);

    // Format datetime
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    return (
        <div className="bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px' }}>
            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex-1 pb-12 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                            <FaChalkboardTeacher className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Đánh Giá Vấn Đáp AI</h1>
                            <p className="text-sm text-gray-600">Xem và đánh giá câu trả lời vấn đáp của sinh viên</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tổng câu trả lời</p>
                                    <p className="text-3xl font-bold text-gray-800">{stats.total_responses}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FaComment className="text-blue-600 text-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Đã đánh giá</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.evaluated}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <FaCheckCircle className="text-green-600 text-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Chờ đánh giá</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <FaClock className="text-yellow-600 text-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Điểm trung bình</p>
                                    <p className="text-3xl font-bold text-red-600">
                                        {stats.avg_score !== null ? stats.avg_score : '-'}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-full">
                                    <FaStar className="text-red-600 text-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <FaFilter className="mr-2 text-gray-500" />
                        <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
                            <select
                                value={filters.topic}
                                onChange={(e) => handleFilterChange('topic', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            >
                                <option value="">Tất cả môn</option>
                                {chatbots.map((chatbot) => (
                                    <option key={chatbot.id} value={chatbot.source}>
                                        {chatbot.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                            <select
                                value={filters.evaluated}
                                onChange={(e) => handleFilterChange('evaluated', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            >
                                <option value="">Tất cả</option>
                                <option value="false">Chờ đánh giá</option>
                                <option value="true">Đã đánh giá</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm sinh viên</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={filters.username}
                                    onChange={(e) => handleFilterChange('username', e.target.value)}
                                    placeholder="Nhập username..."
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                />
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Responses Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-12">
                                <FaSpinner className="animate-spin text-3xl text-red-600 mx-auto mb-4" />
                                <p className="text-gray-500">Đang tải...</p>
                            </div>
                        ) : responses.length === 0 ? (
                            <div className="text-center py-12">
                                <FaRobot className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Không có câu trả lời nào</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Sinh viên</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Môn học</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Câu hỏi</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Thời gian</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {responses.map((resp) => (
                                        <tr key={resp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                        <FaUserGraduate className="text-red-600 text-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{resp.username}</p>
                                                        <p className="text-xs text-gray-500">{resp.full_name || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                                                    {resp.topic_name || resp.topic}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-700 text-sm line-clamp-2 max-w-xs">{resp.question}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-500">{formatDate(resp.submitted_at)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {resp.evaluated ? (
                                                    <div className="flex items-center text-green-600">
                                                        <FaCheckCircle className="mr-2" />
                                                        <span className="font-semibold">{resp.score}/10</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-yellow-600">
                                                        <FaClock className="mr-2" />
                                                        <span>Chờ đánh giá</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedResponse(resp);
                                                        setEvaluationForm({
                                                            score: resp.score || 5,
                                                            feedback: resp.feedback || ''
                                                        });
                                                    }}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                    title={resp.evaluated ? 'Xem chi tiết' : 'Đánh giá'}
                                                >
                                                    {resp.evaluated ? <FaEye /> : <FaCheck />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {responses.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Hiển thị {pagination.skip + 1} - {Math.min(pagination.skip + responses.length, pagination.total)} / {pagination.total}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
                                    disabled={pagination.skip === 0}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
                                    disabled={pagination.skip + pagination.limit >= pagination.total}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats by Topic */}
                {stats && stats.by_topic && stats.by_topic.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FaChartBar className="mr-2 text-red-600" />
                            Thống Kê Theo Môn Học
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.by_topic.map((topic, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-gray-800">{topic.topic_name}</span>
                                        {topic.avg_score !== null && (
                                            <span className="flex items-center text-red-600">
                                                <FaStar className="mr-1" />
                                                {topic.avg_score}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tổng: {topic.total}</span>
                                        <span className="text-green-600">Đã đánh giá: {topic.evaluated}</span>
                                        <span className="text-yellow-600">Chờ: {topic.pending}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Evaluation Modal */}
            {selectedResponse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {selectedResponse.evaluated ? 'Chi Tiết Đánh Giá' : 'Đánh Giá Câu Trả Lời'}
                            </h3>
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="flex items-center bg-gray-50 rounded-lg p-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                    <FaUserGraduate className="text-red-600 text-xl" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{selectedResponse.username}</p>
                                    <p className="text-sm text-gray-500">{selectedResponse.full_name || 'N/A'}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                                        {selectedResponse.topic_name || selectedResponse.topic}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(selectedResponse.submitted_at)}</p>
                                </div>
                            </div>

                            {/* Question */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Câu hỏi</h4>
                                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                                    <p className="text-gray-800">{selectedResponse.question}</p>
                                </div>
                            </div>

                            {/* Answer */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Câu trả lời của sinh viên</h4>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedResponse.answer}</p>
                                </div>
                            </div>

                            {/* AI Response */}
                            {selectedResponse.ai_response && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                        <FaRobot className="mr-2 text-green-600" />
                                        Phản hồi từ AI
                                    </h4>
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                        <p className="text-gray-800 whitespace-pre-wrap">{selectedResponse.ai_response}</p>
                                    </div>
                                </div>
                            )}

                            {/* Evaluation Form */}
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-5 border border-red-200">
                                <h4 className="font-medium text-red-700 mb-4 flex items-center">
                                    <FaStar className="mr-2" />
                                    Đánh Giá
                                </h4>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm (0-10)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            value={evaluationForm.score}
                                            onChange={(e) => setEvaluationForm(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                                            className="flex-1"
                                            disabled={selectedResponse.evaluated}
                                        />
                                        <span className="text-2xl font-bold text-red-600 w-12 text-center">
                                            {evaluationForm.score}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nhận xét (tùy chọn)
                                    </label>
                                    <textarea
                                        value={evaluationForm.feedback}
                                        onChange={(e) => setEvaluationForm(prev => ({ ...prev, feedback: e.target.value }))}
                                        rows={4}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                                        placeholder="Nhập nhận xét cho sinh viên..."
                                        disabled={selectedResponse.evaluated}
                                    />
                                </div>

                                {!selectedResponse.evaluated && (
                                    <button
                                        onClick={handleEvaluate}
                                        disabled={evaluating}
                                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                                    >
                                        {evaluating ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-2" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheck className="mr-2" />
                                                Xác Nhận Đánh Giá
                                            </>
                                        )}
                                    </button>
                                )}

                                {selectedResponse.evaluated && (
                                    <div className="text-center text-sm text-gray-500">
                                        Đánh giá bởi: {selectedResponse.evaluated_by} - {formatDate(selectedResponse.evaluated_at)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default TeacherAIQA;
