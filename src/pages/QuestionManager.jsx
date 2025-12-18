import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  faQuestionCircle,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faExclamationTriangle,
  faUpload,
  faFileExcel,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faList,
  faStar
} from '@fortawesome/free-solid-svg-icons';

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);
  const [availableChatbots, setAvailableChatbots] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Teacher permission states
  const [userRole, setUserRole] = useState('');
  const [assignedTopics, setAssignedTopics] = useState([]);

  // Search states
  const [searchMode, setSearchMode] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    topic: '',
    hasChoices: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchStats, setSearchStats] = useState(null);
  const [searchPagination, setSearchPagination] = useState({
    offset: 0,
    size: 10,
    total: 0,
    has_more: false
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'delete', 'bulk-create', 'excel-upload'
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    offset: 0,
    size: 10,
    total: 0,
    has_more: false
  });

  // Form data for single question
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    choices: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  });

  // Form data for bulk questions
  const [bulkQuestions, setBulkQuestions] = useState([
    {
      question_text: '',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }
  ]);

  // Excel upload
  const [excelFile, setExcelFile] = useState(null);

  const navigate = useNavigate();

  const colors = {
    primary: '#dc2626',
    secondary: '#ff416c',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  // Kiểm tra quyền admin hoặc teacher
  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/mini/');
      return;
    }
    setUserRole(role);

    if (role === 'teacher') {
      fetchTeacherTopics();
    } else {
      fetchChatbots();
    }
  }, [navigate]);

  // Fetch questions when topic or pagination changes
  useEffect(() => {
    if (selectedTopic && !searchMode) {
      fetchQuestions();
    }
  }, [selectedTopic, pagination.offset, searchMode]);

  // Fetch search results when search pagination changes
  useEffect(() => {
    if (searchMode && searchParams.keyword) {
      searchQuestions();
    }
  }, [searchPagination.offset]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchChatbots = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CHATBOTS);
      if (response.ok) {
        const data = await response.json();
        const chatbots = data.chatbots || [];
        setAvailableChatbots(chatbots);
        if (chatbots.length > 0) {
          setSelectedTopic(chatbots[0].source);
        }
      }
    } catch (err) {
      console.error('Error fetching chatbots:', err);
    }
  };

  const fetchTeacherTopics = async () => {
    try {
      // First get teacher's assigned topics
      const teacherResponse = await fetch(API_ENDPOINTS.TEACHER_MY_TOPICS, {
        headers: getAuthHeaders()
      });

      if (teacherResponse.ok) {
        const teacherData = await teacherResponse.json();
        const topics = teacherData.assigned_topics || [];
        setAssignedTopics(topics);

        // Then get all chatbots and filter by assigned topics
        const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS);
        if (chatbotsResponse.ok) {
          const chatbotsData = await chatbotsResponse.json();
          const allChatbots = chatbotsData.chatbots || [];

          // Filter chatbots to only show assigned topics
          const filteredChatbots = allChatbots.filter(chatbot =>
            topics.includes(chatbot.source)
          );

          setAvailableChatbots(filteredChatbots);
          if (filteredChatbots.length > 0) {
            setSelectedTopic(filteredChatbots[0].source);
          }
        }
      } else {
        throw new Error('Không thể tải assigned topics');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedTopic) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.ADMIN_QUESTIONS(selectedTopic)}?offset=${pagination.offset}&size=${pagination.size}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          has_more: data.pagination?.has_more || false
        }));
      } else {
        throw new Error('Không thể tải danh sách câu hỏi');
      }
    } catch (err) {
      setError(err.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const searchQuestions = async () => {
    if (!searchParams.keyword.trim()) return;

    try {
      setLoading(true);

      // Build search URL with parameters
      const searchUrl = new URL(API_ENDPOINTS.ADMIN_SEARCH_QUESTIONS);
      searchUrl.searchParams.append('q', searchParams.keyword);
      searchUrl.searchParams.append('offset', searchPagination.offset.toString());
      searchUrl.searchParams.append('size', searchPagination.size.toString());

      if (searchParams.topic) {
        searchUrl.searchParams.append('topic', searchParams.topic);
      }
      if (searchParams.hasChoices) {
        searchUrl.searchParams.append('has_choices', searchParams.hasChoices);
      }

      const response = await fetch(searchUrl.toString(), { headers: getAuthHeaders() });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.questions || []);
        setSearchStats(data.search_stats || null);
        setSearchPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          has_more: data.pagination?.has_more || false
        }));
      } else {
        throw new Error('Không thể tìm kiếm câu hỏi');
      }
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
      setSearchStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchParams.keyword.trim()) {
      setError('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    setSearchMode(true);
    setSearchPagination(prev => ({ ...prev, offset: 0 }));
    await searchQuestions();
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchParams({ keyword: '', topic: '', hasChoices: '' });
    setSearchResults([]);
    setSearchStats(null);
    setSearchPagination({ offset: 0, size: 10, total: 0, has_more: false });

    // Reload regular questions if topic is selected
    if (selectedTopic) {
      fetchQuestions();
    }
  };

  const handleSearchPageChange = (newOffset) => {
    setSearchPagination(prev => ({ ...prev, offset: newOffset }));
  };

  // Permission check functions
  const canAccessTopic = (topic) => {
    if (userRole === 'admin') return true;
    if (userRole === 'teacher') return assignedTopics.includes(topic);
    return false;
  };

  const validateTopicAccess = (topic) => {
    if (!canAccessTopic(topic)) {
      setError(`Bạn không có quyền truy cập topic "${topic}"`);
      return false;
    }
    return true;
  };

  const handleCreateQuestion = async () => {
    try {
      // Check permission for teacher
      if (!validateTopicAccess(selectedTopic)) {
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_QUESTION_CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          topic: selectedTopic,
          ...questionForm
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể tạo câu hỏi');
      }

      toast.success('✅ Câu hỏi đã được tạo thành công!', { position: 'top-right' });

      // Refresh appropriate data based on current mode
      if (searchMode && searchParams.keyword) {
        await searchQuestions();
      } else if (selectedTopic) {
        fetchQuestions();
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateBulkQuestions = async () => {
    try {
      // Check permission for teacher
      if (!validateTopicAccess(selectedTopic)) {
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_QUESTIONS_BULK, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          topic: selectedTopic,
          questions: bulkQuestions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể tạo câu hỏi');
      }

      toast.success(`✅ Đã tạo thành công ${bulkQuestions.length} câu hỏi!`, { position: 'top-right' });

      // Refresh appropriate data based on current mode
      if (searchMode && searchParams.keyword) {
        await searchQuestions();
      } else if (selectedTopic) {
        fetchQuestions();
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateQuestion = async () => {
    try {
      const topicToUse = selectedQuestion.topic || selectedTopic;

      // Check permission for teacher
      if (!validateTopicAccess(topicToUse)) {
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.ADMIN_QUESTION_BY_ID(topicToUse, selectedQuestion.index),
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(questionForm)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể cập nhật câu hỏi');
      }

      toast.success('✅ Câu hỏi đã được cập nhật thành công!', { position: 'top-right' });

      // Refresh appropriate data based on current mode
      if (searchMode && searchParams.keyword) {
        await searchQuestions();
      } else if (selectedTopic) {
        fetchQuestions();
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      const topicToUse = selectedQuestion.topic || selectedTopic;

      // Check permission for teacher
      if (!validateTopicAccess(topicToUse)) {
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.ADMIN_QUESTION_BY_ID(topicToUse, selectedQuestion.index),
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể xóa câu hỏi');
      }

      toast.success('✅ Câu hỏi đã được xóa thành công!', { position: 'top-right' });

      // Check if we need to go back to previous page
      // If we're deleting the last item on current page and not on first page
      if (searchMode && searchParams.keyword) {
        // For search mode
        if (searchResults.length === 1 && searchPagination.offset > 0) {
          setSearchPagination(prev => ({
            ...prev,
            offset: Math.max(0, prev.offset - prev.size)
          }));
        } else {
          await searchQuestions();
        }
      } else if (selectedTopic) {
        // For browse mode
        if (questions.length === 1 && pagination.offset > 0) {
          // Go back to previous page
          setPagination(prev => ({
            ...prev,
            offset: Math.max(0, prev.offset - prev.size)
          }));
        } else {
          // Just refresh current page
          fetchQuestions();
        }
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExcelUpload = async () => {
    try {
      if (!excelFile) {
        setError('Vui lòng chọn file Excel');
        return;
      }

      // Check permission for teacher
      if (!validateTopicAccess(selectedTopic)) {
        return;
      }

      const formData = new FormData();
      formData.append('topic', selectedTopic);
      formData.append('file', excelFile);

      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_QUESTIONS_UPLOAD_EXCEL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể upload file Excel');
      }

      const result = await response.json();
      toast.success(`✅ Đã upload thành công ${result.created_count || 'nhiều'} câu hỏi từ Excel!`, { position: 'top-right' });

      // Refresh appropriate data based on current mode
      if (searchMode && searchParams.keyword) {
        await searchQuestions();
      } else if (selectedTopic) {
        fetchQuestions();
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setQuestionForm({
      question_text: '',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    });
    setShowModal(true);
  };

  const openBulkCreateModal = () => {
    setModalMode('bulk-create');
    setBulkQuestions([{
      question_text: '',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }]);
    setShowModal(true);
  };

  const openExcelUploadModal = () => {
    setModalMode('excel-upload');
    setExcelFile(null);
    setShowModal(true);
  };

  const openEditModal = (question, index) => {
    setModalMode('edit');

    // For search mode, use the topic from the question itself
    // For browse mode, use the current selected topic
    const questionTopic = searchMode ? question.topic : selectedTopic;
    const questionIndex = searchMode ? (question.topic_index !== undefined ? question.topic_index : index) : index;

    setSelectedQuestion({ ...question, index: questionIndex, topic: questionTopic });

    // Convert question format for editing
    // Tìm index của đáp án đúng trong array choices
    const correctIndex = question.choices.findIndex(choice => choice === question.correct_answer);
    // Nếu không tìm thấy đáp án đúng, mặc định chọn đáp án đầu tiên
    const safeCorrectIndex = correctIndex >= 0 ? correctIndex : 0;

    const choices = question.choices.map((choice, idx) => ({
      text: choice,
      is_correct: idx === safeCorrectIndex
    }));

    setQuestionForm({
      question_text: question.question,
      choices: choices
    });
    setShowModal(true);
  };

  const openDeleteModal = (question, index) => {
    setModalMode('delete');

    // For search mode, use the topic from the question itself
    // For browse mode, use the current selected topic
    const questionTopic = searchMode ? question.topic : selectedTopic;
    const questionIndex = searchMode ? (question.topic_index !== undefined ? question.topic_index : index) : index;

    setSelectedQuestion({ ...question, index: questionIndex, topic: questionTopic });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
    setQuestionForm({
      question_text: '',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    });
    setBulkQuestions([{
      question_text: '',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }]);
    setExcelFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      handleCreateQuestion();
    } else if (modalMode === 'bulk-create') {
      handleCreateBulkQuestions();
    } else if (modalMode === 'edit') {
      handleUpdateQuestion();
    } else if (modalMode === 'delete') {
      handleDeleteQuestion();
    } else if (modalMode === 'excel-upload') {
      handleExcelUpload();
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleTopicChange = (newTopic) => {
    setSelectedTopic(newTopic);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const updateQuestionChoice = (choiceIndex, field, value) => {
    const newChoices = [...questionForm.choices];
    if (field === 'is_correct' && value) {
      // Only one choice can be correct
      newChoices.forEach((choice, idx) => {
        choice.is_correct = idx === choiceIndex;
      });
    } else {
      newChoices[choiceIndex][field] = value;
    }
    setQuestionForm(prev => ({ ...prev, choices: newChoices }));
  };

  const updateBulkQuestionChoice = (questionIndex, choiceIndex, field, value) => {
    const newBulkQuestions = [...bulkQuestions];
    if (field === 'is_correct' && value) {
      // Only one choice can be correct
      newBulkQuestions[questionIndex].choices.forEach((choice, idx) => {
        choice.is_correct = idx === choiceIndex;
      });
    } else {
      newBulkQuestions[questionIndex].choices[choiceIndex][field] = value;
    }
    setBulkQuestions(newBulkQuestions);
  };

  const addBulkQuestion = () => {
    setBulkQuestions(prev => [...prev, {
      question_text: '',
      choices: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }]);
  };

  const removeBulkQuestion = (index) => {
    if (bulkQuestions.length > 1) {
      setBulkQuestions(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex flex-col" style={{ paddingTop: '100px' }}>
      <Navbar />
      <ToastContainer />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <FontAwesomeIcon icon={faQuestionCircle} className="mr-3" style={{ color: colors.primary }} />
                Quản lý Câu hỏi
              </h1>
              <p className="text-gray-600">Quản lý câu hỏi quiz theo từng topic chatbot</p>
            </div>
            {!searchMode && (
              <div className="flex space-x-3">
                <button
                  onClick={openBulkCreateModal}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Thêm câu hỏi
                </button>
                <button
                  onClick={openExcelUploadModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
                >
                  <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                  Upload Excel
                </button>
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={clearSearch}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!searchMode
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" />
                Duyệt câu hỏi
              </button>
              <button
                onClick={() => setSearchMode(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${searchMode
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Browse Mode - Topic Selector */}
          {!searchMode && (
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Chọn topic:</label>
              <select
                value={selectedTopic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {availableChatbots.map(cb => (
                  <option key={cb.id} value={cb.source}>{cb.name} ({cb.source})</option>
                ))}
              </select>
              {selectedTopic && (
                <span className="text-sm text-gray-500">
                  Tổng: {pagination.total} câu hỏi
                </span>
              )}
            </div>
          )}

          {/* Search Mode - Search Form */}
          {searchMode && (
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ khóa tìm kiếm *
                  </label>
                  <input
                    type="text"
                    value={searchParams.keyword}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Nhập từ khóa để tìm kiếm trong câu hỏi và đáp án..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic (tùy chọn)
                  </label>
                  <select
                    value={searchParams.topic}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Tất cả topic</option>
                    {availableChatbots.map(cb => (
                      <option key={cb.id} value={cb.source}>{cb.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lựa chọn (tùy chọn)
                  </label>
                  <select
                    value={searchParams.hasChoices}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, hasChoices: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Bất kỳ</option>
                    <option value="2">2 lựa chọn</option>
                    <option value="3">3 lựa chọn</option>
                    <option value="4">4 lựa chọn</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
                >
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
                >
                  Xóa tìm kiếm
                </button>
              </div>

              {/* Search Stats */}
              {searchStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center text-sm text-blue-800">
                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                    <span>
                      Tìm thấy <strong>{searchStats.matched_questions}</strong> câu hỏi
                      từ <strong>{searchStats.total_questions_found}</strong> câu hỏi
                      trong <strong>{searchStats.topics_searched}</strong> topic
                    </span>
                  </div>
                </div>
              )}
            </form>
          )}
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

        {/* Questions List */}
        {(selectedTopic && !searchMode) || (searchMode && searchResults.length > 0) || (searchMode && loading) ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Câu hỏi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lựa chọn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đáp án đúng</th>
                    {searchMode && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relevance</th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(searchMode ? searchResults : questions).map((question, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {searchMode ? (searchPagination.offset + index + 1) : (pagination.offset + index + 1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={question.question}>
                          {question.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {question.choices.map((choice, idx) => (
                            <div key={idx} className="text-xs">
                              {String.fromCharCode(65 + idx)}: {choice}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                          {question.correct_answer}
                        </span>
                      </td>
                      {searchMode && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {question.topic}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faStar} className="text-yellow-500 mr-1" />
                              <span className="font-medium">{question.relevance_score || 0}</span>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(question, searchMode ? (question.topic_index || 0) : (pagination.offset + index))}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-100"
                            title="Chỉnh sửa"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(question, searchMode ? (question.topic_index || 0) : (pagination.offset + index))}
                            className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-100"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty States */}
            {!searchMode && questions.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-6xl mb-4 text-gray-300" />
                <p className="text-xl">Chưa có câu hỏi nào cho topic này</p>
              </div>
            )}

            {searchMode && searchResults.length === 0 && !loading && searchParams.keyword && (
              <div className="text-center py-12 text-gray-500">
                <FontAwesomeIcon icon={faSearch} className="text-6xl mb-4 text-gray-300" />
                <p className="text-xl">Không tìm thấy câu hỏi nào</p>
                <p className="text-sm mt-2">Thử thay đổi từ khóa hoặc bộ lọc khác</p>
              </div>
            )}

            {/* Pagination */}
            {((searchMode && searchPagination.total > searchPagination.size) ||
              (!searchMode && pagination.total > pagination.size)) && (
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {searchMode ? (
                      <>
                        Hiển thị {searchPagination.offset + 1} - {Math.min(searchPagination.offset + searchPagination.size, searchPagination.total)} của {searchPagination.total} kết quả
                      </>
                    ) : (
                      <>
                        Hiển thị {pagination.offset + 1} - {Math.min(pagination.offset + pagination.size, pagination.total)} của {pagination.total} câu hỏi
                      </>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => searchMode ?
                        handleSearchPageChange(Math.max(0, searchPagination.offset - searchPagination.size)) :
                        handlePageChange(Math.max(0, pagination.offset - pagination.size))
                      }
                      disabled={searchMode ? searchPagination.offset === 0 : pagination.offset === 0}
                      className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
                      Trước
                    </button>
                    <button
                      onClick={() => searchMode ?
                        handleSearchPageChange(searchPagination.offset + searchPagination.size) :
                        handlePageChange(pagination.offset + pagination.size)
                      }
                      disabled={searchMode ? !searchPagination.has_more : !pagination.has_more}
                      className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Sau
                      <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
                    </button>
                  </div>
                </div>
              )}
          </div>
        ) : (
          /* Show topic selector instruction when not in search mode */
          !searchMode && !selectedTopic && (
            <div className="bg-white rounded-lg shadow-lg p-12">
              <div className="text-center text-gray-500">
                <FontAwesomeIcon icon={faQuestionCircle} className="text-6xl mb-4 text-gray-300" />
                <p className="text-xl">Chọn một topic để xem câu hỏi</p>
                <p className="text-sm mt-2">Hoặc chuyển sang chế độ tìm kiếm để tìm câu hỏi trong tất cả topic</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' && 'Thêm Câu hỏi Mới'}
                  {modalMode === 'bulk-create' && 'Thêm Nhiều Câu hỏi'}
                  {modalMode === 'excel-upload' && 'Upload Câu hỏi từ Excel'}
                  {modalMode === 'edit' && 'Chỉnh Sửa Câu hỏi'}
                  {modalMode === 'delete' && 'Xác Nhận Xóa'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {modalMode === 'delete' ? (
                <div>
                  <div className="text-center mb-6">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="text-6xl text-red-500 mb-4"
                    />
                    <p className="text-gray-700">
                      Bạn có chắc chắn muốn xóa câu hỏi này?
                    </p>
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                      <p className="font-medium">{selectedQuestion?.question}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : modalMode === 'excel-upload' ? (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chọn file Excel
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setExcelFile(e.target.files[0])}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    {/* Download Template Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Tải file mẫu Excel
                          </p>
                          <p className="text-xs text-blue-700">
                            Tải xuống file mẫu để điền câu hỏi theo đúng định dạng
                          </p>
                        </div>
                        <a
                          href="/quiz_template.xlsx"
                          download="quiz_template.xlsx"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 flex items-center whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                          Tải xuống
                        </a>
                      </div>

                      <div className="text-sm text-blue-900 border-t border-blue-200 pt-3">
                        <p className="font-medium mb-2">Format file Excel:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">question</code>: Câu hỏi</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">choice_a</code>: Lựa chọn A (bắt buộc)</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">choice_b</code>: Lựa chọn B (bắt buộc)</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">choice_c</code>: Lựa chọn C (tùy chọn)</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">choice_d</code>: Lựa chọn D (tùy chọn)</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">correct_answer</code>: A, B, C hoặc D</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    >
                      <FontAwesomeIcon icon={faUpload} className="mr-2" />
                      Upload
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {modalMode === 'bulk-create' ? (
                      <div>
                        {bulkQuestions.map((question, questionIndex) => (
                          <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-700">Câu hỏi {questionIndex + 1}</h4>
                              {bulkQuestions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBulkQuestion(questionIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Nội dung câu hỏi
                                </label>
                                <textarea
                                  value={question.question_text}
                                  onChange={(e) => {
                                    const newBulkQuestions = [...bulkQuestions];
                                    newBulkQuestions[questionIndex].question_text = e.target.value;
                                    setBulkQuestions(newBulkQuestions);
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                  placeholder="Nhập nội dung câu hỏi"
                                  rows="2"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {question.choices.map((choice, choiceIndex) => (
                                  <div key={choiceIndex}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Lựa chọn {String.fromCharCode(65 + choiceIndex)}
                                    </label>
                                    <div className="flex space-x-2">
                                      <input
                                        type="text"
                                        value={choice.text}
                                        onChange={(e) => updateBulkQuestionChoice(questionIndex, choiceIndex, 'text', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder={`Nhập lựa chọn ${String.fromCharCode(65 + choiceIndex)}`}
                                        required={choiceIndex < 2}
                                      />
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`correct_${questionIndex}`}
                                          checked={choice.is_correct}
                                          onChange={(e) => updateBulkQuestionChoice(questionIndex, choiceIndex, 'is_correct', e.target.checked)}
                                          className="mr-1"
                                        />
                                        <span className="text-sm text-gray-600">Đúng</span>
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addBulkQuestion}
                          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" />
                          Thêm câu hỏi mới
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nội dung câu hỏi
                          </label>
                          <textarea
                            value={questionForm.question_text}
                            onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Nhập nội dung câu hỏi"
                            rows="3"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {questionForm.choices.map((choice, index) => (
                            <div key={index}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lựa chọn {String.fromCharCode(65 + index)}
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={choice.text}
                                  onChange={(e) => updateQuestionChoice(index, 'text', e.target.value)}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                  placeholder={`Nhập lựa chọn ${String.fromCharCode(65 + index)}`}
                                  required={index < 2}
                                />
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="correct_answer"
                                    checked={choice.is_correct}
                                    onChange={(e) => updateQuestionChoice(index, 'is_correct', e.target.checked)}
                                    className="mr-1"
                                  />
                                  <span className="text-sm text-gray-600">Đúng</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      {modalMode === 'create' ? 'Tạo' : modalMode === 'bulk-create' ? `Tạo ${bulkQuestions.length} câu` : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default QuestionManager;
