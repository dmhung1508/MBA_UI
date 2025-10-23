import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { FaUser, FaLock, FaRobot, FaGraduationCap, FaUniversity, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');  // Changed from email to username
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // State to handle errors
    const navigate = useNavigate(); // Hook for navigation
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset error state

        // Prepare data for the request
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('grant_type', 'password'); // Although not required in your backend, some OAuth2 implementations expect this

        try {
            const response = await fetch('https://mba.ptit.edu.vn/auth_mini/token', { // Update with your backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();
            const { access_token, token_type, user_role } = data;

            // Tính thời gian hết hạn: 30 ngày (1 tháng)
            const expirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
            
            // Store the token and user role  
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('token_type', token_type);
            localStorage.setItem('user_role', user_role);
            localStorage.setItem('token_expiration', expirationTime.toString());
            setSuccessMessage('Đăng nhập thành công!');
            // Optionally, redirect to a protected route
            setTimeout(() => {
                window.location.href = '/mini/';
            }, 2000); // Ensure this route exists in your React Router setup
        } catch (err) {
            setError(err.message);
            console.error('Login error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '120px' }}>
                <div className="max-w-6xl w-full">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="md:flex">
                            {/* Left Panel - Form */}
                            <div className="md:w-1/2 p-8 lg:p-12">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 font-medium">
                                        <FaRobot className="mr-2" />
                                        MBA Chatbot - PTIT
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                        Đăng nhập tài khoản
                                    </h2>
                                    <p className="text-gray-600">
                                        Truy cập vào hệ thống MBA Chatbot của PTIT
                                    </p>
                                </div>

                                {/* Error/Success Messages */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                                        {error}
                                    </div>
                                )}
                                {successMessage && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                        {successMessage}
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên đăng nhập
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaUser className="h-5 w-5 text-red-600" />
                                            </div>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                                placeholder="Nhập tên đăng nhập"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaLock className="h-5 w-5 text-red-600" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                                placeholder="Nhập mật khẩu"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
                                    >
                                        <span>Đăng nhập</span>
                                        <FaArrowRight className="ml-2" />
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-gray-600">
                                        Chưa có tài khoản?{' '}
                                                                <a href="/mini/signup" className="text-red-600 hover:text-red-700 font-medium">
                            Đăng ký ngay
                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* Right Panel - Branding */}
                            <div className="md:w-1/2 bg-gradient-to-br from-red-600 to-red-700 text-white p-8 lg:p-12 flex items-center justify-center">
                                <div className="text-center max-w-md">
                                    <div className="mb-8">
                                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaGraduationCap className="text-4xl text-white" />
                                        </div>
                                        <div className="inline-flex items-center bg-white/20 text-white px-4 py-2 rounded-full mb-4 font-medium">
                                            <FaUniversity className="mr-2" />
                                            PTIT - Học viện CNTT&TT
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-3xl font-bold mb-4">
                                        Chào mừng đến với MBA Chatbot!
                                    </h3>
                                    <p className="text-red-100 mb-6 leading-relaxed">
                                        Trợ lý AI thông minh dành riêng cho học viên MBA tại Học viện 
                                        Công nghệ Bưu chính Viễn thông. Hỗ trợ học tập 24/7 với 
                                        thông tin chính xác và cập nhật.
                                    </p>
                                    
                                    <div className="space-y-3 text-left">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                                            <span className="text-red-100">Hỗ trợ chương trình MBA PTIT</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                                            <span className="text-red-100">Dữ liệu chính thức từ PTIT</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                                            <span className="text-red-100">AI tư vấn thông minh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Login;
