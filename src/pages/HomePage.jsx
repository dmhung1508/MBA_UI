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
  FaBolt,
  FaShieldAlt,
  FaClock,
  FaUsers,
  FaChartLine,
  FaGraduationCap,
  FaStar,
  FaArrowRight,
  FaUniversity,
} from "react-icons/fa";

const HomePage = () => {
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Thêm state kiểm tra đăng nhập
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slides data
  const slides = [
    {
      title: "Chương trình học tại PTIT",
      description: "Nâng cao kiến thức quản trị doanh nghiệp với chương trình uy tín",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      highlights: ["Quản trị chiến lược", "Tài chính doanh nghiệp", "Marketing quản trị"]
    },
    {
      title: "Kỹ năng Lãnh đạo",
      description: "Phát triển tư duy lãnh đạo và kỹ năng quản lý hiệu quả",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      highlights: ["Xây dựng đội nhóm", "Ra quyết định", "Quản lý thay đổi"]
    },
    {
      title: "Phân tích Kinh doanh",
      description: "Sử dụng dữ liệu để đưa ra quyết định kinh doanh thông minh",
      image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      highlights: ["Phân tích dữ liệu", "Nghiên cứu thị trường", "Đo lường hiệu suất"]
    },

  ];

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

  // Auto slide effect
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Thay đổi slide mỗi 4 giây

    return () => clearInterval(slideInterval);
  }, [slides.length]);

  // Hàm kiểm tra đăng nhập (thay thế bằng logic thực tế của bạn)
  const checkLoginStatus = () => {
    // Giả sử bạn có một cách để kiểm tra trạng thái đăng nhập
    // Ví dụ: kiểm tra token trong localStorage
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  };

  const handleCloseWarning = () => {
    setShowLoginWarning(false);
  };

  const handleButtonClick = () => {
    if (!isLoggedIn) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang login
      window.location.href = '/mini/login';
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container bg-white">

        {/* Login Warning */}
        <div
          className={`fixed top-20 right-0 transform transition-transform duration-500 ease-in-out z-50 ${showLoginWarning ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 shadow-xl mr-4 rounded-xl border-l-4 border-red-700 flex items-start" role="alert">
            <div className="flex-1">
              <p className="font-bold text-lg mb-1">Cảnh báo!</p>
              <p className="text-white/90">Bạn cần đăng nhập để sử dụng tính năng này.</p>
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

        {/* Hero Section */}
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <div className="animate-fade-in-up">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight mx-auto lg:mx-0">
                    Xin chào, tôi là <br />
                    <span className="text-red-600"> TA Chatbot</span>
                  </h1>

                  <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Chatbot trợ giảng các môn khối kinh tế. <br />Giải đáp thắc mắc về chương trình học,
                    môn học và <br />các thông tin học vụ một cách nhanh chóng và chính xác.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start max-w-md mx-auto lg:mx-0">
                    {isLoggedIn ? (
                      <a
                        href="/mini/mini"
                        className="group inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                      >
                        <FaComments className="mr-2 text-sm sm:text-base" />
                        <span className="hidden sm:inline">Bắt đầu trò chuyện</span>
                        <span className="sm:hidden">Trò chuyện</span>
                        <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform text-sm sm:text-base" />
                      </a>
                    ) : (
                      <>
                        <a
                          href="/mini/login"
                          className="group inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                        >
                          Đăng nhập
                          <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform text-sm sm:text-base" />
                        </a>
                        <a
                          href="/mini/signup"
                          className="inline-flex items-center justify-center border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 text-sm sm:text-base"
                        >
                          Đăng ký ngay
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex justify-center mt-8 lg:mt-0">
                <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-blue-100 rounded-3xl transform rotate-3 opacity-60"></div>

                  {/* Carousel */}
                  <div className="relative overflow-hidden rounded-3xl shadow-xl">
                    <div
                      className="flex transition-transform duration-1000 ease-in-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {slides.map((slide, index) => (
                        <div key={index} className="w-full flex-shrink-0 relative">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            loading="lazy"
                            className="w-full h-80 sm:h-96 object-cover"
                          />
                          {/* Overlay with slide content */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-black/40 backdrop-blur-sm">
                              <h3 className="text-xl sm:text-2xl font-bold mb-2">{slide.title}</h3>
                              <p className="text-sm sm:text-base mb-3 opacity-90">{slide.description}</p>
                              <div className="flex flex-wrap gap-2 mb-2.5">
                                {slide.highlights.map((highlight, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium"
                                  >
                                    {highlight}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Slide indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {slides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/70'
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Floating elements */}


                  {/* MBA Badge */}
                  {/* <div className="absolute -bottom-4 -left-4 bg-white border-2 border-red-600 text-red-600 px-4 py-2 rounded-xl shadow-lg font-bold text-sm sm:text-base">
                  📊 MBA Program
                </div> */}

                  {/* Business icons overlay */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md">
                    <FaChartLine className="text-blue-600" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 font-medium">
                <FaRobot className="mr-2" />
                Trợ lý AI - PTIT
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Chatbot thông minh cho sinh viên
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Trợ lý AI chuyên biệt hỗ trợ sinh viên khối ngành kinh tế tại <br /> Học viện Công nghệ Bưu chính Viễn thông
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="group p-6 sm:p-8 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FaBolt size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">Hỗ trợ tức thì 24/7</h3>
                <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">Giải đáp câu hỏi về chương trình học PTIT, thông tin môn học, điều kiện tốt nghiệp và các quy định học vụ.</p>
              </div>

              <div className="group p-6 sm:p-8 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FaShieldAlt size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">Dữ liệu PTIT chính thức</h3>
                <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">Thông tin được đồng bộ từ hệ thống chính thức của Học viện Công nghệ Bưu chính Viễn thông, đảm bảo độ chính xác tuyệt đối.</p>
              </div>

              <div className="group p-6 sm:p-8 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FaClock size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">Cố vấn AI</h3>
                <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">Tư vấn thông minh về lộ trình học, chọn môn học và định hướng nghề nghiệp sau tốt nghiệp.</p>
              </div>

              <div className="group p-6 sm:p-8 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FaUsers size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">Cộng đồng PTIT</h3>
                <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">Kết nối alumni và sinh viên đang theo học tại PTIT, chia sẻ kinh nghiệm và cơ hội hợp tác.</p>
              </div>

              <div className="group p-6 sm:p-8 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FaGraduationCap size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">Chuyên môn học</h3>
                <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">Hỗ trợ chuyên sâu các môn trong chương trình PTIT: Quản trị Chiến lược, Marketing, Tài chính và Case Study.</p>
              </div>

              <div className="group p-6 sm:p-8 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-lg mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto">
                  <FaChartLine size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">Phân tích Dữ liệu</h3>
                <p className="text-gray-600 text-center text-sm sm:text-base leading-relaxed">Công cụ phân tích dữ liệu kinh doanh và đưa ra nhận định sâu sắc cho bài tập, dự án theo chương trình PTIT.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 sm:py-20 bg-red-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center bg-white/20 text-white px-4 py-2 rounded-full mb-4 font-medium">
                <FaUniversity className="mr-2" />
                Học viện Công nghệ Bưu chính Viễn thông
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Chatbot PTIT - Thành tích ấn tượng</h2>
              <p className="text-lg sm:text-xl text-red-100 px-4">Phục vụ cộng đồng sinh viên và giảng viên tại PTIT</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform p-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">500+</div>
                <div className="text-red-100 text-sm sm:text-base">Sinh viên PTIT</div>
              </div>
              <div className="transform hover:scale-105 transition-transform p-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">10K+</div>
                <div className="text-red-100 text-sm sm:text-base">Câu hỏi đã giải đáp</div>
              </div>
              <div className="transform hover:scale-105 transition-transform p-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">95%</div>
                <div className="text-red-100 text-sm sm:text-base">Độ hài lòng học viên</div>
              </div>
              <div className="transform hover:scale-105 transition-transform p-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">24/7</div>
                <div className="text-red-100 text-sm sm:text-base">AI Assistant</div>
              </div>
            </div>
          </div>
        </section>

        {/* MBA Showcase Carousel */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4 font-medium">
                <FaGraduationCap className="mr-2" />
                Hệ thống hỗ trợ học tập - PTIT
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Chatbot hỗ trợ sinh viên PTIT
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto whitespace-nowrap">
                Tận dụng AI để tối ưu hóa quá trình học tại Học viện Công nghệ Bưu chính Viễn thông
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Chương trình thực tiễn</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kết hợp lý thuyết với thực hành qua các case study thực tế từ doanh nghiệp Việt Nam và quốc tế.
                </p>
              </div>

              <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mạng lưới mạnh mẽ</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kết nối với mạng lưới alumni mạnh mẽ gồm các lãnh đạo doanh nghiệp và chuyên gia hàng đầu.
                </p>
              </div>

              <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🌟</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Đội ngũ giảng viên</h3>
                <p className="text-gray-600 leading-relaxed">
                  Học tập cùng các giảng viên có trình độ cao, kinh nghiệm thực tiễn phong phú trong lĩnh vực kinh doanh.
                </p>
              </div>

              <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cơ hội nghề nghiệp</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mở rộng cơ hội thăng tiến với bằng cấp được công nhận trong và ngoài nước.
                </p>
              </div>

              <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Đổi mới sáng tạo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Phát triển tư duy sáng tạo và kỹ năng lãnh đạo để dẫn dắt sự thay đổi trong tổ chức.
                </p>
              </div>

              <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Phát triển bền vững</h3>
                <p className="text-gray-600 leading-relaxed">
                  Học cách xây dựng và quản lý doanh nghiệp theo hướng phát triển bền vững và có trách nhiệm xã hội.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center bg-gradient-to-r from-red-100 to-blue-100 text-gray-800 px-6 py-3 rounded-full mb-6 font-medium">
                <FaRobot className="mr-2 text-red-600" />
                TA Chatbot - PTIT Official
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 whitespace-nowrap">
                Bắt đầu hành trình học tập cùng AI Assistant
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-4 leading-relaxed">
                Gia nhập cộng đồng sinh viên PTIT và trải nghiệm học tập thông minh <br /> với chatbot chuyên biệt về các môn kinh tế.
              </p>

              {!isLoggedIn && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
                  <a
                    href="/mini/signup"
                    className="group inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Đăng ký miễn phí</span>
                    <span className="sm:hidden">Đăng ký</span>
                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform text-sm sm:text-base" />
                  </a>
                  <a
                    href="/mini/login"
                    className="inline-flex items-center justify-center border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Đã có tài khoản? Đăng nhập</span>
                    <span className="sm:hidden">Đăng nhập</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;