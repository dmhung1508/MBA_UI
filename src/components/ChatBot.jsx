import React, { useState, useEffect } from "react";
import { FaBars, FaChevronLeft, FaHome, FaComment } from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";
import Chatbot1 from "./Chatbot1";
import Chatbot2 from "./Chatbot2";
import Chatbot3 from "./Chatbot3";
import Chatbot4 from "./Chatbot4";
import Chatbot5 from "./Chatbot5";
import Chatbot6 from "./Chatbot6";
import Chatbot7 from "./Chatbot7";
import Chatbot8 from "./Chatbot8";
import Chatbot9 from "./Chatbot9";
import Chatbot10 from "./Chatbot10";
import Chatbot11 from "./Chatbot11";
import Chatbot12 from "./Chatbot12";
import Chatbot13 from "./Chatbot13";
// import Chatbot14 from "./Chatbot14";
// import Chatbot15 from "./Chatbot15";
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const ChatUI = () => {
  const [chatbots, setChatbots] = useState([
    { id: 0, name: "Tổng hợp", avatar: "https://cdn-icons-png.flaticon.com/512/1698/1698535.png", lastMessage: "" },
    { id: 1, name: "Marketing chiến lược", avatar: "https://cdn-icons-png.flaticon.com/512/1698/1698535.png", lastMessage: "" },
    { id: 2, name: "Kinh doanh toàn cầu", avatar: "https://cdn-icons-png.flaticon.com/128/8943/8943377.png", lastMessage: "" },
    { id: 3, name: "Khoa học dữ liệu", avatar: "https://cdn-icons-png.flaticon.com/128/2068/2068998.png", lastMessage: "" },
    { id: 4, name: "Quản trị tài chính và đầu tư", avatar: "https://cdn-icons-png.flaticon.com/128/17807/17807965.png", lastMessage: "" },
    { id: 5, name: "Quản trị vận hành", avatar: "https://cdn-icons-png.flaticon.com/128/10817/10817417.png", lastMessage: "" },
    { id: 6, name: "Quản trị sự thay đổi", avatar: "https://cdn-icons-png.flaticon.com/128/2593/2593622.png", lastMessage: "" },
    { id: 7, name: "Quản trị rủi ro", avatar: "https://cdn-icons-png.flaticon.com/128/2068/2068868.png", lastMessage: "" },
    { id: 8, name: "Quản trị nhân lực", avatar: "https://cdn-icons-png.flaticon.com/128/2593/2593635.png", lastMessage: "" },
    { id: 9, name: "Quản trị doanh nghiệp siêu lớn", avatar: "https://cdn-icons-png.flaticon.com/128/17807/17807964.png", lastMessage: "" },
    { id: 10, name: "Quản trị chiến lược", avatar: "https://cdn-icons-png.flaticon.com/128/2593/2593627.png", lastMessage: "" },
    { id: 11, name: "Nghệ thuật lãnh đạo", avatar: "https://cdn-icons-png.flaticon.com/128/10541/10541409.png", lastMessage: "" },
    { id: 12, name: "Nguyên tắc lãnh đạo", avatar: "https://cdn-icons-png.flaticon.com/128/5291/5291454.png", lastMessage: "" },
    // { id: 13, name: "Chatbot 13", avatar: "https://cdn-icons-png.flaticon.com/128/13330/13330989.png", lastMessage: "" },
    // { id: 14, name: "Chatbot 14", avatar: "https://cdn-icons-png.flaticon.com/128/6540/6540769.png", lastMessage: "" },
    // { id: 15, name: "Chatbot 15", avatar: "https://cdn-icons-png.flaticon.com/128/6873/6873405.png", lastMessage: "" },


  ]);
  const [currentChat, setCurrentChat] = useState(chatbots[0]);
  const [chatHistories, setChatHistories] = useState({
    0: [
      { id: 1, text: "Rất vui được gặp bạn, mình là LISA, trợ lí cho môn học MBA. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    1: [
      { id: 1, text: "Rất vui được gặp bạn, mình là LISA, trợ lí cho môn học marketing chiến lược. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    2: [
      { id: 1, text: "Xin chào! Mình là LISA, trợ lí cho môn học kinh doanh toàn cầu. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    3: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học khoa học dữ liệu. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    4: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị tài chính và đầu tư. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    5: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị vận hành. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    6: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị sự thay đổi. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    7: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị rủi ro. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    8: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị nhân lực. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    9: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị doanh nghiệp siêu lớn. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    10: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học quản trị chiến lược. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    11: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học nghệ thuật lãnh đạo. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    12: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học nguyên tắc lãnh đạo. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    13: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học Chatbot 13. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    14: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học Chatbot 14. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],
    15: [
      { id: 1, text: "Chào bạn! Mình là LISA, trợ lí cho môn học Chatbot 15. Mình có thể giúp gì cho bạn không?", sender: "bot", timestamp: new Date().toLocaleTimeString(), sources: [] },
    ],

  });
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const [isSourcePopupOpen, setIsSourcePopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSources, setSelectedSources] = useState([]);
  const [currentView, setCurrentView] = useState("chat");

  const speechSynthesis = window.speechSynthesis;

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
    // return (
    //   <div className="p-6">
    //     <h1 className="text-3xl font-bold mb-4">Welcome to Our Chatbot</h1>
    //     <p className="mb-4">Our chatbot is designed to assist you with various tasks and answer your questions. Here are some key features:</p>
    //     <ul className="list-disc list-inside mb-4">
    //       <li>24/7 availability</li>
    //       <li>Quick responses to common queries</li>
    //       <li>Ability to handle multiple topics</li>
    //       <li>Easy navigation and user-friendly interface</li>
    //       <li>Speech-to-text input for hands-free interaction</li>
    //       <li>Text-to-speech output for auditory feedback</li>
    //     </ul>
    //     <p>To get started, simply click on the chat button and select a chatbot to begin your conversation!</p>
    //   </div>
    // );
    window.location.href = "https://mba.ptit.edu.vn/chat/";
  };
  const handleSendMessage = (chatbotId, newMessage) => {
    setChatHistories((prevHistories) => ({
      ...prevHistories,
      [chatbotId]: [...prevHistories[chatbotId], newMessage],
    }));
  };

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
              <p className="text-sm text-gray-500 truncate">{chatbot.lastMessage}</p>
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
          <>
            {
              currentChat.id === 0 && (
                <Chatbot13
                  isSpeakerActive={isSpeakerActive}
                  toggleSpeaker={toggleSpeaker}
                  speakText={speakText}
                  toggleSourcePopup={toggleSourcePopup}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  messages={chatHistories[currentChat.id]}
                  onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
                />
              )
            }
            {currentChat.id === 1 && (
              <Chatbot1
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 2 && (
              <Chatbot2
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 3 && (
              <Chatbot3
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 4 && (
              <Chatbot4
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 5 && (
              <Chatbot5
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 6 && (
              <Chatbot6
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 7 && (
              <Chatbot7
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 8 && (
              <Chatbot8
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 9 && (
              <Chatbot9
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 10 && (
              <Chatbot10
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 11 && (
              <Chatbot11
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
            {currentChat.id === 12 && (
              <Chatbot12
                isSpeakerActive={isSpeakerActive}
                toggleSpeaker={toggleSpeaker}
                speakText={speakText}
                toggleSourcePopup={toggleSourcePopup}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                messages={chatHistories[currentChat.id]}
                onSendMessage={(newMessage) => handleSendMessage(currentChat.id, newMessage)}
              />
            )}
          </>
        )}
      </div>

      {/* Source Popup */}
      {isSourcePopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ResizableBox
            width={700}
            height={500}
            minConstraints={[300, 200]}
            maxConstraints={[900, 600]}
            className="bg-white p-6 rounded-lg overflow-auto"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header của Popup */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Sources</h3>
                <button
                  onClick={() => toggleSourcePopup([])}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none"
                >
                  Close
                </button>
              </div>

              {/* Nội dung Sources */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {selectedSources.map((source, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-200">
                    <p className="font-medium">{source}</p>
                  </div>
                ))}
              </div>
            </div>
          </ResizableBox>
        </div>
      )}
    </div>
  );
};

export default ChatUI;