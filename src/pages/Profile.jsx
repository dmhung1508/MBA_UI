import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import { FaUser, FaEnvelope, FaIdCard, FaRobot, FaGraduationCap, FaUniversity, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

const getRoleProfile = (role) => {
    switch (String(role || '').toLowerCase()) {
        case 'teacher':
            return {
                badge: 'Teacher Profile - PTIT',
                title: 'Thông tin giảng viên',
                description: 'Quản lý thông tin tài khoản giảng viên trong hệ thống TA Chatbot',
                status: 'Tài khoản giảng viên',
                headerClass: 'bg-gradient-to-r from-red-600 to-red-700',
                headerSubText: 'text-red-100',
                badgeClass: 'bg-red-100 text-red-800',
                statusDot: 'bg-red-500',
                statusText: 'text-red-700',
                iconText: 'text-red-600',
                iconBg: 'bg-red-600',
                buttonClass: 'bg-red-600 hover:bg-red-700',
                panelClass: 'bg-gray-50',
                panelTitle: 'Khu vực giảng viên',
                features: [
                    {
                        icon: FaGraduationCap,
                        title: 'Môn học phụ trách',
                        description: 'Theo dõi các học phần được phân công',
                    },
                    {
                        icon: FaRobot,
                        title: 'Quản lý học liệu',
                        description: 'Cập nhật nội dung cho chatbot môn học',
                    },
                    {
                        icon: FaUniversity,
                        title: 'Dữ liệu giảng dạy',
                        description: 'Truy cập dữ liệu phục vụ giảng dạy',
                    },
                ],
            };
        case 'admin':
            return {
                badge: 'Admin Profile - PTIT',
                title: 'Thông tin quản trị viên',
                description: 'Quản lý thông tin tài khoản quản trị trong hệ thống TA Chatbot',
                status: 'Tài khoản quản trị viên',
                headerClass: 'bg-gradient-to-r from-red-600 to-red-700',
                headerSubText: 'text-red-100',
                badgeClass: 'bg-red-100 text-red-800',
                statusDot: 'bg-red-500',
                statusText: 'text-red-700',
                iconText: 'text-red-600',
                iconBg: 'bg-red-600',
                buttonClass: 'bg-red-600 hover:bg-red-700',
                panelClass: 'bg-gray-50',
                panelTitle: 'Khu vực quản trị',
                features: [
                    {
                        icon: FaUniversity,
                        title: 'Quản trị hệ thống',
                        description: 'Quản lý dữ liệu và phân quyền',
                    },
                    {
                        icon: FaGraduationCap,
                        title: 'Quản lý môn học',
                        description: 'Theo dõi chatbot và học phần',
                    },
                    {
                        icon: FaRobot,
                        title: 'Cấu hình chatbot',
                        description: 'Kiểm soát nội dung trợ lý AI',
                    },
                ],
            };
        default:
            return {
                badge: 'Student Profile - PTIT',
                title: 'Thông tin sinh viên',
                description: 'Quản lý thông tin tài khoản sinh viên trong hệ thống TA Chatbot',
                status: 'Tài khoản sinh viên',
                headerClass: 'bg-gradient-to-r from-red-600 to-red-700',
                headerSubText: 'text-red-100',
                badgeClass: 'bg-red-100 text-red-800',
                statusDot: 'bg-red-500',
                statusText: 'text-red-700',
                iconText: 'text-red-600',
                iconBg: 'bg-red-600',
                buttonClass: 'bg-red-600 hover:bg-red-700',
                panelClass: 'bg-gray-50',
                panelTitle: 'Khu vực học tập',
                features: [
                    {
                        icon: FaGraduationCap,
                        title: 'Môn học của bạn',
                        description: 'Truy cập các học phần được hỗ trợ',
                    },
                    {
                        icon: FaRobot,
                        title: 'Trợ lý AI',
                        description: 'Hỗ trợ học tập và ôn luyện',
                    },
                    {
                        icon: FaUniversity,
                        title: 'Dữ liệu PTIT',
                        description: 'Thông tin học tập chính thức',
                    },
                ],
            };
    }
};

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get(API_ENDPOINTS.USERS_ME, {
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
        window.location.href = '/mini/login';
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

    const roleProfile = getRoleProfile(userData.role);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '120px' }}>
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className={`${roleProfile.headerClass} px-8 py-6`}>
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <FaUserCircle className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">{roleProfile.status}</h1>
                                    <div className={`flex items-center space-x-2 ${roleProfile.headerSubText}`}>
                                        <FaUniversity className="w-4 h-4" />
                                        <span>TA Chatbot - PTIT</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:flex">
                            {/* Left Panel - User Info */}
                            <div className="md:w-2/3 p-8 lg:p-12">
                                {/* MBA Branding */}
                                <div className="mb-8">
                                    <div className={`inline-flex items-center ${roleProfile.badgeClass} px-4 py-2 rounded-full mb-4 font-medium`}>
                                        <FaRobot className="mr-2" />
                                        {roleProfile.badge}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {roleProfile.title}
                                    </h2>
                                    <p className="text-gray-600">
                                        {roleProfile.description}
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
                                                <FaUser className={`h-5 w-5 ${roleProfile.iconText}`} />
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
                                                <FaEnvelope className={`h-5 w-5 ${roleProfile.iconText}`} />
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
                                                    <FaIdCard className={`h-5 w-5 ${roleProfile.iconText}`} />
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
                                            <div className={`w-3 h-3 ${roleProfile.statusDot} rounded-full`}></div>
                                            <span className={`${roleProfile.statusText} font-medium`}>{roleProfile.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <div className="mt-8">
                                    <button
                                        onClick={handleLogout}
                                        className={`flex items-center space-x-2 ${roleProfile.buttonClass} text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200`}
                                    >
                                        <FaSignOutAlt />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>

                            {/* Right Panel - MBA Features */}
                            <div className={`md:w-1/3 ${roleProfile.panelClass} p-8 lg:p-12`}>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            {roleProfile.panelTitle}
                                        </h3>
                                        <div className="space-y-4">
                                            {roleProfile.features.map((feature) => {
                                                const Icon = feature.icon;
                                                return (
                                                    <div key={feature.title} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                                                        <div className={`w-8 h-8 ${roleProfile.iconBg} rounded-lg flex items-center justify-center`}>
                                                            <Icon className="text-white text-sm" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{feature.title}</p>
                                                            <p className="text-xs text-gray-600">{feature.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
