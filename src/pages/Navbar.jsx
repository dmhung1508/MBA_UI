// Navbar.jsx
import React, { useState, useEffect } from "react";
import {
  FaRobot,
  FaBars,
  FaTimes,
  FaHome,
  FaComments,
  FaSignInAlt,
  FaUserPlus,
  FaUser,
  FaSignOutAlt,
  FaHistory
} from "react-icons/fa";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component được mount
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    const handleStorageChange = () => {
      const updatedToken = sessionStorage.getItem("access_token");
      setIsLoggedIn(!!updatedToken);
    };

    // Lắng nghe sự thay đổi của sessionStorage
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Xử lý sự kiện scroll để thay đổi giao diện navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    setIsLoggedIn(false);
    // Chuyển hướng về trang chủ sau khi đăng xuất
    window.location.href = "/chat/"; 
  };

  // Hàm xử lý khi người dùng nhấn vào Chat
  const handleChatClick = (e) => {
    e.preventDefault(); // Ngăn chặn hành động mặc định của liên kết
    if (isLoggedIn) {
      window.location.href = "/chat/chat"; // Chuyển hướng đến trang Chat
    } else {
      window.location.href = "/chat/?message=login_required"; // Chuyển hướng về trang Home với thông báo cảnh báo
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-red-700 bg-opacity-90 shadow-lg" : "bg-red-600"
        }`}
      >
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <a href="/chat/" className="text-2xl font-bold text-white flex items-center">
              <FaRobot className="mr-2" />
              PTIT Chatbot
            </a>
            <div className="hidden md:flex space-x-6 ml-8">
              <a
                href="http://localhost:5173/chat/"
                className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full"
              >
                <FaHome className="mr-2" /> Trang chủ
              </a>
              <a
                href="/chat/chat"
                onClick={handleChatClick}
                className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full cursor-pointer"
              >
                <FaComments className="mr-2" /> Hỏi chatbot
              </a>
              {isLoggedIn && (
                <a
                  href="/chat/quiz-history"
                  className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full"
                >
                  <FaHistory className="mr-2" /> Lịch sử chat
                </a>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <a
                  href="/chat/login"
                  className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full"
                >
                  <FaSignInAlt className="mr-2" /> Đăng nhập
                </a>
                <a
                  href="/chat/signup"
                  className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full"
                >
                  <FaUserPlus className="mr-2" /> Đăng ký
                </a>
              </>
            ) : (
              <>
                <a
                  href="/chat/account"
                  className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full"
                >
                  <FaUser className="mr-2" /> Tài khoản
                </a>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-pink-300 transition transform hover:scale-110 flex items-center bg-red-500 px-3 py-2 rounded-full"
                >
                  <FaSignOutAlt className="mr-2" /> Đăng xuất
                </button>
              </>
            )}
          </div>

          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </nav>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-red-700 bg-opacity-95 md:hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <a
              href="http://localhost:5173/chat/"
              className="text-white text-2xl hover:text-pink-300 transition"
            >
              Trang chủ
            </a>
            <a
              href="/chat/chat"
              onClick={handleChatClick}
              className="text-white text-2xl hover:text-pink-300 transition cursor-pointer"
            >
              Hỏi chatbot
            </a>
            {isLoggedIn && (
              <a
                href="/chat/quiz-history"
                className="text-white text-2xl hover:text-pink-300 transition"
              >
                Test History
              </a>
            )}
            {!isLoggedIn ? (
              <>
                <a
                  href="http://localhost:5173/chat/login"
                  className="text-white text-2xl hover:text-pink-300 transition"
                >
                  Đăng nhập
                </a>
                <a
                  href="http://localhost:5173/chat/signup"
                  className="text-white text-2xl hover:text-pink-300 transition"
                >
                  Đăng ký
                </a>
              </>
            ) : (
              <>
                <a
                  href="http://localhost:5173/chat/account"
                  className="text-white text-2xl hover:text-pink-300 transition"
                >
                  Tài khoản
                </a>
                <button
                  onClick={handleLogout}
                  className="text-white text-2xl hover:text-pink-300 transition"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
