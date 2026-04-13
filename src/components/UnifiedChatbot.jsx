import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { FaMicrophone, FaPaperPlane, FaQuestionCircle, FaVolumeMute, FaVolumeUp, FaHistory, FaTrash } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINTS } from '../config/api';
import QuizPopup from './QuizPopup';
import { jwtDecode } from 'jwt-decode';

const timestamp = `${Date.now()}-${uuidv4()}`;

const UnifiedChatbot = ({
  chatbotConfig, // { id, name, source, quizTopic, avatar }
  isSpeakerActive,
  toggleSpeaker,
  speakText,
  toggleSourcePopup,
  isLoading,
  setIsLoading,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // success, error
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const chatHistoryRef = useRef(null);
  const speechRecognition = useRef(null);
  const inactivityTimerRef = useRef(null);

  // Các tin nhắn loading thú vị (memoized)
  const loadingMessages = useMemo(() => [
    { text: "Trợ lý AI đang suy nghĩ...", emoji: "💭", subtitle: "Đang xử lý câu hỏi của bạn" },
    { text: "Đang tìm kiếm thông tin...", emoji: "🔍", subtitle: "Chờ chút nhé, sắp có kết quả rồi" },
    { text: "Đang phân tích dữ liệu...", emoji: "📊", subtitle: "Hệ thống đang làm việc chăm chỉ" },
    { text: "Chuẩn bị câu trả lời...", emoji: "✨", subtitle: "Sắp xong rồi, kiên nhẫn tí nha" },
    { text: "Đang kết nối với AI...", emoji: "🤖", subtitle: "Trí tuệ nhân tạo đang hoạt động" }
  ], []);

  // Trích xuất userId từ access_token
  const accessToken = localStorage.getItem('access_token');
  let username = null;

  if (accessToken) {
    try {
      const decodedToken = jwtDecode(accessToken);
      username = decodedToken.sub;
    } catch (error) {
      console.error('Failed to decode access token:', error);
    }
  }

  // Function để format lịch sử chat từ API thành format message
  const formatChatHistoryToMessages = useCallback((chatHistoryData) => {
    const formattedMessages = [];

    chatHistoryData.forEach(chatItem => {
      // Thêm tin nhắn của user
      formattedMessages.push({
        id: `user-${chatItem._id}`,
        text: chatItem.message,
        sender: "user",
        timestamp: new Date(chatItem.timestamp).toLocaleTimeString(),
        historyId: chatItem._id
      });

      // Xử lý response của bot
      let botText = "";
      let sources = [];

      if (typeof chatItem.response === 'string') {
        botText = chatItem.response;
      } else if (chatItem.response && typeof chatItem.response === 'object') {
        if (chatItem.response.response) {
          botText = chatItem.response.response;
        } else {
          botText = JSON.stringify(chatItem.response);
        }

        if (chatItem.response.sources && Array.isArray(chatItem.response.sources)) {
          sources = chatItem.response.sources;
        }
      }

      // Thêm tin nhắn của bot
      formattedMessages.push({
        id: `bot-${chatItem._id}`,
        text: botText,
        sender: "bot",
        timestamp: new Date(chatItem.timestamp).toLocaleTimeString(),
        sources: sources,
        historyId: chatItem._id
      });
    });

    return formattedMessages;
  }, []);

  // Function để load lịch sử chat
  const loadChatHistory = useCallback(async () => {
    if (!username || !chatbotConfig.source) return;

    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        "accept": "application/json",
        "ngrok-skip-browser-warning": "69420",
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        API_ENDPOINTS.CHAT_HISTORY(username, 50, 0, chatbotConfig.source),
        {
          method: "GET",
          headers: headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "ok" && data.chat_history && data.chat_history.length > 0) {
          const formattedHistory = formatChatHistoryToMessages(data.chat_history.reverse());
          setChatHistory(formattedHistory);
          setMessages(formattedHistory);
        } else {
          setChatHistory([]);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatHistory([]);
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [username, chatbotConfig.source, formatChatHistoryToMessages]);

  // Function để hiển thị toast notification
  const showToastNotification = useCallback((message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  }, []);

  // Function để xóa lịch sử chat
  const clearChatHistory = useCallback(async () => {
    if (!username || !chatbotConfig.source) return;
    setShowDeleteConfirm(true);
  }, [username, chatbotConfig.source]);

  // Function để xác nhận xóa lịch sử chat
  const confirmClearHistory = useCallback(async () => {
    setShowDeleteConfirm(false);
    setIsLoadingHistory(true);

    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        "accept": "application/json",
        "ngrok-skip-browser-warning": "69420",
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        API_ENDPOINTS.DELETE_CHAT_HISTORY(username, chatbotConfig.source),
        {
          method: "DELETE",
          headers: headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "ok") {
          setChatHistory([]);
          setMessages([]);
          showToastNotification(`🎉 Đã xóa thành công ${data.deleted_count} tin nhắn chat!`, "success");
        }
      } else {
        showToastNotification("❌ Có lỗi xảy ra khi xóa lịch sử chat. Vui lòng thử lại sau.", "error");
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      showToastNotification("❌ Có lỗi xảy ra khi xóa lịch sử chat. Vui lòng thử lại sau.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [username, chatbotConfig.source, showToastNotification]);

  const openQuizPractice = useCallback((chapters = []) => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    setApiUrl(API_ENDPOINTS.RANDOM_QUESTIONS(chatbotConfig.quizTopic, chapters));
    setIsQuizOpen(true);
  }, [chatbotConfig.quizTopic]);

  const handleToggleChapter = useCallback((chapterValue) => {
    setSelectedChapters((prev) => (
      prev.includes(chapterValue)
        ? prev.filter((value) => value !== chapterValue)
        : [...prev, chapterValue]
    ));
  }, []);

  const handleSelectAllChapters = useCallback(() => {
    setSelectedChapters(availableChapters.map((chapter) => chapter.value));
  }, [availableChapters]);

  const handleStartQuizWithSelectedChapters = useCallback(() => {
    if (selectedChapters.length === 0) {
      showToastNotification("Vui lòng chọn ít nhất một chương để luyện tập.", "error");
      return;
    }

    setShowChapterSelector(false);
    openQuizPractice(selectedChapters);
  }, [openQuizPractice, selectedChapters, showToastNotification]);

  const handleOpenQuiz = useCallback(async () => {
    if (!chatbotConfig.quizTopic || chatbotConfig.quizTopic === "tonghop") {
      openQuizPractice();
      return;
    }

    setIsLoadingChapters(true);
    try {
      const response = await fetch(API_ENDPOINTS.QUIZ_CHAPTERS(chatbotConfig.quizTopic));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Không thể tải danh sách chương.");
      }

      const chapters = data.chapters || [];
      if (chapters.length === 0) {
        openQuizPractice();
        return;
      }

      setAvailableChapters(chapters);
      setSelectedChapters(chapters.map((chapter) => chapter.value));
      setShowChapterSelector(true);
    } catch (error) {
      console.error("Error loading quiz chapters:", error);
      showToastNotification("Không thể tải danh sách chương. Hệ thống sẽ mở toàn bộ câu hỏi của môn này.", "error");
      openQuizPractice();
    } finally {
      setIsLoadingChapters(false);
    }
  }, [chatbotConfig.quizTopic, openQuizPractice, showToastNotification]);

  const handleExplanationRequest = useCallback(async (explanationData) => {
    const dataToSend = { ...explanationData, source: chatbotConfig.source };
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.MBA_EXPLANATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.explanations && data.explanations[0]) {
        let explanation = data.explanations[0].explanation;
        if (typeof explanation !== 'string') {
          if (explanation.text && typeof explanation.text === 'string') {
            explanation = explanation.text;
          } else {
            explanation = JSON.stringify(explanation);
          }
        }
        let parsedText;
        try {
          parsedText = JSON.parse(explanation);
        } catch (parseError) {
          parsedText = { response: explanation, sources: [] };
        }
        const extractedText = parsedText.response || explanation;
        const sources = parsedText.sources || [];
        const botMessage = {
          id: uuidv4(),
          text: extractedText,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          sources: sources,
        };
        setMessages(prev => [...prev, botMessage]);
        if (isSpeakerActive) {
          speakText(botMessage.text);
        }
      }
    } catch (error) {
      const errorMessage = {
        id: uuidv4(),
        text: "Có lỗi xảy ra khi tải giải thích. Vui lòng thử lại sau.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfig.source, isSpeakerActive, speakText, setIsLoading]);

  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() !== "" && !isLoading) {
      setIsLoading(true);
      setLoadingMessageIndex(0); // Reset loading message index

      const newMessage = {
        id: uuidv4(),
        text: inputMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");
      try {
        let apiEndpoint;
        if (chatbotConfig.id === 0) {
          apiEndpoint = API_ENDPOINTS.MBA_RAG_TONGHOP(timestamp, inputMessage);
        } else {
          apiEndpoint = API_ENDPOINTS.RAG(username, inputMessage, chatbotConfig.source, true);
        }

        const token = localStorage.getItem('access_token');
        const headers = new Headers({
          "ngrok-skip-browser-warning": "69420",
        });

        if (token && chatbotConfig.id !== 0) {
          headers.append('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: headers,
        });
        const result = await response.json();
        let botResponse;
        if (chatbotConfig.id === 0) {
          botResponse = {
            id: uuidv4(),
            text: result.text,
            sender: "bot",
            timestamp: new Date().toLocaleTimeString(),
            sources: Object.entries(result.source || {}).map(([key, value]) => `${key}: ${value}`),
          };
        } else {
          botResponse = {
            id: uuidv4(),
            text: result.answer.response,
            sender: "bot",
            timestamp: new Date().toLocaleTimeString(),
            sources: result.answer.sources.map(source => `${source.file_name}: ${source.text}`),
          };
        }
        setMessages(prev => [...prev, botResponse]);
        if (isSpeakerActive) {
          speakText(botResponse.text);
        }
      } catch (error) {
        const errorMessage = {
          id: uuidv4(),
          text: "Error, cannot connect to server",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputMessage, isLoading, chatbotConfig.id, chatbotConfig.source, username, isSpeakerActive, speakText, setIsLoading]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleVoiceInput = useCallback(() => {
    if (isVoiceInputActive) {
      speechRecognition.current.stop();
    } else {
      speechRecognition.current.start();
    }
    setIsVoiceInputActive(!isVoiceInputActive);
  }, [isVoiceInputActive]);

  const handleToggleSpeaker = useCallback((messageText) => {
    if (!isSpeakerActive) {
      speakText(messageText);
    }
    toggleSpeaker();
  }, [isSpeakerActive, speakText, toggleSpeaker]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
    if ("webkitSpeechRecognition" in window) {
      speechRecognition.current = new window.webkitSpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      speechRecognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join("");
        setInputMessage(transcript);
      };
      speechRecognition.current.onerror = (event) => {
        setIsVoiceInputActive(false);
      };
    }
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatbotConfig && chatbotConfig.source && username) {
      loadChatHistory();
    }
  }, [chatbotConfig.source, username]);

  useEffect(() => {
    setChatHistory([]);
    setMessages([]);
  }, [chatbotConfig.source]);

  // Effect để thay đổi loading message theo thời gian
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2000); // Thay đổi message mỗi 2 giây
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadingMessages.length]);

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      <style>{`
        @keyframes loadingProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div ref={chatHistoryRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Đang tải lịch sử chat...</span>
          </div>
        )}
        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex justify-center items-center py-12 bg-gray-50">
            <div className="relative bg-white text-gray-700 rounded-xl shadow-sm p-6 text-center max-w-md transform transition-all hover:scale-102 duration-200">
              {/* Icon nhẹ nhàng */}
              <div className="text-4xl mb-3">🌟</div>

              {/* Tiêu đề thanh lịch */}
              <h1 className="font-semibold text-2xl mb-2 text-gray-800">
                Xin chào!
              </h1>

              {/* Mô tả tối giản */}
              <p className="text-sm text-gray-500 leading-relaxed">
                Tôi là trợ lý AI.
                Hỏi tôi bất cứ điều gì hoặc bắt đầu trò chuyện nhé!
              </p>

              {/* Nút đơn giản */}
              {/* <button className="mt-5 px-5 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200">
        Khám phá ngay
      </button> */}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800"} rounded-lg p-3 ${message.sender === "user" ? "rounded-br-none" : "rounded-bl-none"} shadow-md break-words ${message.historyId ? "opacity-90 border-l-4 border-gray-300" : ""}`}>
              <ReactMarkdown className="text-sm whitespace-normal mb-1">{message.text}</ReactMarkdown>
              <div className="flex justify-between items-center mt-2 text-xs">
                <p className={`${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>
                  {message.historyId && <span className="text-xs opacity-70">📜 </span>}
                  {message.timestamp}
                </p>
                {/* {message.sender === "bot" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleSpeaker(message.text)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {isSpeakerActive ? (
                        <FaVolumeUp className="w-4 h-4" />
                      ) : (
                        <FaVolumeMute className="w-4 h-4" />
                      )}
                    </button>
                    {message.sources && (
                      <button
                        onClick={() => toggleSourcePopup(message.sources)}
                        className="text-blue-500 hover:underline focus:outline-none"
                      >
                        View Sources
                      </button>
                    )}
                  </div>
                )} */}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg bg-white text-gray-800 rounded-lg p-4 rounded-bl-none shadow-md border-l-4 border-blue-400">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl animate-pulse">{loadingMessages[loadingMessageIndex].emoji}</span>
                    <span className="text-sm font-medium text-gray-700 animate-pulse">
                      {loadingMessages[loadingMessageIndex].text}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="animate-pulse">{loadingMessages[loadingMessageIndex].subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar animation */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
                <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{
                  width: '0%',
                  animation: 'loadingProgress 3s ease-in-out infinite'
                }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn…"
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="1"
          />
          <button
            onClick={handleOpenQuiz}
            disabled={isLoadingChapters}
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 focus:outline-none flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FaQuestionCircle className="w-5 h-5" />
            <span>{isLoadingChapters ? "Đang tải..." : "Luyện tập"}</span>
          </button>
          <button
            onClick={clearChatHistory}
            className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 focus:outline-none transition-colors duration-200"
            title="Xóa lịch sử chat"
          >
            <FaTrash className="w-4 h-4" />
          </button>
          {/* <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-full ${isVoiceInputActive ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"} hover:bg-opacity-80 focus:outline-none`}
          >
            <FaMicrophone className="w-4 h-4" />
          </button> */}
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none"
          >
            <FaPaperPlane className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isQuizOpen && (
        <QuizPopup
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          apiUrl={apiUrl}
          onExplanationRequest={handleExplanationRequest}
        />
      )}

      {showChapterSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chọn chương luyện tập
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Chọn một hoặc nhiều chương trắc nghiệm để hệ thống lấy câu hỏi luyện tập.
            </p>

            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {availableChapters.map((chapter) => {
                const checked = selectedChapters.includes(chapter.value);
                return (
                  <label
                    key={chapter.value}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleChapter(chapter.value)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-800">{chapter.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {chapter.count} câu
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                type="button"
                onClick={() => setSelectedChapters([])}
                className="text-gray-600 hover:text-gray-800"
              >
                Bỏ chọn hết
              </button>
              <button
                type="button"
                onClick={handleSelectAllChapters}
                className="text-blue-600 hover:text-blue-800"
              >
                Chọn tất cả
              </button>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowChapterSelector(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleStartQuizWithSelectedChapters}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Bắt đầu luyện tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa lịch sử */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <FaTrash className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Xóa lịch sử chat
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmClearHistory}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out">
          <div className={`px-6 py-3 bg-white shadow-xl rounded-full border ${toastType === "success"
            ? "border-green-200 bg-gradient-to-r from-green-50 to-white"
            : "border-red-200 bg-gradient-to-r from-red-50 to-white"
            } flex items-center space-x-3 min-w-fit`}>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full ${toastType === "success" ? "bg-green-500" : "bg-red-500"
              }`}>
              {toastType === "success" ? (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
              {toastMessage}
            </span>

            <button
              onClick={() => setShowToast(false)}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors duration-200 ml-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(UnifiedChatbot); 
