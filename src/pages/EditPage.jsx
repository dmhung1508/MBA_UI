import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaRobot, FaBars, FaTimes, FaPlus } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import Navbar from './Navbar';
import Footer from './Footer';
import AddSourceModal from '../components/AddSourceModal';
import SourceList from '../components/SourceList';
import { API_ENDPOINTS } from '../config/api';



const EditPage = () => {
  const [chatbots, setChatbots] = useState([]);
  const [chatbotsLoading, setChatbotsLoading] = useState(true);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const chatHistoryRef = useRef(null);
  const speechRecognition = useRef(null);

  // Permission states
  const [userRole, setUserRole] = useState('');
  const [assignedTopics, setAssignedTopics] = useState([]);

  const timestamp = `${Date.now()}-${uuidv4()}`;

  // Initialize user role and fetch data
  useEffect(() => {
    const role = localStorage.getItem('user_role') || '';
    setUserRole(role);

    if (role === 'teacher') {
      fetchTeacherTopics();
    } else if (role === 'admin') {
      fetchChatbots();
    }
  }, []);

  // Fetch teacher's assigned topics
  const fetchTeacherTopics = async () => {
    try {
      setChatbotsLoading(true);
      const response = await fetch(API_ENDPOINTS.TEACHER_MY_TOPICS, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const topics = data.assigned_topics || [];
        console.log('Teacher assigned topics:', topics);
        setAssignedTopics(topics);

        // Fetch all chatbots and filter by assigned topics
        const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS);
        const chatbotsData = await chatbotsResponse.json();

        if (chatbotsData.chatbots) {
          const filteredChatbots = chatbotsData.chatbots.filter(cb =>
            topics.includes(cb.source)
          );
          console.log('Filtered chatbots for teacher:', filteredChatbots);
          setChatbots(filteredChatbots);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher topics:', error);
      setChatbots([]);
    } finally {
      setChatbotsLoading(false);
    }
  };

  // Fetch all chatbots (for admin)
  const fetchChatbots = async () => {
    try {
      setChatbotsLoading(true);
      const response = await fetch(API_ENDPOINTS.CHATBOTS);
      const data = await response.json();
      setChatbots(data.chatbots || []);
    } catch (err) {
      console.error('Không thể tải danh sách chatbot:', err);
      setChatbots([]);
    } finally {
      setChatbotsLoading(false);
    }
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }

    // Setup speech recognition
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
        console.error("Speech recognition error", event.error);
        setIsVoiceInputActive(false);
      };
    }

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, [messages]);

  const handleChatbotSelect = (chatbot) => {
    setSelectedChatbot(chatbot);
    setMessages([
      {
        id: uuidv4(),
        text: `Xin chào! Tôi là trợ lý AI cho môn ${chatbot.name}. Tôi có thể giúp gì cho bạn?`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        sources: []
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "" && !isLoading && selectedChatbot) {
      setIsLoading(true);
      const newMessage = {
        id: uuidv4(),
        text: inputMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");

      try {
        const token = localStorage.getItem('access_token');
        const headers = new Headers({
          "ngrok-skip-browser-warning": "69420",
        });

        if (token) {
          headers.append('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(API_ENDPOINTS.RAG(timestamp, inputMessage, selectedChatbot.source, false), {
          method: "GET",
          headers: headers,
        });
        const result = await response.json();

        // Parse sources to match the expected format
        const sources = result.answer.sources.map(source => ({
          id: source.id || uuidv4(),
          text: source.text || source.content || '',
          file_name: source.file_name || 'Unknown',
          file_type: source.file_type || 'text',
          file_size: source.file_size || 0,
          creation_date: source.creation_date || new Date().toISOString().split('T')[0],
          last_modified_date: source.last_modified_date || new Date().toISOString().split('T')[0],
          score: source.score || 0.5,
          section_summary: source.section_summary || ''
        }));

        const botResponse = {
          id: uuidv4(),
          text: result.answer.response,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          sources: sources,
        };
        setMessages(prev => [...prev, botResponse]);

      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          id: uuidv4(),
          text: "Lỗi kết nối đến server. Vui lòng thử lại sau.",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          sources: []
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (isVoiceInputActive) {
      speechRecognition.current.stop();
    } else {
      speechRecognition.current.start();
    }
    setIsVoiceInputActive(!isVoiceInputActive);
  };

  const handleAddSource = (message) => {
    // Tìm câu hỏi của user trước message bot này
    const messageIndex = messages.findIndex(m => m.id === message.id);
    const userQuestion = messageIndex > 0 ? messages[messageIndex - 1] : null;

    setSelectedMessage({
      ...message,
      userQuestion: userQuestion?.text || ''
    });
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    console.log('Source added successfully');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="flex h-screen pt-20" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Sidebar - Chatbot Selection */}
        <div className={`${isSidebarOpen ? 'w-full md:w-1/4 lg:w-1/5' : 'w-0'} bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out absolute md:relative z-10 h-full`}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-red-600">Chọn Chatbot</h2>
              {userRole === 'teacher' && (
                <p className="text-xs text-blue-600 mt-1">
                  Quyền: Teacher ({assignedTopics.length} chủ đề được phân công)
                </p>
              )}
            </div>
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {chatbotsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : chatbots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaRobot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="mb-2">
                  {userRole === 'teacher' ? 'Chưa được phân công chatbot nào' : 'Không có chatbot nào'}
                </p>
                {userRole === 'teacher' && (
                  <p className="text-xs text-gray-400">
                    Liên hệ admin để được assign topics
                  </p>
                )}
              </div>
            ) : (
              chatbots.map((chatbot) => (
                <div
                  key={chatbot.id}
                  className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-colors ${selectedChatbot?.id === chatbot.id
                    ? "bg-red-50 border-2 border-red-200"
                    : "hover:bg-gray-100"
                    }`}
                  onClick={() => handleChatbotSelect(chatbot)}
                >
                  <img
                    src={chatbot.avatar}
                    alt={chatbot.name}
                    className="w-10 h-10 rounded-full mr-3"
                    onError={(e) => {
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png';
                    }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{chatbot.name}</h3>
                    <p className="text-sm text-gray-500">Chatbot {chatbot.id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center">
              {!isSidebarOpen && (
                <button onClick={toggleSidebar} className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none">
                  <FaBars className="w-5 h-5" />
                </button>
              )}
              {selectedChatbot ? (
                <>
                  <img
                    src={selectedChatbot.avatar}
                    alt={selectedChatbot.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedChatbot.name}</h2>
                    <div className="flex items-center text-sm text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Trực tuyến</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center">
                  <FaRobot className="w-10 h-10 text-gray-400 mr-3" />
                  <h2 className="font-semibold text-gray-500">Chọn một chatbot để bắt đầu</h2>
                </div>
              )}
            </div>
          </div>

          {selectedChatbot ? (
            <>
              {/* Chat Messages */}
              <div ref={chatHistoryRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === "user" ? "bg-red-600 text-white" : "bg-white text-gray-800"} rounded-lg p-4 shadow-md break-words`}>
                      <ReactMarkdown className="text-sm whitespace-normal mb-2">{message.text}</ReactMarkdown>
                      <div className="flex justify-between items-center text-xs">
                        <p className={`${message.sender === "user" ? "text-red-200" : "text-gray-500"}`}>{message.timestamp}</p>
                      </div>

                      {/* Add Source Button for Bot Messages */}
                      {message.sender === "bot" && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleAddSource(message)}
                            className="w-full text-sm text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded transition-colors flex items-center justify-center"
                            title="Đóng góp thông tin chính xác"
                          >
                            <FaPlus className="mr-2" size={12} />
                            Đóng góp thông tin đúng
                          </button>
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <SourceList
                          sources={message.sources}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows="1"
                    disabled={isLoading}
                  />
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-3 rounded-full ${isVoiceInputActive ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"} hover:bg-opacity-80 focus:outline-none transition-colors`}
                    disabled={isLoading}
                  >
                    <FaMicrophone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 focus:outline-none transition-colors disabled:opacity-50"
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <FaPaperPlane className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FaRobot className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">Chọn một chatbot</h3>
                <p className="text-gray-400">
                  Chọn một trong {chatbots.length} chatbot chuyên môn để bắt đầu trò chuyện và chỉnh sửa nguồn.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        fileId={selectedChatbot?.source || ''}
        question={selectedMessage?.userQuestion || ''}
        botAnswer={selectedMessage?.text}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <Footer />
    </div>
  );
};

export default EditPage;
