import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FaRobot,
  FaQuestion,
  FaExclamationTriangle,
  FaHome,
  FaComments,
  FaTimes,
} from "react-icons/fa";

const HomePage = () => {
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Thêm state kiểm tra đăng nhập

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập (thay thế bằng logic thực tế của bạn)
    checkLoginStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("message") === "login_required") {
      setShowLoginWarning(true);
      
      params.delete("message");
      const newSearch = params.toString();
      window.history.replaceState({}, document.title, window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      
      const timer = setTimeout(() => {
        setShowLoginWarning(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Hàm kiểm tra đăng nhập (thay thế bằng logic thực tế của bạn)
  const checkLoginStatus = () => {
    // Giả sử bạn có một cách để kiểm tra trạng thái đăng nhập
    // Ví dụ: kiểm tra token trong localStorage
    const token = sessionStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  };

  const handleCloseWarning = () => {
    setShowLoginWarning(false);
  };

  const handleButtonClick = () => {
    if (!isLoggedIn) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang login
      window.location.href = '/chat/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100">
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-16 flex flex-col md:flex-row items-center justify-between relative">
        <div
          className={`fixed top-20 right-0 transform transition-transform duration-500 ease-in-out ${
            showLoginWarning ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 shadow-lg mr-4 rounded-lg border-l-4 border-red-600 flex items-start" role="alert">
            <div className="flex-1">
              <p className="font-bold text-lg mb-1">Warning!</p>
              <p className="text-white/90">You need to login to use this feature.</p>
            </div>
            <button 
              onClick={handleCloseWarning}
              className="ml-4 text-white/90 hover:text-white transition-colors duration-200"
              aria-label="Close warning"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Hello! I am PTIT Chatbot.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Helps you answer questions and look up information quickly and most accurately.
          </p>
          {isLoggedIn ? (
            <a
              href="https://mba.ptit.edu.vn/chat/chat"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
            >
              Start Chatting
            </a>
          ) : (
            <a
              href="https://mba.ptit.edu.vn/chat/login"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
            >
              Login
            </a>
          )}
        </div>
        <div className="md:w-1/2 flex justify-center">
          <img
            src="https://mba.tcnj.edu/wp-content/uploads/sites/217/2023/10/mba.jpg"
            alt="Friendly Chatbot"
            className="w-full max-w-md rounded-lg shadow-2xl"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;