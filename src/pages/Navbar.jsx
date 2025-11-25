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
  FaHistory,
  FaEdit,
  FaUserShield,
  FaFileAlt,
  FaQuestionCircle,
  FaChevronDown,
  FaCog,
  FaUsers,
  FaChalkboardTeacher,
  FaClipboardList
} from "react-icons/fa";
import { isTokenValid, clearAuthData } from "../utils/auth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component được mount
  useEffect(() => {
    // Kiểm tra token có hợp lệ không
    const tokenValid = isTokenValid();
    const userRole = localStorage.getItem("user_role");

    setIsLoggedIn(tokenValid);
    setIsAdmin(tokenValid && userRole === "admin");
    setIsTeacher(tokenValid && userRole === "teacher");

    const handleStorageChange = () => {
      const tokenValid = isTokenValid();
      const updatedUserRole = localStorage.getItem("user_role");
      setIsLoggedIn(tokenValid);
      setIsAdmin(tokenValid && updatedUserRole === "admin");
      setIsTeacher(tokenValid && updatedUserRole === "teacher");
    };

    // Lắng nghe sự thay đổi của localStorage
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

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAdminDropdownOpen && !event.target.closest('.relative')) {
        setIsAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAdminDropdownOpen]);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsTeacher(false);
    window.location.href = "/mini/";
  };

  // Hàm xử lý khi người dùng nhấn vào Chat
  const handleChatClick = (e) => {
    e.preventDefault(); // Ngăn chặn hành động mặc định của liên kết
    if (isLoggedIn) {
      window.location.href = "/mini/mini"; // Chuyển hướng đến trang Chat
    } else {
      window.location.href = "/mini/?message=login_required"; // Chuyển hướng về trang Home với thông báo cảnh báo
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200" : "bg-white/90 backdrop-blur-sm"
          }`}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            <a href="/mini/" className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <FaRobot className="text-white text-lg" />
              </div>
              <span className="truncate">MBA Chatbot</span>
            </a>

            {/* Desktop Menu - Only show if logged in */}
            {isLoggedIn && (
              <div className="hidden lg:flex items-center space-x-1 ml-6">
                <a
                  href="/mini/"
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg font-medium"
                >
                  <FaHome className="mr-1 text-sm" /> Trang chủ
                </a>
                <a
                  href="/mini/mini"
                  onClick={handleChatClick}
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg cursor-pointer font-medium"
                >
                  <FaComments className="mr-1 text-sm" /> Nhắn tin
                </a>
                <a
                  href="/mini/quiz-history"
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg font-medium"
                >
                  <FaHistory className="mr-1 text-sm" /> Lịch sử
                </a>
                {isTeacher && (
                  <>
                    <a
                      href="/mini/teacher"
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg font-medium"
                    >
                      <FaChalkboardTeacher className="mr-1 text-sm" /> Bảng điều khiển giảng viên
                    </a>
                    {/* <a
                      href="/mini/edit"
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg font-medium"
                    >
                      <FaEdit className="mr-1 text-sm" /> Chỉnh sửa
                    </a> */}
                    {/* <a
                      href="/mini/messages"
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg font-medium"
                    >
                      <FaComments className="mr-1 text-sm" /> Tin nhắn
                    </a> */}
                  </>
                )}
                {isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center px-2 py-2 rounded-lg font-medium"
                    >
                      <FaCog className="mr-1 text-sm" /> Quản trị
                      <FaChevronDown className={`ml-1 text-xs transition-transform duration-200 ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isAdminDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <a
                            href="/mini/edit"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaEdit className="mr-2 text-sm inline" /> Chỉnh sửa nguồn
                          </a>
                          <a
                            href="/mini/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaUserShield className="mr-2 text-sm inline" /> Quản lý Chatbot
                          </a>
                          <a
                            href="/mini/sources"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaFileAlt className="mr-2 text-sm inline" /> Quản lý File
                          </a>
                          <a
                            href="/mini/questions"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaQuestionCircle className="mr-2 text-sm inline" /> Quản lý Câu hỏi
                          </a>
                          <a
                            href="/mini/users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaUsers className="mr-2 text-sm inline" /> Quản lý Người dùng
                          </a>
                          <a
                            href="/mini/messages"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaComments className="mr-2 text-sm inline" /> Quản lý Tin nhắn
                          </a>
                          <a
                            href="/mini/logs"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <FaClipboardList className="mr-2 text-sm inline" /> Quản lý Logs
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {!isLoggedIn ? (
              <>
                <a
                  href="/mini/login"
                  className="text-gray-700 hover:text-red-600 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Đăng nhập
                </a>
                <a
                  href="/mini/signup"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                >
                  Đăng ký
                </a>
              </>
            ) : (
              <>
                <a
                  href="/mini/account"
                  className="text-gray-700 hover:text-red-600 transition-all duration-200 flex items-center px-2 py-2 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <FaUser className="mr-1 text-sm" /> Tài khoản
                </a>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-all duration-200 flex items-center px-2 py-2 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <FaSignOutAlt className="mr-1 text-sm" /> Đăng xuất
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-900 hover:text-red-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>

          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <FaRobot className="text-white text-lg" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">MBA Chatbot</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {/* Always show basic navigation */}
                  <a
                    href="/mini/"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaHome className="mr-3 text-sm" />
                    Trang chủ
                  </a>

                  {isLoggedIn ? (
                    <>
                      <a
                        href="/mini/mini"
                        onClick={(e) => {
                          handleChatClick(e);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        <FaComments className="mr-3 text-sm" />
                        Nhắn tin
                      </a>

                      <a
                        href="/mini/quiz-history"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FaHistory className="mr-3 text-sm" />
                        Lịch sử
                      </a>

                      {isTeacher && (
                        <>
                          <a
                            href="/mini/teacher"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaChalkboardTeacher className="mr-3 text-sm" />
                            Bảng điều khiển giảng viên
                          </a>
                          {/* <a
                            href="/mini/edit"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaEdit className="mr-3 text-sm" />
                            Chỉnh sửa nguồn
                          </a>
                          <a
                            href="/mini/messages"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaComments className="mr-3 text-sm" />
                            Quản lý Tin nhắn
                          </a> */}
                        </>
                      )}

                      {isAdmin && (
                        <>
                          <div className="pt-2 pb-1">
                            <div className="flex items-center px-4 py-2">
                              <FaCog className="mr-2 text-sm text-gray-500" />
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Quản trị</span>
                            </div>
                          </div>
                          <a
                            href="/mini/edit"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaEdit className="mr-3 text-sm" />
                            Chỉnh sửa nguồn
                          </a>
                          <a
                            href="/mini/admin"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaUserShield className="mr-3 text-sm" />
                            Quản lý Chatbot
                          </a>
                          <a
                            href="/mini/sources"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaFileAlt className="mr-3 text-sm" />
                            Quản lý File
                          </a>
                          <a
                            href="/mini/questions"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaQuestionCircle className="mr-3 text-sm" />
                            Quản lý Câu hỏi
                          </a>
                          <a
                            href="/mini/users"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaUsers className="mr-3 text-sm" />
                            Quản lý Người dùng
                          </a>
                          <a
                            href="/mini/messages"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaComments className="mr-3 text-sm" />
                            Quản lý Tin nhắn
                          </a>
                          <a
                            href="/mini/logs"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FaClipboardList className="mr-3 text-sm" />
                            Quản lý Logs
                          </a>
                        </>
                      )}
                    </>
                  ) : (
                    <a
                      href="/mini/mini"
                      onClick={(e) => {
                        handleChatClick(e);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      <FaComments className="mr-3 text-sm" />
                      Hỏi chatbot
                    </a>
                  )}
                </div>
              </div>

              {/* Auth Section */}
              <div className="border-t border-gray-200 p-4">
                {!isLoggedIn ? (
                  <div className="space-y-2">
                    <a
                      href="/mini/login"
                      className="block text-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng nhập
                    </a>
                    <a
                      href="/mini/signup"
                      className="block text-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng ký
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <a
                      href="/mini/account"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUser className="mr-3 text-sm" />
                      Tài khoản
                    </a>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                      <FaSignOutAlt className="mr-3 text-sm" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
