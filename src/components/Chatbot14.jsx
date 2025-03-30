import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaPaperPlane, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";
import { v4 as uuidv4 } from 'uuid';

const timestamp = `${Date.now()}-${uuidv4()}`;
const Chatbot14 = ({ isSpeakerActive, toggleSpeaker, speakText, toggleSourcePopup, isLoading, setIsLoading }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there!", sender: "user", timestamp: new Date().toLocaleTimeString() },
    { id: 2, text: "Hello! How can I assist you today?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const chatHistoryRef = useRef(null);
  const speechRecognition = useRef(null);

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
        console.error("Speech recognition error", event.error);
        setIsVoiceInputActive(false);
      };
    } else {
      console.log("Speech recognition not supported");
    }

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "" && !isLoading) {
      setIsLoading(true);
      const newMessage = {
        id: messages.length + 1,
        text: inputMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputMessage("");

      try {
        const response = await fetch(`https://sculpin-winning-feline.ngrok-free.app/rag/?time=${timestamp}&q=${inputMessage}&source=chatbot14`, {
          method: "get",
          headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
          }),
        });
        const result = await response.json();
        const botResponse = {
          id: messages.length + 2,
          text: result.result,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
          sources: result.source_documents.map(doc => doc.page_content),
        };
        setMessages((prevMessages) => [...prevMessages, botResponse]);

        if (isSpeakerActive) {
          speakText(botResponse.text);
        }
      } catch (error) {
        const errorMessage = {
          id: messages.length + 2,
          text: "Error, cannot connect to server",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
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

  return (
    <div className="relative flex flex-col h-[600px] bg-gray-100 overflow-hidden">
      <div ref={chatHistoryRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-[80px]">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800"} rounded-lg p-3 ${message.sender === "user" ? "rounded-br-none" : "rounded-bl-none"} shadow-md`}>
              <p className="text-sm whitespace-pre-wrap mb-1">{message.text}</p>
              <div className="flex justify-between items-center mt-2 text-xs">
                <p className={`${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>{message.timestamp}</p>
                {message.sender === "bot" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        toggleSpeaker();
                        if (!isSpeakerActive) {
                          speakText(message.text);
                        }
                      }}
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
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="1"
          />
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
    </div>
  );
};

export default Chatbot14;