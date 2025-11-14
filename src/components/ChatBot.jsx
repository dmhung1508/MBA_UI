import React, { useState, useEffect } from "react";
import { FaBars, FaChevronLeft, FaHome, FaComment } from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";
import UnifiedChatbot from "./UnifiedChatbot";
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const ChatUI = () => {
  const [chatbots, setChatbots] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatHistories, setChatHistories] = useState({});
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const [isSourcePopupOpen, setIsSourcePopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSources, setSelectedSources] = useState([]);
  const [expandedSources, setExpandedSources] = useState({});
  const [currentView, setCurrentView] = useState("chat");

  const speechSynthesis = window.speechSynthesis;

  // Fetch chatbots from API
  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        const response = await fetch('https://api.dinhmanhhung.net/auth_mini/chatbots');
        const data = await response.json();
        
        setChatbots(data.chatbots);
        
        // Set current chat to first chatbot
        if (data.chatbots.length > 0) {
          setCurrentChat(data.chatbots[0]);
        }
        
        // Initialize chat histories for all chatbots
        const initialHistories = {};
        data.chatbots.forEach(chatbot => {
          initialHistories[chatbot.id] = [
            {
              id: 1,
              text: `Rất vui được gặp bạn, mình là LISA, trợ lí cho môn học ${chatbot.name}. Mình có thể giúp gì cho bạn không?`,
              sender: "bot",
              timestamp: new Date().toLocaleTimeString(),
              sources: []
            }
          ];
        });
        setChatHistories(initialHistories);
        
      } catch (error) {
        console.error('Error fetching chatbots:', error);
        // Fallback to default chatbots if API fails
        const defaultChatbots = [
          { id: 0, name: "Tổng hợp", source: "tonghop", quizTopic: "tonghop", avatar: "https://cdn-icons-png.flaticon.com/512/1698/1698535.png" }
        ];
        setChatbots(defaultChatbots);
        setCurrentChat(defaultChatbots[0]);
        setChatHistories({
          0: [
            { id: 1, text: "Rất vui được gặp bạn, mình là LISA, trợ lí cho môn học MBA. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] }
          ]
        });
      }
    };

    fetchChatbots();
  }, []);

  const toggleSpeaker = () => {
    if (isSpeakerActive) {
      speechSynthesis.cancel();
    }
    setIsSpeakerActive(!isSpeakerActive);
  };

  const speakText = async (text) => {
    const url = 'https://api.fpt.ai/hmi/tts/v5';
    const payload = text;
    const headers = {
      'api-key': 'BZGsVoIYFBjbh24kYrIHHBR9oJDId87Y',
      'speed': '',
      'voice': 'linhsan'
    };

    try {
      // Step 1: Send request to get MP3 URL
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
      });

      const result = await response.json();
      const mp3Url = result.async;

      // Step 2: Wait for the MP3 URL to be ready and fetch the audio file
      let audioReady = false;
      let audio = null;

      while (!audioReady) {
        try {
          audio = new Audio(mp3Url);
          await audio.play();
          audioReady = true;
        } catch (error) {
          console.log("Waiting for audio to be ready...");
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        }
      }
    } catch (error) {
      console.error("Error speaking text:", error);
    }
  };

  const toggleSourcePopup = (sources) => {
    setSelectedSources(sources || []);
    setIsSourcePopupOpen(!isSourcePopupOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderIntroduction = () => {
    window.location.href = "https://api.dinhmanhhung.net/mini/";
  };

  const handleSendMessage = (chatbotId, newMessage) => {
    setChatHistories((prevHistories) => ({
      ...prevHistories,
      [chatbotId]: [...prevHistories[chatbotId], newMessage],
    }));
  };

  // Show loading if chatbots haven't loaded yet
  if (chatbots.length === 0 || !currentChat) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-full md:w-1/4 lg:w-1/5' : 'w-0'} bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out absolute md:relative z-10 h-full`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Chatbots</h2>
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <FaChevronLeft className="w-5 h-5" />
          </button>
        </div>
        {chatbots.map((chatbot) => (
          <div
            key={chatbot.id}
            className={`flex items-center p-4 hover:bg-gray-100 cursor-pointer ${currentChat.id === chatbot.id ? "bg-blue-50" : ""}`}
            onClick={() => {
              setCurrentChat(chatbot);
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
          >
            <img
              src={chatbot.avatar}
              alt={chatbot.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h3 className="font-semibold">{chatbot.name}</h3>
              <p className="text-sm text-gray-500 truncate">{chatbot.lastMessage || "Sẵn sàng trò chuyện"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={toggleSidebar} className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none">
                <FaBars className="w-5 h-5" />
              </button>
            )}
            <img
              src={currentChat.avatar}
              alt={currentChat.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h2 className="font-semibold">{currentChat.name}</h2>
              <div className="flex items-center text-sm text-green-500">
                <BsCircleFill className="w-2 h-2 mr-1" />
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView("home")}
              className={`p-3 rounded-full text-lg ${currentView === "home" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"} hover:bg-opacity-80 focus:outline-none transition-colors duration-200`}
              title="Home"
            >
              <FaHome className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentView("chat")}
              className={`p-3 rounded-full text-lg ${currentView === "chat" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"} hover:bg-opacity-80 focus:outline-none transition-colors duration-200`}
              title="Chat"
            >
              <FaComment className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        {currentView === "home" ? (
          renderIntroduction()
        ) : (
          <UnifiedChatbot
            chatbotConfig={currentChat}
            isSpeakerActive={isSpeakerActive}
            toggleSpeaker={toggleSpeaker}
            speakText={speakText}
            toggleSourcePopup={toggleSourcePopup}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            messages={chatHistories[currentChat.id] || []}
            onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
          />
        )}
      </div>

      {/* Source Popup */}
      {isSourcePopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Nguồn tham khảo</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSources.length} nguồn được tìm thấy
                </p>
              </div>
              <button
                onClick={() => toggleSourcePopup([])}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {Array.isArray(selectedSources) && selectedSources.length > 0 ? (
                <div className="space-y-4">
                  {selectedSources.map((source, index) => {
                    let displayText = '';
                    let fileName = '';
                    let fileInfo = '';
                    
                    if (typeof source === 'string') {
                      displayText = source;
                    } else if (source && typeof source === 'object') {
                      displayText = source.text || '';
                      fileName = source.file_name || `Nguồn ${index + 1}`;
                      if (source.creation_date) {
                        fileInfo = `Ngày tạo: ${source.creation_date}`;
                      }
                    }
                    
                    const isExpanded = expandedSources[index];
                    const maxLength = 300;
                    const shouldTruncate = displayText.length > maxLength;
                    const textToShow = isExpanded || !shouldTruncate 
                      ? displayText 
                      : displayText.substring(0, maxLength) + '...';
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Source Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded">
                                  {index + 1}
                                </span>
                                <h4 className="font-semibold text-gray-800 text-sm">
                                  {fileName}
                                </h4>
                              </div>
                              {fileInfo && (
                                <p className="text-xs text-gray-500 mt-1 ml-8">{fileInfo}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Source Content */}
                        <div className="bg-white p-4">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                              {textToShow}
                            </p>
                          </div>
                          
                          {shouldTruncate && (
                            <button
                              onClick={() => setExpandedSources(prev => ({
                                ...prev,
                                [index]: !prev[index]
                              }))}
                              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              {isExpanded ? '← Thu gọn' : 'Xem thêm →'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-center">Không có nguồn tham khảo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatUI;