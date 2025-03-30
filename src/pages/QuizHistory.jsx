import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, 
  faCheckCircle, 
  faQuestionCircle, 
  faTasks,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faMinus,
  faInbox,
  faSmile
} from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
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

    const colors = {
        primary: '#dc2626',       // Màu đỏ chủ đạo
        secondary: '#ff416c',     // Màu hồng phụ
        background: '#dc2626'     // Màu nền (có thể sử dụng nếu cần)
    };

    useEffect(() => {
        fetchQuizHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ gọi một lần khi thành phần được mount

    const fetchQuizHistory = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('access_token');

            // Chọn đúng endpoint API
            const API_URL = `https://mba.ptit.edu.vn/quiz_history`;

            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
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
            <nav aria-label="Quiz history pagination" className="mt-4">
                <ul className="pagination justify-content-center">
                    {/* Nút Trước */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            style={{ 
                                color: currentPage === 1 ? '#6c757d' : colors.primary,
                                border: `1px solid ${colors.primary}`
                            }}
                            disabled={currentPage === 1}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    </li>

                    {/* Trang đầu và dấu chấm lửng */}
                    {startPage > 1 && (
                        <>
                            <li className="page-item">
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(1)}
                                    style={{ 
                                        color: colors.primary,
                                        border: `1px solid ${colors.primary}`
                                    }}
                                >
                                    1
                                </button>
                            </li>
                            {startPage > 2 && (
                                <li className="page-item disabled">
                                    <span className="page-link">...</span>
                                </li>
                            )}
                        </>
                    )}

                    {/* Số trang */}
                    {pageNumbers.map(number => (
                        <li 
                            key={number} 
                            className={`page-item ${currentPage === number ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => handlePageChange(number)}
                                style={currentPage === number ? {
                                    backgroundColor: colors.primary,
                                    borderColor: colors.primary,
                                    color: 'white'
                                } : {
                                    color: colors.primary,
                                    border: `1px solid ${colors.primary}`
                                }}
                            >
                                {number}
                            </button>
                        </li>
                    ))}

                    {/* Trang cuối và dấu chấm lửng */}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <li className="page-item disabled">
                                    <span className="page-link">...</span>
                                </li>
                            )}
                            <li className="page-item">
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(totalPages)}
                                    style={{ 
                                        color: colors.primary,
                                        border: `1px solid ${colors.primary}`
                                    }}
                                >
                                    {totalPages}
                                </button>
                            </li>
                        </>
                    )}

                    {/* Nút Tiếp */}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            style={{ 
                                color: currentPage === totalPages ? '#6c757d' : colors.primary,
                                border: `1px solid ${colors.primary}`
                            }}
                            disabled={currentPage === totalPages}
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    return (
        <div className="min-h-screen d-flex flex-column bg-gradient-to-br from-red-100 to-pink-100"
            style={{ backgroundColor: '#fff1f2', minHeight: '100vh', paddingTop: '80px' }}>
            <Navbar />

            <div className="container py-4 flex-grow-1">
                <div className="card shadow mb-4" style={{
                    border: 'none',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff'
                }}>
                    <div className="card-body">
                        <h2 className="text-center mb-4" style={{ color: colors.primary }}>
                            <FontAwesomeIcon icon={faHistory} className="me-2" />
                            Lịch sử làm bài test
                        </h2>

                        <div className="row mb-4">
                            {/* Tổng số lượt làm bài */}
                            <div className="col-md-3">
                                <div className="card" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                                    <div className="card-body text-white">
                                        <h5 className="card-title">
                                            <FontAwesomeIcon icon={faTasks} className="me-2" />
                                            Số lượt làm bài
                                        </h5>
                                        <p className="card-text h2">{stats.totalAttempts}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Số câu đúng trung bình */}
                            <div className="col-md-3">
                                <div className="card" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                                    <div className="card-body text-white">
                                        <h5 className="card-title">
                                            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                            Số câu đúng TB
                                        </h5>
                                        <p className="card-text h2">{stats.averageCorrect}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tổng số câu đúng */}
                            <div className="col-md-3">
                                <div className="card" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                                    <div className="card-body text-white">
                                        <h5 className="card-title">
                                            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                            Tổng số câu đúng
                                        </h5>
                                        <p className="card-text h2">{stats.totalCorrect}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tổng số câu hỏi */}
                            <div className="col-md-3">
                                <div className="card" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                                    <div className="card-body text-white">
                                        <h5 className="card-title">
                                            <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
                                            Tổng số câu
                                        </h5>
                                        <p className="card-text h2">{stats.totalQuestions}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border" style={{ color: colors.primary }} role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="list-group">
                                    {Array.isArray(quizHistory) && quizHistory.length > 0 ? (
                                        currentItems.map((quiz, index) => {
                                            const globalIndex = indexOfFirstItem + index; // To ensure uniqueness across pages
                                            return (
                                                <div key={globalIndex} className="list-group-item" style={{ border: `1px solid ${colors.primary}`, marginBottom: '10px', borderRadius: '8px' }}>
                                                    <div className="d-flex justify-content-between align-items-center"
                                                        onClick={() => toggleQuizDetails(globalIndex)}
                                                        style={{ cursor: 'pointer' }}>
                                                        <div>
                                                            <h5 className="mb-1" style={{ color: colors.primary }}>Bài test #{globalIndex + 1}</h5>
                                                            <small className="text-muted">Thời gian: {formatDate(quiz.timestamp)}</small>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <span className="badge me-2" style={{ backgroundColor: colors.primary }}>
                                                                {quiz.correct_answers}/{quiz.total_questions} câu đúng
                                                            </span>
                                                            <span className="badge me-2" style={{ backgroundColor: colors.secondary }}>
                                                                Điểm: {quiz.score}
                                                            </span>
                                                            <FontAwesomeIcon icon={expandedQuiz === globalIndex ? faMinus : faPlus} />
                                                        </div>
                                                    </div>

                                                    {expandedQuiz === globalIndex && (
                                                        <div className="mt-3">
                                                            <h6 style={{ color: colors.primary }}>Chi tiết câu hỏi:</h6>
                                                            {Array.isArray(quiz.questions) && quiz.questions.length > 0 ? (
                                                                quiz.questions.map((question, qIndex) => (
                                                                    <div key={qIndex} className="card mb-2">
                                                                        <div className="card-body">
                                                                            <p className="mb-2">{question.question}</p>
                                                                            <div className="d-flex justify-content-between">
                                                                                <small className="text-muted">
                                                                                    Câu trả lời của bạn: {question.user_answer}
                                                                                </small>
                                                                                <small style={{ color: question.is_correct ? colors.primary : colors.secondary }}>
                                                                                    {question.is_correct ? "Đúng" : `Sai (Đáp án: ${question.correct_answer})`}
                                                                                </small>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p>No question details available.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-4">
                                            {/* Thêm các biểu tượng để thể hiện lịch sử trống */}
                                            <FontAwesomeIcon icon={faInbox} size="4x" color={colors.primary} />
                                            <FontAwesomeIcon icon={faSmile} size="4x" color={colors.secondary} className="ms-3" />
                                            
                                            <h4 className="mt-4" style={{ color: colors.primary }}>Chào bạn!</h4>
                                            <p>Bạn chưa có lịch sử làm bài kiểm tra. Hãy bắt đầu bằng cách làm bài kiểm tra đầu vào.</p>
                                            <button 
                                                className="btn btn-primary mt-3"
                                                onClick={() => window.location.href = 'https://mba.ptit.edu.vn/chat/test'}
                                                style={{ background: colors.primary }}
                                                >
                                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                                Bắt đầu làm bài kiểm tra
                                            </button>

                                        </div>
                                    )}
                                </div>
                                
                                {/* Phần Phân trang */}
                                {totalPages > 1 && <PaginationComponent />}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default QuizHistory;
