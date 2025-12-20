
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
    FaChartBar,
    FaUsers,
    FaUpload,
    FaQuestionCircle,
    FaArrowLeft,
    FaChevronDown,
    FaChevronUp,
    FaUserTie,
    FaFileExcel,
    FaSpinner
} from 'react-icons/fa';

const TeacherStats = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const userRole = localStorage.getItem('user_role');
        if (userRole !== 'admin') {
            navigate('/mini/');
            return;
        }
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_ENDPOINTS.TEACHER_ACTIVITY_STATS, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu thống kê');
            }

            const data = await response.json();
            setStats(data.stats || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_ENDPOINTS.TEACHER_ACTIVITY_STATS_EXPORT, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể export file Excel');
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `thong_ke_giao_vien_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            alert('Lỗi export: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const toggleRow = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    <FaChartBar className="mr-3 text-red-600 inline-block align-middle" />
                                    Thống kê hoạt động giáo viên
                                </h1>
                                <p className="text-gray-600">Theo dõi số lượng truy cập và upload tài liệu của giáo viên theo từng môn học</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={exporting || stats.length === 0}
                            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${exporting || stats.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {exporting ? (
                                <FaSpinner className="mr-2 animate-spin" />
                            ) : (
                                <FaFileExcel className="mr-2" />
                            )}
                            {exporting ? 'Đang xuất...' : 'Export Excel'}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                            <strong className="font-bold">Lỗi!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Môn học (Topic)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <FaUsers className="mr-2 text-blue-600" />
                                            Giáo viên truy cập
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <FaUpload className="mr-2 text-green-600" />
                                            Số file
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <FaQuestionCircle className="mr-2 text-purple-600" />
                                            Số câu hỏi
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats.length > 0 ? (
                                    stats.map((item, index) => (
                                        <React.Fragment key={index}>
                                            {/* Main row */}
                                            <tr
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => toggleRow(index)}
                                            >
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {expandedRows[index] ? (
                                                        <FaChevronUp className="transition-transform text-red-600" />
                                                    ) : (
                                                        <FaChevronDown className="transition-transform text-gray-400" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.topic}</div>
                                                    <div className="text-xs text-gray-500">{item.quizTopic}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {item.teacher_access_count} giáo viên
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {item.file_count || 0} file
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {item.question_count || 0} câu hỏi
                                                    </span>
                                                </td>
                                            </tr>

                                            {/* Expanded row - Teacher details */}
                                            {expandedRows[index] && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="5" className="px-6 py-4">
                                                        <div className="ml-4">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                                <FaUserTie className="mr-2 text-blue-600" />
                                                                Danh sách giáo viên đã truy cập ({item.teacher_access_count || 0}):
                                                            </h4>
                                                            {item.teachers && item.teachers.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {item.teachers.map((teacher, tIndex) => (
                                                                        <div
                                                                            key={tIndex}
                                                                            className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm shadow-sm"
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <FaUserTie className="mr-2 text-blue-500" />
                                                                                <div>
                                                                                    <div className="font-medium text-blue-700">
                                                                                        {typeof teacher === 'object' ? teacher.full_name : teacher}
                                                                                    </div>
                                                                                    {typeof teacher === 'object' && teacher.email && (
                                                                                        <div className="text-xs text-gray-500">{teacher.email}</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-gray-500 text-sm italic">Chưa có giáo viên nào truy cập</p>
                                                            )}

                                                            {/* Danh sách file */}
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 mt-4 flex items-center">
                                                                <FaUpload className="mr-2 text-green-600" />
                                                                Danh sách file đã upload ({item.file_count || 0} file):
                                                            </h4>
                                                            {item.files && item.files.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {item.files.map((file, fIndex) => (
                                                                        <span
                                                                            key={fIndex}
                                                                            className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-sm text-green-700 shadow-sm"
                                                                        >
                                                                            <FaUpload className="mr-1.5 text-green-500 inline-block align-middle" />
                                                                            {file.length > 40 ? file.substring(0, 40) + '...' : file}
                                                                        </span>
                                                                    ))}
                                                                    {item.file_count > 10 && (
                                                                        <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                                                                            ... và {item.file_count - 10} file khác
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-gray-500 text-sm italic">Chưa có file nào</p>
                                                            )}

                                                            {/* Additional info */}
                                                            <div className="mt-4 pt-3 border-t border-gray-200">
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-500">Quiz Topic:</span>
                                                                        <span className="ml-2 font-medium text-gray-700">{item.quizTopic || 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Source ID:</span>
                                                                        <span className="ml-2 font-medium text-gray-700">{item.source || 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Tổng:</span>
                                                                        <span className="ml-2 font-medium text-gray-700">
                                                                            {item.file_count || 0} file, {item.question_count || 0} câu hỏi
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            Chưa có dữ liệu thống kê
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    {stats.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {stats.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Tổng số môn học</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {[...new Set(stats.flatMap(s => s.teachers || []))].length}
                                    </div>
                                    <div className="text-sm text-gray-600">Tổng giáo viên</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {stats.reduce((sum, s) => sum + (s.file_count || 0), 0)}
                                    </div>
                                    <div className="text-sm text-gray-600">Tổng file</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {stats.reduce((sum, s) => sum + (s.question_count || 0), 0)}
                                    </div>
                                    <div className="text-sm text-gray-600">Tổng câu hỏi</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TeacherStats;
