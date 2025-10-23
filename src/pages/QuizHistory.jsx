import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaHistory, 
  FaCheckCircle, 
  FaQuestionCircle, 
  FaTasks,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaMinus,
  FaInbox,
  FaSmile,
  FaRobot,
  FaGraduationCap,
  FaUniversity,
  FaTrophy,
  FaChartLine,
  FaClock
} from 'react-icons/fa';
import Navbar from './Navbar';
import Footer from './Footer';

const QuizHistory = () => {
    const [quizHistory, setQuizHistory] = useState([]);
    const [expandedQuiz, setExpandedQuiz] = useState(null);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageCorrect: 0,
        totalCorrect: 0,
        totalQuestions: 0,
    });
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5; // Fixed items per page
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();



    useEffect(() => {
        fetchQuizHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ gọi một lần khi thành phần được mount

    const fetchQuizHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            // Chọn đúng endpoint API
            const API_URL = `https://mba.ptit.edu.vn/auth_mini/quiz_history`;

            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
                mode: 'no-cors'
            });

            // Kiểm tra cấu trúc dữ liệu trả về
            console.log('API Response:', response.data);

            if (Array.isArray(response.data)) {
                // Scenario A: response.data là một mảng
                setQuizHistory(response.data);
                setTotalPages(Math.ceil(response.data.length / itemsPerPage));
                calculateStats(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                // Scenario B: response.data là một object có data và totalItems
                setQuizHistory(response.data.data);
                setTotalPages(Math.ceil(response.data.totalItems / itemsPerPage));
                calculateStats(response.data.data);
            } else {
                // Xử lý cấu trúc dữ liệu không mong đợi
                console.error('Unexpected API response structure:', response.data);
                setQuizHistory([]);
                setTotalPages(1);
                setStats({
                    totalAttempts: 0,
                    averageCorrect: 0,
                    totalCorrect: 0,
                    totalQuestions: 0,
                });
            }
        } catch (error) {
            console.error('Error fetching quiz history:', error);
            // Tùy chọn: thiết lập trạng thái lỗi để hiển thị thông báo thân thiện với người dùng
            setQuizHistory([]);
            setTotalPages(1);
            setStats({
                totalAttempts: 0,
                averageCorrect: 0,
                totalCorrect: 0,
                totalQuestions: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    // Hàm tính toán thống kê dựa trên lịch sử quiz
    const calculateStats = (history) => {
        if (!Array.isArray(history)) {
            console.error('Invalid history data:', history);
            setStats({
                totalAttempts: 0,
                averageCorrect: 0,
                totalCorrect: 0,
                totalQuestions: 0,
            });
            return;
        }

        const totalAttempts = history.length;
        let totalCorrect = 0;
        let totalQuestions = 0;

        history.forEach(quiz => {
            totalCorrect += quiz.correct_answers || 0;
            totalQuestions += quiz.total_questions || 0;
        });

        const averageCorrect = totalAttempts ? (totalCorrect / totalAttempts).toFixed(2) : 0;

        setStats({
            totalAttempts,
            averageCorrect,
            totalCorrect,
            totalQuestions,
        });
    };

    // Toggle the expanded quiz details
    const toggleQuizDetails = (index) => {
        setExpandedQuiz(expandedQuiz === index ? null : index);
    };

    // Format the timestamp to a readable string
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setExpandedQuiz(null); // Reset expanded quiz khi thay đổi trang
        }
    };

    // Tính toán các mục hiện tại dựa trên trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = quizHistory.slice(indexOfFirstItem, indexOfLastItem);

        // Pagination component
    const PaginationComponent = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <nav aria-label="Quiz history pagination" className="mt-6">
                <div className="flex justify-center space-x-2">
                    {/* Nút Trước */}
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg border transition-colors duration-200 ${
                            currentPage === 1 
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                        }`}
                    >
                        <FaChevronLeft />
                    </button>

                    {/* Trang đầu và dấu chấm lửng */}
                    {startPage > 1 && (
                        <>
                            <button 
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-2 rounded-lg border bg-white text-red-600 border-red-300 hover:bg-red-50 transition-colors duration-200"
                            >
                                1
                            </button>
                            {startPage > 2 && (
                                <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                        </>
                    )}

                    {/* Số trang */}
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`px-3 py-2 rounded-lg border transition-colors duration-200 ${
                                currentPage === number
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                            }`}
                        >
                            {number}
                        </button>
                    ))}

                    {/* Trang cuối và dấu chấm lửng */}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                            <button 
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-2 rounded-lg border bg-white text-red-600 border-red-300 hover:bg-red-50 transition-colors duration-200"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    {/* Nút Tiếp */}
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg border transition-colors duration-200 ${
                            currentPage === totalPages 
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                        }`}
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </nav>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ paddingTop: '120px' }}>
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 font-medium">
                        <FaRobot className="mr-2" />
                        MBA Quiz History - PTIT
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Lịch sử luyện tập MBA
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Theo dõi tiến trình luyện tập và kết quả của bạn trong các bài test MBA
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Tổng số lượt làm bài */}
                    <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-200 text-sm font-medium">Số lượt làm bài</p>
                                <p className="text-3xl font-bold">{stats.totalAttempts}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <FaTasks className="text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Số câu đúng trung bình */}
                    <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-200 text-sm font-medium">Số câu đúng TB</p>
                                <p className="text-3xl font-bold">{stats.averageCorrect}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <FaCheckCircle className="text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Tổng số câu đúng */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-sm font-medium">Tổng số câu đúng</p>
                                <p className="text-3xl font-bold">{stats.totalCorrect}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <FaTrophy className="text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Tổng số câu hỏi */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-200 text-sm font-medium">Tổng số câu</p>
                                <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <FaQuestionCircle className="text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải lịch sử MBA quiz...</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {Array.isArray(quizHistory) && quizHistory.length > 0 ? (
                                currentItems.map((quiz, index) => {
                                    const globalIndex = indexOfFirstItem + index;
                                    return (
                                        <div key={globalIndex} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                            <div 
                                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                                                onClick={() => toggleQuizDetails(globalIndex)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                                                                <FaGraduationCap className="text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-900">
                                                                    Bài test MBA #{globalIndex + 1}
                                                                </h3>
                                                                <div className="flex items-center text-sm text-gray-500">
                                                                    <FaClock className="mr-1" />
                                                                    {formatDate(quiz.timestamp)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-3">
                                                        <div className="text-right">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                    {quiz.correct_answers}/{quiz.total_questions} câu đúng
                                                                </span>
                                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                    Điểm: {quiz.score}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                                                            {expandedQuiz === globalIndex ? <FaMinus /> : <FaPlus />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedQuiz === globalIndex && (
                                                <div className="border-t border-gray-200 bg-gray-50 p-6">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                        <FaChartLine className="mr-2 text-red-600" />
                                                        Chi tiết câu hỏi MBA
                                                    </h4>
                                                    {Array.isArray(quiz.questions) && quiz.questions.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {quiz.questions.map((question, qIndex) => (
                                                                <div key={qIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                                                    <p className="text-gray-900 mb-3 font-medium">
                                                                        {qIndex + 1}. {question.question}
                                                                    </p>
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-gray-600">
                                                                            <strong>Câu trả lời của bạn:</strong> {question.user_answer}
                                                                        </span>
                                                                        <span className={`font-semibold ${
                                                                            question.is_correct 
                                                                                ? 'text-green-600' 
                                                                                : 'text-red-600'
                                                                        }`}>
                                                                            {question.is_correct 
                                                                                ? "✓ Đúng" 
                                                                                : `✗ Sai (Đáp án: ${question.correct_answer})`
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500">Không có chi tiết câu hỏi.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-16">
                                    <div className="mb-6">
                                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaInbox className="text-4xl text-red-600" />
                                        </div>
                                        <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 font-medium">
                                            <FaGraduationCap className="mr-2" />
                                            MBA Quiz Center
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                        Chưa có lịch sử luyện tập MBA
                                    </h3>
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                        Bạn chưa có lịch sử làm bài kiểm tra MBA. Hãy bắt đầu luyện tập để cải thiện kiến thức quản trị kinh doanh của mình!
                                    </p>
                                    <button 
                                        onClick={() => window.location.href = '/mini/'}
                                        className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        <FaPlus className="mr-2" />
                                        Bắt đầu luyện tập MBA
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && <PaginationComponent />}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default QuizHistory;
