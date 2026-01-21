import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-toastify';
import {
    FaRobot,
    FaQuestionCircle,
    FaPaperPlane,
    FaHistory,
    FaCheckCircle,
    FaClock,
    FaStar,
    FaComment,
    FaBook,
    FaChevronDown,
    FaSpinner,
    FaTimes,
    FaEye
} from 'react-icons/fa';

const AIQAPage = () => {
    const navigate = useNavigate();

    // States
    const [chatbots, setChatbots] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingQuestion, setLoadingQuestion] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [myResponses, setMyResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [lastAIResponse, setLastAIResponse] = useState(null); // Lưu phản hồi AI mới nhất

    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/mini/login');
            return;
        }
        fetchChatbots();
        fetchMyResponses();
    }, [navigate]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Lấy danh sách môn học
    const fetchChatbots = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.CHATBOTS, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setChatbots(data.chatbots || []);
            }
        } catch (error) {
            console.error('Error fetching chatbots:', error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy câu hỏi ngẫu nhiên
    const fetchRandomQuestion = async (topic) => {
        if (!topic) return;

        try {
            setLoadingQuestion(true);
            setCurrentQuestion(null);
            setAnswer('');

            const response = await fetch(API_ENDPOINTS.AI_QA_RANDOM_QUESTION(topic), {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentQuestion(data);
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Không thể lấy câu hỏi');
            }
        } catch (error) {
            console.error('Error fetching question:', error);
            toast.error('Lỗi kết nối server');
        } finally {
            setLoadingQuestion(false);
        }
    };

    // Gửi câu trả lời
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!answer.trim()) {
            toast.warning('Vui lòng nhập câu trả lời');
            return;
        }

        if (!currentQuestion) {
            toast.warning('Vui lòng chọn câu hỏi trước');
            return;
        }

        try {
            setSubmitting(true);
            setLastAIResponse(null);

            const response = await fetch(API_ENDPOINTS.AI_QA_SUBMIT, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    topic: selectedTopic,
                    question: currentQuestion.question,
                    answer: answer.trim()
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Đã gửi câu trả lời! AI đang phản hồi...');

                // Lưu phản hồi AI và hiển thị
                setLastAIResponse({
                    question: currentQuestion.question,
                    answer: answer.trim(),
                    ai_response: data.ai_response || '',
                    topic_name: currentQuestion.topic_name || selectedTopic
                });

                setAnswer('');
                fetchMyResponses();
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Không thể gửi câu trả lời');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            toast.error('Lỗi kết nối server');
        } finally {
            setSubmitting(false);
        }
    };

    // Lấy lịch sử câu trả lời của tôi
    const fetchMyResponses = async () => {
        try {
            setLoadingResponses(true);
            const response = await fetch(`${API_ENDPOINTS.AI_QA_MY_RESPONSES}?limit=50`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setMyResponses(data.responses || []);
            }
        } catch (error) {
            console.error('Error fetching responses:', error);
        } finally {
            setLoadingResponses(false);
        }
    };

    // Chọn môn học
    const handleTopicChange = (e) => {
        const topic = e.target.value;
        setSelectedTopic(topic);
        setCurrentQuestion(null);
        setAnswer('');
    };

    // Format datetime
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen" style={{ paddingTop: '80px' }}>
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-4">
                                <FaRobot className="text-white text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Vấn Đáp với AI</h1>
                                <p className="text-gray-600">Chọn môn học, trả lời câu hỏi và nhận đánh giá từ giảng viên</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${showHistory
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <FaHistory className="mr-2" />
                            Lịch sử ({myResponses.length})
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Q&A Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Topic Selection */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FaBook className="mr-2 text-indigo-600" />
                                Chọn Môn Học
                            </h3>

                            <div className="relative">
                                <select
                                    value={selectedTopic}
                                    onChange={handleTopicChange}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl appearance-none focus:border-indigo-500 focus:outline-none transition-colors text-gray-700 bg-white"
                                >
                                    <option value="">-- Chọn môn học --</option>
                                    {chatbots.map((chatbot) => (
                                        <option key={chatbot.id} value={chatbot.source}>
                                            {chatbot.name}
                                        </option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>

                            {selectedTopic && (
                                <button
                                    onClick={() => fetchRandomQuestion(selectedTopic)}
                                    disabled={loadingQuestion}
                                    className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                                >
                                    {loadingQuestion ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Đang tải...
                                        </>
                                    ) : (
                                        <>
                                            <FaQuestionCircle className="mr-2" />
                                            Lấy Câu Hỏi Mới
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Question & Answer Form */}
                        {currentQuestion && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
                                <div className="mb-6">
                                    <div className="flex items-center mb-3">
                                        <FaQuestionCircle className="text-indigo-600 mr-2" />
                                        <span className="text-sm text-gray-500">
                                            Môn: {currentQuestion.topic_name || currentQuestion.topic}
                                        </span>
                                    </div>
                                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border-l-4 border-indigo-500">
                                        <h4 className="font-semibold text-gray-800 text-lg leading-relaxed">
                                            {currentQuestion.question}
                                        </h4>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Câu trả lời của bạn:
                                        </label>
                                        <textarea
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            rows={6}
                                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                                            placeholder="Nhập câu trả lời của bạn tại đây..."
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Số ký tự: {answer.length}
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={submitting || !answer.trim()}
                                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <>
                                                    <FaSpinner className="animate-spin mr-2" />
                                                    Đang gửi...
                                                </>
                                            ) : (
                                                <>
                                                    <FaPaperPlane className="mr-2" />
                                                    Gửi Câu Trả Lời
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                fetchRandomQuestion(selectedTopic);
                                                setLastAIResponse(null);
                                            }}
                                            disabled={loadingQuestion}
                                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                                        >
                                            Câu khác
                                        </button>
                                    </div>
                                </form>

                                {/* AI Response Section */}
                                {lastAIResponse && (
                                    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 animate-fade-in">
                                        <div className="flex items-center mb-4">
                                            <div className="p-2 bg-green-500 rounded-lg mr-3">
                                                <FaRobot className="text-white" />
                                            </div>
                                            <h4 className="font-semibold text-green-700">Phản hồi từ AI</h4>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                {lastAIResponse.ai_response || 'Đang chờ phản hồi...'}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3 italic">
                                            💡 Đây là phản hồi tự động từ AI. Giảng viên sẽ đánh giá chi tiết sau.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {!currentQuestion && selectedTopic && !loadingQuestion && !lastAIResponse && (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <FaQuestionCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Nhấn "Lấy Câu Hỏi Mới" để bắt đầu</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - History / Stats */}
                    <div className="space-y-6">
                        {/* Stats Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống Kê</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-blue-600">{myResponses.length}</p>
                                    <p className="text-sm text-gray-600">Tổng câu trả lời</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-green-600">
                                        {myResponses.filter(r => r.evaluated).length}
                                    </p>
                                    <p className="text-sm text-gray-600">Đã đánh giá</p>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {myResponses.filter(r => !r.evaluated).length}
                                    </p>
                                    <p className="text-sm text-gray-600">Chờ đánh giá</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-purple-600">
                                        {myResponses.filter(r => r.evaluated && r.score !== null).length > 0
                                            ? (myResponses.filter(r => r.evaluated && r.score !== null)
                                                .reduce((acc, r) => acc + r.score, 0) /
                                                myResponses.filter(r => r.evaluated && r.score !== null).length).toFixed(1)
                                            : '-'}
                                    </p>
                                    <p className="text-sm text-gray-600">Điểm TB</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent History */}
                        {showHistory && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 max-h-[600px] overflow-y-auto">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FaHistory className="mr-2 text-indigo-600" />
                                    Lịch Sử Vấn Đáp
                                </h3>

                                {loadingResponses ? (
                                    <div className="text-center py-8">
                                        <FaSpinner className="animate-spin text-2xl text-indigo-600 mx-auto" />
                                    </div>
                                ) : myResponses.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Chưa có câu trả lời nào</p>
                                ) : (
                                    <div className="space-y-4">
                                        {myResponses.map((resp) => (
                                            <div
                                                key={resp.id}
                                                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => setSelectedResponse(resp)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                                        {resp.topic_name || resp.topic}
                                                    </span>
                                                    {resp.evaluated ? (
                                                        <span className="flex items-center text-green-600 text-sm">
                                                            <FaCheckCircle className="mr-1" />
                                                            {resp.score}/10
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-yellow-600 text-sm">
                                                            <FaClock className="mr-1" />
                                                            Chờ đánh giá
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{resp.question}</p>
                                                <p className="text-xs text-gray-500">{formatDate(resp.submitted_at)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Response Detail Modal */}
            {selectedResponse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">Chi Tiết Câu Trả Lời</h3>
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Topic & Time */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                                    {selectedResponse.topic_name || selectedResponse.topic}
                                </span>
                                <span className="text-gray-500">{formatDate(selectedResponse.submitted_at)}</span>
                            </div>

                            {/* Question */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                    <FaQuestionCircle className="mr-2 text-indigo-600" />
                                    Câu hỏi
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-800">{selectedResponse.question}</p>
                                </div>
                            </div>

                            {/* Answer */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                    <FaComment className="mr-2 text-blue-600" />
                                    Câu trả lời của bạn
                                </h4>
                                <div className="bg-blue-50 rounded-xl p-4">
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
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                        <p className="text-gray-800 whitespace-pre-wrap">{selectedResponse.ai_response}</p>
                                    </div>
                                </div>
                            )}

                            {/* Evaluation */}
                            {selectedResponse.evaluated ? (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-green-700 flex items-center">
                                            <FaStar className="mr-2" />
                                            Đánh giá từ giảng viên
                                        </h4>
                                        <span className="text-2xl font-bold text-green-600">
                                            {selectedResponse.score}/10
                                        </span>
                                    </div>
                                    {selectedResponse.feedback && (
                                        <p className="text-gray-700">{selectedResponse.feedback}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-3">
                                        Đánh giá bởi: {selectedResponse.evaluated_by} - {formatDate(selectedResponse.evaluated_at)}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                                    <div className="flex items-center text-yellow-700">
                                        <FaClock className="mr-2" />
                                        <span>Đang chờ giảng viên đánh giá</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AIQAPage;
