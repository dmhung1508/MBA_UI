import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaPaperPlane, FaQuestionCircle, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import QuizPopup from './QuizPopup';

const timestamp = `${Date.now()}-${uuidv4()}`;

const Chatbot1 = ({ 
  isSpeakerActive, 
  toggleSpeaker, 
  speakText, 
  toggleSourcePopup, 
  isLoading, 
  setIsLoading, 
  messages, 
  onSendMessage 
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const chatHistoryRef = useRef(null);
  const speechRecognition = useRef(null);
  const inactivityTimerRef = useRef(null);

  const handleOpenQuiz = () => {
    setIsQuizOpen(true);
    setApiUrl("https://mba.ptit.edu.vn/api/random-questions?topic=mcl");
  };

  const handleExplanationRequest = async (explanationData) => {
    const mySource = "maketingchienluoc";
    const dataToSend = { ...explanationData, source: mySource };

    setIsLoading(true);

    try {
      const response = await fetch('https://mba.ptit.edu.vn/rag_api/explanation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

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
          console.error('Error parsing explanation JSON:', parseError);
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
        console.log('Bot message:', botMessage);

        onSendMessage(botMessage);

        if (isSpeakerActive) {
          speakText(botMessage.text);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: uuidv4(),
        text: "Có lỗi xảy ra khi tải giải thích. Vui lòng thử lại sau.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      onSendMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "" && !isLoading) {
      setIsLoading(true);
      const newMessage = {
        id: uuidv4(),
        text: inputMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(),
      };
      onSendMessage(newMessage);
      setInputMessage("");

      try {
        const response = await fetch(`https://mba.ptit.edu.vn/rag_api/tonghop/?time=${timestamp}&q=${encodeURIComponent(inputMessage)}&source=maketingchienluoc`, {
          method: "GET",
          headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
          }),
        });
        const result = await response.json();

        const botResponse = {
          id: uuidv4(),
          text: result.text,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          sources: Object.entries(result.source).map(([key, value]) => `${key}: ${value}`),
        };
        onSendMessage(botResponse);

        if (isSpeakerActive) {
          speakText(botResponse.text);
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = {
          id: uuidv4(),
          text: "Error, cannot connect to server",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
        };
        onSendMessage(errorMessage);
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

  const handleToggleSpeaker = (messageText) => {
    if (!isSpeakerActive) {
      speakText(messageText);
    }
    toggleSpeaker();
  };

  useEffect(() => {
    // Tự động cuộn xuống cuối khi có tin nhắn mới
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }

    // Cấu hình nhận diện giọng nói
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
    } else {
      console.log("Speech recognition not supported");
    }

    // Dọn dẹp khi component unmount
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Thêm useEffect để cuộn xuống cuối khi messages thay đổi
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // Theo dõi sự không hoạt động của người dùng
  useEffect(() => {
    // Xóa timer hiện tại nếu có
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Lấy tin nhắn cuối cùng
    const lastMessage = messages[messages.length - 1];

    if (lastMessage) {
      if (lastMessage.sender === 'bot' && !lastMessage.isQuizSuggestion) {
        // Nếu tin nhắn cuối là từ bot và không phải là gợi ý quiz, bắt đầu timer
        inactivityTimerRef.current = setTimeout(() => {
          // Sau 30 giây không có phản hồi từ người dùng
          const suggestionMessage = {
            id: uuidv4(),
            text: "Cậu có thể làm bài trắc nghiệm để luyện tập thêm.",
            sender: "bot",
            timestamp: new Date().toLocaleTimeString(),
            isQuizSuggestion: true,
          };
          onSendMessage(suggestionMessage);
        }, 30000); // 30 giây
      }
    }

    // Dọn dẹp timer khi component unmount
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Lịch sử chat */}
      <div ref={chatHistoryRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          if (message.isQuizSuggestion) {
            // Render tin nhắn gợi ý với nút luyện tập
            return (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-xs lg:max-w-md xl:max-w-lg bg-white text-gray-800 rounded-lg p-3 rounded-bl-none shadow-md break-words">
                  <p className="text-sm whitespace-normal mb-1">{message.text}</p>
                  <button
                    onClick={handleOpenQuiz}
                    className="bg-green-500 text-white p-2 mt-2 rounded-full hover:bg-green-600 focus:outline-none flex items-center space-x-2"
                  >
                    <FaQuestionCircle className="w-5 h-5" />
                    <span>Luyện tập</span>
                  </button>
                </div>
              </div>
            );
          } else {
            let messageText = message.text;
            if (typeof messageText !== 'string') {
              messageText = JSON.stringify(messageText);
            }
            return (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800"} rounded-lg p-3 ${message.sender === "user" ? "rounded-br-none" : "rounded-bl-none"} shadow-md break-words`}>
                  <ReactMarkdown className="text-sm whitespace-normal mb-1">
                    {messageText}
                  </ReactMarkdown>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <p className={`${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>{message.timestamp}</p>
                    {message.sender === "bot" && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleSpeaker(messageText)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {isSpeakerActive ? (
                            <FaVolumeUp className="w-4 h-4" />
                          ) : (
                            <FaVolumeMute className="w-4 h-4" />
                          )}
                        </button>
                        {message.sources && message.sources.length > 0 && (
                          <button
                            onClick={() => toggleSourcePopup(message.sources)}
                            className="text-blue-500 hover:underline focus:outline-none"
                          >
                            View Sources
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        })}
        {isLoading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      {/* Khu vực nhập tin nhắn */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="1"
          />
          <button
            onClick={handleOpenQuiz}
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 focus:outline-none flex items-center space-x-2"
          >
            <FaQuestionCircle className="w-5 h-5" />
            <span>Luyện tập</span>
          </button>

          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-full ${isVoiceInputActive ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"} hover:bg-opacity-80 focus:outline-none`}
          >
            <FaMicrophone className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none"
          >
            <FaPaperPlane className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quiz Popup */}
      <QuizPopup 
        isOpen={isQuizOpen} 
        onClose={() => setIsQuizOpen(false)} 
        apiUrl={apiUrl}
        onRequestExplanation={handleExplanationRequest}
      />
    </div>
  );
};

export default Chatbot1;
