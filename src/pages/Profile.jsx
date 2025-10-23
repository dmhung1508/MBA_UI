import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import { FaUser, FaEnvelope, FaIdCard, FaRobot, FaGraduationCap, FaUniversity, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get('https://mba.ptit.edu.vn/auth_mini/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                setUserData(response.data);
            } catch (err) {
                setError('Không thể tải thông tin người dùng');
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user_role');
        navigate('/mini/login');
    };

    if (!userData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin tài khoản...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '120px' }}>
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <FaUserCircle className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Thông tin tài khoản</h1>
                                    <div className="flex items-center space-x-2 text-red-100">
                                        <FaUniversity className="w-4 h-4" />
                                        <span>MBA Chatbot - PTIT</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:flex">
                            {/* Left Panel - User Info */}
                            <div className="md:w-2/3 p-8 lg:p-12">
                                {/* MBA Branding */}
                                <div className="mb-8">
                                    <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 font-medium">
                                        <FaRobot className="mr-2" />
                                        MBA Student Profile - PTIT
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        Thông tin học viên MBA
                                    </h2>
                                    <p className="text-gray-600">
                                        Quản lý thông tin cá nhân trong hệ thống MBA Chatbot
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                                        {error}
                                    </div>
                                )}

                                {/* User Information */}
                                <div className="space-y-6">
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
                                                value={userData.username}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaEnvelope className="h-5 w-5 text-red-600" />
                                            </div>
                                            <input
                                                type="email"
                                                value={userData.email}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {userData.full_name && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Họ và tên
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaIdCard className="h-5 w-5 text-red-600" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={userData.full_name}
                                                    readOnly
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* User Role/Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-green-700 font-medium">Học viên MBA tích cực</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <div className="mt-8">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        <FaSignOutAlt />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>

                            {/* Right Panel - MBA Features */}
                            <div className="md:w-1/3 bg-gray-50 p-8 lg:p-12">
                                <div className="space-y-6">
                                    {/* MBA Features */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Tính năng MBA
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                                    <FaGraduationCap className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Tư vấn môn học</p>
                                                    <p className="text-xs text-gray-600">Hỗ trợ chương trình MBA</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                                    <FaRobot className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">AI Assistant</p>
                                                    <p className="text-xs text-gray-600">Trợ lý thông minh 24/7</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                                                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                                    <FaUniversity className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Dữ liệu PTIT</p>
                                                    <p className="text-xs text-gray-600">Thông tin chính thức</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Thống kê sử dụng
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                                <span className="text-gray-600">Câu hỏi đã hỏi</span>
                                                <span className="font-bold text-red-600">-</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                                <span className="text-gray-600">Phiên chat</span>
                                                <span className="font-bold text-red-600">-</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                                <span className="text-gray-600">Ngày tham gia</span>
                                                <span className="font-bold text-red-600">Mới</span>
                                            </div>
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
}

export default Profile;