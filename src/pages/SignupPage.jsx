import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { FaUser, FaLock, FaEnvelope, FaRobot, FaGraduationCap, FaUniversity, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // New state for email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State for storing error messages
  const [successMessage, setSuccessMessage] = useState(''); // State for success messages
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu không khớp! Vui lòng kiểm tra lại.');
      setSuccessMessage('');
      return;
    }

    // Optional: Additional validations (e.g., email format)

    setErrorMessage('');
    setIsLoading(true);

    try {
      // Define the payload according to your backend's expected schema
      const payload = {
        full_name: name, // Include if your backend expects it
        username,
        email,
        password
      };

      const response = await axios.post(API_ENDPOINTS.REGISTER, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
      });

      setIsLoading(false);
      setSuccessMessage('Bạn đã đăng ký thành công! Vui lòng đăng nhập.');
      // Optionally, redirect to login page after a delay
      setTimeout(() => {
        navigate('/login'); // Ensure you have a route for login
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.data && error.response.data.detail) {
        setErrorMessage(error.response.data.detail);
      } else {
        setErrorMessage('Có lỗi xảy ra trong quá trình đăng ký! Vui lòng thử lại.');
      }
      setSuccessMessage('');
    }
  };



  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '120px' }}>
        <div className="max-w-6xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              {/* Left Panel - Branding */}
              <div className="md:w-1/2 bg-gradient-to-br from-red-600 to-red-700 text-white p-8 lg:p-12 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaGraduationCap className="text-4xl text-white" />
                    </div>
                    <div className="inline-flex items-center bg-white/20 text-white px-4 py-2 rounded-full mb-4 font-medium">
                      <FaUniversity className="mr-2" />
                      PTIT - Học viện CNBCVT
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4">
                    Gia nhập cộng đồng MBA PTIT!
                  </h3>
                  <p className="text-red-100 mb-6 leading-relaxed">
                    Tạo tài khoản để truy cập MBA Chatbot và tận hưởng trải nghiệm 
                    học tập thông minh với AI tư vấn chuyên biệt về quản trị kinh doanh.
                  </p>
                  
                  <div className="space-y-3 text-left mb-8">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                      <span className="text-red-100">Tư vấn lộ trình MBA cá nhân</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                      <span className="text-red-100">Hỗ trợ môn học và case study</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                      <span className="text-red-100">Kết nối với cộng đồng MBA</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-red-100 mb-4">Đã có tài khoản?</p>
                    <a href="/mini/login" className="inline-flex items-center bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
                      <span>Đăng nhập ngay</span>
                      <FaArrowRight className="ml-2" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="md:w-1/2 p-8 lg:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 font-medium">
                    <FaRobot className="mr-2" />
                    MBA Chatbot - PTIT
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Tạo tài khoản mới
                  </h2>
                  <p className="text-gray-600">
                    Đăng ký để truy cập hệ thống MBA Chatbot
                  </p>
                </div>

                {/* Error/Success Messages */}
                {errorMessage && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    {successMessage}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-4 w-4 text-red-600" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-4 w-4 text-red-600" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="Nhập tên đăng nhập"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-4 w-4 text-red-600" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="Nhập địa chỉ email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-red-600" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="Nhập mật khẩu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-red-600" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="Nhập lại mật khẩu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center mt-6"
                  >
                    <span>{isLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}</span>
                    {!isLoading && <FaArrowRight className="ml-2" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;